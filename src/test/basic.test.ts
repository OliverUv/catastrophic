import { test } from 'ava';

import { CatastrophicCaretaker, Catastrophe } from '../';

test(async function basic_use(t) {
  t.plan(4);

  let error_manager = new CatastrophicCaretaker();

  // To preserve API compat, unique_number must always refer to the
  // same error, forever.
  let tst_errors = {
    tepid_trepidations: {
      unique_number: 1,
      http_code: 500,
      description: `the function couldn't do it due to excessive worry`,
    },
    too_boring_to_compute: {
      unique_number: 2, // To preserve API compat, must never change ever
      http_code: 400,
      description: `user supplied very boring data`,
    },
  };

  let tst_category = {
    code: 'TST',
    description: 'Testing category',
  };

  let ohno = error_manager.register_category(tst_category, tst_errors);

  function throwing_inner_function() {
    // This is how you would use it. Typing `ohno.` will
    // trigger auto complete suggestions as appropriate.
    // Fantastic.
    throw ohno.too_boring_to_compute();
  }

  const actually_thrown_error:Catastrophe = t.throws(throwing_inner_function);
  
  t.deepEqual(actually_thrown_error.error, tst_errors.too_boring_to_compute);
  t.deepEqual(actually_thrown_error.category, tst_category);
  let stack = actually_thrown_error.native_error.stack;
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stackt race');
  }
});
