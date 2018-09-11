import {
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { ParametersObject } from "@atomist/sdm";
import { DatasetIdentifierRegExp, DatasetLabelRegExp } from "../metaPatterns";

/**
 * Parameter interface for Meta db setup project creation
 */
export interface MetaDbSetupProjectCreationParameters
  extends SeedDrivenGeneratorParameters {
  /**
   * Code of the dataset.
   */
  datasetCode: string;

  /**
   * Label of the dataset.
   */
  datasetLabel: string;

  /**
   * True if the dataset variables are derived from MIP CDEs.
   */
  derivedFromMipCde: string;
}

/**
 * Parameters for creating Meta db setup projects.
 */
export const MetaDbSetupProjectCreationParameterDefinitions: ParametersObject = {
  datasetCode: {
    displayName: "Dataset code",
    description: "Code for the dataset",
    ...DatasetIdentifierRegExp,
    required: true,
    order: 50,
  },

  datasetLabel: {
    displayName: "Dataset label",
    description: "Label for the dataset",
    ...DatasetLabelRegExp,
    required: true,
    order: 51,
  },

  derivedFromMipCde: {
    displayName: "Variables derived from MIP CDEs",
    description: "yes if dataset variables are derived from MIP CDEs, no if the list of variables is generic",
    pattern: /(yes|no)/,
    required: true,
    order: 52,
  },
};
