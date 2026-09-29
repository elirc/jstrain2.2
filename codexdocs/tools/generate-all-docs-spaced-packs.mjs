import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const docsRoot = path.resolve(import.meta.dirname, "..");
const outputRoot = path.join(docsRoot, "spaced-repetition-all");

const stages = [
  { day: 0, name: "Encode from an honest baseline", support: "Cold attempt, then S2", variation: "the source's smallest representative case" },
  { day: 1, name: "Reconstruct without recognition cues", support: "S2 fading to S1", variation: "a blank artifact with the headings hidden" },
  { day: 3, name: "Discriminate adjacent ideas", support: "S1", variation: "a plausible look-alike that needs a different decision" },
  { day: 7, name: "Interleave without the topic label", support: "S1", variation: "a mixed TypeScript, Node, React, SQL, or process problem" },
  { day: 14, name: "Repair the weakest model", support: "S1", variation: "the most important prior hesitation or misconception" },
  { day: 21, name: "Teach and defend", support: "S1 to S0", variation: "a skeptical review question and a changed constraint" },
  { day: 30, name: "Transfer into project work", support: "S0", variation: "a real RelayDesk or CRUD-project ticket" },
  { day: 45, name: "Detect misuse in unfamiliar work", support: "S0", variation: "an unfamiliar diff containing one subtle defect or omission" },
  { day: 60, name: "Survive change and failure", support: "S0", variation: "a requirement change combined with timeout, race, denial, crash, or old version" },
  { day: 90, name: "Independent mastery audit", support: "S0", variation: "a novel randomly selected domain and no original topic cues" },
];

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (path.resolve(full) === path.resolve(outputRoot)) return [];
      return walk(full);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [full] : [];
  }));
  return nested.flat();
}

function clean(text) {
  return text
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[`*_#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(relative) {
  const normalized = relative.replaceAll("\\", "/");
  if (normalized.includes("/mastery/")) return "mastery bank";
  if (normalized.includes("/explanations/")) return "coaching explanation";
  if (normalized.startsWith("crud-projects/")) return "project brief or delivery guide";
  if (normalized.startsWith("learning-modes/spaced-packs/")) return "existing spaced-practice guide";
  if (normalized.startsWith("learning-modes/")) return "adaptive learning guide";
  if (normalized.startsWith("modules/")) return "deep engineering module";
  if (normalized.startsWith("optimized-01-29/")) return "optimized technical lesson";
  if (normalized.startsWith("templates/")) return "engineering work template";
  if (normalized.startsWith("references/")) return "routing or reference guide";
  return "course guide or assessment";
}

function titleAndConcepts(source, filename) {
  const title = clean(source.match(/^# (.+)$/m)?.[1] ?? path.basename(filename, ".md"));
  const headings = [...source.matchAll(/^#{2,4} (.+)$/gm)]
    .map((match) => clean(match[1]))
    .filter((heading) => heading && !/^Stage(?: record| \d+)/i.test(heading) && heading !== "Spaced practice");
  const boldTerms = [...source.matchAll(/\*\*([^*]{3,80}):?\*\*/g)].map((match) => clean(match[1]));
  const concepts = [...new Set([...headings, ...boldTerms, title])].slice(0, 16);
  while (concepts.length < 6) concepts.push(`apply ${title} to a concrete engineering decision`);
  return { title, concepts };
}

function artifactFor(kind) {
  return {
    "mastery bank": "prediction, implementation, test, trace, review, or project-transfer artifact",
    "coaching explanation": "corrected causal explanation paired with executable evidence",
    "project brief or delivery guide": "vertical feature, acceptance table, ADR, test, runbook, or operational proof",
    "existing spaced-practice guide": "retrieval record showing whether the existing schedule produced transfer",
    "adaptive learning guide": "completed session artifact plus mode-effectiveness evidence",
    "deep engineering module": "working code, discriminating test, and project transfer",
    "optimized technical lesson": "prediction table, minimal demonstration, and changed-case solution",
    "engineering work template": "completed template for a realistic feature, review, decision, or incident",
    "routing or reference guide": "evidence-backed route decision and result after following it",
    "course guide or assessment": "completed plan, assessment, rubric evidence, or project decision",
  }[kind];
}

function stageContent(stage, index, concepts, kind) {
  const a = concepts[index % concepts.length];
  const b = concepts[(index + 3) % concepts.length];
  const c = concepts[(index + 6) % concepts.length];
  const artifact = artifactFor(kind);
  return [
    `## Stage ${String(index + 1).padStart(2, "0")} — Day ${stage.day}: ${stage.name}`,
    "",
    `**Support ceiling:** ${stage.support}. **Changed condition:** ${stage.variation}.`,
    "",
    `- [ ] **Retrieve the model:** With the source closed, explain **${a}** as problem → mechanism → ownership → boundary → counterexample.`,
    `  - Evidence: keep the unedited first attempt, mark confidence, then record exactly what source or runtime feedback corrected.`,
    `- [ ] **Reconstruct the useful artifact:** Recreate **${b}** from a blank file, page, diagram, test, or decision table appropriate to this ${kind}.`,
    `  - Evidence: produce a ${artifact}; compare only afterward and describe the smallest decision you omitted.`,
    `- [ ] **Discriminate and falsify:** Contrast **${a}** with **${c}** and create a case where copying the first rule or workflow would be wrong.`,
    `  - Evidence: use output, a failing test, row set, timeline, authorization matrix, review finding, or incident observation—not preference.`,
    `- [ ] **Transfer under variation:** Apply **${b}** to ${stage.variation}; change at least one of actor, trust, time, concurrency, data size, dependency failure, or version.`,
    `  - Evidence: link a reviewable artifact and state which idea transferred, which scaffold did not, and the remaining risk.`,
    `- [ ] **Review and reschedule:** Obtain test/runtime/source/human/adversarial-AI feedback on **${a}**, **${b}**, and **${c}**; score 0–4 and choose the next gap.`,
    `  - Evidence: record assistance, accessibility adaptations, one rejected suggestion, the next retrieval date, and why the interval fits the score.`,
    "",
    "### Retrieval record",
    "",
    "```text",
    "Date and actual interval:",
    "Score 0–4:",
    "Cold answer / artifact link:",
    "Mismatch and corrected mechanism:",
    "Counterexample or failure:",
    "Changed context:",
    "Feedback and assistance:",
    "Next date and support ceiling:",
    "```",
    "",
  ];
}

