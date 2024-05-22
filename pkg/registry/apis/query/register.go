package query

import (
	"encoding/json"

	"github.com/prometheus/client_golang/prometheus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/apiserver/pkg/registry/generic"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	common "k8s.io/kube-openapi/pkg/common"
	"k8s.io/kube-openapi/pkg/spec3"
	"k8s.io/kube-openapi/pkg/validation/spec"

	query "github.com/grafana/grafana/pkg/apis/query/v0alpha1"
	"github.com/grafana/grafana/pkg/apiserver/builder"
	"github.com/grafana/grafana/pkg/expr"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/registry/apis/query/client"
	"github.com/grafana/grafana/pkg/registry/apis/query/queryschema"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/services/datasources/service"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/plugincontext"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
)

var _ builder.APIGroupBuilder = (*QueryAPIBuilder)(nil)

type QueryAPIBuilder struct {
	log                    log.Logger
	concurrentQueryLimit   int
	userFacingDefaultError string
	returnMultiStatus      bool // from feature toggle
	features               featuremgmt.FeatureToggles

	tracer     tracing.Tracer
	metrics    *metrics
	parser     *queryParser
	client     DataSourceClientSupplier
	registry   query.DataSourceApiServerRegistry
	converter  *expr.ResultConverter
	queryTypes *query.QueryTypeDefinitionList
}

func NewQueryAPIBuilder(features featuremgmt.FeatureToggles,
	client DataSourceClientSupplier,
	registry query.DataSourceApiServerRegistry,
	legacy service.LegacyDataSourceLookup,
	registerer prometheus.Registerer,
	tracer tracing.Tracer,
) (*QueryAPIBuilder, error) {
	reader := expr.NewExpressionQueryReader(features)

	// Read the expression query definitions
	raw, err := expr.QueryTypeDefinitionListJSON()
	if err != nil {
		return nil, err
	}
	queryTypes := &query.QueryTypeDefinitionList{}
	err = json.Unmarshal(raw, queryTypes)
	if err != nil {
		return nil, err
	}

	return &QueryAPIBuilder{
		concurrentQueryLimit: 4,
		log:                  log.New("query_apiserver"),
		returnMultiStatus:    features.IsEnabledGlobally(featuremgmt.FlagDatasourceQueryMultiStatus),
		client:               client,
		registry:             registry,
		parser:               newQueryParser(reader, legacy, tracer),
		metrics:              newMetrics(registerer),
		tracer:               tracer,
		features:             features,
		queryTypes:           queryTypes,
		converter: &expr.ResultConverter{
			Features: features,
			Tracer:   tracer,
		},
	}, nil
}

func RegisterAPIService(features featuremgmt.FeatureToggles,
	apiregistration builder.APIRegistrar,
	dataSourcesService datasources.DataSourceService,
	pluginStore pluginstore.Store,
	accessControl accesscontrol.AccessControl,
	pluginClient plugins.Client,
	pCtxProvider *plugincontext.Provider,
	registerer prometheus.Registerer,
	tracer tracing.Tracer,
	legacy service.LegacyDataSourceLookup,
) (*QueryAPIBuilder, error) {
	if !(features.IsEnabledGlobally(featuremgmt.FlagQueryService) ||
		features.IsEnabledGlobally(featuremgmt.FlagGrafanaAPIServerWithExperimentalAPIs)) {
		return nil, nil // skip registration unless explicitly added (or all experimental are added)
	}

	builder, err := NewQueryAPIBuilder(
		features,
		&CommonDataSourceClientSupplier{
			Client: client.NewQueryClientForPluginClient(pluginClient, pCtxProvider),
		},
		client.NewDataSourceRegistryFromStore(pluginStore, dataSourcesService),
		legacy, registerer, tracer,
	)
	apiregistration.RegisterAPI(builder)
	return builder, err
}

func (b *QueryAPIBuilder) GetGroupVersion() schema.GroupVersion {
	return query.SchemeGroupVersion
}

func addKnownTypes(scheme *runtime.Scheme, gv schema.GroupVersion) {
	scheme.AddKnownTypes(gv,
		&query.DataSourceApiServer{},
		&query.DataSourceApiServerList{},
		&query.QueryDataRequest{},
		&query.QueryDataResponse{},
		&query.QueryTypeDefinition{},
		&query.QueryTypeDefinitionList{},
	)
}

func (b *QueryAPIBuilder) InstallSchema(scheme *runtime.Scheme) error {
	addKnownTypes(scheme, query.SchemeGroupVersion)
	metav1.AddToGroupVersion(scheme, query.SchemeGroupVersion)
	return scheme.SetVersionPriority(query.SchemeGroupVersion)
}

