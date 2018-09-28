import { CodeTransformRegistration, EditMode } from "@atomist/sdm";
import { UpgradeToDataDbSetup2_4Transform } from "./upgradeToDataDbSetup2_4";
import { UpgradeToDataDbSetup2_5Transform } from "./upgradeToDataDbSetup2_5";

export const UpgradeDataDbSetupRegistration: CodeTransformRegistration = {
  name: "UpgradeDataDbSetup",
  description: "Upgrade data db setup",
  intent: "upgrade data db setup",
  transform: [
    UpgradeToDataDbSetup2_4Transform,
    UpgradeToDataDbSetup2_5Transform,
  ],
  transformPresentation: ci => {
    return new MasterCommit();
  },
};

class MasterCommit implements EditMode {
  get message(): string {
    return "Upgrade data db setup";
  }

  get branch(): string {
    return "master";
  }
}