async function generate() {
  await mkdir(outputRoot, { recursive: true });
  const files = (await walk(docsRoot)).sort((a, b) => a.localeCompare(b));
  const prepared = await Promise.all(files.map(async (file, index) => {
    const source = await readFile(file, "utf8");
    const relative = path.relative(docsRoot, file);
    const { title, concepts } = titleAndConcepts(source, file);
    const kind = classify(relative);
    const id = `P${String(index + 1).padStart(3, "0")}`;
    const outputName = `${id}.md`;
    const sourceLink = path.relative(outputRoot, file).replaceAll("\\", "/");
    const content = [
      `# ${id} — ${title}: ten-stage spaced pack`,
      "",
      `Source: [${relative.replaceAll("\\", "/")}](${sourceLink})`,
      "",
      `Source kind: **${kind}**. This pack provides ten delayed retrieval stages and fifty concrete actions. Attempt each stage before reopening the source or its coaching material.`,
      "",
      "## Score before scheduling",
      "",
      "- **0:** no useful independent start—change representation and retry tomorrow; reveal S2 help only after attempting.",
      "- **1:** heavy conceptual/procedural help—repeat a changed case in one to two days at S1.",
      "- **2:** familiar case works but changed-context transfer fails—keep a short interval and reduce only the transfer jump.",
      "- **3:** independent changed-context performance—advance to the next scheduled stage.",
      "- **4:** detects misuse in unfamiliar work and defends tradeoffs—advance and interleave with an adjacent source.",
      "",
      "Accessibility tools, alternate input/output, and additional time do not lower a score. A conceptual hint caps it at 2 for that attempt.",
      "",
      ...stages.flatMap((stage, stageIndex) => stageContent(stage, stageIndex, concepts, kind)),
      "## Mastery gate",
      "",
      "Pass when the final audit scores at least 3, includes unfamiliar project or review evidence, and can be explained without the source or AI. After a lapse, repair only the missing model and resume; do not grind all stages again.",
      "",
    ].join("\n");
    const stageCount = content.match(/^## Stage \d{2} /gm)?.length ?? 0;
    const actionCount = content.match(/^- \[ \] \*\*/gm)?.length ?? 0;
    if (stageCount !== 10 || actionCount !== 50) {
      throw new Error(`${relative}: expected 10 stages/50 actions, received ${stageCount}/${actionCount}`);
    }
    return { id, title, kind, relative: relative.replaceAll("\\", "/"), outputName, content };
  }));

  await Promise.all(prepared.map((item) => writeFile(path.join(outputRoot, item.outputName), item.content, "utf8")));

  const grouped = Map.groupBy(prepared, (item) => item.kind);
  const index = [
    "# Whole-course ten-stage spaced repetition",
    "",
    `This snapshot covers every one of the ${prepared.length} Markdown files that existed in \`codexdocs\` before this generated destination. Each source receives ten stages and fifty actions: ${prepared.length * 10} sessions and ${prepared.length * 50} actions total.`,
    "",
    "Read [OPERATING-GUIDE.md](OPERATING-GUIDE.md) before importing these into a calendar or task manager. The collection is a selectable library, not a mandate to keep every source active.",
    "",
  ];
  for (const [kind, items] of grouped) {
    index.push(`## ${kind}`, "", "| ID | Source | Pack |", "| --- | --- | --- |");
    for (const item of items) {
      const sourceLink = path.relative(outputRoot, path.join(docsRoot, item.relative)).replaceAll("\\", "/");
      index.push(`| ${item.id} | [${item.relative}](${sourceLink}) | [${item.title}](${item.outputName}) |`);
    }
    index.push("");
  }
  await writeFile(path.join(outputRoot, "README.md"), index.join("\n"), "utf8");
  console.log(JSON.stringify({ sources: prepared.length, packs: prepared.length, stages: prepared.length * 10, actions: prepared.length * 50 }));
}

await generate();
