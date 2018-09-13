import { logger } from "@atomist/automation-client";
import { InterpretLog } from "@atomist/sdm";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";

export const CaptainLogInterpreter: InterpretLog<BuildInfo> = log => {
    const data: BuildInfo = {
        timeMillis: undefined,
        success: log.includes("[CAPTAIN] Running post command"),
        testInfo: undefined,
        dockerImage: dockerImagesGrammar.firstMatch(log) || undefined,
    };
    if (!log) {
        logger.warn("Log was empty");
        return {
            relevantPart: "",
            message: "Failed with empty log",
            includeFullLog: false,
            data,
        };
    }

    // TODO: detect more error cases

    logger.info("Did not find anything to recognize in the log");
    return {
        relevantPart: "",
        message: (data.success) ? "Seems fine" : "Unknown error",
        data,
    };
};

/**
 * Microgrammar for Maven test output
 * @type {Microgrammar<MavenInfo>}
 */
const dockerImagesGrammar = Microgrammar.fromString<DockerImage>(
    "[CAPTAIN] Tagging image ${name}:latest as ${name}:${version}",
    {
        name: String,
        version: String,
    });

export interface TestStatus {

    passingTests: number;

    pendingTests: number;

    failingTests: number;

    errors: number;
}

export interface DockerImage {

    name: string;

    version: string;
}

/**
 * Data common to all builds
 */
export interface BuildInfo {

    timeMillis?: number;

    success: boolean;

    testInfo?: TestStatus;

    dockerImage?: DockerImage;

}
