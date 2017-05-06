import { test } from 'ava';

import * as err from '../';

test(async function basic_use(t) {
  t.plan(3);

  let error_manager = new err.CatastrophicCaretaker();

  // Don't mark up this with the ErrorDescCol type! You'll lose the more
  // granular auto-completion that lets you go `tst_errors.` and then choose
  // between the errors you've defined for this category. Don't worry, TS will
  // still ensure that this fulfills the type required by the register
  // function.
  let tst_errors = {
    didnt_do_very_good: {
      unique_number: 1, // To preserve API compat, must never change ever
      http_code: 500,
      description: `the function couldn't do it due to tepid trepidations`,
    },
  };

  let tst_category = {
    code: 'TST',
    description: 'Testing category',
  };

  let die = error_manager.register_category(tst_category, tst_errors);

  function inner_function() {
    throw die.die(tst_errors.didnt_do_very_good);
  }

  const actually_thrown_error:err.Catastrophe = t.throws(inner_function);
  
  t.deepEqual(actually_thrown_error.error, tst_errors.didnt_do_very_good);
  t.deepEqual(actually_thrown_error.category, tst_category);
});
