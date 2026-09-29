// ─────────────────────────────────────────────────────────────────────────
//  27 · signupFlow · runFlow — SOLUTION                        ★★☆ core
//  run: node 27-prompt-flow.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `const name = yield ASK_NAME;` reads like a blocking
//  prompt() call and is not one — the generator hands the question out
//  and freezes, and the answer arrives at that same line whenever the
//  driver gets round to it. The flow therefore does not care whether
//  the answers come from a CLI, a chat webhook or an array in a test.
//
//  The re-ask loop is the payoff: validation is an ordinary `while`
//  around one line, instead of a state field saying which question is
//  outstanding.
//
//  runFlow is the driver, and it differs from a plain drive loop in one
//  way that matters — it keeps the step where done === true, because
//  that is the only place the record ever appears. Push the prompt
//  BEFORE checking whether an answer is left, so a flow that runs out
//  still reports the question it is waiting on.
//
//  Classic wrong turn: `flow.next(answers[0])` as the first call. The
//  priming pull has no paused yield to receive anything, so that answer
//  vanishes and every later one lands on the wrong question.

import { test, eq } from '../../_lib/check.js';

// scaffolding: the exact prompt strings. Do not edit.
const ASK_NAME = 'What is your name?';
const ASK_EMAIL = 'What is your email?';
const ASK_PLAN = 'Which plan? free or pro';

export function* signupFlow() {
  const name = yield ASK_NAME;
  const email = yield ASK_EMAIL;
  let plan = yield ASK_PLAN;
  while (plan !== 'free' && plan !== 'pro') {
    plan = yield ASK_PLAN;
  }
  return { name, email, plan };
}

export function runFlow(flow, answers) {
  const prompts = [];
  let step = flow.next();
  let index = 0;
  while (!step.done) {
    prompts.push(step.value);
    if (index >= answers.length) return { prompts, result: undefined };
    step = flow.next(answers[index]);
    index += 1;
  }
  return { prompts, result: step.value };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the priming pull asks for the name', () => {
  eq(signupFlow().next(), { value: ASK_NAME, done: false });
});

test('each answer moves the flow to the next question', () => {
  const flow = signupFlow();
  flow.next();
  eq(flow.next('Ada').value, ASK_EMAIL);
  eq(flow.next('ada@x.dev').value, ASK_PLAN);
});

test('the finished record rides out on done: true', () => {
  const flow = signupFlow();
  flow.next();
  flow.next('Ada');
  flow.next('ada@x.dev');
  eq(flow.next('pro'), {
    value: { name: 'Ada', email: 'ada@x.dev', plan: 'pro' },
    done: true,
  });
});

test('an answer the flow will not accept is asked again', () => {
  const flow = signupFlow();
  flow.next();
  flow.next('Ada');
  flow.next('ada@x.dev');
  eq(flow.next('gold').value, ASK_PLAN);
  eq(flow.next('nonsense').value, ASK_PLAN);
  eq(flow.next('free').done, true);
});

test('runFlow collects the prompts and keeps the return value', () => {
  eq(runFlow(signupFlow(), ['Ada', 'ada@x.dev', 'free']), {
    prompts: [ASK_NAME, ASK_EMAIL, ASK_PLAN],
    result: { name: 'Ada', email: 'ada@x.dev', plan: 'free' },
  });
});

test('runFlow shows the repeated question when an answer is rejected', () => {
  eq(runFlow(signupFlow(), ['Ada', 'a@b.co', 'gold', 'pro']), {
    prompts: [ASK_NAME, ASK_EMAIL, ASK_PLAN, ASK_PLAN],
    result: { name: 'Ada', email: 'a@b.co', plan: 'pro' },
  });
});

test('runFlow that runs out of answers reports no result', () => {
  eq(runFlow(signupFlow(), ['Ada']), {
    prompts: [ASK_NAME, ASK_EMAIL],
    result: undefined,
  });
  eq(runFlow(signupFlow(), []), { prompts: [ASK_NAME], result: undefined });
});

test('two flows in progress share nothing', () => {
  const a = signupFlow();
  const b = signupFlow();
  a.next();
  b.next();
  a.next('Ada');
  eq(b.next('Bo').value, ASK_EMAIL);
  eq(a.next('ada@x.dev').value, ASK_PLAN);
});
