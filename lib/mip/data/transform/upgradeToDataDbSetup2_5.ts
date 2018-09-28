import {
  CodeTransform,
  doWithFiles,
} from "@atomist/sdm";
import { updateParentImage, dockerImage } from "../../../docker/DockerBuildFile";

export const UpgradeToDataDbSetup2_5Transform: CodeTransform = async project => {
  await project.deleteDirectory("config");

  doWithFiles(
    project,
    "sql/*.csv",
    async file => {
      await file.setPath("data/" + file.name);
    },
  ).then(async project => {
    await project.findFile("Dockerfile").then(async file => {
      await file.getContent().then(content => {
        file.setContent(removeDeprecatedBuildStages(content));
      });
    });
    return project;
  });
};

function removeDeprecatedBuildStages(text: string): string {
  const lines = text.split("\n");

  return lines
    .map(l => {
      l = updateParentImage(l, dockerImage("hbpmip", "data-db-setup", "2.5.5"))
      l = updateParentImage(l, dockerImage("hbpmip", "mip-cde-data-db-setup", "1.4.0"))
      l = l.replace("COPY sql/", "COPY data/")
      l = l.replace("COPY config/ /flyway/config/", "COPY data/ data/")
    })
    .join("\n");
}
