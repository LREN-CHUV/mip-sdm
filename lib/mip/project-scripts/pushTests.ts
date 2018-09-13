import { PredicatePushTest, predicatePushTest } from "@atomist/sdm";
import { BuildScriptFile } from "./wellKnowFiles";

/**
 * Does this project's build script uses captain and Docker?
 * @type {PredicatePushTest}
 */
export const HasCaptainBuildScriptFile: PredicatePushTest = predicatePushTest(
    "Has Captain build script",
    async p => {
        const build = await p.getFile(BuildScriptFile);
        if (!build) {
            return false;
        }
        return (await build.getContent()).includes("captain");
    },
);
