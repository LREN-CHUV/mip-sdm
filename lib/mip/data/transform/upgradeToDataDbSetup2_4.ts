//import { Microgrammar } from "@atomist/microgrammar";
import {
  CodeTransform,
  CodeTransformRegistration,
  doWithFiles,
  EditMode,
  logger,
} from "@atomist/sdm";
//import { fromDockerImageGrammar } from "../../../docker/DockerBuildFile";

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
    .map(l => {
      /*
      const parentImage = fromDockerImageGrammar.firstMatch(l);
      if (parentImage) {
        const updater = Microgrammar.updatableMatch(parentImage, l);
        if (
          parentImage.parentImage.registry == "hbpmip" &&
          parentImage.parentImage.name == "data-db-setup"
        ) {
          logger.info("Update parent image to hbpmip/data-db-setup:2.4.0");
          updater.parentImage.version = "2.4.0";
        }
        return updater.newContent();
      } else { return l; }
      */
      return l.replace(/hbpmip\/data-db-setup:\d\.\d\.\d/, "hbpmip/data-db-setup:2.4.0")
        .replace(/hbpmip\/mip-cde-data-db-setup:\d\.\d\.\d/, "hbpmip/mip-cde-data-db-setup:1.3.0");
    })
    .join("\n");
}
