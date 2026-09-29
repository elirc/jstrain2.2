import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const docsRoot = path.resolve(import.meta.dirname, "..");
const masteryRoot = path.join(docsRoot, "optimized-01-29", "mastery");
const topicOutputRoot = path.join(docsRoot, "optimized-01-29", "explanations");
const projectRoot = path.join(docsRoot, "crud-projects");
const projectOutputRoot = path.join(projectRoot, "explanations");

const topicPurpose = {
  "01": "runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent",
  "02": "function behavior, captured state, callback lifetime, and ownership of execution context",
  "03": "collection transformations, identity, mutation, and data-shape contracts across application layers",
  "04": "text parsing, regular expressions, keyed collections, dates, and normalization at system boundaries",
  "05": "JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately",
  "06": "failure modeling, context preservation, cleanup, recovery, and honest caller-visible error behavior",
  "07": "asynchronous ordering, cancellation, concurrency, settlement, and resource lifetime",
  "08": "lazy traversal, generator control flow, module contracts, and dependency direction",
  "09": "operation costs, invariants, representation choices, and selecting structures from workload rather than habit",
  "10": "practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales",
  "11": "pure transformation, effect isolation, immutability, composition, and refactoring toward predictable code",
  "12": "Node runtime boundaries including files, buffers, events, streams, cryptography, processes, and HTTP",
  "13": "browser lifecycle, events, accessibility, security, state ownership, and DOM performance",
  "14": "design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned",
  "15": "requirements, architecture, vertical delivery, integration, release safety, and technical defense",
  "16": "command contracts, streams, shell safety, filesystem effects, exit behavior, and operator experience",
  "17": "backpressure, subprocesses, workers, queues, cancellation, performance, and graceful lifecycle ownership",
  "18": "HTTP semantics, routing, middleware, validation, caching, streaming, errors, and connection lifecycle",
  "19": "durability, concurrency, repositories, transactions, migrations, recovery, and data integrity",
  "20": "risk-based test design, deterministic seams, contracts, properties, mutation, coverage, and CI feedback",
  "21": "retrieval and transfer across mixed topics without the labels and cues provided by a tutorial",
  "22": "relational cardinality, join semantics, null behavior, aggregation, indexes, and stable query contracts",
  "23": "rapid integration of Node modules, bytes, events, files, streams, processes, servers, and persistence",
  "24": "disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence",
  "25": "navigation and safe change in unfamiliar repositories with distributed ownership and compatibility constraints",
  "26": "trust boundaries, authorization, injection, browser threats, secrets, dependencies, and defense in depth",
  "27": "relational modeling, constraints, exact transactions, query performance, concurrency, pagination, and migrations",
  "28": "unreliable API consumption, runtime contracts, cancellation, retries, caching, client races, and honest UX",
  "29": "deriving discriminating tests from risks and contracts instead of merely executing lines of code",
};

const rungWhy = {
  Explain: "A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax.",
  Predict: "Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result.",
  Implement: "Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior.",
  Test: "Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration.",
  "Debug and review": "Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change.",
  Apply: "Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints.",
};

const rungApproach = {
  Explain: "Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words.",
  Predict: "Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta.",
  Implement: "Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version.",
  Test: "Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates.",
  "Debug and review": "Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix.",
  Apply: "Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff.",
};

const proofByRung = {
  Explain: "Keep a two-minute recording or written causal diagram, plus one corrected misconception.",
  Predict: "Keep the pre-run prediction, observed output, and a short explanation of every mismatch.",
  Implement: "Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.",
  Test: "Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.",
  "Debug and review": "Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.",
  Apply: "Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.",
};

const rungPitfall = {
  Explain: "Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow.",
  Predict: "Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior.",
  Implement: "Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics.",
  Test: "Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation.",
  "Debug and review": "Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence.",
  Apply: "Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails.",
};

