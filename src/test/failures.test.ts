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

test(async function throw_on_reserved_category_code(t) {
  t.plan(2);
  let error_manager = new Catastrophic();
  t.throws(() => {
    error_manager.new_category({
      unique_code: 'CATASTROPHIC',
      description: 'This must not be allowed.',
    },{});
  });

  let error_manager_2 = new Catastrophic('INTRNL');
  t.throws(() => {
    error_manager_2.new_category({
      unique_code: 'INTRNL',
      description: 'This must not be allowed.',
    },{});
  })
});

test(async function throw_on_duplicate_category_code(t) {
  let error_manager = new Catastrophic();
  t.plan(1);
  error_manager.new_category({
    unique_code: 'one',
    description: 'This is ok',
  }, {});
  error_manager.new_category({
    unique_code: 'two',
    description: 'This is also ok',
  }, {});
  t.throws(() => {
    error_manager.new_category({
      unique_code: 'two',
      description: 'But this is not, as two is already used',
    }, {});
  })
});

test(async function throw_on_duplicate_error_number(t) {
  let error_manager = new Catastrophic();
  t.plan(1);
  t.throws(() => {
    error_manager.new_category({
      unique_code: 'one',
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

test(async function throw_on_separator_collision(t) {
  t.plan(1);
  t.throws(() => {
    let error_manager = new Catastrophic('X_', '_');
  });;
});

test(async function throw_on_separator_collision_2(t) {
  t.plan(1);
  let error_manager = new Catastrophic('X', '_');
  t.plan(1);
  t.throws(() => {
    error_manager.new_category({
      unique_code: 'heyo_',
      description: 'This is not ok',
    }, {});
  });;
});
