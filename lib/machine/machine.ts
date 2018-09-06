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

import { GitHubRepoRef, SoftwareDeliveryMachine, SoftwareDeliveryMachineConfiguration } from "@atomist/sdm";
import { createSoftwareDeliveryMachine, summarizeGoalsInGitHubStatus } from "@atomist/sdm-core";
import {
    MetaDbSetupProjectCreationParameterDefinitions, MetaDbSetupProjectCreationParameters,
} from "../mip/meta/generate/MetaDbSetupProjectCreationParameters";
import { TransformSeedToCustomProject } from "../mip/meta/generate/TransformSeedToCustomProject";
import { SlocSupport } from "@atomist/sdm-pack-sloc";

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
        description: "Create a new database setup project for the metadata describing the list of variables and their taxonomy",
        parameters: MetaDbSetupProjectCreationParameterDefinitions,
        startingPoint: new GitHubRepoRef("lren-chuv", "mip-meta-db-setup-seed"),
        transform: [
            TransformSeedToCustomProject,
        ],
    });

    sdm.addExtensionPacks(SlocSupport);

    summarizeGoalsInGitHubStatus(sdm);

    return sdm;
}
