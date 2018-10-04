import { FingerprinterRegistration, PushImpactListenerInvocation, computeShaOf } from "@atomist/sdm";
import { Fingerprint } from "@atomist/automation-client";
import { BumpVersionInspection, BumpTrackedVersion } from "../inspection/CurrentVersionInspection";

export class BumpVersionFingerprinter implements FingerprinterRegistration {

    public readonly name = "BumpVersionFingerprinter";

    public async action(cri: PushImpactListenerInvocation): Promise<Fingerprint[]> {
        const version: BumpTrackedVersion = BumpVersionInspection.apply(cri.project);
        return Promise.apply({
            name: "dependencies",
            abbreviation: "deps",
            version: "0.1",
            sha: computeShaOf(version.version),
            data: version.version,
        });
    }
}
