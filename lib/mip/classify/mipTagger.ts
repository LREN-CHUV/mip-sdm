import { Tagger, fileExists } from "@atomist/automation-client";

/**
 * Function to add MIP-related GitHub topics if needed
 * @param p project to scan
 * @return {Promise<DefaultTaggerTags>}
 */
export const mipTagger: Tagger = async p => {
    const tags: string[] = [];
    if ((await fileExists(p, "Dockerfile")) && !p.name.endsWith("-seed")) {
        tags.push("docker-image");
    }

    if (p.name.endsWith("data-db-setup") || p.name.endsWith("meta-db-setup")) {
        tags.push("reference-data");
    } else if (p.name.startsWith("woken")) {
        tags.push("algorithm-factory");
    }

    return { repoId: p.id, tags };
};
