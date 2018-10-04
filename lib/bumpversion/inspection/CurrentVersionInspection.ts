import { CodeInspection } from "@atomist/sdm";
import { BumpVersionConfig } from "../versionner";
import { Microgrammar } from "@atomist/microgrammar";

/**
 * A version managed by bumpversion
 */
export interface BumpTrackedVersion {

    version: string;

}

interface Property {
    key: string;
    value: string;
}

const PropertyKey = /[^[=\s]+/;

const propertiesGrammar = Microgrammar.fromString<Property>(
    "${key} = ${value}",
    {
        key: PropertyKey,
        value: /.*/,

    });

export const BumpVersionInspection: CodeInspection<BumpTrackedVersion> = async p => {

    return p.findFile(BumpVersionConfig).then(async f => {
        const content = await f.getContent();
        const versionProperty = propertiesGrammar.findMatches(content).find(m => m.key == "current_version");
        return { version: versionProperty.value };
    });
}