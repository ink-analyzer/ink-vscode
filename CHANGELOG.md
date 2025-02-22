# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.32] - 2025-02-05

- 🎉 Support for [ink! v5.1](https://github.com/paritytech/ink/releases/tag/v5.1.0).
- Miscellaneous improvements.

## [0.1.31] - 2024-05-03

- Code action for [migrating ink! 4.x projects to ink! 5.0](https://use.ink/faq/migrating-from-ink-4-to-5/).
- Completions for full ink! entities (i.e. inserting full Rust items not just ink! attribute macros and arguments e.g. ink! constructor and message `fn` items as completions when typing `fn` inside `impl` blocks e.t.c)
- Code action for extracting ink! events into standalone packages (only for [ink! v5](https://github.com/paritytech/ink/releases/tag/v5.0.0) projects).
- Completions and code actions for `ink::combine_extensions!` declarative macro.
- General performance and robustness improvements for semantic analyzer and language server.

## [0.1.30] - 2024-04-02

- Improve support for ink! workspace dependencies.
- General robustness improvements for semantic analyzer and language server.

## [0.1.29] - 2024-03-18

- Improve support for [ink! v5](https://github.com/paritytech/ink/releases/tag/v5.0.0)

## [0.1.28] - 2024-03-17

- Improve support for [ink! v5](https://github.com/paritytech/ink/releases/tag/v5.0.0)

## [0.1.27] - 2024-03-16

- 🎉 Support for [ink! v5](https://github.com/paritytech/ink/releases/tag/v5.0.0)
- Performance improvements and general and robustness updates for semantic analyzer and language server.

## [0.1.26] - 2024-02-19

- Improve contextual awareness for completions, code/intent actions and quickfixes (e.g. suggest unique ids and names for ink! entities).

## [0.1.25] - 2024-02-04

- General robustness updates.

## [0.1.24] - 2024-01-26

- General robustness improvements for semantic analyzer.

## [0.1.23] - 2024-01-17

- General robustness improvements for semantic analyzer.

## [0.1.22] - 2024-01-10

- General robustness improvements for semantic analyzer.

## [0.1.21] - 2024-01-09

- General robustness improvements for semantic analyzer.

## [0.1.20] - 2024-01-02

- Performance improvements for language server.

## [0.1.19] - 2024-01-01

- General robustness improvements for semantic analyzer.

## [0.1.18] - 2023-12-24

- General robustness improvements for language server and semantic analyzer.

## [0.1.17] - 2023-12-20

- Add diagnostics and quickfixes for error code type resolution and implementation of `ink::env::chain_extension::FromStatusCode` trait.
- Add diagnostics and quickfixes for no usage of `Self::ErrorCode` in chain extension.
- Add diagnostics and quickfixes for error code type, and extension input and output types implementing SCALE codec traits.
- Improve item and external trait impl resolvers.
- General robustness improvements for semantic analyzer.

## [0.1.16] - 2023-12-10

- Improvements for chain environment implementation resolution.

## [0.1.15] - 2023-12-04

- Add diagnostics and quickfixes for chain environment arguments (i.e. argument value is a path to an item `T` and `T: impl ink::env::Environment`).
- Improvements for trait definition resolution and formatting of related quickfixes.
- General robustness improvements for language server and semantic analyzer.

## [0.1.14] - 2023-11-02

- Signature help improvements.
- General robustness improvements for language server and semantic analyzer.

## [0.1.13] - 2023-10-28

- Add create project command.
- Add diagnostics and quickfixes for ink! trait definition implementations.

## [0.1.12] - 2023-10-09

- General robustness improvements for semantic analyzer.

## [0.1.11] - 2023-09-29

- Signature help improvements.
- Improvements to code actions for trait `impl` blocks.
- General robustness improvements for semantic analyzer.

## [0.1.10] - 2023-09-25

- Add signature help for ink! attribute arguments.
- Add code actions for "flattening" ink! attributes.
- General robustness improvements for semantic analyzer.

## [0.1.9] - 2023-09-19

- Improve diagnostics and quickfixes for ambiguous attribute arguments.
- Improve "primary" attribute and argument quickfixes.
- General robustness improvements for semantic analyzer.

## [0.1.8] - 2023-09-18

- Improve formatting of text edits (i.e. code actions and quickfixes) inserted after ADT fields.
- General robustness improvements for semantic analyzer.

## [0.1.7] - 2023-09-13

- Add code actions for adding ink! entities (i.e. code stubs/snippets for items not just attributes).
- Improve formatting of text edits (i.e. code actions and quickfixes) inserted after comments and rustdoc.
- General robustness improvements for semantic analyzer.

## [0.1.6] - 2023-09-10

- Improve formatting of move and delete text edits (i.e. actions and quickfixes).
- General robustness improvements for semantic analyzer.

## [0.1.5] - 2023-09-09

- Improve formatting of text edits (i.e. actions and quickfixes) based on context.
- Snippet parsing performance improvements.
- General robustness improvements for semantic analyzer.

## [0.1.4] - 2023-09-07

- Add quickfixes for diagnostic errors and warnings.
- Add support for ink! e2e macro (i.e. diagnostics, completions, code/intent actions and hover content).
- Add inlay hints for ink! attribute arguments with values.
- Add support for multiple snippets in code actions.
- Limit diagnostic ranges to item "declarations".
- General robustness improvements for semantic analyzer.

## [0.1.3] - 2023-08-05

- Documentation improvements.

## [0.1.2] - 2023-08-04

- Documentation fixes.

## [0.1.1] - 2023-08-04

- Documentation improvements.

## [0.1.0] - 2023-08-04

- Initial release.