const rungTransfer = {
  Explain: "Use the model in a design or code-review conversation and answer one follow-up objection without notes.",
  Predict: "Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system.",
  Implement: "Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite.",
  Test: "State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk.",
  "Debug and review": "Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step.",
  Apply: "Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers.",
};

const keywordGuides = [
  [/authori[sz]|tenant|permission|role|owner/i, "Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation."],
  [/concurr|race|interleav|parallel|simultaneous/i, "Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof."],
  [/idempoten|duplicate|retry|backoff|webhook/i, "Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout."],
  [/transaction|atomic|rollback|commit|lost update/i, "List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state."],
  [/stream|backpressure|buffer|pipeline/i, "Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe."],
  [/\btime\b|clock|date|zone|DST|deadline|expiry|expiration/i, "Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant."],
  [/SQL|query|join|index|database|repository|schema/i, "Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible."],
  [/React|DOM|browser|accessib|keyboard|focus|UI|user-visible/i, "Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states."],
  [/HTTP|API|route|header|cookie|CORS|status/i, "Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary."],
  [/\btests?\b|\btesting\b|\bcoverage\b|\bmutants?\b|\bfixtures?\b|\bassert(?:ion|ions)?\b|property-based/i, "State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason."],
  [/error|failure|throw|reject|invalid|malformed/i, "Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe."],
  [/migration|version|compatib|rollout|deploy/i, "Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change."],
  [/cache|stale|optimistic/i, "Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user."],
  [/security|inject|secret|XSS|CSRF|path traversal|prototype pollution/i, "Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary."],
  [/worker|child process|subprocess|process|signal|shutdown/i, "Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown."],
  [/module|import|export|dependency|cycle/i, "Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers."],
  [/file|path|CSV|JSON Lines|upload|download/i, "Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage."],
  [/\balgorithms?\b|\bcomplexity\b|\bsearch(?:ing)?\b|\bsort(?:ing|ed)?\b|\btraversal\b|data structures?|\bqueues?\b|\bstacks?\b|\bmaps?\b|\bsets?\b/i, "Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes."],
  [/closure|callback|\bthis\b|capture/i, "Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup."],
  [/prototype|class|inherit|composition/i, "Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition."],
  [/promise|async|await|event loop|microtask|cancell/i, "Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success."],
  [/\bevents?\b|\blisteners?\b|\bemitters?\b/i, "Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation."],
  [/money|currency|price|amount|refund|total/i, "Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total."],
];

const keywordPitfalls = [
  [/authori[sz]|tenant|permission|role|owner/i, "A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state."],
  [/concurr|race|interleav|parallel|simultaneous/i, "Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation."],
  [/idempoten|duplicate|retry|backoff|webhook/i, "An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic."],
  [/transaction|atomic|rollback|commit|lost update/i, "A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee."],
  [/stream|backpressure|buffer|pipeline/i, "A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name."],
  [/\btime\b|clock|date|zone|DST|deadline|expiry|expiration/i, "Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes."],
  [/SQL|query|join|index|database|repository|schema/i, "Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics."],
  [/React|DOM|browser|accessib|keyboard|focus|UI|user-visible/i, "Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe."],
  [/HTTP|API|route|header|cookie|CORS|status/i, "Treating every failure as 400 or 500 erases retry and conflict semantics; types also do not validate bytes received over the wire."],
  [/\btests?\b|\btesting\b|\bcoverage\b|\bmutants?\b|\bfixtures?\b|\bassert(?:ion|ions)?\b|property-based/i, "Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive."],
  [/error|failure|throw|reject|invalid|malformed/i, "Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier."],
  [/migration|version|compatib|rollout|deploy/i, "A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping."],
  [/cache|stale|optimistic/i, "A single loading flag or blanket invalidation usually hides request identity, freshness, rollback, and concurrent mutation semantics."],
  [/security|inject|secret|XSS|CSRF|path traversal|prototype pollution/i, "Blocklists and client checks miss alternate encodings and execution contexts; defend at the authoritative boundary with allow-listed semantics."],
  [/worker|child process|subprocess|process|signal|shutdown/i, "Forcing process exit can discard output and partial work; background success is incomplete until handles and children are owned and drained."],
  [/money|currency|price|amount|refund|total/i, "Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds."],
];

