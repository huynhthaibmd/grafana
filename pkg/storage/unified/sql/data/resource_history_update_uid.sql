UPDATE {{ .Ident "resource_history" }}
    SET {{ .Ident "value" }} = REPLACE({{ .Ident "value" }}, CONCAT('"uid":"', {{ .Arg .OldUID }}, '"'), CONCAT('"uid":"', {{ .Arg .NewUID }}, '"'))
    WHERE {{ .Ident "name" }} = {{ .Arg .WriteEvent.Key.Name }}
    AND {{ .Ident "namespace" }} = {{ .Arg .WriteEvent.Key.Namespace }}
    AND {{ .Ident "group" }}     = {{ .Arg .WriteEvent.Key.Group }}
    AND {{ .Ident "resource" }}  = {{ .Arg .WriteEvent.Key.Resource }}
    AND {{ .Ident "action" }} != 3
    -- check that deletion timestamp is not present. Otherwise, if a resource is deleted but has a finalizer
    -- it will be returned. We only want to show the history of a resource on restore before it was deleted.
    AND {{ .Ident "value" }} NOT LIKE '%deletionTimestamp%';
