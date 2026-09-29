import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const docsRoot = path.resolve(import.meta.dirname, "..");
const modeRoot = path.join(docsRoot, "learning-modes");
const outputRoot = path.join(modeRoot, "spaced-packs");
const markerPattern = /\n?<!-- spaced-pack-link:start -->[\s\S]*?<!-- spaced-pack-link:end -->\n?/g;

const stages = [
  { day: "0", label: "Baseline encoding", support: "S2 after the cold attempt", change: "a representative example", aim: "separate familiarity from what you can currently retrieve and produce" },
  { day: "1", label: "Blank reconstruction", support: "S2 fading to S1", change: "the same mechanism from a blank artifact", aim: "reconstruct the core model before the first feeling of fluency fades" },
  { day: "3", label: "Discrimination", support: "S1", change: "a misleading adjacent concept or look-alike", aim: "choose the correct mechanism from competing plausible options" },
  { day: "7", label: "Interleaved application", support: "S1", change: "an unlabeled task mixed with another topic", aim: "retrieve the skill without the source file or topic heading acting as a cue" },
  { day: "14", label: "Feedback correction", support: "S1", change: "a previous misconception or weak artifact", aim: "repair the mental model and prove that feedback changed future behavior" },
  { day: "21", label: "Teach-back and objection", support: "S1 then S0", change: "an adversarial reviewer question", aim: "communicate causal reasoning and defend a tradeoff without notes" },
  { day: "30", label: "Project transfer", support: "S0", change: "a real RelayDesk or CRUD-project ticket", aim: "apply the method under authentic state, data, user, and failure constraints" },
  { day: "45", label: "Review and debugging", support: "S0", change: "unfamiliar or subtly defective work", aim: "recognize absence or misuse of the skill in code you did not just write" },
  { day: "60", label: "Requirement and incident change", support: "S0", change: "a changed requirement plus dependency or operational failure", aim: "preserve the capability when the original plan and happy path no longer hold" },
  { day: "90", label: "Independent mastery audit", support: "S0", change: "a novel context selected at random", aim: "demonstrate durable, flexible performance and decide the next review interval" },
];

function cleanInline(text) {
  return text.replace(/\[([^\]]+)]\([^)]+\)/g, "$1").replace(/[`*_]/g, "").trim();
}

function conceptsFrom(source, title) {
  const h2 = [...source.matchAll(/^## (.+)$/gm)].map((match) => cleanInline(match[1])).filter((heading) => heading !== "Spaced practice");
  const h3 = [...source.matchAll(/^### (.+)$/gm)].map((match) => cleanInline(match[1]));
  const candidates = [...new Set([...h2, ...h3, cleanInline(title)])];
  while (candidates.length < 5) candidates.push(`apply ${cleanInline(title)} to an engineering task`);
  return candidates.slice(0, Math.max(5, Math.min(10, candidates.length)));
}

function fileTitle(source, filename) {
  return source.match(/^# (.+)$/m)?.[1] ?? filename.replace(/\.md$/, "");
}

function packFilename(filename) {
  return filename.replace(/\.md$/, "-SPACED-PACK.md");
}

function taskLines(stage, index, concepts) {
  const primary = concepts[index % concepts.length];
  const secondary = concepts[(index + 1) % concepts.length];
  const tertiary = concepts[(index + 2) % concepts.length];
  return [
    `- [ ] **Cold retrieval:** Without opening the source, explain **${primary}** and state the problem it solves, its mechanism, one boundary, and one counterexample.`,
    `  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.`,
    `- [ ] **Reconstruct:** Create the source's useful artifact for **${secondary}** from a blank page, file, diagram, test, or checklist; use ${stage.change}.`,
    `  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.`,
    `- [ ] **Discriminate and break:** Contrast **${primary}** with **${tertiary}**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.`,
    `  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.`,
    `- [ ] **Transfer:** Use **${secondary}** in ${stage.change}; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.`,
    `  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.`,
    `- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **${primary}** and **${secondary}**. Score the attempt 0–4 and schedule the next interval.`,
    `  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.`,
  ];
}

