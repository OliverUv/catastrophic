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
  t.plan(8);

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

  t.is(actually_thrown_error.identity(), 'TST_1');
  t.deepEqual(actually_thrown_error.identity_json(), {
    error_category: 'TST',
    error_number: 1,
  });

  let stack = actually_thrown_error.native_error.stack;
  if (stack) {
    t.truthy(stack.includes('throwing_inner_function'));
    t.truthy(actually_thrown_error.stack.includes('throwing_inner_function'));
  } else {
    t.fail('Thrown native contained no stack trace');
  }
});
