package grafanaapiserver

import (
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apiserver/pkg/registry/generic"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/kube-openapi/pkg/common"
	"k8s.io/kube-openapi/pkg/spec3"
)

// TODO: this (or something like it) belongs in grafana-app-sdk,
// but lets keep it here while we iterate on a few simple examples
type APIGroupBuilder interface {
	// Get the main group name
	GetGroupVersion() schema.GroupVersion

	// Add the kinds to the server scheme
	InstallSchema(scheme *runtime.Scheme) error

	// Build the group+version behavior
	GetAPIGroupInfo(
		scheme *runtime.Scheme,
		codecs serializer.CodecFactory, // pointer?
		optsGetter generic.RESTOptionsGetter,
	) (*genericapiserver.APIGroupInfo, error)

	// Get OpenAPI definitions
	GetOpenAPIDefinitions() common.GetOpenAPIDefinitions

	// Get the API routes for each version
	GetAPIRoutes() *APIRoutes
}

// This is used to implement dynamic sub-resources like pods/x/logs
type APIRouteHandler struct {
	Path      string           // added to the appropriate level
	Spec      *spec3.PathProps // Exposed in the open api service discovery
	Connector rest.Connecter   // NOTE this is not passed a name!
}

// APIRoutes define explicit HTTP handlers in an apiserver
// TBD: is this actually necessary -- there may be more k8s native options for this
type APIRoutes struct {
	// Root handlers are registered directly after the apiVersion identifier
	Root []APIRouteHandler

	// Namespace handlers are mounted under the namespace
	Namespace []APIRouteHandler
}
