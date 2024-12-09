SELECT
    {{ .Ident "namespace" | .Into .Response.Key.Namespace }},
    {{ .Ident "group" | .Into .Response.Key.Group }},
    {{ .Ident "resource" | .Into .Response.Key.Resource }},
    {{ .Ident "name" | .Into .Response.Key.Name }},
    {{ .Ident "folder" | .Into .Response.Folder }},
    {{ .Ident "resource_version" | .Into .Response.ResourceVersion }},
    {{ .Ident "value" | .Into .Response.Value }}

    FROM {{ .Ident "resource_history" }}

    WHERE 1 = 1
        AND {{ .Ident "namespace" }} = {{ .Arg .Request.Key.Namespace }}
        AND {{ .Ident "group" }}     = {{ .Arg .Request.Key.Group }}
        AND {{ .Ident "resource" }}  = {{ .Arg .Request.Key.Resource }}
        AND {{ .Ident "name" }}      = {{ .Arg .Request.Key.Name }}
      {{ if .Request.IncludeDeleted }}
        AND {{ .Ident "action" }} != 3
        -- check that deletion timestamp is not present. Otherwise, if a resource is deleted but has a finalizer
        -- it will be returned in the history. We want to return the most recent version of the resource before deletion.
        AND {{ .Ident "value" }} NOT LIKE '%deletionTimestamp%'
      {{ end }}
      {{ if gt .Request.ResourceVersion 0 }}
        AND {{ .Ident "resource_version" }}
          -- if includeDeleted was set on the read request, and a resourceVersion is given, return the exact one requested
          {{ if .Request.IncludeDeleted }}
            =
          {{ else }}
            <=
          {{ end }}
          {{ .Arg .Request.ResourceVersion }}
      {{ end }}
    ORDER BY {{ .Ident "resource_version" }} DESC
    LIMIT 1
;
