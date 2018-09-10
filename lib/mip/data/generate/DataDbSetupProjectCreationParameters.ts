import { ParametersObject } from "@atomist/sdm";
import {
  MetaDbSetupProjectCreationParameterDefinitions,
  MetaDbSetupProjectCreationParameters,
} from "../../meta/generate/MetaDbSetupProjectCreationParameters";

/**
 * Parameter interface for Data db setup project creation
 */
export interface DataDbSetupProjectCreationParameters
  extends MetaDbSetupProjectCreationParameters {

    dataPrivacyLevel: string,

    dataLicense: string,

    projectContainsData?: string,

  }

/**
 * Parameters for creating Data db setup.
 * Based on Meta db setup creation parameters.
 */
export const DataDbSetupProjectCreationParameterDefinitions: ParametersObject = {

  ...MetaDbSetupProjectCreationParameterDefinitions,

  dataPrivacyLevel: {
    displayName: "Privacy level for data: personal, depersonalized, anonymous",
    description: "Defines the Privacy level for data: personal, depersonalized, anonymous",
    required: true,
    pattern: /(personal|depersonalized|anonymous)/,
    order: 60,
  },

  dataLicense: {
    displayName: "License for data: cc-by-sa-4, cc-by-nc-sa-4, on-demand-access, private",
    description: "Defines the License for data: cc-by-sa-4 (open access), cc-by-nc-sa-4 (open access non commercial), on-demand-access, private",
    required: true,
    pattern: /(cc-by-sa-4|cc-by-nc-sa-4|on-demand-access|private)/,
    order: 61,
  },

  // cc-by-sa-4 : Creative Commons Attribution-ShareAlike 4.0 International
  // cc-by-nc-sa-4: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

  projectContainsData: {
    displayName: "Does the project contains data? yes/no",
    description: "Does the project contains data? If yes and the data is private or access is on demand, the data container will not be published and this project should not even be stored on hbpmip_private on Gitlab.com",
    required: true,
    pattern: /(yes|no)/,
    order: 61,
  },

};
