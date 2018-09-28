import { ChildProcessResult, spawnAndWatch } from "@atomist/automation-client";
import {
  AddressChannels,
  AppInfo,
  GitProject,
  InterpretLog,
  LogInterpretation,
  ProgressLog,
  ProjectOperationCredentials,
  RemoteRepoRef,
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import { LocalBuilder, LocalBuildInProgress } from "@atomist/sdm-core";
import { BuildScriptFile } from "../wellKnowFiles";
import { CaptainLogInterpreter } from "./buildLogInterpreter";

/*
 * Builds a MIP project using its build.sh script in the local automation client.
 */

// TODO: add LogInterpretation, especially for Maven or NPM projects
export class ProjectBuilder extends LocalBuilder implements LogInterpretation {
  public logInterpreter: InterpretLog = CaptainLogInterpreter;

  constructor(
    sdm: SoftwareDeliveryMachine,
    private readonly args: Array<{ name: string; value?: string }> = [],
  ) {
    super("ProjectBuilder", sdm);
  }

  protected async startBuild(
    credentials: ProjectOperationCredentials,
    id: RemoteRepoRef,
    atomistTeam: string,
    log: ProgressLog,
    addressChannels: AddressChannels,
    configuration: SoftwareDeliveryMachineConfiguration,
  ): Promise<LocalBuildInProgress> {
    return configuration.sdm.projectLoader.doWithProject(
      { credentials, id, readOnly: true },
      async p => {
        const buildResult = executeBuild(p, log, this.args);
        const rb = new UpdatingBuild(id, buildResult, atomistTeam, log.url);
        return rb;
      },
    );
  }
}

class UpdatingBuild implements LocalBuildInProgress {
  public deploymentUnitFile: string;

  constructor(
    public repoRef: RemoteRepoRef,
    public buildResult: Promise<ChildProcessResult>,
    public team: string,
    public url: string,
  ) {}

  get appInfo(): AppInfo {
    return undefined;
  }
}

export async function executeBuild(
  p: GitProject,
  progressLog: ProgressLog,
  args: Array<{ name: string; value?: string }> = [],
): Promise<ChildProcessResult> {
  const command = "./" + BuildScriptFile;
  return spawnAndWatch(
    {
      command,
      args: [],
    },
    {
      cwd: p.baseDir,
    },
    progressLog,
  );
}
