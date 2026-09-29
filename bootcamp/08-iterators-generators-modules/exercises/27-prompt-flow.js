// ─────────────────────────────────────────────────────────────────────────
//  27 · signupFlow · runFlow                                   ★★☆ core
//  concepts: two-way generators · yielding questions, receiving answers
//  run: node 27-prompt-flow.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A wizard written as callbacks scatters its state across five
//  handlers. Written as a generator it is a straight-line script: yield
//  the question, and the answer arrives back at the same line.
//
//      const flow = signupFlow();
//      flow.next().value             → ASK_NAME
//      flow.next('Ada').value        → ASK_EMAIL
//      flow.next('ada@x.dev').value  → ASK_PLAN
//      flow.next('gold').value       → ASK_PLAN   (bad answer, re-ask)
//      flow.next('pro')
//          → { value: { name, email, plan }, done: true }
//
//  signupFlow asks the three questions in order, re-asks the plan
//  question until the answer is 'free' or 'pro', and RETURNS the
//  finished record rather than yielding it.
//
//  runFlow(flow, answers) drives any such flow: feed the answers in
//  order and hand back { prompts, result } — every question that was
//  asked, plus the generator's return value. If the answers run out
//  before the flow ends, result is undefined.
//
//  hint: the return value only ever appears on the step where
//        done === true — a for-of loop would throw it in the bin

import { test, eq } from '../../_lib/check.js';

// scaffolding: the exact prompt strings. Do not edit.
const ASK_NAME = 'What is your name?';
const ASK_EMAIL = 'What is your email?';
const ASK_PLAN = 'Which plan? free or pro';

export function* signupFlow() {
  throw new Error('TODO');
}

export function runFlow(flow, answers) {
  throw new Error('TODO');
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
