import {
  ChildProcessResult,
  fileExists,
  isLocalProject,
  LocalProject,
  SuccessIsReturn0ErrorFinder,
} from "@atomist/automation-client";
import {
  AutofixRegistration,
  CodeTransform,
  LoggingProgressLog,
  ProgressLog,
  spawnAndWatch,
} from "@atomist/sdm";
import { updateYamlDocument } from "@atomist/yaml-updater";
import { safeLoad } from "js-yaml";
import { BumpVersionConfig, PreCommitConfig } from "../wellKnowFiles";

const PRECOMMIT_HOOKS_VERSION = "v1.4.0-1";

interface PC {
  /** (optional: default ^$) global file exclude pattern. new in 1.1.0. */
  exclude?: string;

  /** (optional: default false) set to true to have pre-commit stop running hooks after the first failure. new in 1.1.0. */
  fail_fast?: boolean;

  /** A list of repository mappings. */
  repos: Repo[];
}

interface Repo {
  /** the repository url to git clone from */
  repo: string;

  /** the revision or tag to clone at. new in 1.7.0 previously sha */
  rev: string;

  hooks: Hook[];
}

interface Hook {
  /** which hook from the repository to use. */
  id: string;

  /** (optional) override the name of the hook - shown during hook execution. */
  name?: string;

  /** (optional) override the language version for the hook. See Overriding Language Version. */
  language_version?: string;

  /** (optional) override the default pattern for files to run on. */
  files?: string;

  /** (optional) file exclude pattern. */
  exclude?: string;

  /** (optional) override the default file types to run on. See Filtering files with types. new in 0.15.0. */
  types?: string;

  /** (optional) file types to exclude. new in 0.15.0. */
  exclude_types?: string;

  /** (optional) list of additional parameters to pass to the hook. */
  args?: string[];

  /** (optional) confines the hook to the commit, push, commit-msg, or manual stage. See Confining hooks to run at certain stages. */
  stages?: string[];

  /** (optional) a list of dependencies that will be installed in the environment where this hook gets run. One useful application is to install plugins for hooks such as eslint. new in 0.6.6. */
  additional_dependencies?: string[];

  /** (optional) if true, this hook will run even if there are no matching files. new in 0.7.2. */
  always_run?: boolean;

  /** (optional) if true, forces the output of the hook to be printed even when the hook passes. new in 1.6.0. */
  verbose?: boolean;

  /** (optional) if present, the hook output will additionally be written to a file. new in 0.14.0 */
  log_file?: string;
}

/**
 * Standard build script using Captain to drive the Docker build
 */
export const PreCommitTransform: CodeTransform = async (project, sdmc) => {
  if (project.fileExistsSync(PreCommitConfig)) {
    const progressLog = new LoggingProgressLog("Pre-commit");

    await project.findFile(PreCommitConfig).then(async file => {
      let content = await file.getContent();

      if (content.indexOf("repos:") < 0 || content.indexOf("sha:") >= 0) {
        if (isLocalProject(project)) {
          await executePreCommitMigrateConfig(
            project as LocalProject,
            progressLog,
          );
          content = await file.getContent();
        }
      }

      const config: PC = safeLoad(content);
      let changed = false;

      config.repos.forEach(repo => {
        if (repo.repo == "git://github.com/pre-commit/pre-commit-hooks") {
          repo.rev = PRECOMMIT_HOOKS_VERSION;
          const hooks = repo.hooks;
          if (
            !hasHook("check-yaml", hooks) &&
            isLocalProject(project) &&
            hasYamlFiles(project as LocalProject)
          ) {
            hooks.push({ id: "check-yaml" });
            changed = true;
          }

          if (
            !hasHook("check-json", hooks) &&
            isLocalProject(project) &&
            hasJsonFiles(project as LocalProject)
          ) {
            hooks.push({ id: "check-json" });
            changed = true;
          }

          if (
            !hasHook("pretty-format-json", hooks) &&
            isLocalProject(project) &&
            hasJsonFiles(project as LocalProject)
          ) {
            hooks.push({
              id: "pretty-format-json",
              args: ["--autofix"],
              exclude: "slack.json",
            });
            changed = true;
          }

          if (
            !hasHook("check-added-large-files", hooks) &&
            isLocalProject(project) &&
            hasCsvFiles(project as LocalProject)
          ) {
            hooks.push({
              id: "check-added-large-files",
              exclude: ".*.csv",
            });
            changed = true;
          }

          if (
            hasHook("check-added-large-files", hooks) &&
            isLocalProject(project) &&
            hasCsvFiles(project as LocalProject)
          ) {
            const checkLargeFiles = getHook("check-added-large-files", hooks);
            if (!checkLargeFiles.exclude) {
              checkLargeFiles.exclude = ".*.csv";
              changed = true;
            }
          }

          if (
            !hasHook("end-of-file-fixer", hooks) &&
            isLocalProject(project) &&
            project.fileExistsSync(BumpVersionConfig)
          ) {
            hooks.push({
              id: "end-of-file-fixer",
              exclude: ".bumpversion.cfg",
            });
            changed = true;
          }

          if (
            hasHook("end-of-file-fixer", hooks) &&
            isLocalProject(project) &&
            project.fileExistsSync(BumpVersionConfig)
          ) {
            const eofFixer = getHook("end-of-file-fixer", hooks);
            if (!eofFixer.exclude) {
              eofFixer.exclude = ".bumpversion.cfg";
              changed = true;
            }
          }
        }
      });

      if (changed) {
        await file.setContent(
          // Ugly hack to fix improper ident included...
          updateYamlDocument({ repos: config.repos }, content, {
            keepArrayIndent: false,
          })
            .replace(/    rev:/g, "  rev:")
            .replace(/    hooks:/g, "  hooks:")
            .replace(/        exclude:/g, "      exclude:")
            .replace(/        args:/g, "      args:"),
        );
      }
    });

    if (isLocalProject(project)) {
      await executePreCommitOnProject(project as LocalProject, progressLog);
    }
  }
  return project;
};

function hasHook(hookId: string, hooks: Hook[]): boolean {
  return !!hooks.find(h => h.id == hookId);
}

function getHook(hookId: string, hooks: Hook[]): Hook {
  return hooks.find(h => h.id == hookId);
}

export const PreCommitFix: AutofixRegistration = {
  name: "PreCommitFix",
  transform: PreCommitTransform,
};

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
      stripAnsi: true,
      errorFinder: SuccessIsReturn0ErrorFinder,
    },
  );
}

function executePreCommitMigrateConfig(
  project: LocalProject,
  progressLog: ProgressLog,
): Promise<ChildProcessResult> {
  // Run twice this command if it failed on first time
  const command = `pre-commit migrate-config`;

  return spawnAndWatch(
    {
      command: "sh",
      args: ["-c", `${command} || true`],
    },
    {
      cwd: project.baseDir,
    },
    progressLog,
    {
      stripAnsi: true,
      errorFinder: SuccessIsReturn0ErrorFinder,
    },
  );
}

export async function hasJsonFiles(project: LocalProject): Promise<boolean> {
  return fileExists(project, "**/*.json", f => f.name != "slack.json");
}

export async function hasYamlFiles(project: LocalProject): Promise<boolean> {
  return (
    (await fileExists(project, "**/*.yml")) || fileExists(project, "**/*.yaml")
  );
}

export async function hasCsvFiles(project: LocalProject): Promise<boolean> {
  return fileExists(project, "**/*.csv");
}
