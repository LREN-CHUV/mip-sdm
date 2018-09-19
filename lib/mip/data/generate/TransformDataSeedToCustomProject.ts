import { chainEditors, doWithFiles, Project } from "@atomist/automation-client";
import { CodeTransform } from "@atomist/sdm";
import { curry, curry3 } from "@typed/curry";
import { DataDbSetupProjectCreationParameters } from "./DataDbSetupProjectCreationParameters";

/**
 * Transform a seed to a custom Data db setup project.
 * Transform suited for use in a Data db setup generator.
 */
export const TransformDataSeedToCustomProject: CodeTransform<
  DataDbSetupProjectCreationParameters
> = async (p, ctx, params) => {
  const distScope = distributionScope(
    params.dataPrivacyLevel,
    params.dataLicense,
    params.projectContainsData == "yes",
  );
  return chainEditors(
    curry3(renameDataset)(params.datasetCode, params.datasetLabel),
    curry(mipCdeOrGeneric)(params.derivedFromMipCde.toLowerCase() == "yes"),
    curry(dockerRepository)(distScope),
    curry(gitRepository)(distScope),
    curry(dataLicense)(params.dataLicense),
  )(p, ctx.context, params);
};

function renameDataset(
  datasetCode: string,
  datasetLabel: string,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "**/*.*", async file => {
    await file
      .replaceAll("CUSTOM_LABEL", datasetLabel)
      .then(f => f.replaceAll("CUSTOM", datasetCode))
      .then(f => {
        if (f.path.indexOf("CUSTOM") >= 0) {
          f.rename(f.name.replace("CUSTOM", datasetCode));
        }
      });
  });
}

function mipCdeOrGeneric(
  derivedFromMipCde: boolean,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "**/generic_*.*", async f => {
    if (derivedFromMipCde) {
      return project.deleteFile(f.path);
    } else {
      await f.rename(f.name.replace("generic_", ""));
      return project;
    }
  }).then(p =>
    doWithFiles(p, "**/mip_*.*", async f => {
      if (derivedFromMipCde) {
        await f.rename(f.name.replace("mip_", ""));
        return project;
      } else {
        return project.deleteFile(f.path);
      }
    }),
  ).then(p =>
    doWithFiles(p, "generic_*", async f => {
      if (derivedFromMipCde) {
        return project.deleteFile(f.path);
      } else {
        await f.rename(f.name.replace("generic_", ""));
        return project;
      }
    }),
  ).then(p =>
    doWithFiles(p, "mip_*", async f => {
      if (derivedFromMipCde) {
        await f.rename(f.name.replace("mip_", ""));
        return project;
      } else {
        return project.deleteFile(f.path);
      }
    }),
  ).then(p =>
    doWithFiles(p, "**/generic_*/*", async f => {
      if (derivedFromMipCde) {
        return project.deleteFile(f.path);
      } else {
        await f.rename(f.name.replace("generic_", ""));
        return project;
      }
    }),
  ).then(p =>
    doWithFiles(p, "**/mip_*/*", async f => {
      if (derivedFromMipCde) {
        await f.rename(f.name.replace("mip_", ""));
        return project;
      } else {
        return project.deleteFile(f.path);
      }
    }),
  );
}

function dockerRepository(
  distributionScope: string,
  project: Project,
): Promise<Project> {
  let dockerRepo = "donotdistribute.local/hbpmip_private";
  let dockerRepoLabel = "local Docker image";
  switch (distributionScope) {
    case "public":
      dockerRepo = "hbpmip";
      dockerRepoLabel = "Docker hub";
      break;

    case "protected":
      dockerRepo = "registry.gitlab.com/hbpmip_private";
      dockerRepoLabel = "private Gitlab.com Docker Repository";
      break;
  }

  return doWithFiles(project, "**/*.*", async file => {
    await file
      .replaceAll("DOCKER_REPO_LABEL", dockerRepoLabel)
      .then(f => f.replaceAll("DOCKER_REPO", dockerRepo))
      .then(f => {
        if (f.name.indexOf("_LOCAL") >= 0) {
          if (distributionScope == "local") {
            f.rename(f.name.replace("_LOCAL", ""));
          } else {
            return project.deleteFile(f.path);
          }
        } else if (f.name.indexOf("_REMOTE") >= 0) {
          if (distributionScope == "local") {
            return project.deleteFile(f.path);
          } else {
            f.rename(f.name.replace("_REMOTE", ""));
          }
        }
        return project;
      });
  });
}

function gitRepository(
  distributionScope: string,
  project: Project,
): Promise<Project> {
  let gitHttpRepo = "https://gitlab.chuv.ch/reference/CUSTOM-data-db-setup";
  let gitSshRepo = "git@gitlab.chuv.ch:reference";
  switch (distributionScope) {
    case "public":
      gitHttpRepo = "https://github.com/HBPMedical";
      gitSshRepo = "git@github.com:HBPMedical";
      break;

    case "protected":
      gitHttpRepo = "https://gitlab.com/hbpmip_private";
      gitSshRepo = "git@gitlab.com:hbpmip_private";
      break;
  }

  return doWithFiles(project, "**/*.*", async file => {
    await file
      .replaceAll("GIT_HTTP_REPO", gitHttpRepo)
      .then(f => f.replaceAll("GIT_SSH_REPO", gitSshRepo));
  });
}

function dataLicense(dataLicense: string, project: Project): Promise<Project> {
  let license = "Proprietary - confidential information";
  let licenseBadge =
    "https://img.shields.io/badge/license-proprietary-AF4C64.svg";

  switch (dataLicense) {
    case "cc-by-sa":
      license = "CC BY-SA 4.0";
      licenseBadge =
        "https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg";
      break;
    case "cc-by-nc-sa":
      license = "CC BY-NC-SA 4.0";
      licenseBadge =
        "https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg";
      break;
    case "on-demand-access":
      license =
        "Proprietary - requires special authorisation for access and use";
      "https://img.shields.io/badge/license-proprietary-AF4C64.svg";
      break;
  }

  return doWithFiles(project, "**/*.*", async file => {
    await file
      .replaceAll("DATA_LICENSE_BADGE", licenseBadge)
      .then(f => f.replaceAll("DATA_LICENSE", license));
  });
}

function distributionScope(
  dataPrivacyLevel: string,
  dataLicense: string,
  projectContainsData: boolean,
) {
  let distributionScope = "protected";
  if (dataPrivacyLevel == "anonymous" && dataLicense.startsWith("cc")) {
    distributionScope = "public";
  } else if (dataPrivacyLevel == "personal" && projectContainsData) {
    distributionScope = "local";
  } else if (dataLicense == "private" && projectContainsData) {
    distributionScope = "local";
  }
  return distributionScope;
}
