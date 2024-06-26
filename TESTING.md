# ink! Analyzer for Visual Studio Code: Manual Feature Testing Guide

## Setup

### Option 1: Marketplace Install

- Install the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ink-analyzer.ink-analyzer)
  directly from the VS Code marketplace following [this guide](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension)
- Clone the [VS Code extension repo](https://github.com/ink-analyzer/ink-vscode) and
  open the [test-fixtures](https://github.com/ink-analyzer/ink-vscode) directory in VS Code.

### Option 2: Debug Environment

- Follow the VS Code extension's ["Development, Debugging and Automated Testing Guide"](/DEVELOPMENT.md) to set up
  a test environment.
- Use the "Run Extension (without Rust Analyzer)" launch configuration to test the extension in an isolated environment
  (see further instructions in the ["Development, Debugging and Automated Testing Guide"](/DEVELOPMENT.md)).

**NOTE:** If you're using the Debug Environment option and have already cloned the
[VS Code extension repository](https://github.com/ink-analyzer/ink-vscode) in the past,
be sure to pull the latest changes to make sure you get the latest release of the language server.

## Testing

The instructions below are written for the
[erc20 contract in the "test-fixtures" directory/workspace of the VS Code extension's repository](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/erc20/lib.rs)
(unless stated otherwise), so open that in VS Code first.

### 1. Commands

You can view a list of all available commands in one of the following ways:

- Typing `>ink!` into the ["Command Palette"](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)
  (notice the preceding `>` before `ink!` in this case).
- Clicking in the "Command Palette", then selecting `Show and Run Commands >`, and then typing `ink!`
  (after the now prefilled `>`).
- Typing `Cmd/Ctrl + Shift + P` to navigate directly into the `Show and Run Commands >` section of
  the "Command Palette", and then type `ink!`.
- Hovering over the `ink! analyzer` ["Status Bar"](https://code.visualstudio.com/docs/getstarted/userinterface) item.

![command palette](/images/screenshots/command-palette.png 'command palette')

![status bar commands](/images/screenshots/status-bar-item.png 'status bar commands')

### 2. Diagnostics and Quickfixes

![`storage` quickfix](/images/screenshots/diagnostic-quickfix.png '`storage` quickfix')

**Action:**

Remove the ink! storage item i.e.

```rust
/// A simple ERC-20 contract.
#[ink(storage)]
// ...
pub struct Erc20 {
  /// Total token supply.
  total_supply: Balance,
  // ...
}
```

**Expected Result:**

- You should see diagnostic "squiggles" (zigzag underlines) on the ink! contract `mod` item
  (i.e. covering the line `mod erc20 {`).
- Hovering over the "squiggles" should show a diagnostic message like `Missing ink! storage`.
- Hovering over the "squiggles" should reveal a "quickfix" to `Add ink! storage "struct".`
- Alternatively, positioning the cursor on the "squiggles" and clicking the "light bulb" that's triggered by
  this action will also reveal the above quickfix.

**Additional testing examples:**

- Remove other required ink! entities (e.g. remove all ink! messages).
- Add a conflicting argument to one of the ink! attributes (e.g. change `#[ink(constructor)]` to
  `#[ink(constructor, topic)]` or change `#[ink::contract]` to `#[ink::contract(payable)]`).
- Add an unknown argument to one of the ink! attributes
  (e.g. change `#[ink(constructor)]` to `#[ink(constructor, xyz)]`).
- Apply an ink! attribute to the wrong Rust item kind
  (e.g. add an `#[ink::test]` attribute above the line `impl Erc20 {`).
- Add unexpected or remove required Rust item invariants e.g. remove the `Self` return type (i.e. remove `-> Self`)
  from one of the ink! constructor functions or add a self reference receiver (i.e. add `&self` as the first parameter)
  to one of the ink! constructor functions.
- Add clashing selectors to ink! constructors or ink! messages (e.g. change all `#[ink(message)]` attributes to
  `#[ink(message, selector = 1)]`, or add an ink! constructor or ink! message with the same `fn` name as an
  existing callable e.g. add another ink! message named `total_supply`).
- Move an ink! entity to the wrong scope (e.g. move an ink! message into the root of the contract `mod` - e.g.
  move the `total_supply` ink! message to the line right after the ink! storage `struct`).
- Set a wrong value for an ink! `env` argument value (e.g. replace `#[ink::contract(env = crate::CustomEnvironment)]`
  with `#[ink::contract(env = self::CustomEnvironment)]` in the
  [psp22-extension contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/psp22-extension/lib.rs)
  in the test-fixtures directory).
- Remove the `ink::env::Environment` implementation for a custom chain environment type
  (e.g. remove the `ink::env::Environment` implementation for the `CustomEnvironment` type i.e.
  by removing the `impl` block starting with the line `impl Environment for CustomEnvironment {` in the
  [psp22-extension contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/psp22-extension/lib.rs)
  in the test-fixtures directory).
- Remove one of the methods in a trait definition implementation block (e.g. remove the `total_supply(&self) -> Balance` method
  from the `impl` block starting with line `impl BaseErc20 for Erc20 {` in the
  [trait-erc20 contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/trait-erc20/lib.rs)
  in the test-fixtures directory).
- Add a custom method that's not defined in the trait definition to its implementation block (e.g. add a method named
  `another` to the `impl` block starting with line `impl BaseErc20 for Erc20 {` in the
  [trait-erc20 contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/trait-erc20/lib.rs)
  in the test-fixtures directory).
- Modify the signature of a trait definition implementation block method to not match the signature of the similarly
  named method in the trait definition (e.g. replace the immutable self receiver in `total_supply(&self) -> Balance`
  with a mutable self receiver i.e. `total_supply(&mut self) -> Balance`, or replace the `bool` return type with a
  `Option<bool>` return type for the `impl` block starting with line `impl BaseErc20 for Erc20 {` in the
  [trait-erc20 contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/trait-erc20/lib.rs)
  in the test-fixtures directory).
- Modify the ink! attribute arguments of a trait definition implementation block method to not match those of the
  similarly named method in the trait definition (e.g. add the ink! `payable` attribute argument to the
  `total_supply(&self) -> Balance` method i.e. replace `#[ink(message)]` with `#[ink(message, payable)]` for the
  `impl` block starting with line `impl BaseErc20 for Erc20 {` in the
  [trait-erc20 contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/trait-erc20/lib.rs)
  in the test-fixtures directory).
- Remove the `ink::env::chain_extension::FromStatusCode` implementation for a chain extension's `ErrorCode` type (e.g.
  remove the `ink::env::chain_extension::FromStatusCode` implementation for the `Psp22Error` type i.e. by removing
  the `impl` block starting with the line `impl ink::env::chain_extension::FromStatusCode for Psp22Error {` in the
  [psp22-extension contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/psp22-extension/lib.rs)
  in the test-fixtures directory).
- Use `Self::ErrorCode` in a chain extension (e.g. change the `token_name` extension declaration from
  `fn token_name(asset_id: u32) -> Result<Vec<u8>>;` to
  `fn token_name(asset_id: u32) -> core::result::Result<Vec<u8>, Self::ErrorCode>;` in the
  [psp22-extension contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/psp22-extension/lib.rs)
  in the test-fixtures directory).
- Remove at least one SCALE codec trait (i.e. `scale::Encode`, `scale::Decode` or `scale_info::TypeInfo`) implementation
  (including via `#[ink::scale_derive(...)]` or `#[derive(...)]` attributes) from a chain extension's `ErrorCode` type
  or a custom input or output type for one of its methods (e.g. remove the `#[ink::scale_derive(Encode, Decode, TypeInfo)]`
  attribute for the `Psp22Error` type i.e. by removing the attributes above the line `pub enum Psp22Error {` in the
  [psp22-extension contract](https://github.com/ink-analyzer/ink-vscode/blob/master/test-fixtures/v5/psp22-extension/lib.rs)
  in the test-fixtures directory).

All the above edits should result in diagnostics "squiggles" that reveal one or more quickfixes for the issues.

**NOTE:** The list of diagnostics and quickfixes above is not exhaustive.

### 3. Completions

![message completions](/images/screenshots/completion.png 'message completions')

- For attribute macro completions, make one of the ink! macro-based attributes "incomplete"
  (e.g. change `#[ink::contract]` to `#[ink]` or `#[ink::c]`) and either start typing to complete the macro name or
  hit `Cmd/Ctrl + Space` to trigger a completion proposal manually.
- For "primary" attribute argument completions (e.g. `storage`, `event`, `constructor`, `message` e.t.c),
  make one of the ink! argument-based attributes "incomplete" (e.g. change `#[ink(storage)]` to `#[ink()]`) and
  either typing the `(` character, or starting to type inside the parentheses, or hitting `Cmd/Ctrl + Space`
  should trigger completion proposals.
- For "complementary" attribute argument completions
  (e.g. `payable`, `default`, `selector` for `#[ink(message)]`, or `anonymous` for `#[ink(event)]` e.t.c),
  add a comma after an existing attribute argument (e.g. change `#[ink(message)]` to `#[ink(message,)]`) and
  either typing the comma (`,`) character, or hitting `Cmd/Ctrl + Space` should trigger completion proposals.
- For "complementary" argument completions for ink! attribute macros (e.g. `env` and `keep_attr` for `#[ink::contract]`),
  add parentheses after the attribute macro (e.g. change `#[ink::contract]` to `#[ink::contract()]`), and
  either typing the `(` character, or starting to type inside the parentheses, or hitting `Cmd/Ctrl + Space`
  should trigger completion proposals.

### 4. Hover content

![`env` hover content](/images/screenshots/hover-2.png '`env` hover content')

Hovering over an ink! attribute macro (e.g. `#[ink::contract]`) or argument (e.g. `#[ink(storage)]` or the `env = ...`
part in `#[ink::contract(env = crate::Environment)]`) will reveal related usage documentation for the
ink! attribute macro or specific ink! attribute argument in a popup.

### 5. Code Actions

![contract `mod` code action](/images/screenshots/code-action.png 'contract `mod` code action')

Positioning the cursor either on an ink! attribute (e.g. on an `#[ink::contract]`) or on the "declaration"
(e.g. anywhere on the line `mod erc20 {` but not inside the body) of a Rust item that is either already annotated
with ink! attributes or can be annotated with ink! attributes (e.g. `mod`, `struct`, `fn`, `impl` e.t.c) will trigger
a "light bulb" with relevant code actions.

**Testing examples:**

- Positioning the cursor on an ink! attribute (e.g. on `#[ink::contract]`) will trigger a "light bulb" with code actions
  for adding complementary arguments (if any) to the ink! attribute (i.e. `env` and `keep_attr` for `#[ink(contract)]`
  or `payable`, `default` and `selector` for `#[ink(message)]`).
- Positioning the cursor on the "declaration" of a Rust item without any other ink! attributes but whose item kind
  can be annotated with ink! attributes (e.g. `mod`, `struct`, `fn`, `impl` e.t.c) will trigger a "light bulb" with
  code actions for adding relevant ink! attributes depending on the context
  (e.g. `Add ink! message attribute` for an `fn` item).
- Positioning the cursor on the ink! contract `mod` item "declaration" (i.e. on the line `mod erc20 {`) will
  trigger a "light bulb" with code actions for adding an `ink! event "struct"`, `ink! message "fn"` or
  `ink! constructor "fn"` to the ink! contract.
- After inserting an ink! event (e.g. use code action described above), positioning the cursor on the
  ink! event `struct` item "declaration" (i.e. on the line `pub struct MyEvent {`) will trigger a "light bulb"
  with code actions for adding an `ink! topic "field"`.
- Positioning the cursor on the item "declaration" of a "test" `mod` (i.e. a `mod` annotated with `#[cfg(test)]` or
  similar e.g. on the line `mod tests {`) will trigger a "light bulb" with code actions for adding an `ink! test "fn"`
  to the `mod` item.
- Positioning the cursor on the item "declaration" of a "test" `mod` with an additional `e2e-tests` feature condition
  (i.e. a `mod` annotated with `#[cfg(all(test, feature = "e2e-tests"))]` or similar e.g. on the line `mod e2e_tests {`)
  will trigger a "light bulb" with code actions for adding an `ink! e2e test "fn"` to the `mod` item.
- Positioning the cursor on the "declaration" of a Rust item with multiple ink! attributes
  (e.g. `#[ink(event)]\n#[ink(anonymous)]` e.t.c) will trigger a "light bulb" with code actions for
  "flattening" the ink! attributes.
- For VS Code version 1.86 or newer, you can enable code actions on empty lines by changing the
  `Editor › Lightbulb: Enabled` setting to `on` (See [this guide](https://code.visualstudio.com/docs/getstarted/settings)
  for details - the equivalent entry for `settings.json` is `"editor.lightbulb.enabled" = "on"`),
  with this setting enabled, positioning the cursor on an empty line will trigger a "light bulb" with code actions for
  inserting relevant ink! entities for the context (e.g. placing the cursor on the new line between
  `#![cfg_attr(not(feature = "std"), no_std, no_main)]` and `#[ink::contract]` trigger a "light bulb" with code actions
  for adding an ink! trait definition, ink! chain extension, ink! storage item or a custom ink! environment
  at the cursor position).
  **NOTE:** Alternatively, to trigger code actions on empty lines without changing the above setting
  (or on versions of VS Code older than 1.86), you can right-click at the empty line position,
  and then select `Refactor` from the subsequent context menu to reveal the equivalent code actions.

### 6. Inlay Hints

![`env: impl Environment` inlay hint](/images/screenshots/inlay-hint.png '`env: impl Environment` inlay hint')

ink! attribute arguments that are expected to have values
(e.g. `selector`, `env`, `keep_attr`, `namespace`, `extension`, `handle_status`, `derive` e.t.c)
will have inlay hints (additional inline information) about the type of the expected value added right after
the `name` part of the `name=value` pair (e.g. `: u32 | _` for `selector`, `: impl Environment` for `env`,
and `: bool` for `handle_status`).

### 7. Signature Help

![`message` signature help](/images/screenshots/signature-help-3.png '`message` signature help')

When adding ink! attribute arguments (e.g. "primary" like `storage`, `event`, `constructor`, `message` e.t.c or
"complementary"/"additional" like `env`, `keep_attr`, `payable`, `selector`, `anonymous` e.t.c),
a popup with additional information about the "signature" for the ink! attribute and a description about
the current argument can be triggered either automatically after typing the opening parenthesis
(`(`) character or a comma (`,`) separator character, or manually by hitting `Cmd/Ctrl + Shift + Space`.
