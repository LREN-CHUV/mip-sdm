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
  DoNotSetAnyGoals,
  not,
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
  whenPushSatisfies,
} from "@atomist/sdm";
import {
  createSoftwareDeliveryMachine,
  IsInLocalMode,
  summarizeGoalsInGitHubStatus,
} from "@atomist/sdm-core";
import { HasCaptainBuildScriptFile } from "../mip/project-scripts/pushTests";
import { addCaptainSupport } from "./captainSupport";
import { BuildGoals, CheckGoals, LocalGoals } from "./goals";
import { addMipSupport } from "./mipSupport";
import { addTeamPolicies } from "./teamPolicies";
import { HasCircleCIFile } from "../circle-ci/pushtests/CircleCIPushTests";

export function machine(
  configuration: SoftwareDeliveryMachineConfiguration,
): SoftwareDeliveryMachine {
  const sdm = createSoftwareDeliveryMachine(
    {
      name: "MIP Software Delivery Machine",
      configuration,
    },

    whenPushSatisfies(not(HasCaptainBuildScriptFile))
      .itMeans("Non Docker-built repository")
      .setGoals(DoNotSetAnyGoals),

    whenPushSatisfies(HasCaptainBuildScriptFile, IsInLocalMode)
      .itMeans("Docker-built repository in local mode")
      .setGoals(LocalGoals),

    // TODO: ignore projects in HBPMedical team that are already managed by another team
    // whenPushSatisfies(not(isSdmEnabled(configuration.name)), isTeam("T095SFFBK"))
    //      .itMeans("Node repository in atomist team that we are already building in atomist-community")
    //      .setGoals(DoNotSetAnyGoals),

    // TODO: check for immaterial changes
    // whenPushSatisfies(allSatisfied(IsNode, not(IsMaven)), not(MaterialChangeToNodeRepo))
    // .itMeans("No Material Change")
    // .setGoals(Immaterial),

    whenPushSatisfies(HasCaptainBuildScriptFile, HasCircleCIFile)
      .itMeans("Just Checking")
      .setGoals(CheckGoals),

    whenPushSatisfies(HasCaptainBuildScriptFile)
      .itMeans("Build")
      .setGoals(BuildGoals),
  );

  addCaptainSupport(sdm);
  addMipSupport(sdm);
  addTeamPolicies(sdm);

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
