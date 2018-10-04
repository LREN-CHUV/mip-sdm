import { SoftwareDeliveryMachine, SoftwareDeliveryMachineConfiguration } from "@atomist/sdm";
import { version } from "./goals";
import { BumpVersionVersioner } from "../bumpversion/versionner";
import { BumpVersionFingerprinter } from "../bumpversion/fingerprint/BumpVersionFingerprinter";

export function addBumpVersionSupport(sdm: SoftwareDeliveryMachine<SoftwareDeliveryMachineConfiguration>) {

    version.withVersioner(BumpVersionVersioner);

    sdm.addFingerprinterRegistration(new BumpVersionFingerprinter());

}