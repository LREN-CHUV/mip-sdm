import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { CodeTransform } from "@atomist/sdm";
import { curry, curry3 } from "@typed/curry";
import { MetaDbSetupProjectCreationParameters } from "./MetaDbSetupProjectCreationParameters";

/**
 * Transform a seed to a custom Spring Boot project.
 * Transform suited for use in a Spring Boot generator.
 */
export const TransformSeedToCustomProject: CodeTransform<
  MetaDbSetupProjectCreationParameters
> = async (p, ctx, params) => {
  return chainEditors(
    curry3(renameDataset)(params.datasetCode, params.datasetLabel),
    curry(mipCdeOrGeneric)(params.derivedFromMipCde.toLowerCase() == "yes"),
  )(p, ctx, params);
};

function renameDataset(
  datasetCode: string,
  datasetLabel: string,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "**/*.*,Dockerfile", file =>
    file
      .replaceAll("DATASET_LABEL", datasetLabel)
      .then(f => f.replaceAll("DATASET", datasetCode)),
  );
}

function mipCdeOrGeneric(
  derivedFromMipCde: boolean,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "Dockerfile.*", async f => {
    if (f.name.endsWith(".mip")) {
      if (derivedFromMipCde) {
        await f.rename("Dockerfile");
      } else {
        project.deleteFile(f.name);
      }
    } else if (f.name.endsWith(".generic")) {
      if (derivedFromMipCde) {
        project.deleteFile(f.name);
      } else {
        await f.rename("Dockerfile");
      }
    }
  });
}
