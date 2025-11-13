# <img src="./icon.png" width="32px" height="32px" style="margin-bottom: -3px"> ink! analyzer for Visual Studio Code

[ink!] language support for Visual Studio Code.

[ink!] is a programming language used for writing smart contracts for blockchains built with
[Substrate][substrate].

[ink!]: https://use.ink/
[substrate]: https://substrate.io/

## Features

- diagnostics - errors and warnings based on ink! semantic rules.
- quickfixes - suggested edits/code actions for fixing diagnostic errors and warnings.
- completions - inline code suggestions for ink! attribute macros, arguments and items 
  for defining and configuring your ink! smart contract's storage, constructors, messages, 
  events, errors, tests and much more.
- code/intent actions - contextual assists for:
  - adding relevant ink! attribute macros, arguments and items
  - migrating ink! projects to newer versions of ink! (e.g. ink! 4.x to 5.0)
  - extracting ink! items (e.g. ink! events) into standalone packages
  - and more!
- inlay hints - inline type and format information for ink! attribute argument values
  (e.g. `u32 | _| @` for ink! message selectors).
- signature help - popup information for valid ink! attribute arguments for the current context/cursor position.
- hover content - popup documentation for ink! attribute macros and arguments.
- commands - triggers for custom functionality like creating a new ink! project with a contract stub or
  restarting/stopping the ink! language server.

## Screenshots

### Completions

![contract completions](/images/screenshots/completion-2.png 'contract completions')

![message completions](/images/screenshots/completion.png 'message completions')

### Diagnostics

![`anonymous` diagnostic](/images/screenshots/diagnostic-5.png '`anonymous` diagnostic')

![constructor `&self` receiver diagnostic](/images/screenshots/diagnostic.png 'constructor `&self` receiver diagnostic')

### Quick Fixes

![constructor `&self` receiver quickfix](/images/screenshots/quickfix-2.png 'constructor `&self` receiver quickfix')

![message self reference receiver quickfix](/images/screenshots/quickfix-4.png 'message self reference receiver quickfix')

### Code Actions

![contract `mod` code action](/images/screenshots/code-action-8.png 'contract `mod` code action')

![`impl` code action](/images/screenshots/code-action-3.png '`impl` code action')

### Inlay Hints

![`selector: u32 | _` inlay hint](/images/screenshots/inlay-hint-2.png '`selector: u32 | _` inlay hint')

### Signature Help

![`message` signature help](/images/screenshots/signature-help-3.png '`message` signature help')

### Hover content

![`env` hover content](/images/screenshots/hover-2.png '`env` hover content')

### Commands

![command palette](/images/screenshots/command-palette.png 'command palette')

![status bar commands](/images/screenshots/status-bar-item.png 'status bar commands')

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

🎨 Illustration by: [Dima Moiseenko][Dima]

🌱 Funded by: the [Web3 Foundation][W3F] and [Polkadot Treasury][Treasury].

[Dima]: https://illustratordima.com/
[W3F]: https://web3.foundation/
[Treasury]: https://polkadot.network/ecosystem/treasury/
