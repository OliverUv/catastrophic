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

import {
  Summary,
  CategorySummary,
  CategorySpec,
  SolidCategorySpec,
  ErrorSpec,
  SolidErrorSpec,
  ErrorSpecCollection,
  CatastropheIdentity,
  CatastropheSpec,
} from './interfaces';

import {
  category_compare,
  error_compare,
} from './util';

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
  private num_2_err:{[num:number]:SolidErrorSpec} = {};
  private default_http_code = 500;
  private solid_errors:SolidErrorSpec[] = [];

  constructor(
    private separator:string,
    private spec:CategorySpec,
    private ohno:InternalErrorCat,
    private errors:ErrorSpecCollection,
  ) {
    if (spec.default_http_code != undefined) {
      this.default_http_code = spec.default_http_code;
    }
    this.register_errors(errors);
  }

  public get_summary_json() : CategorySummary {
    let spec = this.spec;
    spec.default_http_code = this.default_http_code;

    return {
      spec: <SolidCategorySpec>spec,
      errors: this.solid_errors.sort(error_compare),
    };
  }

  private register_errors(errors:ErrorSpecCollection) : void {
    Object.keys(errors).forEach((k) => {
      let error = errors[k];

      // Ensure key and unique_number are not registered
      if (this.num_2_err[error.unique_number]) {
        throw this.ohno.non_unique_error_number([this.spec, k, errors]);
      }

      // Set description to key name if none is set
      if (!error.description) {
        error.description = k;
      }
      if (error.http_code == undefined || error.http_code == null) {
        error.http_code = this.default_http_code;
      }

      // Register unique number as taken
      this.num_2_err[error.unique_number] = <SolidErrorSpec>error;
      this.solid_errors.push(<SolidErrorSpec>error);
    });
  }

  private get_solid_spec(error:ErrorSpec):SolidErrorSpec {
    return this.num_2_err[error.unique_number];
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
        category: this.spec,
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
  private category_specs:CategorySpec[] = [];
  private categories:Category[] = [];
  private category_codes:{[code:string]:boolean} = {};
  private ohno:InternalErrorCat;

  constructor(
    private permanent_internal_error_code='CATASTROPHIC',
    private permanent_identity_separator='_',
  ) {
    this.ohno = this.new_category({
      unique_code: this.permanent_internal_error_code,
      description: 'Errors from within the Catastrophic Error Builder',
    }, internal_errors);
  }

  public new_category<T extends ErrorSpecCollection>(
    cat_spec:CategorySpec,
    errors:T,
  ) : ErrorCat<T> {

    // Ensure category code doesn't contain the identity separator
    if (cat_spec.unique_code.indexOf(this.permanent_identity_separator) !== -1) {
      throw this.ohno.category_code_contains_separator(cat_spec);
    }

    // Ensure no conflicting Category Code
    if (this.category_codes[cat_spec.unique_code]) {
      if (cat_spec.unique_code == this.permanent_internal_error_code) {
        throw this.ohno.tried_to_use_reserved_category_code();
      }
      throw this.ohno.non_unique_category_code(cat_spec);
    }

    // Save metadata
    this.category_specs.push(cat_spec);
    this.category_codes[cat_spec.unique_code] = true;

    // Construct
    let category = new Category(
        this.permanent_identity_separator,
        cat_spec,
        this.ohno,
        errors);

    this.categories.push(category);

    // unsafe {
      // Build and return Catastrophe factory
      let cat:any = {};
      Object.keys(errors).forEach((k) => {
        cat[k] = category.get_die_for(errors[k]);
      });
      return <ErrorCat<T>>cat;
    // } end unsafe
  }

  public get_summary_json() : Summary {
    return {
      separator: this.permanent_identity_separator,
      categories: this.categories.map((c) => c.get_summary_json()).sort(category_compare),
    };
  }
}

export * from './interfaces';
