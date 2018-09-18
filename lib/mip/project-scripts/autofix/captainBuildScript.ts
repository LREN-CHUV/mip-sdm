import { AutofixRegistration, CodeTransform } from "@atomist/sdm";
import { BuildScriptFile, CaptainFile } from "../wellKnowFiles";

const BUILD_SCRIPT = `#!/usr/bin/env bash
set -e

if [[ $NO_SUDO || -n "$CIRCLECI" ]]; then
  CAPTAIN="captain"
elif groups $USER | grep &>/dev/null '\\bdocker\\b'; then
  CAPTAIN="captain"
else
  CAPTAIN="sudo captain"
fi

BUILD_DATE=$(date -Iseconds) \\
  VCS_REF=$(git describe --tags --dirty) \\
  VERSION=$(git describe --tags --dirty) \\
  $CAPTAIN build
`;

/**
 * Standard build script using Captain to drive the Docker build
 */
export const CaptainBuildScriptTransform: CodeTransform = async p => {
  if (p.fileExistsSync(CaptainFile) && p.fileExistsSync(BuildScriptFile)) {
    await p.findFile(BuildScriptFile).then(async file => {
      await file.setContent(BUILD_SCRIPT);
    });
  }
  return p;
};

export const CaptainBuildScriptFix: AutofixRegistration = {
  name: "CaptainBuildScript",
  transform: CaptainBuildScriptTransform,
};