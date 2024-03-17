# ![icon](/images/iconx32.png 'icon') ink! Analyzer for Visual Studio Code

[ink!](https://use.ink/) language support for Visual Studio Code.

[ink!](https://use.ink/) is a programming language used for writing smart contracts for blockchains built with
[Substrate](https://substrate.io/).

## Features

- diagnostics - errors and warnings based on ink! semantic rules.
- quickfixes - suggested edits/code actions for diagnostic errors and warnings.
- completions - completion suggestions for ink! attribute macros and arguments.
- code/intent actions - contextual assists for adding relevant ink! attribute macros and arguments to relevant items.
- hover content - descriptive/informational text for ink! attribute macros and arguments.
- inlay hints - inline type and format information for ink! attribute arguments values 
  (e.g. `u32 | _| @` for ink! message selectors).
- signature help - popup information for valid ink! attribute arguments for the current context/cursor position.
- commands - triggers for custom functionality like creating a new ink! project with a contract stub or
  restarting/stopping the ink! language server.

## Screenshots

### Commands

![command palette](/images/screenshots/command-palette.png 'command palette')

![status bar commands](/images/screenshots/status-bar-item.png 'status bar commands')

### Completions

![contract completions](/images/screenshots/completion-2.png 'contract completions')

![message completions](/images/screenshots/completion.png 'message completions')

![event completions](/images/screenshots/completion-6.png 'event completions')

![extension completions](/images/screenshots/completion-3.png 'extension completions')

![trait definition completions](/images/screenshots/completion-4.png 'trait definition completions')

![storage item completions](/images/screenshots/completion-5.png 'storage item completions')

### Diagnostics

![`anonymous` diagnostic](/images/screenshots/diagnostic-5.png '`anonymous` diagnostic')

![constructor `&self` receiver diagnostic](/images/screenshots/diagnostic.png 'constructor `&self` receiver diagnostic')

![constructor return type diagnostic](/images/screenshots/diagnostic-4.png 'constructor return type diagnostic')

![message self reference receiver diagnostic](/images/screenshots/diagnostic-3.png 'message self reference receiver diagnostic')

![chain extension `ErrorCode` type diagnostic](/images/screenshots/diagnostic-2.png 'chain extension `ErrorCode` type diagnostic')

### Quick Fixes

![`anonymous` quickfix](/images/screenshots/quickfix.png '`anonymous` quickfix')

![constructor `&self` receiver quickfix](/images/screenshots/quickfix-2.png 'constructor `&self` receiver quickfix')

![constructor return type quickfix](/images/screenshots/quickfix-3.png 'constructor return type quickfix')

![message self reference receiver quickfix](/images/screenshots/quickfix-4.png 'message self reference receiver quickfix')

![chain extension `ErrorCode` type quickfix](/images/screenshots/quickfix-5.png 'chain extension `ErrorCode` type quickfix')

### Code Actions

![contract `mod` code action](/images/screenshots/code-action.png 'contract `mod` code action')

![message `fn` code action](/images/screenshots/code-action-2.png 'message `fn` code action')

![`impl` code action](/images/screenshots/code-action-3.png '`impl` code action')

![extension `fn` code action](/images/screenshots/code-action-4.png 'extension `fn` code action')

![trait definition `trait` code action](/images/screenshots/code-action-5.png 'trait definition `trait` code action')

![storage item `struct` code action](/images/screenshots/code-action-6.png 'storage item `struct` code action')

### Hover content

![`storage` hover content](/images/screenshots/hover.png '`storage` hover content')

![`env` hover content](/images/screenshots/hover-2.png '`env` hover content')

### Inlay Hints

![`env: impl Environment` inlay hint](/images/screenshots/inlay-hint.png '`env: impl Environment` inlay hint')

![`selector: u32 | _` inlay hint](/images/screenshots/inlay-hint-2.png '`selector: u32 | _` inlay hint')

![`extension: u32` inlay hint](/images/screenshots/inlay-hint-3.png '`extension: u32` inlay hint')

### Signature Help

![`message` signature help](/images/screenshots/signature-help-3.png '`message` signature help')

![`contract` signature help](/images/screenshots/signature-help-2.png '`contract` signature help')

## Recommendations

[ink!](https://use.ink/) is built on top of [Rust](https://www.rust-lang.org/), so you'll have a much better experience
with both [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) and
ink! analyzer enabled.

## Extension Settings

This extension provides the following settings:

- `ink-analyzer.server.path`: **(Optional)** Sets the path to ink! Language Server (ink-lsp-server) binary/executable
  (points to the bundled binary/executable that ships with the extension by default).
- `ink-analyzer.trace.server`: **(Optional)** Enables/disables tracing of the communication between VS Code and
  the ink! Language Server (not recommended for regular users).

## Development and Testing

Check out the [Development and Testing Guide](/DEVELOPMENT.md).

## License

Licensed under [GPL-3.0](/LICENSE).

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you,
as defined in the GPL-3.0 license, shall be licensed as above, without any additional terms or conditions.

## Acknowledgements

🌱 Funded by: the [Web3 Foundation](https://web3.foundation/).
