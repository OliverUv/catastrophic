import {
  CategorySummary as C,
  SolidErrorSpec as E,
} from './interfaces';

export function category_compare(a:C, b:C) : number {
  let a_c = a.spec.unique_code.toUpperCase();
  let b_c = b.spec.unique_code.toUpperCase();
  if (a_c < b_c) {
    return -1;
  }
  if (a_c > b_c) {
    return 1;
  }
  return 0;
}

export function error_compare(a:E, b:E) : number {
  return a.unique_number - b.unique_number;
}
