import {
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import { AddAtomistWebhookToCircleCiFix } from "../circle-ci/transform/addCircleCiToAtomistWebhook";
import { PreCommitFix } from "../mip/project-scripts/autofix/preCommit";
import { autofix } from "./goals";

export function addTeamPolicies(
  sdm: SoftwareDeliveryMachine<SoftwareDeliveryMachineConfiguration>,
) {
  // Enable autofixes
  autofix.with(AddAtomistWebhookToCircleCiFix).with(PreCommitFix);
}
