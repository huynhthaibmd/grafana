/*Package api contains base API implementation of unified alerting
 *
 *Generated by: Swagger Codegen (https://github.com/swagger-api/swagger-codegen.git)
 *
 *Do not manually edit these files, please find ngalert/api/swagger-codegen/ for commands on how to generate them.
 */
package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/middleware/requestmeta"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/services/ngalert/metrics"
	"github.com/grafana/grafana/pkg/web"
)

type RulerApi interface {
	RouteDeleteGrafanaRuleGroupConfig(*contextmodel.ReqContext) response.Response
	RouteDeleteNamespaceGrafanaRulesConfig(*contextmodel.ReqContext) response.Response
	RouteDeleteNamespaceRulesConfig(*contextmodel.ReqContext) response.Response
	RouteDeleteRuleGroupConfig(*contextmodel.ReqContext) response.Response
	RouteGetGrafanaRuleGroupConfig(*contextmodel.ReqContext) response.Response
	RouteGetGrafanaRulesConfig(*contextmodel.ReqContext) response.Response
	RouteGetNamespaceGrafanaRulesConfig(*contextmodel.ReqContext) response.Response
	RouteGetNamespaceRulesConfig(*contextmodel.ReqContext) response.Response
	RouteGetRuleByUID(*contextmodel.ReqContext) response.Response
	RouteGetRulegGroupConfig(*contextmodel.ReqContext) response.Response
	RouteGetRulesConfig(*contextmodel.ReqContext) response.Response
	RouteGetRulesForExport(*contextmodel.ReqContext) response.Response
	RoutePostNameGrafanaRulesConfig(*contextmodel.ReqContext) response.Response
	RoutePostNameGrafanaRulesPrometheusConfig(*contextmodel.ReqContext) response.Response
	RoutePostNameRulesConfig(*contextmodel.ReqContext) response.Response
	RoutePostRulesGroupForExport(*contextmodel.ReqContext) response.Response
}

func (f *RulerApiHandler) RouteDeleteGrafanaRuleGroupConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	groupnameParam := web.Params(ctx.Req)[":Groupname"]
	return f.handleRouteDeleteGrafanaRuleGroupConfig(ctx, namespaceParam, groupnameParam)
}
func (f *RulerApiHandler) RouteDeleteNamespaceGrafanaRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	return f.handleRouteDeleteNamespaceGrafanaRulesConfig(ctx, namespaceParam)
}
func (f *RulerApiHandler) RouteDeleteNamespaceRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	return f.handleRouteDeleteNamespaceRulesConfig(ctx, datasourceUIDParam, namespaceParam)
}
func (f *RulerApiHandler) RouteDeleteRuleGroupConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	groupnameParam := web.Params(ctx.Req)[":Groupname"]
	return f.handleRouteDeleteRuleGroupConfig(ctx, datasourceUIDParam, namespaceParam, groupnameParam)
}
func (f *RulerApiHandler) RouteGetGrafanaRuleGroupConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	groupnameParam := web.Params(ctx.Req)[":Groupname"]
	return f.handleRouteGetGrafanaRuleGroupConfig(ctx, namespaceParam, groupnameParam)
}
func (f *RulerApiHandler) RouteGetGrafanaRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	return f.handleRouteGetGrafanaRulesConfig(ctx)
}
func (f *RulerApiHandler) RouteGetNamespaceGrafanaRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	return f.handleRouteGetNamespaceGrafanaRulesConfig(ctx, namespaceParam)
}
func (f *RulerApiHandler) RouteGetNamespaceRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	return f.handleRouteGetNamespaceRulesConfig(ctx, datasourceUIDParam, namespaceParam)
}
func (f *RulerApiHandler) RouteGetRuleByUID(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	ruleUIDParam := web.Params(ctx.Req)[":RuleUID"]
	return f.handleRouteGetRuleByUID(ctx, ruleUIDParam)
}
func (f *RulerApiHandler) RouteGetRulegGroupConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	groupnameParam := web.Params(ctx.Req)[":Groupname"]
	return f.handleRouteGetRulegGroupConfig(ctx, datasourceUIDParam, namespaceParam, groupnameParam)
}
func (f *RulerApiHandler) RouteGetRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetRulesConfig(ctx, datasourceUIDParam)
}
func (f *RulerApiHandler) RouteGetRulesForExport(ctx *contextmodel.ReqContext) response.Response {
	return f.handleRouteGetRulesForExport(ctx)
}
func (f *RulerApiHandler) RoutePostNameGrafanaRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	// Parse Request Body
	conf := apimodels.PostableRuleGroupConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostNameGrafanaRulesConfig(ctx, conf, namespaceParam)
}
func (f *RulerApiHandler) RoutePostNameGrafanaRulesPrometheusConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	// Parse Request Body
	conf := apimodels.PostableRuleGroupPrometheusConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostNameGrafanaRulesPrometheusConfig(ctx, conf, namespaceParam)
}
func (f *RulerApiHandler) RoutePostNameRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	// Parse Request Body
	conf := apimodels.PostableRuleGroupConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostNameRulesConfig(ctx, conf, datasourceUIDParam, namespaceParam)
}
func (f *RulerApiHandler) RoutePostRulesGroupForExport(ctx *contextmodel.ReqContext) response.Response {
	// Parse Path Parameters
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	// Parse Request Body
	conf := apimodels.PostableRuleGroupConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostRulesGroupForExport(ctx, conf, namespaceParam)
}

