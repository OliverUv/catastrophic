export interface Summary {
  separator:string;
  categories:CategorySummary[];
}

export interface CategorySummary {
  spec:SolidCategorySpec;
  errors:SolidErrorSpec[];
}

export interface CategorySpec {
  unique_code:string;
  default_http_code?:number;
  description:string;
  // description should only be visible to devs inside the project, never
  // exposed anywhere except debug logs.
}

export interface SolidCategorySpec extends CategorySpec {
  default_http_code:number;
}

export interface ErrorSpec {
  unique_number:number;
  http_code?:number;
  description?:string;
}

export interface SolidErrorSpec extends ErrorSpec {
  description:string; // Known to have description
  http_code:number;
}

export interface ErrorSpecCollection {
  [error_key:string]:ErrorSpec;
}

export interface CatastropheIdentity {
  error_category:string;
  error_number:number;
}

export interface CatastropheSpec {
  native_error:Error;
  error:SolidErrorSpec;
  category:CategorySpec;
  separator:string;
  annotation?:any;
}

