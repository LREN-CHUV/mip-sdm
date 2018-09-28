import {
  LocalProject,
  logger,
  spawnAndWatch,
  SuccessIsReturn0ErrorFinder,
  execIn,
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
        await file.getContent().then(content => {
          file.setContent(updateDockerBuildFile(content));
        });
      });
      return project;
    })
    .then(async project => {
      const dataPackageFileName = "data/datapackage.json";
      if (!await project.hasFile(dataPackageFileName)) {
        const localProject = project as LocalProject;
        const progressLog = new LoggingProgressLog("Generate datapackage.json");
        const csvFiles: string[] = [];

        await doWithFiles(project, "data/*.csv", file => {
          csvFiles.push(file.name);
        });

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

function updateDockerBuildFile(text: string): string {
  const lines = text.split("\n");

  return lines
    .map(l => {
      l = updateParentImage(l, dockerImage("hbpmip", "data-db-setup", "2.5.5"));
      l = updateParentImage(
        l,
        dockerImage("hbpmip", "mip-cde-data-db-setup", "1.4.0"),
      );
      l = l.replace("COPY sql/", "COPY data/");
      l = l.replace("COPY config/ /flyway/config/", "COPY data/ data/");
      return l;
    })
    .join("\n");
}
