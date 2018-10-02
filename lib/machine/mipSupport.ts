import {
  GitHubRepoRef,
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import { tagRepo } from "@atomist/sdm-core";
import { AddAtomistWebhookToCircleCiRegistration } from "../circle-ci/transform/addCircleCiToAtomistWebhook";
import { mipTagger } from "../mip/classify/mipTagger";
import {
  DataDbSetupProjectCreationParameterDefinitions,
  DataDbSetupProjectCreationParameters
} from "../mip/data/generate/DataDbSetupProjectCreationParameters";
import { TransformDataSeedToCustomProject } from "../mip/data/generate/TransformDataSeedToCustomProject";
import { UpgradeDataDbSetupRegistration } from "../mip/data/transform/upgradeDataDbSetup";
import {
  MetaDbSetupProjectCreationParameterDefinitions,
  MetaDbSetupProjectCreationParameters
} from "../mip/meta/generate/MetaDbSetupProjectCreationParameters";
import { TransformMetaSeedToCustomProject } from "../mip/meta/generate/TransformMetaSeedToCustomProject";

export function addMipSupport(
  sdm: SoftwareDeliveryMachine<SoftwareDeliveryMachineConfiguration>,
) {
  sdm.addGeneratorCommand<MetaDbSetupProjectCreationParameters>({
    name: "CreateMetaDbSetup",
    intent: "create meta db setup",
    description:
      "Create a new database setup project that will insert into a database the metadata describing the list of variables and their taxonomy",
    parameters: MetaDbSetupProjectCreationParameterDefinitions,
    startingPoint: new GitHubRepoRef("lren-chuv", "mip-meta-db-setup-seed"),
    transform: [TransformMetaSeedToCustomProject],
  });

  sdm.addGeneratorCommand<DataDbSetupProjectCreationParameters>({
    name: "CreateDataDbSetup",
    intent: "create data db setup",
    description:
      "Create a new database setup project that will insert into a database the features of a dataset",
    parameters: DataDbSetupProjectCreationParameterDefinitions,
    startingPoint: new GitHubRepoRef("lren-chuv", "mip-data-db-setup-seed"),
    transform: [TransformDataSeedToCustomProject],
  });

  sdm.addCodeTransformCommand(UpgradeDataDbSetupRegistration);

  sdm.addCodeTransformCommand(AddAtomistWebhookToCircleCiRegistration);

  sdm.addFirstPushListener(tagRepo(mipTagger));
}
