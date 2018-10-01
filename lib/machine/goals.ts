import {
  Autofix,
  Build,
  goals,
  Fingerprint,
  ProductionEnvironment,
  GoalWithFulfillment,
  IndependentOfEnvironment,
  CodeInspectionGoal,
  PushReactionGoal,
} from "@atomist/sdm";

import { Version, Tag } from "@atomist/sdm-core";

export const version = new Version();
export const autofix = new Autofix();
export const build = new Build();
export const tag = new Tag();
export const fingerprint = new Fingerprint();

export const publish = new GoalWithFulfillment({
  uniqueName: "publish",
  environment: IndependentOfEnvironment,
  displayName: "publish",
  workingDescription: "Publishing",
  completedDescription: "Published",
  failedDescription: "Publish failed",
  isolated: true,
}, build); // Dockerbuild

export const publishWithApproval = new GoalWithFulfillment({
  uniqueName: "publish-approval",
  environment: IndependentOfEnvironment,
  displayName: "publish",
  workingDescription: "Publishing",
  completedDescription: "Published",
  failedDescription: "Publish failed",
  isolated: true,
  approvalRequired: true,
}, build); // Dockerbuild

export const releaseNpm = new GoalWithFulfillment({
  uniqueName: "release-npm",
  environment: ProductionEnvironment,
  displayName: "release NPM package",
  workingDescription: "Releasing NPM package",
  completedDescription: "Released NPM package",
  failedDescription: "Release NPM package failure",
  isolated: true,
});

export const releaseJava = new GoalWithFulfillment({
  uniqueName: "release-java",
  environment: ProductionEnvironment,
  displayName: "release Java library",
  workingDescription: "Releasing Java library",
  completedDescription: "Released Java library",
  failedDescription: "Release Java library failure",
  isolated: true,
});

export const releasePython = new GoalWithFulfillment({
  uniqueName: "release-python",
  environment: ProductionEnvironment,
  displayName: "release Python library",
  workingDescription: "Releasing Python library",
  completedDescription: "Released Python library",
  failedDescription: "Release Python library failure",
  isolated: true,
});

export const releaseDocker = new GoalWithFulfillment({
  uniqueName: "release-docker",
  environment: ProductionEnvironment,
  displayName: "release Docker image",
  workingDescription: "Releasing Docker image",
  completedDescription: "Released Docker image",
  failedDescription: "Release Docker image failure",
  isolated: true,
});

export const releaseTag = new GoalWithFulfillment({
  uniqueName: "release-tag",
  environment: ProductionEnvironment,
  displayName: "create release tag",
  workingDescription: "Creating release tag",
  completedDescription: "Created release tag",
  failedDescription: "Creating release tag failure",
});

export const releaseDocs = new GoalWithFulfillment({
  uniqueName: "release-docs",
  environment: ProductionEnvironment,
  displayName: "publish docs",
  workingDescription: "Publishing docs",
  completedDescription: "Published docs",
  failedDescription: "Publishing docs failure",
  isolated: true,
});

//export const ReleaseChangelogGoal = releaseChangelogGoal(releaseDocs);

export const releaseVersion = new GoalWithFulfillment({
  uniqueName: "release-version",
  environment: ProductionEnvironment,
  displayName: "increment version",
  workingDescription: "Incrementing version",
  completedDescription: "Incremented version",
  failedDescription: "Incrementing version failure",
}, releaseDocs); // ReleaseChangelogGoal

export const smokeTest = new GoalWithFulfillment({
  uniqueName: "smoke-test",
  environment: ProductionEnvironment,
  displayName: "smoke test",
  workingDescription: "Running smoke tests",
  completedDescription: "Run smoke tests",
  failedDescription: "Smoke test failure",
  isolated: true,
}, build);

// GOALSET Definition

// Just running review and autofix
export const CheckGoals = goals("Check")
  .plan(version, CodeInspectionGoal, autofix, PushReactionGoal, fingerprint);

// Goals for running in local mode
export const LocalGoals = goals("Local Build")
  .plan(CheckGoals)
  .plan(build).after(autofix, version);

// Just running the build and publish
export const BuildGoals = goals("Build")
  .plan(CheckGoals)
  .plan(build).after(autofix, version)
  .plan(tag, publish).after(build);

// Just running the build and publish
export const BuildReleaseGoals = goals("Build with Release")
  .plan(CheckGoals)
  .plan(build).after(autofix, version)
  .plan(tag).after(build)
  .plan(publishWithApproval).after(build)
  .plan(releaseNpm, releaseJava, releasePython, releaseDocs).after(publishWithApproval)
  .plan(releaseTag).after(releaseNpm, releaseJava, releasePython)
  .plan(releaseVersion); // releaseChangelog
