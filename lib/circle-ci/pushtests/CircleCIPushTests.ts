import { PredicatePushTest, predicatePushTest, hasFile } from "@atomist/sdm";
import { CircleCIConfigFile } from "../circleCiFiles";

/**
 * Does this project use Circle CI?
 */
export const HasCircleCIFile: PredicatePushTest = predicatePushTest(
  "Is CircleCI",
  hasFile(CircleCIConfigFile).predicate,
);