const sectionPurpose = {
  "Actors and permissions": "This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.",
  "Core data model": "This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.",
  "Required workflows": "This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.",
  "API and UI requirements": "This turns domain behavior into stable server contracts and honest, accessible client states.",
  "Critical rules and failure cases": "This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.",
  "Background work and integrations": "This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.",
  "Required tests": "This supplies independent evidence against a named risk rather than measuring activity or line execution.",
  "Delivery plan": "This keeps the project shippable through vertical increments with concrete exit evidence.",
  "Stretch features": "This adds complexity only after the core system is correct and provides a deliberate specialization challenge.",
};

const sectionFailure = {
  "Actors and permissions": "The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need.",
  "Core data model": "The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership.",
  "Required workflows": "The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries.",
  "API and UI requirements": "The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state.",
  "Critical rules and failure cases": "The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary.",
  "Background work and integrations": "The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded.",
  "Required tests": "The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect.",
  "Delivery plan": "The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof.",
  "Stretch features": "The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak.",
};

const sectionImplementation = {
  "Actors and permissions": "Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.",
  "Core data model": "Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.",
  "Required workflows": "Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.",
  "API and UI requirements": "Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.",
  "Critical rules and failure cases": "Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.",
  "Background work and integrations": "Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.",
  "Required tests": "Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect.",
  "Delivery plan": "Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment.",
  "Stretch features": "Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.",
};

function guidesFor(text) {
  const matches = keywordGuides.filter(([pattern]) => pattern.test(text)).slice(0, 2);
  return matches.map(([, guide]) => guide).join(" ");
}

function pitfallFor(text) {
  return keywordPitfalls.find(([pattern]) => pattern.test(text))?.[1] ?? "The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.";
}

function safeTitle(text) {
  return text.replace(/`/g, "").replace(/\.$/, "");
}

async function generateTopicNotes() {
  await mkdir(topicOutputRoot, { recursive: true });
  const names = (await readdir(masteryRoot))
    .filter((name) => /^\d{2}-.*\.md$/.test(name))
    .sort();
  const indexRows = [];

  for (const name of names) {
    const source = await readFile(path.join(masteryRoot, name), "utf8");
    const number = name.slice(0, 2);
    const heading = source.match(/^# (.+)$/m)?.[1] ?? name;
    const title = heading.replace(/ mastery bank$/i, "");
    const outputName = name
      .replace(/-MASTERY-BANK\.md$/, "-COACHING.md")
      .replace(/-MASTERY\.md$/, "-COACHING.md");
    const lines = source.split(/\r?\n/);
    let rung = "";
    let exerciseNumber = 0;
    const output = [
      `# ${title} — coaching notes`,
      "",
      `Companion to [the exercise bank](../mastery/${name}). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.`,
      "",
    ];

    for (const line of lines) {
      const rungMatch = line.match(/^## (Explain|Predict|Implement|Test|Debug and review|Apply)$/);
      if (rungMatch) {
        rung = rungMatch[1];
        output.push(`## ${rung}`, "", `${rungWhy[rung]} In this topic, the focus is ${topicPurpose[number]}.`, "");
        continue;
      }
      const taskMatch = line.match(/^- \[ \] (.+)$/);
      if (!taskMatch || !rung) continue;
      exerciseNumber += 1;
      const task = taskMatch[1];
      const guide = guidesFor(task);
      output.push(
        `### E${String(exerciseNumber).padStart(2, "0")} — ${safeTitle(task)}`,
        "",
        `- **Why it matters:** ${rungWhy[rung]} It strengthens ${topicPurpose[number]} by requiring you to ${task.charAt(0).toLowerCase()}${task.slice(1)}`,
        `- **How to approach and prove it:** ${rungApproach[rung]}${guide ? ` ${guide}` : ""} ${proofByRung[rung]}`,
        `- **Common wrong turn:** ${rungPitfall[rung]} ${pitfallFor(task)}`,
        `- **Transfer checkpoint:** ${rungTransfer[rung]} Tie the answer back to the exact behavior in “${safeTitle(task)}.”`,
        "",
      );
    }

    if (exerciseNumber !== 30) throw new Error(`${name} contained ${exerciseNumber} exercises`);
    await writeFile(path.join(topicOutputRoot, outputName), `${output.join("\n").trim()}\n`, "utf8");
    indexRows.push(`| ${number} | [${title.replace(/^\d{2} — /, "")}](./${outputName}) | 30 |`);
  }

  const readme = [
    "# Coaching notes for topics 01–29",
    "",
    "These companions add four explanations to every mastery problem: why it matters, how to approach and prove it, the common wrong turn, and a transfer checkpoint. Attempt the linked exercise first so the notes support learning rather than recognition.",
    "",
    "| # | Topic | Problems explained |",
    "| --- | --- | ---: |",
    ...indexRows,
    "",
    "Use a note only after writing a prediction or plan. After reading it, close the file and restate the approach from memory before continuing.",
    "",
  ].join("\n");
  await writeFile(path.join(topicOutputRoot, "README.md"), readme, "utf8");
  return { files: names.length, problems: names.length * 30, explanations: names.length * 120 };
}

