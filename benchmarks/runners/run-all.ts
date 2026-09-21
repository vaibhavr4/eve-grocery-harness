import "dotenv/config";
import { runMultiToolSuite } from "./run-multi-tool.js";
import { runSingleToolSuite } from "./run-single-tool.js";
import { runSubstitutionSuite } from "./run-substitution.js";
import { writeResults } from "../lib/write-results.js";

async function main() {
  console.log("Running single-tool suite…");
  writeResults("single-tool.json", await runSingleToolSuite());

  console.log("Running multi-tool suite…");
  writeResults("multi-tool.json", await runMultiToolSuite());

  console.log("Running substitution suite…");
  writeResults("substitution.json", await runSubstitutionSuite());

  console.log("Done. Results in benchmarks/results/*.json — see the Model Experiments tab.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
