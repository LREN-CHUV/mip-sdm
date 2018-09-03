import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { ParametersObject } from "@atomist/sdm";
import { DatasetIdentifierRegExp, DatasetLabelRegExp } from "../metaPatterns";

/**
 * Parameter interface for Spring Boot project creation
 */
export interface MetaDbSetupProjectCreationParameters extends SeedDrivenGeneratorParameters {

    /**
     * Code of the dataset.
     */
    datasetCode: string;

    /**
     * Label of the dataset.
     */
    datasetLabel: string;
}

/**
 * Parameters for creating Spring Boot apps.
 * Based on Java project creation parameters.
 */
export const MetaDbSetupProjectCreationParameterDefinitions: ParametersObject = {

    datasetCode: {
        displayName: "Dataset code",
        description: "code for the dataset",
        ...DatasetIdentifierRegExp,
        required: true,
    },

    datasetLabel: {
        displayName: "Dataset label",
        description: "label for the dataset",
        ...DatasetLabelRegExp,
        required: true,
    },
};
