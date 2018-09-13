import { CodeTransform, doWithFiles, CodeTransformRegistration } from "@atomist/sdm";

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
    description: "Upgrade data db setup in this project",
    intent: "upgrade data db setup",
    transform: UpgradeToDataDbSetup2_4Transform
  };

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
  let fromBuildJava = lines.findIndex(l => l.indexOf("COPY --from=build-java-env") >= 0);

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

  if (start > 0 && end > start) {
    lines.splice(start, end - start)
  }

  lines.forEach( l => {
      l.replace(/hbpmip\/data-db-setup:\d\.\d\.\d/, "hbpmip/data-db-setup:2.4.0");
  });

  return lines.join("\n");
}
