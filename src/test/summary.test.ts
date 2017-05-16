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

test(async function multi_category_summary(t) {
  t.plan(2);

  let error_manager = new Catastrophic();

  let tst_category = {
    unique_code: 'TST',
    description: 'Testing category',
  };

  let tst_errors = {
    tepid_trepidations: {
      unique_number: 0,
      description: `the function couldn't do it due to excessive worry`,
    },
    momentous_machinations: {
      unique_number: 1,
      http_code: 500,
      description: `the function couldn't complete due to excessive consideration`,
    },
    too_boring_to_compute: {
      unique_number: 2,
      http_code: 400,
      description: `user supplied very boring data`,
    },
  };

  let wiley_category = {
    unique_code: 'W',
    description: 'Robot errors',
    default_http_code: 400,
  };

  let wiley_errors = {
    too_much_mega: {
      unique_number: 0,
      http_code: 500,
      description: `oh gosh oh dang`,
    },
    too_big_hair: {
      unique_number: 1,
      description: `this should never happen`,
    },
  };

  error_manager.new_category(tst_category, tst_errors);
  error_manager.new_category(wiley_category, wiley_errors);

  let summary = error_manager.get_summary_json();
  t.is(summary.separator, '_');
  // Ensures all info is printed, categories are sorted by unique_code, and
  // errors sorted by unique_number
  t.deepEqual(summary.categories, [
    {
      spec: {
        unique_code: 'CATASTROPHIC',
        description: 'Errors from within the Catastrophic Error Builder',
        default_http_code: 500,
      },
      errors: [
        {
          unique_number: 0,
          http_code: 500,
          description: 'Tried to use reserved internal category code',
        },
        {
          unique_number: 1,
          http_code: 500,
          description: 'Tried to register two categories with the same category code',
        },
        {
          unique_number: 2,
          http_code: 500,
          description: 'Category code contains separator, this is not allowed.',
        },
        {
          unique_number: 3,
          http_code: 500,
          description: 'Tried to register two errors with the same key in a single category',
        },
        {
          unique_number: 4,
          http_code: 500,
          description: 'Tried to register two errors with the same number in a single category',
        },
      ],
    },
    {
      spec:
        {
        unique_code: 'TST',
        description: 'Testing category',
        default_http_code: 500,
      },
      errors: [
        {
          unique_number: 0,
          description: `the function couldn't do it due to excessive worry`,
          http_code: 500,
        },
        {
          unique_number: 1,
          http_code: 500,
          description: `the function couldn't complete due to excessive consideration`,
        },
        {
          unique_number: 2,
          http_code: 400,
          description: 'user supplied very boring data',
        },
      ],
    },
    {
      spec: {
        unique_code: 'W',
        description: 'Robot errors',
        default_http_code: 400,
      },
      errors: [
        {
          unique_number: 0,
          http_code: 500,
          description: 'oh gosh oh dang',
        },
        {
          unique_number: 1,
          description: 'this should never happen',
          http_code: 400,
        },
      ],
    },
  ]);
});
