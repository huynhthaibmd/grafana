//
// This file is generated by grafana-app-sdk
// DO NOT EDIT
//

package apis

import (
	"encoding/json"

	"github.com/grafana/grafana-app-sdk/app"
)

var (
	rawSchemaFeedbackv0alpha1     = []byte(`{"spec":{"properties":{"message":{"type":"string"}},"required":["message"],"type":"object"},"status":{"properties":{"additionalFields":{"description":"additionalFields is reserved for future use","type":"object","x-kubernetes-preserve-unknown-fields":true},"operatorStates":{"additionalProperties":{"properties":{"descriptiveState":{"description":"descriptiveState is an optional more descriptive state field which has no requirements on format","type":"string"},"details":{"description":"details contains any extra information that is operator-specific","type":"object","x-kubernetes-preserve-unknown-fields":true},"lastEvaluation":{"description":"lastEvaluation is the ResourceVersion last evaluated","type":"string"},"state":{"description":"state describes the state of the lastEvaluation.\nIt is limited to three possible states for machine evaluation.","enum":["success","in_progress","failed"],"type":"string"}},"required":["lastEvaluation","state"],"type":"object"},"description":"operatorStates is a map of operator ID to operator state evaluations.\nAny operator which consumes this kind SHOULD add its state evaluation information to this field.","type":"object"}},"type":"object","x-kubernetes-preserve-unknown-fields":true}}`)
	versionSchemaFeedbackv0alpha1 app.VersionSchema
	_                             = json.Unmarshal(rawSchemaFeedbackv0alpha1, &versionSchemaFeedbackv0alpha1)
)

var appManifestData = app.ManifestData{
	AppName: "feedback",
	Group:   "feedback.grafana.app",
	Kinds: []app.ManifestKind{
		{
			Kind:       "Feedback",
			Scope:      "Namespaced",
			Conversion: false,
			Versions: []app.ManifestKindVersion{
				{
					Name: "v0alpha1",
					Admission: &app.AdmissionCapabilities{
						Validation: &app.ValidationCapability{
							Operations: []app.AdmissionOperation{
								app.AdmissionOperationCreate,
								app.AdmissionOperationUpdate,
							},
						},
						Mutation: &app.MutationCapability{
							Operations: []app.AdmissionOperation{
								app.AdmissionOperationCreate,
								app.AdmissionOperationUpdate,
							},
						},
					},
					Schema: &versionSchemaFeedbackv0alpha1,
				},
			},
		},
	},
}

func jsonToMap(j string) map[string]any {
	m := make(map[string]any)
	json.Unmarshal([]byte(j), &j)
	return m
}

func LocalManifest() app.Manifest {
	return app.NewEmbeddedManifest(appManifestData)
}

func RemoteManifest() app.Manifest {
	return app.NewAPIServerManifest("feedback")
}
