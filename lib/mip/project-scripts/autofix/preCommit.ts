import {
  ChildProcessResult,
  LocalProject,
  SuccessIsReturn0ErrorFinder,
} from "@atomist/automation-client";
import { ProgressLog, spawnAndWatch } from "@atomist/sdm";

export function executePreCommitOnProject(
  project: LocalProject,
  progressLog: ProgressLog,
): Promise<ChildProcessResult> {

  // Run twice this command if it failed on first time
  const command = `pre-commit run --all-files`;

  return spawnAndWatch(
    {
      command: "sh",
      args: ["-c", `${command} || ${command}`],
    },
    {
      cwd: project.baseDir,
    },
    progressLog,
    {
      errorFinder: SuccessIsReturn0ErrorFinder,
    },
  );
}
