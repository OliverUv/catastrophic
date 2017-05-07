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
  description:string;
  code:string;
}

export interface ErrorSpec {
  unique_number:number;
  http_code:number;
  description:string;
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
  error:ErrorSpec;
  category:CategorySpec;
  separator:string;
  annotation?:any;
}

export class Catastrophe {
  public native_error:Error;
  public error:ErrorSpec;
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
    this.category = spec.category;
    this.separator = spec.separator;
    this.annotation = spec.annotation;
  }

  public identity() : string {
    return `${this.category.code}${this.separator}${this.error.unique_number}`;
  }

  public identity_json() : CatastropheIdentity {
    return {
      error_category: this.category.code,
      error_number: this.error.unique_number,
    };
  }
}

class Category {
  private unique_numbers:{[num:number]:boolean} = {};

  constructor(
    private separator:string,
    private category:CategorySpec,
    private ohno:InternalErrorCat,
    private errors:ErrorSpecCollection,
  ) {
    this.register_errors(errors);
  }

  private register_errors(errors:ErrorSpecCollection) : void {
    // Ensure key and unique_number are not registered
    Object.keys(errors).forEach((k) => {
      if (this.unique_numbers[errors[k].unique_number]) {
        this.ohno.non_unique_error_number([this.category, k, errors]);
      }
      this.unique_numbers[errors[k].unique_number] = true;
    });
  }

  // Builds a Catastrophe for throwing
  public die(error:ErrorSpec, annotation?:any) : Catastrophe {
    return new Catastrophe({
      native_error: new Error('catastrophe'),
      error,
      category: this.category,
      separator: this.separator,
      annotation,
    });
  }
}

export type ReturnsCatastrophe = (annotation?:any) => Catastrophe;

export type Cat<T> = {
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

type InternalErrorCat = Cat<typeof internal_errors>;

export class CatastrophicCaretaker {
  private cat_descs:CategorySpec[] = [];
  private categories:Category[] = [];
  private category_codes:{[code:string]:boolean} = {};
  private ohno:InternalErrorCat;

  constructor(
    private internal_error_code='CATASTROPHIC',
    private code_number_separator='_',
  ) {
    this.register_category({
      code: this.internal_error_code,
      description: 'Errors from within the Catastrophic Error Builder',
    }, internal_errors);
  }

  public register_category<T extends ErrorSpecCollection>(
    cat_desc:CategorySpec,
    errors:T,
  ) : Cat<T> {

    // Ensure category code doesn't contain the code/number separator
    if (cat_desc.code.includes(this.code_number_separator)) {
      throw this.ohno.category_code_contains_separator(cat_desc);
    }

    // Ensure no conflicting Category Code
    if (this.category_codes[cat_desc.code]) {
      if (cat_desc.code == this.internal_error_code) {
        throw this.ohno.tried_to_use_reserved_category_code();
      }
      throw this.ohno.non_unique_category_code(cat_desc);
    }

    // Save metadata
    this.cat_descs.push(cat_desc);
    this.category_codes[cat_desc.code] = true;

    // Construct
    let category = new Category(
        this.code_number_separator,
        cat_desc,
        this.ohno,
        errors);

    // unsafe {
      // Build and return Catastrophe factory
      let cat:any = {};
      Object.keys(errors).forEach((k) => {
        cat[k] = (annotation:any) => category.die(errors[k], annotation);
      });
      return <Cat<T>>cat;
    // } end unsafe
  }
}
