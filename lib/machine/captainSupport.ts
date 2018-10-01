import { SoftwareDeliveryMachine, SoftwareDeliveryMachineConfiguration } from "@atomist/sdm";
import { autofix, build } from "./goals";
import { CaptainBuildScriptFix } from "../mip/project-scripts/autofix/captainBuildScript";
import { HasCaptainBuildScriptFile } from "../mip/project-scripts/pushTests";
import { ProjectBuilder } from "../mip/project-scripts/build/ProjectBuilder";
import { CaptainLogInterpreter } from "../mip/project-scripts/build/buildLogInterpreter";

export function addCaptainSupport(sdm: SoftwareDeliveryMachine<SoftwareDeliveryMachineConfiguration>) {

    autofix.with(CaptainBuildScriptFix);

    build.with({
        name: "Build script",
        pushTest: HasCaptainBuildScriptFile,
        builder: new ProjectBuilder(sdm),
        logInterpreter: CaptainLogInterpreter,
    });

}