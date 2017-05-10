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

interface NaughtyMetadata {
  anger_level:number;
  naughty_user:string;
  suggested_punishment:any;
}

test(async function specific_annotation_type(t) {
  t.plan(9);

  let error_manager = new Catastrophic();

  let any_category = {
    unique_code: 'ANY',
    description: 'Errors with any type of annotation data',
  };

  let any_errors = {
    easy_error: {
      unique_number: 0,
      http_code: 500,
      description: `light weight error right here`,
    },
  };

  let bad_category = {
    unique_code: 'BAD',
    description: 'Santa angering',
  };

  let bad_errors = {
    user_too_naughty: {
      unique_number: 0,
      http_code: 400,
      description: `user angered santa too much`,
    },
  };

  let ohno = {
    any: error_manager.new_category(any_category, any_errors),
    bad: error_manager.new_category<typeof bad_errors, NaughtyMetadata>(bad_category, bad_errors),
  };

  let err_any = ohno.any.easy_error('welp');
  t.is(err_any.annotation, 'welp');

  let err_any2 = ohno.any.easy_error();
  t.truthy(err_any2.annotation == undefined);

  // Can't be done, as intended. Thanks TS compiler
  // let err_bad = ohno.bad.user_too_naughty('forbidden');

  // We don't want this to be allowed, but if we remove the question mark from
  // the ReturnsCatastrophe function definition, other things stop working.
  // See line 215 of src/index.ts
  let err_bad2 = ohno.bad.user_too_naughty();

  // Allowed!
  let err_bad3 = ohno.bad.user_too_naughty({
    anger_level: 666,
    naughty_user: 'Mallory',
    suggested_punishment: 'Big ol lumps of coal, hahaha',
  });
});
