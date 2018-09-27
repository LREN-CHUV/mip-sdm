import { Microgrammar } from "@atomist/microgrammar";
import { clean, lt } from "semver";
import { logger } from "@atomist/automation-client";

const REGISTRY_PATTERN = /[a-z0-9]+(?:[._-][a-z0-9]+)*/;
const NAME_PATTERN = REGISTRY_PATTERN;
const VERSION_PATTERN = /[a-zA-Z0-9\._-]+/;

/**
 * Microgrammar for a reference to a Docker image
 * @type {Microgrammar<DockerImage>}
 */
export const versionedDockerImageRefGrammar = Microgrammar.fromString<
  DockerImage
>("${registry}/${name}:${version}", {
  registry: REGISTRY_PATTERN,
  name: NAME_PATTERN,
  version: VERSION_PATTERN,
});

/**
 * Microgrammar for a reference to a Docker image without a version
 * @type {Microgrammar<DockerImage>}
 */
export const unversionedDockerImageRefGrammar = Microgrammar.fromString<
  DockerImage
>("${registry}/${name}", {
  registry: REGISTRY_PATTERN,
  name: NAME_PATTERN,
});

/**
 * Microgrammar for the parent image defined in the FROM clause
 * @type {Microgrammar<{parentImage: DockerImage}>}
 */
export const fromVersionedDockerImageGrammar = Microgrammar.fromDefinitions<{
  parentImage: DockerImage;
}>({
  _from: "FROM",
  parentImage: versionedDockerImageRefGrammar,
});

/**
 * Microgrammar for the parent image defined in the FROM clause
 * @type {Microgrammar<{parentImage: DockerImage}>}
 */
export const fromUnversionedDockerImageGrammar = Microgrammar.fromDefinitions<{
  parentImage: DockerImage;
}>({
  _from: "FROM",
  parentImage: unversionedDockerImageRefGrammar,
});

export interface DockerImage {
  registry?: string;

  name: string;

  version?: string;
}

export function dockerImage(registry: string, name: string, version: string = undefined): DockerImage {
  return {registry: registry, name: name, version: version};
}

/**
 * Update the parent image in a Dockerfile
 * @param line A line of the Dockerfile
 * @param parentImage The parent image
 * @param newVersion The new version to use
 */
export function updateParentImage(
  line: string,
  parentImage: DockerImage,
  newVersion: string = parentImage.version,
) {
  const match = fromVersionedDockerImageGrammar.firstMatch(line);
  if (match) {
    const updater = Microgrammar.updatableMatch(match, line);
    if (
      match.parentImage.registry == parentImage.registry &&
      match.parentImage.name == match.parentImage.name
    ) {
      const version = clean(match.parentImage.version);
      if (version && lt(version, newVersion)) {
        logger.info(`Update parent image to ${parentImage.registry}/${parentImage.name}:${newVersion}`);
        updater.parentImage.version = newVersion;
        return updater.newContent();
      }
    }
  }
  return line;
}
