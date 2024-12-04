export enum FieldExtractorID {
  JSON = 'json',
  KeyValues = 'kvp',
  Auto = 'auto',
  RegExp = 'regexp',
  CSV = 'csv',
}

export interface JSONPath {
  path: string;
  alias?: string;
}
export interface ExtractFieldsOptions {
  source?: string;
  jsonPaths?: JSONPath[];
  delimiter?: string;
  regExp?: string;
  format?: FieldExtractorID;
  replace?: boolean;
  keepTime?: boolean;
}
