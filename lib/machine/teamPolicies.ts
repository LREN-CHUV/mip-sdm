import { SoftwareDeliveryMachine, SoftwareDeliveryMachineConfiguration } from "@atomist/sdm";
import { autofix } from "./goals";
import { AddAtomistWebhookToCircleCiFix } from "../transform/addCircleCiToAtomistWebhook";
import { PreCommitFix } from "../mip/project-scripts/autofix/preCommit";

export function addTeamPolicies(sdm: SoftwareDeliveryMachine<SoftwareDeliveryMachineConfiguration>) {

    // Enable autofixes
    autofix.with(AddAtomistWebhookToCircleCiFix)
        .with(PreCommitFix);
}
