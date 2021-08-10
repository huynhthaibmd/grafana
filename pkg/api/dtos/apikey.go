package dtos

// swagger:model ApikeyResponse
type NewApiKeyResult struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Key  string `json:"key"`
}