func (b *QueryAPIBuilder) GetAPIGroupInfo(
	scheme *runtime.Scheme,
	codecs serializer.CodecFactory, // pointer?
	optsGetter generic.RESTOptionsGetter,
	_ bool,
) (*genericapiserver.APIGroupInfo, error) {
	gv := query.SchemeGroupVersion
	apiGroupInfo := genericapiserver.NewDefaultAPIGroupInfo(gv.Group, scheme, metav1.ParameterCodec, codecs)

	storage := map[string]rest.Storage{}

	plugins := newPluginsStorage(b.registry)
	storage[plugins.resourceInfo.StoragePath()] = plugins
	if !b.features.IsEnabledGlobally(featuremgmt.FlagGrafanaAPIServerWithExperimentalAPIs) {
		// The plugin registry is still experimental, and not yet accurate
		// For standard k8s api discovery to work, at least one resource must be registered
		// While this feature is under development, we can return an empty list for non-dev instances
		plugins.returnEmptyList = true
	}

	// The query endpoint -- NOTE, this uses a rewrite hack to allow requests without a name parameter
	storage["query"] = newQueryREST(b)

	// Register the expressions query schemas
	err := queryschema.RegisterQueryTypes(b.queryTypes, storage)

	apiGroupInfo.VersionedResourcesStorageMap[gv.Version] = storage
	return &apiGroupInfo, err
}

func (b *QueryAPIBuilder) GetOpenAPIDefinitions() common.GetOpenAPIDefinitions {
	return query.GetOpenAPIDefinitions
}

// Register additional routes with the server
func (b *QueryAPIBuilder) GetAPIRoutes() *builder.APIRoutes {
	return nil
}

func (b *QueryAPIBuilder) GetAuthorizer() authorizer.Authorizer {
	return nil // default is OK
}

func (b *QueryAPIBuilder) PostProcessOpenAPI(oas *spec3.OpenAPI) (*spec3.OpenAPI, error) {
	// The plugin description
	oas.Info.Description = "Query service"

	// The root api URL
	root := "/apis/" + b.GetGroupVersion().String() + "/"

	// Add queries to the request properties
	err := queryschema.AddQueriesToOpenAPI(b.queryTypes, oas, &plugins.JSONData{
		ID: expr.DatasourceType, // Not really a plugin, but identified the same way
	})
	if err != nil {
		return oas, nil
	}

	// Rewrite the query path
	sub := oas.Paths.Paths[root+"namespaces/{namespace}/query/{name}"]
	if sub != nil && sub.Post != nil {
		sub.Post.Tags = []string{"Query"}
		sub.Parameters = []*spec3.Parameter{
			{
				ParameterProps: spec3.ParameterProps{
					Name:        "namespace",
					In:          "path",
					Description: "object name and auth scope, such as for teams and projects",
					Example:     "default",
					Required:    true,
					Schema:      spec.StringProperty().UniqueValues(),
				},
			},
		}
		sub.Post.Description = "Query datasources (with expressions)"
		sub.Post.Parameters = nil //
		sub.Post.RequestBody = &spec3.RequestBody{
			RequestBodyProps: spec3.RequestBodyProps{
				Content: map[string]*spec3.MediaType{
					"application/json": {
						MediaTypeProps: spec3.MediaTypeProps{
							Schema: spec.RefSchema("#/components/schemas/" + queryschema.QueryRequestSchemaKey),
							Examples: map[string]*spec3.Example{
								"A": {
									ExampleProps: spec3.ExampleProps{
										Summary:     "Random walk (testdata)",
										Description: "Use testdata to execute a random walk query",
										Value: `{
											"queries": [
												{
													"refId": "A",
													"scenarioId": "random_walk_table",
													"seriesCount": 1,
													"datasource": {
													"type": "grafana-testdata-datasource",
													"uid": "PD8C576611E62080A"
													},
													"intervalMs": 60000,
													"maxDataPoints": 20
												}
											],
											"from": "now-6h",
											"to": "now"
										}`,
									},
								},
								"B": {
									ExampleProps: spec3.ExampleProps{
										Summary:     "With deprecated datasource name",
										Description: "Includes an old style string for datasource reference",
										Value: `{
											"queries": [
												{
													"refId": "A",
													"datasource": {
														"type": "grafana-googlesheets-datasource",
														"uid": "b1808c48-9fc9-4045-82d7-081781f8a553"
													},
													"cacheDurationSeconds": 300,
													"spreadsheet": "spreadsheetID",
													"datasourceId": 4,
													"intervalMs": 30000,
													"maxDataPoints": 794
												},
												{
													"refId": "Z",
													"datasource": "old",
													"maxDataPoints": 10,
													"timeRange": {
														"from": "100",
														"to": "200"
													}
												}
											],
											"from": "now-6h",
											"to": "now"
										}`,
									},
								},
							},
						},
					},
				},
			},
		}

		delete(oas.Paths.Paths, root+"namespaces/{namespace}/query/{name}")
		oas.Paths.Paths[root+"namespaces/{namespace}/query"] = sub
	}

	// The root API discovery list
	sub = oas.Paths.Paths[root]
	if sub != nil && sub.Get != nil {
		sub.Get.Tags = []string{"API Discovery"} // sorts first in the list
	}
	return oas, nil
}
