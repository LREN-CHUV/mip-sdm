/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AutoCodeInspection,
  Autofix,
  GitHubRepoRef,
  goalContributors,
  goals,
  onAnyPush,
  PushImpact,
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import {
  createSoftwareDeliveryMachine,
  summarizeGoalsInGitHubStatus,
} from "@atomist/sdm-core";
import { buildAwareCodeTransforms } from "@atomist/sdm/pack/build-aware-transform";
import { SlocSupport } from "@atomist/sdm-pack-sloc";
import {
  DataDbSetupProjectCreationParameterDefinitions,
  DataDbSetupProjectCreationParameters
} from "../mip/data/generate/DataDbSetupProjectCreationParameters";
import { TransformDataSeedToCustomProject } from "../mip/data/generate/TransformDataSeedToCustomProject";
import {
  MetaDbSetupProjectCreationParameterDefinitions,
  MetaDbSetupProjectCreationParameters
} from "../mip/meta/generate/MetaDbSetupProjectCreationParameters";
import { TransformMetaSeedToCustomProject } from "../mip/meta/generate/TransformMetaSeedToCustomProject";
import {
  AddAtomistWebhookToCircleCiRegistration,
  AddAtomistWebhookToCircleCiTransform
} from "../transform/addCircleCiToAtomistWebhook";
import { UpgradeDataDbSetupRegistration } from "../mip/data/transform/upgradeToDataDbSetup2_4";

export function machine(
  configuration: SoftwareDeliveryMachineConfiguration,
): SoftwareDeliveryMachine {
  const sdm = createSoftwareDeliveryMachine({
    name: "MIP Software Delivery Machine",
    configuration,
  });

  sdm.addGeneratorCommand<MetaDbSetupProjectCreationParameters>({
    name: "CreateMetaDbSetup",
    intent: "create meta db setup",
    description:
      "Create a new database setup project that will insert into a database the metadata describing the list of variables and their taxonomy",
    parameters: MetaDbSetupProjectCreationParameterDefinitions,
    startingPoint: new GitHubRepoRef("lren-chuv", "mip-meta-db-setup-seed"),
    transform: [TransformMetaSeedToCustomProject],
  });

  // Enable autofixes
  const AutofixGoal = new Autofix().with({
    name: "AddAtomistWebhookToCircleCiFix",
    transform: AddAtomistWebhookToCircleCiTransform,
  });

  const BaseGoals = goals("checks")
    .plan(new AutoCodeInspection())
    .plan(new PushImpact())
    .plan(AutofixGoal);

  // const BuildGoals = goals("build")
  //    .plan(new Build().with({ name: "Maven", builder: new MavenBuilder(sdm) }))
  //    .after(AutofixGoal);

  sdm.addGoalContributions(
    goalContributors(
      onAnyPush().setGoals(BaseGoals),
      // whenPushSatisfies(anySatisfied(IsMaven)).setGoals(BuildGoals),
    ),
  );

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

  sdm.addCodeTransformCommand(AddAtomistWebhookToCircleCiRegistration);
  sdm.addCodeTransformCommand(UpgradeDataDbSetupRegistration);

  sdm.addExtensionPacks(
    buildAwareCodeTransforms({ issueRouter: { raiseIssue: async () => { /* intentionally left empty */ }}}),
    SlocSupport
  );

  summarizeGoalsInGitHubStatus(sdm);

  return sdm;
}
