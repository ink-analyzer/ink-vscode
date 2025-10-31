# ink! analyzer for Visual Studio Code

[ink!] language support for Visual Studio Code.

[ink!] is a programming language used for writing smart contracts for blockchains built with
[Substrate][substrate].

[ink!]: https://use.ink/
[substrate]: https://substrate.io/

## Features

- diagnostics - errors and warnings based on ink! semantic rules.
- quickfixes - suggested edits/code actions for diagnostic errors and warnings.
- completions - completion suggestions for ink! attribute macros, arguments and entities/items.
- code/intent actions - contextual assists for:
  - adding relevant ink! attribute macros, arguments and entities/items
  - migrating ink! projects to newer versions of ink! (e.g. ink! 4.x to 5.0)
  - extracting ink! entities (e.g. ink! 5.0 events) into standalone packages
  - and more!
- inlay hints - inline type and format information for ink! attribute arguments values
  (e.g. `u32 | _| @` for ink! message selectors).
- signature help - popup information for valid ink! attribute arguments for the current context/cursor position.
- hover content - descriptive/informational text for ink! attribute macros and arguments.
- commands - triggers for custom functionality like creating a new ink! project with a contract stub or
  restarting/stopping the ink! language server.

## Screenshots

### Commands

![command palette](/images/screenshots/command-palette.png 'command palette')

![status bar commands](/images/screenshots/status-bar-item.png 'status bar commands')

### Completions

![contract completions](/images/screenshots/completion-2.png 'contract completions')

![message completions](/images/screenshots/completion.png 'message completions')

![`fn` completions](/images/screenshots/completion-8.png '`fn` completions')

![`ink::combine_extensions!` completions](/images/screenshots/completion-9.png '`ink::combine_extensions!` completions')

### Diagnostics

![`anonymous` diagnostic](/images/screenshots/diagnostic-5.png '`anonymous` diagnostic')

![constructor `&self` receiver diagnostic](/images/screenshots/diagnostic.png 'constructor `&self` receiver diagnostic')

### Quick Fixes

![`anonymous` quickfix](/images/screenshots/quickfix.png '`anonymous` quickfix')

![constructor `&self` receiver quickfix](/images/screenshots/quickfix-2.png 'constructor `&self` receiver quickfix')

![message self reference receiver quickfix](/images/screenshots/quickfix-4.png 'message self reference receiver quickfix')

![chain extension `ErrorCode` type quickfix](/images/screenshots/quickfix-5.png 'chain extension `ErrorCode` type quickfix')

### Code Actions

![contract `mod` code action](/images/screenshots/code-action-8.png 'contract `mod` code action')

![event `struct` code action](/images/screenshots/code-action-7.png 'event `struct` code action')

![message `fn` code action](/images/screenshots/code-action-2.png 'message `fn` code action')

![`impl` code action](/images/screenshots/code-action-3.png '`impl` code action')

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

[ink!] is built on top of [Rust], so you'll have a much better experience
with both [rust-analyzer] and ink! analyzer enabled.

[Rust]: https://www.rust-lang.org/
[rust-analyzer]: https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer

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

🌱 Funded by: the [Web3 Foundation][W3F] and [Polkadot Treasury][Treasury].

[W3F]: https://web3.foundation/
[Treasury]: https://polkadot.network/ecosystem/treasury/
