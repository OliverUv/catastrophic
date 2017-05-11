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

import { test } from 'ava';

import { Catastrophic, Catastrophe } from '../';

test(async function basic_use(t) {
  t.plan(9);

  let error_manager = new Catastrophic();

  let tst_category = {
    unique_code: 'TST',
    description: 'Testing category',
  };

  let tst_errors = {
    tepid_trepidations: {
      unique_number: 0,
      http_code: 500,
      description: `the function couldn't do it due to excessive worry`,
    },
    too_boring_to_compute: {
      unique_number: 1,
      http_code: 400,
      description: `user supplied very boring data`,
    },
  };

  let ohno = error_manager.new_category(tst_category, tst_errors);

  function throwing_inner_function() {
    throw ohno.too_boring_to_compute('errordata');
  }

  const catastrophe:Catastrophe = t.throws(throwing_inner_function);
  
  t.deepEqual(
      catastrophe.error,
      tst_errors.too_boring_to_compute);

  t.deepEqual(
      catastrophe.category,
      tst_category);

  t.is(
      catastrophe.annotation,
      'errordata');

  t.is(catastrophe.identity(), 'TST_1');
  t.deepEqual(catastrophe.identity_json(), {
    error_category: 'TST',
    error_number: 1,
  });

  let stack = catastrophe.stack;
  t.is(stack, catastrophe.native_error.stack);
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
    t.truthy(catastrophe.stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stack trace');
  }
});

test(async function terse(t) {
  t.plan(2);

  let error_manager = new Catastrophic();

  let category = {
    unique_code: 'TRS',
    description: 'Terse category',
  };

  let errors = {
    self_explanatory_error: {
      unique_number: 0,
      // http_code: 500, < Automatically added
      // description: 'self_explanatory_error',  < Automatically added
    }
  };

  let ohno = error_manager.new_category(category, errors);

  const dang = ohno.self_explanatory_error();

  t.is(dang.error.description, 'self_explanatory_error');
  t.is(dang.error.http_code, 500);
});

test(async function inner_error(t) {
  t.plan(10);

  let error_manager = new Catastrophic();

  let tst_category = {
    unique_code: 'TSTIONE',
    description: 'inner error test category numbero unos',
  };

  let tst_errors = {
    dangeronies: {
      unique_number: 0,
      http_code: 500,
      description: `ah gosh darn it`,
    },
  };

  let ohno = error_manager.new_category(tst_category, tst_errors);
  const inner_error_message = 'well that didnt pan out';
  let inner_error:Error = <Error><any>'assign before use hack';

  // This is to ensure we get the stack trace from the inner error
  function throwing_inner_function() {
    inner_error = new Error(inner_error_message);
  }
  throwing_inner_function();
  function throwing_outer_function() {
    throw ohno.dangeronies(inner_error);
  }

  const catastrophe:Catastrophe = t.throws(throwing_outer_function);

  t.deepEqual(
      catastrophe.error,
      tst_errors.dangeronies);

  t.deepEqual(
      catastrophe.category,
      tst_category);

  // For sake of convenience, if no annotation is given, and we got
  // an inner error, we use its message as annotation.
  t.is(
      catastrophe.annotation,
      inner_error_message);

  t.is(catastrophe.identity(), 'TSTIONE_0');
  t.deepEqual(catastrophe.identity_json(), {
    error_category: 'TSTIONE',
    error_number: 0,
  });

  t.is(catastrophe.native_error, <any>inner_error);

  let stack = catastrophe.stack;
  t.is(stack, catastrophe.native_error.stack);
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
    t.truthy(catastrophe.stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stack trace');
  }
});

test(async function inner_error_with_annotation(t) {
  t.plan(10);

  let error_manager = new Catastrophic();

  let tst_category = {
    unique_code: 'TSTITWO',
    description: 'inner error test category numbero dos',
  };

  let tst_errors = {
    dangeronies: {
      unique_number: 0,
      http_code: 500,
      description: `ah gosh darn it to heck`,
    },
  };

  let ohno = error_manager.new_category(tst_category, tst_errors);
  const annotation = 'AAAAAAAAAAAAAAAAAAA NOOOOOOOO';
  let inner_error:Error = <Error><any>'assign before use hack';

  // This is to ensure we get the stack trace from the inner error
  function throwing_inner_function() {
    inner_error = new Error('not used but remains in catastrophe.native_error.message');
  }
  throwing_inner_function();
  function throwing_outer_function() {
    throw ohno.dangeronies(inner_error, annotation);
  }

  const catastrophe:Catastrophe = t.throws(throwing_outer_function);

  t.deepEqual(
      catastrophe.error,
      tst_errors.dangeronies);

  t.deepEqual(
      catastrophe.category,
      tst_category);

  t.is(
      catastrophe.annotation,
      annotation);

  t.is(catastrophe.identity(), 'TSTITWO_0');
  t.deepEqual(catastrophe.identity_json(), {
    error_category: 'TSTITWO',
    error_number: 0,
  });

  t.is(catastrophe.native_error, <any>inner_error);

  let stack = catastrophe.stack;
  t.is(stack, catastrophe.native_error.stack);
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
    t.truthy(catastrophe.stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stack trace');
  }
});
