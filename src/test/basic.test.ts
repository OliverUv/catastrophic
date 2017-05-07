import { test } from 'ava';

import { CatastrophicCaretaker, Catastrophe } from '../';

test(async function basic_use(t) {
  t.plan(5);

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
      unique_number: 2,
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
    throw ohno.too_boring_to_compute('errordata');
  }

  const actually_thrown_error:Catastrophe = t.throws(throwing_inner_function);
  
  t.deepEqual(
      actually_thrown_error.error,
      tst_errors.too_boring_to_compute);

  t.deepEqual(
      actually_thrown_error.category,
      tst_category);

  t.is(
      actually_thrown_error.annotation,
      'errordata');

  let stack = actually_thrown_error.native_error.stack;
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stack trace');
  }
});

test(async function throw_on_reserved_category_code(t) {
  t.plan(2);
  let error_manager = new CatastrophicCaretaker();
  t.throws(() => {
    error_manager.register_category({
      code: 'CATASTROPHIC',
      description: 'This must not be allowed.',
    },{});
  });

  let error_manager_2 = new CatastrophicCaretaker('INTRNL');
  t.throws(() => {
    error_manager_2.register_category({
      code: 'INTRNL',
      description: 'This must not be allowed.',
    },{});
  })
});

test(async function throw_on_duplicate_category_code(t) {
  let error_manager = new CatastrophicCaretaker();
  t.plan(1);
  error_manager.register_category({
    code: 'one',
    description: 'This is ok',
  },{});
  error_manager.register_category({
    code: 'two',
    description: 'This is also ok',
  },{});
  t.throws(() => {
    error_manager.register_category({
      code: 'two',
      description: 'But this is not, as two is already used',
    },{});
  })
});

test(async function throw_on_duplicate_error_number(t) {
  let error_manager = new CatastrophicCaretaker();
  t.plan(1);
  t.throws(() => {
    error_manager.register_category({
      code: 'one',
      description: 'This is ok',
    },{
      error_one: {
        unique_number: 0,
        http_code: 500,
        description: 'ok'
      },
      error_two: {
        unique_number: 0,
        http_code: 500,
        description: 'not ok'
      },
    });
  });;
});

test(async function throw_on_duplicate_error_key(t) {
  let error_manager = new CatastrophicCaretaker();
  t.plan(1);
  t.throws(() => {
    error_manager.register_category({
      code: 'one',
      description: 'This is ok',
    },{
      error_one: {
        unique_number: 0,
        http_code: 500,
        description: 'ok'
      },
      error_two: {
        unique_number: 0,
        http_code: 500,
        description: 'not ok'
      },
    });
  });;
});
