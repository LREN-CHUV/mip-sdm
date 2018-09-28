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
  GitHubRepoRef,
  goalContributors,
  onAnyPush,
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
  whenPushSatisfies,
} from "@atomist/sdm";
import {
  createSoftwareDeliveryMachine,
  summarizeGoalsInGitHubStatus,
  tagRepo,
} from "@atomist/sdm-core";
import { mipTagger } from "../mip/classify/mipTagger";
import {
  DataDbSetupProjectCreationParameterDefinitions,
  DataDbSetupProjectCreationParameters,
} from "../mip/data/generate/DataDbSetupProjectCreationParameters";
import { TransformDataSeedToCustomProject } from "../mip/data/generate/TransformDataSeedToCustomProject";
import { UpgradeDataDbSetupRegistration } from "../mip/data/transform/upgradeDataDbSetup";
import {
  MetaDbSetupProjectCreationParameterDefinitions,
  MetaDbSetupProjectCreationParameters
} from "../mip/meta/generate/MetaDbSetupProjectCreationParameters";
import { TransformMetaSeedToCustomProject } from "../mip/meta/generate/TransformMetaSeedToCustomProject";
import { CaptainLogInterpreter } from "../mip/project-scripts/build/buildLogInterpreter";
import { ProjectBuilder } from "../mip/project-scripts/build/ProjectBuilder";
import { HasCaptainBuildScriptFile } from "../mip/project-scripts/pushTests";
import { AddAtomistWebhookToCircleCiRegistration } from "../transform/addCircleCiToAtomistWebhook";
import { BaseGoals, BuildGoal, BuildGoals } from "./goals";

export function machine(
  configuration: SoftwareDeliveryMachineConfiguration,
): SoftwareDeliveryMachine {
  const sdm = createSoftwareDeliveryMachine(
    {
      name: "MIP Software Delivery Machine",
      configuration,
    },
    whenPushSatisfies(HasCaptainBuildScriptFile)
      .itMeans("Build")
      .setGoals(BuildGoals),
  );

  BuildGoal.with({
    name: "Build script",
    pushTest: HasCaptainBuildScriptFile,
    builder: new ProjectBuilder(sdm),
    logInterpreter: CaptainLogInterpreter,
  });

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

  sdm.addFirstPushListener(tagRepo(mipTagger));

  sdm
    .addExtensionPacks
    // buildAwareCodeTransforms({
    //  issueRouter: {
    //    raiseIssue: async () => {
    //      /* intentionally left empty */
    //    },
    //  },
    // }),
    // SlocSupport,
    ();

  summarizeGoalsInGitHubStatus(sdm);

  return sdm;
}
