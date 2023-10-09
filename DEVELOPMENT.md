# ink! Analyzer for Visual Studio Code: Development and Testing Guide

## Prerequisites

### Native Development

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js >= 16.0](https://nodejs.org/)
- [Yarn >= 1.0](https://yarnpkg.com/)

**NOTE:** Older versions of Node.js and Yarn may work, however, they have not been tested and no support will be provided for them.
Similarly other package managers (e.g. [npm](https://www.npmjs.com/) and [pnpm](https://pnpm.io/)) will likely work, but they haven't been tested and no support will be provided for them.

### Dev Container Development

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker](https://www.docker.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

Follow these VS Code Dev Containers tutorials to set up your development environment and get started with container-based development:

- [Dev Containers tutorial](https://code.visualstudio.com/docs/devcontainers/tutorial)
- [Developing inside a Container](https://code.visualstudio.com/docs/devcontainers/containers)

#### Tips for Dev Container Development

##### 1. Cloning the repository

When using a Dev Container, you can either:

- [Open the Git repository (or PR) in an isolated container volume](https://code.visualstudio.com/docs/devcontainers/containers#_quick-start-open-a-git-repository-or-github-pr-in-an-isolated-container-volume).
- [Open a locally cloned repository in a container](https://code.visualstudio.com/docs/devcontainers/containers#_quick-start-open-an-existing-folder-in-a-container).

##### 2. Opening a terminal

When using a Dev Container, you can [open a terminal attached to the container inside VS Code](https://code.visualstudio.com/docs/devcontainers/containers#_opening-a-terminal).

## Development

### Installing Dependencies

Run the following command from the project root:

```shell
yarn install
```

**NOTE:** The above command is automatically run after the Dev Container is created, so it can be skipped in that context.

### Debugging

- Open the project in VS Code.
- Start a debugging session using either the `Run Extension (alongside Rust Analyzer)` or `Run Extension (without Rust Analyzer)` launch configuration.
  - This will open a new VS Code window with the extension loaded and the [`test-fixtures`](/test-fixtures) directory set as the workspace root.
  - A debugging session can be started in a few ways including:
    - Opening the ["Run and Debug" view](https://code.visualstudio.com/docs/editor/debugging#_run-and-debug-view) and selecting and running the preferred launch configuration from the configuration dropdown.
    - Selecting `Start Debugging > Run Extension (alongside Rust Analyzer)` or `Start Debugging > Run Extension (without Rust Analyzer)` from the ["Command Palette"](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
    - Selecting `Run > Start Debugging` from the [application menu](https://code.visualstudio.com/docs/editor/debugging#_run-menu) to run the last run (or default) Debug configuration.

**NOTE:** Extension source code is found in the [`src/`](/src) directory and [`src/extension.ts`](/src/extension.ts) is the entrypoint.

## Testing

You can run integration tests for all the core functionality either from the command line or using a launch configuration.

### From the command line

Run the following command from the project root:

```shell
yarn test
```

### Using a Launch Configuration

- Open the project in VS Code.
- Start a debugging session using the `Run Extension Tests` launch configuration.

**NOTE:** See the [`Development > Debugging`](#debugging) section above for instructions for starting a debugging session using a launch configuration.

**NOTE:** For instructions for manual feature testing, refer to the ["Manual Feature Testing Guide"](/TESTING.md).

## License

Licensed under [GPL-3.0](/LICENSE).

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the GPL-3.0 license, shall be
licensed as above, without any additional terms or conditions.

## Acknowledgements

🌱 Funded by: the [Web3 Foundation](https://web3.foundation/).
