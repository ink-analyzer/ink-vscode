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

![message completions](/images/screenshots/completion.png 'message completions')

![contract completions](/images/screenshots/completion-2.png 'contract completions')

![extension completions](/images/screenshots/completion-3.png 'extension completions')

![trait definition completions](/images/screenshots/completion-4.png 'trait definition completions')

![storage item completions](/images/screenshots/completion-5.png 'storage item completions')

![event completions](/images/screenshots/completion-6.png 'event completions')

### Code Actions

![contract `mod` code action](/images/screenshots/code-action.png 'contract `mod` code action')

![message `fn` code action](/images/screenshots/code-action-2.png 'message `fn` code action')

![`impl` code action](/images/screenshots/code-action-3.png '`impl` code action')

![extension `fn` code action](/images/screenshots/code-action-4.png 'extension `fn` code action')

![trait definition `trait` code action](/images/screenshots/code-action-5.png 'trait definition `trait` code action')

![storage item `struct` code action](/images/screenshots/code-action-6.png 'storage item `struct` code action')

### Diagnostics and Hover content

![constructor `&self` diagnostic](/images/screenshots/diagnostic.png 'constructor `&self` diagnostic')

![chain extension `ErrorCode` type diagnostic](/images/screenshots/diagnostic-2.png 'chain extension `ErrorCode` type diagnostic')

![`anonymous` diagnostic and hover content](/images/screenshots/diagnostic-hover.png '`anonymous` diagnostic and hover content')

![message self reference diagnostic and hover content](/images/screenshots/diagnostic-hover-2.png 'message self reference diagnostic and hover content')

![constructor return type diagnostic and hover content](/images/screenshots/diagnostic-hover-3.png 'constructor return type diagnostic and hover content')

![`storage` hover content](/images/screenshots/hover.png '`storage` hover content')

![`env` hover content](/images/screenshots/hover-2.png '`env` hover content')

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
