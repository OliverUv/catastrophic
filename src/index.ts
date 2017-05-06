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
}

export class ErrorCategory {
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
  die(error:ErrorDesc) : Catastrophe {
    return {
      category: this.category,
      error: error,
      native_error: new Error('catastrophe'),
    };
  }
}

export class CatastrophicCaretaker {
  private categories:ErrorCategoryDesc[] = [];
  private category_codes:{[code:string]:boolean} = {};

  public register_category(
    cat:ErrorCategoryDesc,
    errors:ErrorDescCol,
  ) : ErrorCategory {
    if (this.category_codes[cat.code]) {
      // TODO Error out because of code
    }
    this.categories.push(cat);
    this.category_codes[cat.code] = true;
    return new ErrorCategory(cat);
  }
}
