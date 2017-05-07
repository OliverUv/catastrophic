import { test } from 'ava';

import { CatastrophicCaretaker, Catastrophe } from '../';

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
