import { AutofixRegistration, hasFile, allSatisfied, hasFileContaining, not, CodeTransformRegistration } from "@atomist/sdm";
import { File } from "@atomist/automation-client/project/File";
export const CircleCIConfigFile = "./circleci/config.yml";

const ATOMIST_NOTIFY = `

notify:
  webhooks:
    - url: https://webhook.atomist.com/atomist/circle/teams/T233KRG4R
`;

export const AddCircleCiToAtomistWebhookAutofix: AutofixRegistration = {
    name: "Add CircleCi to Atomist webhook Fix",
    pushTest: allSatisfied(hasFile(CircleCIConfigFile), not(hasFileContaining(CircleCIConfigFile, /webhook.atomist.com/))),
    transform: async p => {
        return p.findFile(CircleCIConfigFile).then(async (file: File) => {
            const content = await file.getContent();
            await file.setContent(content + ATOMIST_NOTIFY);
            return p;
        })
    },
};
