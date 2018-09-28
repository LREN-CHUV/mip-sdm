import {
  AutoCodeInspection,
  Autofix,
  Build,
  goals,
  PushImpact,
} from "@atomist/sdm";

import { AddAtomistWebhookToCircleCiFix } from "../transform/addCircleCiToAtomistWebhook";

import { CaptainBuildScriptFix } from "../mip/project-scripts/autofix/captainBuildScript";

// Enable autofixes
export const AutofixGoal = new Autofix()
  .with(AddAtomistWebhookToCircleCiFix)
  .with(CaptainBuildScriptFix);

export const BaseGoals = goals("checks")
  .plan(new AutoCodeInspection())
  .plan(new PushImpact())
  .plan(AutofixGoal);

export const BuildGoal = new Build();
export const BuildGoals = goals("build")
  .plan(BuildGoal)
  .after(AutofixGoal);