function parseProjectItems(source) {
  const lines = source.split(/\r?\n/);
  const items = [];
  let section = "";
  let subsection = "";
  let inTable = false;
  let tableHeaderSeen = false;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      section = h2[1];
      subsection = "";
      inTable = false;
      tableHeaderSeen = false;
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      subsection = h3[1];
      inTable = false;
      tableHeaderSeen = false;
      continue;
    }
    const bullet = line.match(/^- (.+)$/);
    if (bullet && sectionPurpose[section]) {
      items.push({ section, subsection, text: bullet[1], kind: "requirement" });
      continue;
    }
    if (line.startsWith("|")) {
      if (!sectionPurpose[section]) continue;
      if (/^\|[ -]+\|/.test(line)) {
        tableHeaderSeen = true;
        continue;
      }
      if (!inTable) {
        inTable = true;
        continue;
      }
      if (!tableHeaderSeen) continue;
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length >= 2 && !cells.every((cell) => /^-+$/.test(cell))) {
        items.push({ section, subsection, text: `${cells[0]} — ${cells.slice(1).join("; ")}`, kind: "table entry" });
      }
    } else if (line.trim() === "") {
      inTable = false;
    }
  }
  return items;
}

function requirementProof(section, text) {
  const guide = guidesFor(text);
  const base = {
    "Actors and permissions": "Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.",
    "Core data model": "Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.",
    "Required workflows": "Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.",
    "API and UI requirements": "Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.",
    "Critical rules and failure cases": "Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.",
    "Background work and integrations": "Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.",
    "Required tests": "Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test.",
    "Delivery plan": "Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation.",
    "Stretch features": "Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.",
  }[section];
  return `${base}${guide ? ` ${guide}` : ""}`;
}

function requirementImplementation(section, text) {
  const guide = guidesFor(text);
  return `${sectionImplementation[section]}${guide ? ` ${guide}` : ""}`;
}