func (api *API) RegisterRulerApiEndpoints(srv RulerApi, m *metrics.API) {
	api.RouteRegister.Group("", func(group routing.RouteRegister) {
		group.Delete(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodDelete, "/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}",
				api.Hooks.Wrap(srv.RouteDeleteGrafanaRuleGroupConfig),
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodDelete, "/api/ruler/grafana/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/ruler/grafana/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RouteDeleteNamespaceGrafanaRulesConfig),
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodDelete, "/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RouteDeleteNamespaceRulesConfig),
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodDelete, "/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}",
				api.Hooks.Wrap(srv.RouteDeleteRuleGroupConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/grafana/api/v1/rules/{Namespace}/{Groupname}",
				api.Hooks.Wrap(srv.RouteGetGrafanaRuleGroupConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/grafana/api/v1/rules"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/grafana/api/v1/rules"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/grafana/api/v1/rules",
				api.Hooks.Wrap(srv.RouteGetGrafanaRulesConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/grafana/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/grafana/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RouteGetNamespaceGrafanaRulesConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RouteGetNamespaceRulesConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/grafana/api/v1/rule/{RuleUID}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/grafana/api/v1/rule/{RuleUID}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/grafana/api/v1/rule/{RuleUID}",
				api.Hooks.Wrap(srv.RouteGetRuleByUID),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}/{Groupname}",
				api.Hooks.Wrap(srv.RouteGetRulegGroupConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/{DatasourceUID}/api/v1/rules"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/{DatasourceUID}/api/v1/rules",
				api.Hooks.Wrap(srv.RouteGetRulesConfig),
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/ruler/grafana/api/v1/export/rules"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodGet, "/api/ruler/grafana/api/v1/export/rules"),
			metrics.Instrument(
				http.MethodGet,
				"/api/ruler/grafana/api/v1/export/rules",
				api.Hooks.Wrap(srv.RouteGetRulesForExport),
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodPost, "/api/ruler/grafana/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodPost,
				"/api/ruler/grafana/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RoutePostNameGrafanaRulesConfig),
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/ruler/grafana/prometheus/config/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodPost, "/api/ruler/grafana/prometheus/config/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodPost,
				"/api/ruler/grafana/prometheus/config/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RoutePostNameGrafanaRulesPrometheusConfig),
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodPost, "/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}"),
			metrics.Instrument(
				http.MethodPost,
				"/api/ruler/{DatasourceUID}/api/v1/rules/{Namespace}",
				api.Hooks.Wrap(srv.RoutePostNameRulesConfig),
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/ruler/grafana/api/v1/rules/{Namespace}/export"),
			requestmeta.SetOwner(requestmeta.TeamAlerting),
			requestmeta.SetSLOGroup(requestmeta.SLOGroupHighSlow),
			api.authorize(http.MethodPost, "/api/ruler/grafana/api/v1/rules/{Namespace}/export"),
			metrics.Instrument(
				http.MethodPost,
				"/api/ruler/grafana/api/v1/rules/{Namespace}/export",
				api.Hooks.Wrap(srv.RoutePostRulesGroupForExport),
				m,
			),
		)
	}, middleware.ReqSignedIn)
}
