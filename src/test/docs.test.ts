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

test(async function simple_example(t) {
  t.plan(0); // We test everything in basic.test.ts, this file is a cleaner version.

  // You would only create one CatastrophicCaretaker, and make it available
  // through your DI system. Any component or module can then use it to define
  // its own error category, with errors.
  let error_manager = new Catastrophic();

  // Lets say our module is called "Testing" and we chose the code A for it.
  let tst_category = {
    unique_code: 'A',
    description: 'Testing category',
  };

  // To preserve API compat, unique_number must always refer to the same error, forever.
  let tst_errors = {
    tepid_trepidations: {
      unique_number: 0,
      http_code: 500,
      description: `the function couldn't do it due to excessive worry`,
    },
    too_boring_to_compute: {
      unique_number: 1,
      http_code: 400,
    },
  };

  // ohno is your error factory for tst_errors, which you could just use within
  // a component or make available in a module through your DI system
  let ohno = error_manager.new_category(tst_category, tst_errors);

  function throwing_inner_function() {
    // This is how you would use it. Typing `ohno.` will
    // trigger auto complete suggestions as appropriate.
    // ohno's type is `Cat<typeof tst_errors>`.
    // Fantastic.
    throw ohno.too_boring_to_compute({
      boring_level: 9001,
      extra_infos: 'This object is an annotation.',
      sweet_infos: 'You can annotate your Catties however you want.',
      xoxox_infos: 'But you should not show the annotations to clients.',
    });
  }

  try {
    throwing_inner_function();
  } catch (e) {
    // e.category == tst_category
    // e.error ~= tst_errors.too_boring_to_compute
    // e.error.description == 'too_boring_to_compute'
    // e.annotation == 'just as expected'
    // e.stack and e.native_error.stack contain "throwing_inner_function"
    // e.identity() == 'A_1'
    // e.identity_json() == {
    //   error_category: 'A',
    //   error_number: 1
    // }
  }

  // You can also wrap existing Errors (they must be `instanceof Error`).
  // If you do so, the stack of the wrapped error will be used. Convenient!
  try {
    throw Error('worrying too much i cant do it captain, i just cant do it');
  } catch (e) {
    let err = ohno.tepid_trepidations(e, 'just as expected');
    // err.native_error is the error above
    // err.annotation is 'just as expected'
    let err_2 = ohno.tepid_trepidations(e);
    // since no annotation was given, we used the Error's message instead, so
    // err_2.annotation = 'worrying too much i cant do it captain, i just cant do it'
  }
});
