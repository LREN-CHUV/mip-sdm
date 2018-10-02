import { ProjectVersioner } from "@atomist/sdm-core";

export const BumpVersionConfig = ".bumpversion.cfg"

/**
 * ProjectVersioner to be used with all projects managed by Bumpversion
 * 
 * @param sdmGoal
 * @param p
 * @param log
 * @constructor
 */
export const BumpversionVersioner: ProjectVersioner = async (sdmGoal, p, log) => {
    const version = ""; // await newVersion(sdmGoal, p);
    //await changeMavenVersion(version, p, log);
    return version;
};
