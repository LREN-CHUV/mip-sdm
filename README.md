[![CHUV](https://img.shields.io/badge/CHUV-LREN-AF4C64.svg)](https://www.unil.ch/lren/en/home.html) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/LREN-CHUV/mip-sdm/blob/master/LICENSE)


# MIP Software Delivery Machine powered by [Atomist][atomist]

[![atomist sdm goals](http://badge.atomist.com/T29E48P34/atomist/blank-sdm-seed/0aaf5b12-ff68-4e22-bcf6-9b84c49dae19)](https://app.atomist.com/workspace/T29E48P34)
[![npm version](https://img.shields.io/npm/v/@atomist/blank-sdm.svg)](https://www.npmjs.com/package/@atomist/blank-sdm)

[Atomist][atomist] software delivery machine (SDM) customised for HBP Medical team.

See the [Atomist documentation][atomist-doc] for more information on
what SDMs are and what they can do for you using the Atomist API for
software.

[atomist-doc]: https://docs.atomist.com/ (Atomist Documentation)

## Functions provided

### Code generation for new projects

#### atomist create meta db setup

Creates a new database setup project that will insert into a database the metadata describing the list of variables and their taxonomy.

The project will use [Flyway Database migrations](flywaydb) to create the tables and insert data in the target database.

#### atomist create data db setup

Creates a new database setup project that will insert into a database the features of a dataset.

The project will use [Flyway Database migrations](flywaydb) to create the tables and insert data in the target database.

## Prerequisites

See the [Atomist Developer documentation][atomist-dev] for
instructions on setting up your development environment.  Briefly, you
will need [Git][git], [Node.js][node], and the [Atomist
CLI][atomist-cli] installed and properly configured on your system.
With these installed, you can run this SDM in local mode.

To run this SDM for your team, you will need an Atomist workspace.
See the [Atomist Getting Started Guide][atomist-start] for
instructions on how to get an Atomist workspace and connect it to your
source code repositories, continuous integration, chat platform, etc.

[atomist-dev]: https://docs.atomist.com/developer/prerequisites/ (Atomist - Developer Prerequisites)
[git]: https://git-scm.com/ (Git)
[atomist-cli]: https://github.com/atomist/cli (Atomist Command-Line Interface)
[atomist-start]: https://docs.atomist.com/user/ (Atomist - Getting Started)

## Running

See the [Atomist Developer documentation][atomist-dev] for details on
how to run this SDM.  Briefly, once the prerequisites are met on your
system you can start the SDM in local mode with the following command:

```
$ atomist start --local
```

The Atomist documentation for [running SDMs][atomist-run] has
instructions for connecting and SDM to the Atomist API for software
and running an SDM in various environments.

[atomist-run]: https://docs.atomist.com/developer/run/ (Atomist - Running SDMs)

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/blank-sdm/issues

## Development

You will need to install [Node.js][node] to build and test this
project.

[node]: https://nodejs.org/ (Node.js)

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the [Atomist SDM][atomist-sdm].  Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm (Atomist Software Delivery Machine)

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)
[flywaydb]: https://flywaydb.org/ (Flyway Database migrations)