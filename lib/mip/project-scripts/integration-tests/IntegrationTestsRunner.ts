import {
  ChildProcessResult,
  spawnAndWatch,
  SuccessIsReturn0ErrorFinder,
} from "@atomist/automation-client";
import {
  ExecuteGoal,
  ExecuteGoalResult,
  GitProject,
  GoalInvocation,
  ProgressLog,
} from "@atomist/sdm";
import { IntegrationTestsScriptFile } from "../wellKnowFiles";


export function executeIntegrationTests(): ExecuteGoal {
  return async (gi: GoalInvocation): Promise<ExecuteGoalResult> => {
    const { configuration, credentials, context } = gi;
    const id = gi.id;

    return configuration.sdm.projectLoader.doWithProject(
      { credentials, id, context, readOnly: false },
      async (project: GitProject) => {

        let testResult: ChildProcessResult;
        try {
          testResult = await runIntegrationTests(project, gi.progressLog);
        } catch (e) {
          testResult = {
            code: 1,
            message: e.message,
            error: true,
            childProcess: e
          };
        }

        const egr: ExecuteGoalResult = {
          code: testResult.code,
          message: testResult.message,
          targetUrl: gi.progressLog.url,
        };
        gi.progressLog.write(`Integration tests for ${id} complete: ${egr}`);
        return egr;
      },
    );
  };
}

async function runIntegrationTests(
  p: GitProject,
  progressLog: ProgressLog,
): Promise<ChildProcessResult> {

  const command = "./" + IntegrationTestsScriptFile;
  return spawnAndWatch(
    {
      command,
      args: [],
    },
    {
      cwd: p.baseDir,
    },
    progressLog,
    {
      stripAnsi: true,
      errorFinder: SuccessIsReturn0ErrorFinder,
    },
  );
}
