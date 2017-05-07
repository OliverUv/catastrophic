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

export class Catastrophe {
  public native_error:Error;
  public error:ErrorSpec;
  public category:CategorySpec;

  // If you wish this annotation could be statically typed per ErrorDesc,
  // take a look at the experiment/typesafe_arbitrary_data{,2} branches.
  // It's as far as I got. Probably not possible. :( See also
  // * https://github.com/Microsoft/TypeScript/issues/1290
  // * https://github.com/Microsoft/TypeScript/issues/1213
  public annotation?:any;
}

class Category {
  private unique_numbers:{[num:number]:boolean} = {};

  constructor(
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
  die(error:ErrorSpec, annotation?:any) : Catastrophe {
    return {
      category: this.category,
      native_error: new Error('catastrophe'),
      error,
      annotation,
    };
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
  non_unique_error_key: {
    unique_number: 2,
    http_code: 500,
    description: `Tried to register two errors with the same key in a single category`,
  },
  non_unique_error_number: {
    unique_number: 3,
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

  constructor(private internal_error_code='CATASTROPHIC') {
    this.register_category({
      code: this.internal_error_code,
      description: 'Errors from within the Catastrophic Error Builder',
    }, internal_errors);
  }

  public register_category<T extends ErrorSpecCollection>(
    cat_desc:CategorySpec,
    errors:T,
  ) : Cat<T> {

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
    let category = new Category(cat_desc, this.ohno, errors);

    // Build and return Catastrophe factory
    let cat:any = {};
    Object.keys(errors).forEach((k) => {
      cat[k] = (annotation:any) => category.die(errors[k], annotation);
    });
    return <Cat<T>>cat;
  }
}
