# ![icon](/images/iconx32.png 'icon') ink! Analyzer for Visual Studio Code

[ink!](https://use.ink/) language support for Visual Studio Code.

[ink!](https://use.ink/) is a programming language used for writing smart contracts for blockchains built with [Substrate](https://substrate.io/).

## Features

- diagnostics - errors and warnings based on ink! semantic rules.
- completions - completion suggestions for ink! attribute macros and arguments.
- code/intent actions - contextual assists for adding relevant ink! attribute macros and arguments to relevant items.
- hover content - descriptive/informational text for ink! attribute macros and arguments.

## Screenshots

### Completions

![constructor completions](/images/screenshots/completion.png 'constructor completions')

### Code Actions

![contract `mod` code action](/images/screenshots/code-action.png 'contract `mod` code action')

![message `fn` code action](/images/screenshots/code-action-2.png 'message `fn` code action')

![`impl` code action](/images/screenshots/code-action-3.png '`impl` code action')

### Diagnostics and Hover content

![`anonymous` diagnostic and hover content](/images/screenshots/diagnostics.png '`anonymous` diagnostic and hover content')

![`storage` hover content](/images/screenshots/hover.png '`storage` hover content')

## Recommendations

[ink!](https://use.ink/) is built on top of [Rust](https://www.rust-lang.org/), so you'll have a much better experience with both [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) and ink! analyzer enabled.

## Extension Settings

This extension provides the following settings:

- `ink-analyzer.server.path`: **(Optional)** Sets the path to ink! Language Server (ink-lsp-server) binary/executable (points to the bundled binary/executable that ships with the extension by default).
- `ink-analyzer.trace.server`: **(Optional)** Enables/disables tracing of the communication between VS Code and the ink! Language Server (not recommended for regular users).

## Development and Testing

Check out the [Development and Testing Guide](/DEVELOPMENT.md).

## License

Licensed under [GPL-3.0](/LICENSE).

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the GPL-3.0 license, shall be
licensed as above, without any additional terms or conditions.

## Acknowledgements

🌱 Funded by: the [Web3 Foundation](https://web3.foundation/).
