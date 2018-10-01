import {
  LocalProject,
  logger,
  spawnAndWatch,
  SuccessIsReturn0ErrorFinder,
  execIn,
  Project,
} from "@atomist/automation-client";
import { CodeTransform, doWithFiles, LoggingProgressLog } from "@atomist/sdm";
import {
  dockerImage,
  updateParentImage,
} from "../../../docker/DockerBuildFile";
import { executePreCommitOnProject } from "../../project-scripts/autofix/preCommit";

export const UpgradeToDataDbSetup2_5Transform: CodeTransform = async (
  project,
  sdmc,
) => {
  await project.deleteDirectory("config");

  await doWithFiles(project, "sql/*.csv", async file => {
    await file.setPath("data/" + file.name);
  })
    .then(async project => {
      await project.findFile("Dockerfile").then(async file => {
        await file.getContent().then(async content => {
          const csvFiles = await csvFilesInDataDir(project);
          file.setContent(updateDockerBuildFile(content, csvFiles));
        });
      });
      return project;
    })
    .then(async project => {
      const dataPackageFileName = "data/datapackage.json";
      if (!await project.hasFile(dataPackageFileName)) {
        const localProject = project as LocalProject;
        const progressLog = new LoggingProgressLog("Generate datapackage.json");
        const csvFiles = await csvFilesInDataDir(project);

        const csvFilesList = csvFiles.join(" ");
        const command = `goodtables init -o datapackage.json ${csvFilesList}`;
        const res = await spawnAndWatch(
          {
            command: "sh",
            args: ["-c", `${command} || true`], // hack for poor return code by Goodtables 2.1
          },
          {
            cwd: localProject.baseDir + "/data",
          },
          progressLog,
          {
            errorFinder: SuccessIsReturn0ErrorFinder,
            logCommand: true,
          },
        );

        if (res.code != 0) {
          logger.error(`Command 'goodtables' failed`);
          logger.error(progressLog.log);
          return undefined;
        }

        const dataPackageFile = await project.getFile(dataPackageFileName);
        const content = await dataPackageFile.getContent();

        interface Schema {
          fields: [{ [key: string]: string }];
        }
        interface DP {
          name: string;
          resources: [
            {
              schema: string | Schema;
            }
          ];
        }

        const json: DP = JSON.parse(content);
        const resources = json.resources;

        json.name = project.name.replace("-data-db-setup", "").replace("-db-setup", "")
        resources.forEach(resource => {
          const schema: Schema = resource.schema as Schema;
          if (
            schema.fields.find(f => f.name == "subjectcode") &&
            schema.fields.find(f => f.name == "rightamygdala") &&
            schema.fields.find(f => f.name == "leftputamen")
          ) {
            resource.schema = "mip-cde-table-schema.json";
          }
        });

        await project.add(dataPackageFile);
        await dataPackageFile.setContent(JSON.stringify(json));
        await execIn(localProject.baseDir, "git", ["add", dataPackageFileName]);

        await executePreCommitOnProject(localProject, progressLog);

        await sdmc.addressChannels(
          `Generated datapackage.json for ${project.name}:\n${await dataPackageFile.getContent()}`,
        );

      }
      return project;
    });
};

function updateDockerBuildFile(text: string, csvFiles: string[]): string {
  const lines = text.split("\n");

  let start = lines.findIndex(l => {
    return (
      l.indexOf("FROM python") >= 0 &&
      l.indexOf("as build-stats-env") > 0
    );
  });
  let end = lines.findIndex(l => {
    return (
      l.indexOf("FROM hbpmip/") >= 0 &&
      l.indexOf("data-db-setup") >= 0 &&
      l.indexOf(" as ") < 0
    );
  });

  if (start > 0) {
    if (lines[start - 1].startsWith("#")) {
      start = start - 1;
    }
  }

  if (end > 0) {
    if (lines[end - 1].startsWith("#")) {
      end = end - 1;
    }
  }

  if (start >= 0 && end > start) {
    lines.splice(start, end - start);
  }

  const qcStage1 = `# Build stage for quality control
FROM python:3.6.1-alpine as data-qc-env

RUN apk add --no-cache python3-dev build-base
RUN pip3 install --no-cache-dir goodtables csvkit==1.0.2

COPY data/ data/
WORKDIR /data

# Produce a validation report, plus a readable report if there is an error
`

  const qcStage2 = `RUN goodtables validate -o datapackage.checks --json datapackage.json || goodtables validate datapackage.json
RUN test $(grep -c "loading error" datapackage.checks) -eq 0

`

  const csvStats = csvFiles.map(f => `RUN csvstat ${f} | tee ${f.replace(".csv", ".stats")}`).join("\n");

  const updatedLines = lines
    .map(l => {
      l = updateParentImage(l, dockerImage("hbpmip", "data-db-setup", "2.5.5"));
      l = updateParentImage(
        l,
        dockerImage("hbpmip", "mip-cde-data-db-setup", "1.4.1"),
      );
      l = l.replace("COPY sql/", "COPY data/");
      l = l.replace("COPY config/ /flyway/config/", "COPY data/ /data/");
      if (l.indexOf("COPY --from=build-stats-env") >= 0) {
        l = "COPY --from=data-qc-env /data/*.stats /data/*.checks /data/";
      }
      return l;
    })
    .join("\n");

  if (text.indexOf("hbpmip/mip-cde-data-db-setup") > 0) {
    const recoverSchemas = `FROM hbpmip/mip-cde-data-db-setup:1.4.1 as parent-image`
    const copySchemas = "COPY --from=parent-image /data/*.json /data/"

    return `${recoverSchemas}\n${qcStage1}\n${copySchemas}\n${qcStage2}\n${csvStats}\n\n${updatedLines}`;
  } else {
    return `${qcStage1}\n${qcStage2}\n${csvStats}\n\n${updatedLines}`;
  }
}

async function csvFilesInDataDir(project: Project): Promise<string[]> {
  const csvFiles: string[] = [];

  await doWithFiles(project, "data/*.csv", file => {
    csvFiles.push(file.name);
  });

  return new Promise<string[]>((resolve, reject) => {
    resolve(csvFiles);
  });

}