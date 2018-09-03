import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

/**
 * Validation pattern for dataset identifiers
 * @type BaseParameter
 * @ModuleExport
 */
export const DatasetIdentifierRegExp: Partial<BaseParameter> = {
    description: "valid dataset identifier name",
    pattern: /^([$a-zA-Z_][\w$]*)*$/,
    validInput: "a valid dataset identifier",
    minLength: 1,
    maxLength: 32,
};

/**
 * Validation pattern for dataset labels
 * @type BaseParameter
 * @ModuleExport
 */
export const DatasetLabelRegExp: Partial<BaseParameter> = {
    description: "valid dataset label",
    pattern: /^([$a-zA-Z_][\w $]*)*$/,
    validInput: "a valid dataset label",
    minLength: 1,
    maxLength: 32,
};