async function generate() {
  await mkdir(outputRoot, { recursive: true });
  const sourceNames = (await readdir(modeRoot))
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
  const rows = [];
  let actions = 0;

  for (const filename of sourceNames) {
    const sourcePath = path.join(modeRoot, filename);
    const rawSource = await readFile(sourcePath, "utf8");
    const source = rawSource.replace(markerPattern, "").trimEnd();
    const title = fileTitle(source, filename);
    const concepts = conceptsFrom(source, title);
    const outputName = packFilename(filename);
    const output = [
      `# ${title} — ten-stage spaced-practice pack`,
      "",
      `Source: [${filename}](../${filename})`,
      "",
      "This pack expands the source into ten retrieval cycles from day 0 through day 90. Each cycle contains five actions: cold retrieval, reconstruction, discrimination/failure, transfer, and feedback/scheduling. Attempt before reopening the source.",
      "",
      "## Scoring and interval rule",
      "",
      "- **0 — no model:** no useful independent start; return tomorrow using a different representation and S2 support after attempting.",
      "- **1 — fragile:** completes with substantial hints or cannot explain failure; repeat in one to two days at S1.",
      "- **2 — familiar:** completes the known case independently but transfer fails; keep the next scheduled interval with a smaller changed constraint.",
      "- **3 — transferable:** completes and explains a changed case independently; advance to the next interval.",
      "- **4 — review-ready:** applies in unfamiliar work, detects misuse, and defends tradeoffs; advance and mix with another topic.",
      "",
      "A minor syntax lookup may still score 3 when the mechanism and decisions are independent. Any conceptual hint caps the score at 2. Record accessibility support separately; access tools do not reduce the score.",
      "",
    ];

    stages.forEach((stage, index) => {
      output.push(
        `## Stage ${String(index + 1).padStart(2, "0")} — Day ${stage.day}: ${stage.label}`,
        "",
        `**Aim:** ${stage.aim}. **Support:** ${stage.support}.`,
        "",
        ...taskLines(stage, index, concepts),
        "",
        "### Stage record",
        "",
        "```text",
        "Date / actual gap since last attempt:",
        "Score 0–4 and reason:",
        "Cold misconception or hesitation:",
        "Evidence produced:",
        "Changed dimension:",
        "AI/human/accessibility support used:",
        "Next date and task:",
        "```",
        "",
      );
      actions += 5;
    });

    output.push(
      "## Completion gate",
      "",
      "Complete the pack when the day-90 audit scores at least 3, includes unfamiliar project or review evidence, and can be explained without the source or AI. Otherwise schedule a focused lapse repair rather than restarting all ten stages.",
      "",
    );
    await writeFile(path.join(outputRoot, outputName), output.join("\n"), "utf8");

    const linkedSource = `${source}\n\n<!-- spaced-pack-link:start -->\n## Spaced practice\n\nUse the [ten-stage day 0–90 practice pack](spaced-packs/${outputName}) to retrieve, vary, and transfer this material instead of rereading it.\n<!-- spaced-pack-link:end -->\n`;
    if (linkedSource !== rawSource) await writeFile(sourcePath, linkedSource, "utf8");
    rows.push(`| [${cleanInline(title)}](../${filename}) | [Practice pack](${outputName}) | 10 | 50 |`);
  }

  const readme = [
    "# Ten-stage spaced-practice packs",
    "",
    `Every adaptive-training source file has a ten-stage practice pack. Across ${sourceNames.length} sources, this provides ${sourceNames.length * 10} scheduled sessions and ${actions} concrete practice actions.`,
    "",
    "Use [the operating guide](OPERATING-GUIDE.md) before scheduling the packs. Do not complete stages consecutively in one sitting: the gap and changed retrieval conditions are part of the exercise.",
    "",
    "| Source | Pack | Stages | Actions |",
    "| --- | --- | ---: | ---: |",
    ...rows,
    "",
  ].join("\n");
  await writeFile(path.join(outputRoot, "README.md"), readme, "utf8");
  console.log(JSON.stringify({ sources: sourceNames.length, packs: sourceNames.length, stages: sourceNames.length * 10, actions }));
}

await generate();

