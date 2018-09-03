import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { CodeTransform } from "@atomist/sdm";
import { MetaDbSetupProjectCreationParameters } from "./MetaDbSetupProjectCreationParameters";

/**
 * Transform a seed to a custom Spring Boot project.
 * Transform suited for use in a Spring Boot generator.
 */
export const TransformSeedToCustomProject: CodeTransform<
  MetaDbSetupProjectCreationParameters
> = async (p, ctx, params) => {
  return chainEditors(async project =>
    renameDataset(project, params.datasetCode, params.datasetLabel),
  )(p, ctx, params);
};

function renameDataset(
  project: Project,
  datasetCode: string,
  datasetLabel: string,
): Promise<Project> {
  return doWithFiles(project, "**/*.*,Dockerfile", file =>
    file
      .replaceAll("DATASET_LABEL", datasetLabel)
      .then(f => f.replaceAll("DATASET", datasetCode)),
  );
}
