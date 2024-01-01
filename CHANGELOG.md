# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