async function generateProjectNotes() {
  await mkdir(projectOutputRoot, { recursive: true });
  const names = (await readdir(projectRoot)).filter((name) => /^0[1-8]-.*\.md$/.test(name)).sort();
  const indexRows = [];
  let requirementCount = 0;

  for (const name of names) {
    const source = await readFile(path.join(projectRoot, name), "utf8");
    const title = source.match(/^# (.+)$/m)?.[1] ?? name;
    const items = parseProjectItems(source);
    requirementCount += items.length;
    const outputName = name.replace(/\.md$/, "-EXPLAINED.md");
    const output = [
      `# ${title} — requirement coaching`,
      "",
      `Companion to [the build brief](../${name}). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.`,
      "",
    ];
    let currentSection = "";
    let currentSubsection = "";
    let number = 0;

    for (const item of items) {
      if (item.section !== currentSection) {
        currentSection = item.section;
        currentSubsection = "";
        output.push(`## ${currentSection}`, "", sectionPurpose[currentSection], "");
      }
      if (item.subsection && item.subsection !== currentSubsection) {
        currentSubsection = item.subsection;
        output.push(`### ${currentSubsection}`, "");
      }
      number += 1;
      output.push(
        `#### R${String(number).padStart(3, "0")} — ${safeTitle(item.text)}`,
        "",
        `- **Engineering intent:** ${sectionPurpose[item.section]} This requirement makes that concrete through: ${item.text}`,
        `- **Acceptance evidence:** ${requirementProof(item.section, item.text)}`,
        `- **Failure to avoid:** ${sectionFailure[item.section]} ${pitfallFor(item.text)}`,
        `- **Implementation guidance:** ${requirementImplementation(item.section, item.text)}`,
        "",
      );
    }

    await writeFile(path.join(projectOutputRoot, outputName), `${output.join("\n").trim()}\n`, "utf8");
    indexRows.push(`| ${name.slice(0, 2)} | [${title.replace(/^\d{2} — /, "")}](./${outputName}) | ${items.length} |`);
  }

  const readme = [
    "# Explained CRUD requirements",
    "",
    "These companions add four coaching layers to every enumerated requirement in the eight build briefs: engineering intent, acceptance evidence, failure to avoid, and implementation guidance. Read the original brief first; use these notes while splitting an increment into implementation tickets and review checks.",
    "",
    "| # | Project | Requirements explained |",
    "| --- | --- | ---: |",
    ...indexRows,
    "",
    "The notes clarify the work but do not replace an ADR, a threat model, executable acceptance tests, or evidence from the running system.",
    "",
  ].join("\n");
  await writeFile(path.join(projectOutputRoot, "README.md"), readme, "utf8");
  return { files: names.length, requirements: requirementCount, explanations: requirementCount * 4 };
}

async function markdownFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await markdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(fullPath);
  }
  return result;
}

async function validateDocs() {
  const files = await markdownFiles(docsRoot);
  const brokenLinks = [];
  const oddFences = [];
  const trailingWhitespace = [];
  const linkTargets = new Set();

  for (const file of files) {
    const content = await readFile(file, "utf8");
    if ((content.match(/^```/gm)?.length ?? 0) % 2 !== 0) oddFences.push(file);
    content.split(/\r?\n/).forEach((line, index) => {
      if (/[ \t]+$/.test(line)) trailingWhitespace.push(`${file}:${index + 1}`);
    });
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0].replace(/^<|>$/g, "");
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      linkTargets.add(`${file}\0${path.resolve(path.dirname(file), target)}\0${target}`);
    }
  }
  await Promise.all([...linkTargets].map(async (entry) => {
    const [file, resolved, target] = entry.split("\0");
    try {
      await access(resolved);
    } catch {
      brokenLinks.push(`${file} -> ${target}`);
    }
  }));
  return {
    files: files.length,
    brokenLinks,
    oddFences,
    trailingWhitespace,
  };
}

const validateOnly = process.argv.includes("--validate-only");
const skipValidation = process.argv.includes("--skip-validation");
if (validateOnly) console.log("validation-start");
const topicStats = validateOnly ? undefined : await generateTopicNotes();
const projectStats = validateOnly ? undefined : await generateProjectNotes();
const validation = skipValidation ? undefined : await validateDocs();
console.log(JSON.stringify({ ...(topicStats && { topicStats }), ...(projectStats && { projectStats }), ...(validation && { validation }) }));
