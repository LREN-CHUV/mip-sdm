import { File } from "@atomist/automation-client";
import { CodeTransformRegistration, CodeTransform, AutofixRegistration } from "@atomist/sdm";

export const CircleCIConfigFile = ".circleci/config.yml";

const ATOMIST_NOTIFY = `

notify:
  webhooks:
    - url: https://webhook.atomist.com/atomist/circle/teams/T233KRG4R
`;

export const AddAtomistWebhookToCircleCiTransform: CodeTransform = async p => {
    return p.findFile(CircleCIConfigFile).then(async (file: File) => {
      const content = await file.getContent();
      if (content.indexOf("webhook.atomist.com") < 0) {
        await file.setContent(content + ATOMIST_NOTIFY);
      }
      return p;
    });
};

export const AddAtomistWebhookToCircleCiRegistration: CodeTransformRegistration = {
  name: "AddAtomistWebhookToCircleCi",
  description: "Notify Atomist on CircleCi builds",
  intent: "notify Atomist on CircleCi builds",
  transform: AddAtomistWebhookToCircleCiTransform
};

export const AddAtomistWebhookToCircleCiFix: AutofixRegistration = {
  name: "AddAtomistWebhookToCircleCiFix",
  transform: AddAtomistWebhookToCircleCiTransform,
}