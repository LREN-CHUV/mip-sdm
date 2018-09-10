import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
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
  return chainEditors(
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
      .then(f => f.replaceAll("DATASET", datasetCode))
      .then(f => { if (f.name.indexOf("CUSTOM") >= 0) {f.rename(f.name.replace("CUSTOM", datasetCode))} });
  });
}

function mipCdeOrGeneric(
  derivedFromMipCde: boolean,
  project: Project,
): Promise<Project> {
  return doWithFiles(project, "**/generic_*.*", async f => {
    if (derivedFromMipCde) {
      await project.deleteFile(f.name);
    } else if (f.name.indexOf("CUSTOM") >= 0) {
      await f.rename(f.name.replace("generic_", ""));
    }
  }).then((p) =>
    doWithFiles(p, "**/mip_*.*", async f => {
      if (derivedFromMipCde) {
        await f.rename(f.name.replace("mip_", ""));
      } else {
        await project.deleteFile(f.name);
      }
    })
  );
}

// TODO
//function dataPrivacyLevel() {
//  donotdistribute.local/hbpmip_private
//}