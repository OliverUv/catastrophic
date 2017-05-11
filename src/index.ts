// Copyright 2017 Oliver Uvman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export interface CategorySpec {
  // Should only be visible to devs inside the project,
  // never exposed anywhere except debug logs.
  unique_code:string;
  description:string;
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

export class Catastrophe {
  public native_error:Error;
  public error:SolidErrorSpec;
  public stack:string;
  public category:CategorySpec;
  public separator:string;
  public annotation?:any;
  // If you wish the annotation could be statically typed per ErrorDesc,
  // take a look at the experiment/typesafe_arbitrary_data{,2} branches.
  // It's as far as I got. Probably not possible. :( See also
  // * https://github.com/Microsoft/TypeScript/issues/1290
  // * https://github.com/Microsoft/TypeScript/issues/1213

  constructor(spec:CatastropheSpec) {
    this.native_error = spec.native_error;
    this.error = spec.error;
    this.stack = spec.native_error.stack || 'No stack trace available';
    this.category = spec.category;
    this.separator = spec.separator;
    this.annotation = spec.annotation;
  }

  public identity() : string {
    return `${this.category.unique_code}${this.separator}${this.error.unique_number}`;
  }

  public identity_json() : CatastropheIdentity {
    return {
      error_category: this.category.unique_code,
      error_number: this.error.unique_number,
    };
  }
}

class Category {
  private unique_numbers:{[num:number]:SolidErrorSpec} = {};

  constructor(
    private separator:string,
    private category:CategorySpec,
    private ohno:InternalErrorCat,
    private errors:ErrorSpecCollection,
  ) {
    this.register_errors(errors);
  }

  private register_errors(errors:ErrorSpecCollection) : void {
    Object.keys(errors).forEach((k) => {
      let error = errors[k];

      // Ensure key and unique_number are not registered
      if (this.unique_numbers[error.unique_number]) {
        this.ohno.non_unique_error_number([this.category, k, errors]);
      }

      // Set description to key name if none is set
      if (!error.description) {
        error.description = k;
      }
      if (error.http_code == undefined || error.http_code == null) {
        error.http_code = 500;
      }

      // Register unique number as taken
      this.unique_numbers[error.unique_number] = <SolidErrorSpec>error;
    });
  }

  private get_solid_spec(error:ErrorSpec):SolidErrorSpec {
    return this.unique_numbers[error.unique_number];
  }

  public get_die_for(error:ErrorSpec) : ReturnsCatastrophe {
    return (
      inner_error_or_annotation,
      optional_annotation_if_error_given,
    ) : Catastrophe => {
      let inner_error:Error|undefined = undefined;
      let annotation:any = optional_annotation_if_error_given;
      if (inner_error_or_annotation instanceof Error) {
        inner_error = inner_error_or_annotation;
        if (!annotation) {
          annotation = inner_error.message;
        }
      } else {
        annotation = inner_error_or_annotation;
      }
      return new Catastrophe({
        error: this.get_solid_spec(error),
        native_error: inner_error || new Error('catastrophe'),
        category: this.category,
        separator: this.separator,
        annotation,
      });
    }
  }
}

export type ReturnsCatastrophe = (
    annotation_or_error?:any|Error,
    optional_annotation_if_error_given?:any,
) => Catastrophe;

export type ErrorCat<T> = {
  [error_key in keyof T]:ReturnsCatastrophe;
};

const internal_errors = {
  tried_to_use_reserved_category_code: {
    unique_number: 0,
    http_code: 500,
    description: `Tried to use reserved internal category code`,
  },
  non_unique_category_code: {
    unique_number: 1,
    http_code: 500,
    description: `Tried to register two categories with the same category code`,
  },
  category_code_contains_separator: {
    unique_number: 2,
    http_code: 500,
    description: `Category code contains separator, this is not allowed.`,
  },
  non_unique_error_key: {
    unique_number: 3,
    http_code: 500,
    description: `Tried to register two errors with the same key in a single category`,
  },
  non_unique_error_number: {
    unique_number: 4,
    http_code: 500,
    description: `Tried to register two errors with the same number in a single category`,
  },
};

type InternalErrorCat = ErrorCat<typeof internal_errors>;

export class Catastrophic {
  private cat_descs:CategorySpec[] = [];
  private categories:Category[] = [];
  private category_codes:{[code:string]:boolean} = {};
  private ohno:InternalErrorCat;

  constructor(
    private permanent_internal_error_code='CATASTROPHIC',
    private permanent_identity_separator='_',
  ) {
    this.new_category({
      unique_code: this.permanent_internal_error_code,
      description: 'Errors from within the Catastrophic Error Builder',
    }, internal_errors);
  }

  public new_category<T extends ErrorSpecCollection>(
    cat_desc:CategorySpec,
    errors:T,
  ) : ErrorCat<T> {

    // Ensure category code doesn't contain the identity separator
    if (cat_desc.unique_code.includes(this.permanent_identity_separator)) {
      throw this.ohno.category_code_contains_separator(cat_desc);
    }

    // Ensure no conflicting Category Code
    if (this.category_codes[cat_desc.unique_code]) {
      if (cat_desc.unique_code == this.permanent_internal_error_code) {
        throw this.ohno.tried_to_use_reserved_category_code();
      }
      throw this.ohno.non_unique_category_code(cat_desc);
    }

    // Save metadata
    this.cat_descs.push(cat_desc);
    this.category_codes[cat_desc.unique_code] = true;

    // Construct
    let category = new Category(
        this.permanent_identity_separator,
        cat_desc,
        this.ohno,
        errors);

    // unsafe {
      // Build and return Catastrophe factory
      let cat:any = {};
      Object.keys(errors).forEach((k) => {
        cat[k] = category.get_die_for(errors[k]);
      });
      return <ErrorCat<T>>cat;
    // } end unsafe
  }
}
