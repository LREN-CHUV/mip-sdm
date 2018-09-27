import {
  CodeTransform,
  CodeTransformRegistration,
  doWithFiles,
  EditMode,
  logger,
} from "@atomist/sdm";
import { updateParentImage, dockerImage } from "../../../docker/DockerBuildFile";

export const UpgradeToDataDbSetup2_4Transform: CodeTransform = async project => {
  doWithFiles(
    project,
    "src/main/java/eu/humanbrainproject/mip/migrations/*",
    async file => {
      await file.setPath("config/" + file.name);
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

export const UpgradeDataDbSetupRegistration: CodeTransformRegistration = {
  name: "UpgradeDataDbSetup",
  description: "Upgrade data db setup",
  intent: "upgrade data db setup",
  transform: UpgradeToDataDbSetup2_4Transform,
  transformPresentation: ci => {
    return new MasterCommit();
  },
};
class MasterCommit implements EditMode {
  get message(): string {
    return "Upgrade data db setup to version 2.4";
  }

  get branch(): string {
    return "master";
  }
}

function removeDeprecatedBuildStages(text: string): string {
  const lines = text.split("\n");

  let start = lines.findIndex(l => {
    return (
      l.indexOf("FROM hbpmip/data-db-setup") >= 0 &&
      l.indexOf("as parent-image") > 0
    );
  });
  let end = lines.findIndex(l => {
    return (
      l.indexOf("FROM hbpmip/data-db-setup") >= 0 &&
      l.indexOf("as parent-image") < 0
    );
  });

  if (start < 0 && end < 0) {
    start = lines.findIndex(l => {
      return (
        l.indexOf("FROM maven") >= 0 &&
        l.indexOf("as build-java-env") > 0
      );
    });
    end = lines.findIndex(l => {
      return (
        l.indexOf("FROM hbpmip/mip-cde-data-db-setup") >= 0 &&
        l.indexOf("as parent-image") < 0
      );
    });
    }

  const fromBuildJava = lines.findIndex(
    l => l.indexOf("COPY --from=build-java-env") >= 0,
  );

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

  if (fromBuildJava >= 0) {
    lines[fromBuildJava] = "COPY config/ /flyway/config/";
  }

  if (start >= 0 && end > start) {
    lines.splice(start, end - start);
  } else {
    logger.warn(`Cannot find block of lines to remove from Dockerfile. Block start ${start}, end ${end}`);
  }

  return lines
    .map(l => updateParentImage(l, dockerImage("hbpmip", "data-db-setup", "2.4.0")))
    .join("\n");
}
