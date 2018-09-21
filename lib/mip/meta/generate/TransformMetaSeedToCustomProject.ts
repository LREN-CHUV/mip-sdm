import { chainEditors, doWithFiles, Project } from "@atomist/automation-client";
import { CodeTransform } from "@atomist/sdm";
import { curry, curry3 } from "@typed/curry";
import { MetaDbSetupProjectCreationParameters } from "./MetaDbSetupProjectCreationParameters";

/**
 * Transform a seed to a custom Meta db setup project.
 * Transform suited for use in a Meta db setup generator.
 */
export const TransformMetaSeedToCustomProject: CodeTransform<
  MetaDbSetupProjectCreationParameters
> = async (p, ctx, params) => {
  return chainEditors(
    project => doWithFiles(project, "README.md", async file => {
      await project.deleteFile(file.path);
      return project;
    }),
    curry3(renameDataset)(params.datasetCode, params.datasetLabel),
    curry(mipCdeOrGeneric)(params.derivedFromMipCde.toLowerCase() == "yes"),
  )(p, ctx.context, params);
};

function renameDataset(
  datasetCode: string,
  datasetLabel: string,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "**/*.*", async file => {
    await file
      .replaceAll("DATASET_LABEL", datasetLabel)
      .then(f => f.replaceAll("DATASET", datasetCode));
  });
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
        await project.deleteFile(f.name);
      }
    } else if (f.name.endsWith(".generic")) {
      if (derivedFromMipCde) {
        await project.deleteFile(f.name);
      } else {
        await f.rename("Dockerfile");
      }
    }
  }).then(p =>
    doWithFiles(p, "mip*.*", async f => {
      if (!derivedFromMipCde) {
        await project.deleteFile(f.name);
      }
    }),
  );
}
