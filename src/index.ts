export interface ErrorCategoryDesc {
  // Should only be visible to devs inside the project,
  // never exposed anywhere except debug logs.
  description:string;
  code:string;
}

export interface ErrorDesc {
  unique_number:number;
  http_code:number;
  description:string;
}

export interface ErrorDescCol {
  [error_key:string]:ErrorDesc;
}

export class Catastrophe {
  public native_error:Error;
  public error:ErrorDesc;
  public category:ErrorCategoryDesc;
  public data?:any;
}

class ErrorCategory {
  private errors:ErrorDescCol = {};
  private unique_numbers:{[num:number]:boolean} = {};

  constructor(private category:ErrorCategoryDesc) {}

  register_errors(errors:ErrorDescCol) : void {
    // Ensure key and unique_number are not registered
    Object.keys(errors).forEach((k) => {
      if (this.errors.hasOwnProperty(k)) {
        // TODO Error out because of key
      }
      if (this.unique_numbers[errors[k].unique_number]) {
        // TODO Error out because of number
      }
      let error = errors[k];
      this.errors[k] = error;
      this.unique_numbers[error.unique_number] = true;
    });
  }

  // Builds a Catastrophe for throwing
  die(error:ErrorDesc, data?:any) : Catastrophe {
    return {
      category: this.category,
      native_error: new Error('catastrophe'),
      error,
      data,
    };
  }
}

export type ReturnsCatastrophe = (data?:any)=>Catastrophe;

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
};

export class CatastrophicCaretaker {
  private categories:ErrorCategoryDesc[] = [];
  private category_codes:{[code:string]:boolean} = {};
  private ohno:Cat<typeof internal_errors>;

  public register_category<T extends ErrorDescCol>(
    cat:ErrorCategoryDesc,
    errors:T,
  ) : Cat<T> {
    if (this.category_codes[cat.code]) {
      if (cat.code == this.internal_error_code) {
        throw this.ohno.tried_to_use_reserved_category_code();
      }
      throw this.ohno.non_unique_category_code(cat);
    }
    this.categories.push(cat);
    this.category_codes[cat.code] = true;
    let catt = new ErrorCategory(cat);
    catt.register_errors(errors);
    let killer:any = {};
    Object.keys(errors).forEach((k) => {
      killer[k] = (data:any) => catt.die(errors[k], data);
    });
    return <Cat<T>>killer;
  }

  constructor(private internal_error_code='CATASTROPHIC') {
    this.register_category({
      code: this.internal_error_code,
      description: 'Errors from within the Catastrophic Error Builder',
    }, internal_errors);
  }
}
