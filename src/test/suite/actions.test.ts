import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assert = require('chai').assert;

import {
  activateExtension,
  applyTestEdits,
  assertContainsText,
  getDocumentUri,
  openDocument,
  setDocumentContent,
  toRange,
} from './utils';
import { TestCase, TestGroup, TestResultAction } from './types';

// Describes a collection of actions tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ERC20_TESTS: Array<TestCase> = [
  {
    name: '#[ink::contract]',
    // Removes `#[ink::contract]` from the source code.
    edits: [{ text: '', startPos: [2, 0], endPos: [2, 17] }],
    // Sets the selection range at the beginning of the `mod` declaration.
    params: { startPos: [3, 0], endPos: [3, 0] },
    // Describes the expected code actions.
    results: [{ label: 'Add', edits: [{ text: '#[ink::contract]', startPos: [3, 0], endPos: [3, 0] }] }],
  },
  {
    name: '#[ink(storage)]',
    params: { startPos: [7, 4], endPos: [7, 4] },
    results: [],
  },
  {
    name: 'default|payable|selector=$1 <- #[ink(constructor)]',
    params: { startPos: [55, 8] },
    results: [
      { label: 'Add', edits: [{ text: ', default', startPos: [55, 25], endPos: [55, 25] }] },
      { label: 'Add', edits: [{ text: ', payable', startPos: [55, 25], endPos: [55, 25] }] },
      { label: 'Add', edits: [{ text: ', selector=${1:1}', startPos: [55, 25], endPos: [55, 25] }] },
    ],
  },
  {
    name: '#[ink(constructor|default|message|payable|selector=${1:1})] <- pub fn new(total_supply: Balance)',
    edits: [{ text: '', startPos: [55, 8], endPos: [55, 27] }],
    params: { startPos: [56, 8] },
    results: [
      { label: 'Add', edits: [{ text: '#[ink(constructor)]', startPos: [56, 8], endPos: [56, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(default)]', startPos: [56, 8], endPos: [56, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(message)]', startPos: [56, 8], endPos: [56, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(payable)]', startPos: [56, 8], endPos: [56, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(selector=${1:1})]', startPos: [56, 8], endPos: [56, 8] }] },
    ],
  },
  {
    name: 'default|payable|selector=${1:1} <- #[ink(message)]',
    params: { startPos: [73, 8] },
    results: [
      { label: 'Add', edits: [{ text: ', default', startPos: [73, 21], endPos: [73, 21] }] },
      { label: 'Add', edits: [{ text: ', payable', startPos: [73, 21], endPos: [73, 21] }] },
      { label: 'Add', edits: [{ text: ', selector=${1:1}', startPos: [73, 21], endPos: [73, 21] }] },
    ],
  },
  {
    name: '#[ink(constructor|default|message|payable|selector=${1:1})] <- pub fn total_supply(&self)',
    edits: [{ text: '', startPos: [73, 8], endPos: [73, 23] }],
    params: { startPos: [74, 8] },
    results: [
      { label: 'Add', edits: [{ text: '#[ink(constructor)]', startPos: [74, 8], endPos: [74, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(default)]', startPos: [74, 8], endPos: [74, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(message)]', startPos: [74, 8], endPos: [74, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(payable)]', startPos: [74, 8], endPos: [74, 8] }] },
      { label: 'Add', edits: [{ text: '#[ink(selector=${1:1})]', startPos: [74, 8], endPos: [74, 8] }] },
    ],
  },
  {
    name: 'impl level empty line',
    // i.e. empty line between `new` constructor fn and `total_supply` message fn.
    params: { startPos: [71, 0], endPos: [71, 0] },
    results: [
      { label: 'Add', edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [71, 0], endPos: [71, 0] }] },
      { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [71, 0], endPos: [71, 0] }] },
    ],
  },
  {
    name: '#[ink::test]',
    params: { startPos: [271, 8] },
    results: [],
  },
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
  {
    name: '#[ink::chain_extension]|#[ink::trait_definition] <- pub trait BaseErc20',
    edits: [{ text: '', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [4, 0], endPos: [4, 0] },
    results: [
      { label: 'Add', edits: [{ text: '#[ink::chain_extension]', startPos: [4, 0], endPos: [4, 0] }] },
      { label: 'Add', edits: [{ text: '#[ink::trait_definition]', startPos: [4, 0], endPos: [4, 0] }] },
    ],
  },
  {
    name: 'impl BaseErc20 for Erc20 {',
    params: { startPos: [110, 4], endPos: [110, 4] },
    results: [{ label: 'Add', edits: [{ text: '#[ink(impl)]', startPos: [110, 4], endPos: [110, 4] }] }],
  },
  {
    name: 'undeclared method',
    edits: [{ text: '', startPos: [5, 4], endPos: [7, 23] }],
    params: { startPos: [113, 8], endPos: [113, 8] },
    results: [{ label: 'Add', edits: [{ text: '', startPos: [109, 8], endPos: [115, 8] }] }],
  },
  {
    name: 'mismatching parameters',
    edits: [{ text: '&mut self, a: u8', startPos: [113, 24], endPos: [113, 29] }],
    params: { startPos: [113, 24], endPos: [113, 33] },
    results: [{ label: 'Add', edits: [{ text: '(&self)', startPos: [113, 23], endPos: [113, 41] }] }],
  },
  {
    name: 'mismatching return type',
    edits: [{ text: '-> u8', startPos: [113, 31], endPos: [113, 41] }],
    params: { startPos: [113, 31], endPos: [113, 31] },
    results: [{ label: 'Add', edits: [{ text: '-> Balance', startPos: [113, 31], endPos: [113, 36] }] }],
  },
  {
    name: 'mismatching attribute arguments',
    edits: [{ text: ', payable', startPos: [112, 21], endPos: [112, 21] }],
    params: { startPos: [112, 23], endPos: [112, 23] },
    results: [{ label: 'Add', edits: [{ text: '', startPos: [112, 21], endPos: [112, 30] }] }],
  },
];
const PSP22_CHAIN_EXTENSION_TESTS: Array<TestCase> = [
  {
    name: 'type ErrorCode = ();',
    edits: [{ text: '()', startPos: [12, 21], endPos: [12, 31] }],
    params: { startPos: [12, 21], endPos: [12, 21] },
    results: [{ label: 'Add', edits: [{ text: '${1:crate::Psp22Error}', startPos: [12, 21], endPos: [12, 23] }] }],
  },
];
const ACTION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: '(env=${1:ink::env::DefaultEnvironment}|keep_attr="$1") <- #[ink::contract]',
        // Makes no modifications.
        // Sets the selection range at the beginning of `#[ink::contract]`.
        params: { startPos: [2, 0], endPos: [2, 0] },
        // Describes the expected code actions.
        results: [
          {
            label: 'Add',
            edits: [{ text: '(env=${1:ink::env::DefaultEnvironment})', startPos: [2, 15], endPos: [2, 15] }],
          },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
        ],
      },
      {
        name: 'mod erc20 {',
        params: { startPos: [3, 0], endPos: [3, 0] },
        results: [
          {
            label: 'Add',
            edits: [{ text: '(env=${1:ink::env::DefaultEnvironment})', startPos: [2, 15], endPos: [2, 15] }],
          },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
          { label: 'Add', edits: [{ text: '#[ink::event]', isSnippet: true, startPos: [2, 0], endPos: [2, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [38, 5], endPos: [38, 5] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [217, 9], endPos: [217, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [217, 9], endPos: [217, 9] }] },
        ],
      },
      {
        name: '#[ink::contract]|#[ink(env=crate::Environment)]',
        edits: [{ text: '#[ink::contract]\n#[ink(env=crate::Environment)]', startPos: [2, 0], endPos: [2, 17] }],
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink::contract(env=crate::Environment)]', startPos: [2, 0], endPos: [2, 16] }],
          },
          { label: 'Add', edits: [{ text: '#[ink::event]', isSnippet: true, startPos: [2, 0], endPos: [2, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [39, 5], endPos: [39, 5] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [218, 9], endPos: [218, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [218, 9], endPos: [218, 9] }] },
        ],
      },
      {
        name: 'root level empty line',
        // i.e. empty line between `#![cfg_attr(not(feature = "std"), no_std, no_main)]` and `#[ink::contract]`
        params: { startPos: [1, 0], endPos: [1, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::event]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink::trait_definition]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [
              { text: '#[ink::chain_extension(extension=${1:1})]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] },
            ],
          },
          {
            label: 'Add',
            edits: [{ text: 'ink::combine_extensions!', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [{ text: '#[ink::storage_item]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [{ text: 'impl ink::env::Environment for ', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
        ],
      },
      {
        name: '#[ink::event|scale_derive|storage_item]|#[ink(anonymous|event|signature_topic|storage)] <- pub struct Erc20',
        edits: [{ text: '', startPos: [7, 4], endPos: [7, 19] }],
        params: { startPos: [9, 4], endPos: [9, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::event]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink::scale_derive]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(signature_topic="$1")]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [9, 4], endPos: [9, 4] }] },
        ],
      },
      {
        name: 'anonymous <- #[ink(event)]',
        params: { startPos: [20, 4], endPos: [20, 4] },
        results: [
          { label: 'Add', edits: [{ text: ', anonymous', startPos: [20, 15], endPos: [20, 15] }] },
          { label: 'Add', edits: [{ text: ', signature_topic="$1"', startPos: [20, 15], endPos: [20, 15] }] },
          { label: 'Extract', edits: [] },
        ],
      },
      {
        name: '#[ink(event)]|#[ink(anonymous)]',
        edits: [{ text: '#[ink(event)]\n    #[ink(anonymous)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [22, 4], endPos: [22, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(event, anonymous)]', startPos: [20, 4], endPos: [20, 17] }] },
          { label: 'Add', edits: [{ text: '#[ink(topic)]', isSnippet: true, startPos: [27, 23], endPos: [27, 23] }] },
          { label: 'Extract', edits: [] },
        ],
      },
      {
        name: '#[ink::storage_item|scale_derive|storage_item]|#[ink(anonymous|event|signature_topic|storage)] <- pub struct Transfer',
        edits: [{ text: '', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [21, 4], endPos: [21, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::event]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink::scale_derive]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(signature_topic="$1")]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [21, 4], endPos: [21, 4] }] },
        ],
      },
      {
        name: '`mod` level empty line',
        // i.e. empty line between `Erc20` storage struct and `Transfer` event struct.
        params: { startPos: [18, 0], endPos: [18, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::event]', isSnippet: true, startPos: [2, 0], endPos: [2, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [18, 0], endPos: [18, 0] }] },
        ],
      },
      {
        name: 'impl Erc20 {',
        params: { startPos: [53, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(impl)]', startPos: [53, 4], endPos: [53, 4] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(namespace="${1:my_namespace}")]', startPos: [53, 4], endPos: [53, 4] }],
          },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [217, 9], endPos: [217, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [217, 9], endPos: [217, 9] }] },
        ],
      },
      {
        name: 'mod tests {',
        params: { startPos: [221, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::test]', isSnippet: true, startPos: [510, 9], endPos: [510, 9] }] },
        ],
      },
      {
        name: 'mod e2e_tests {',
        params: { startPos: [514, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::test]', isSnippet: true, startPos: [642, 9], endPos: [642, 9] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink_e2e::test]', isSnippet: true, startPos: [642, 9], endPos: [642, 9] }],
          },
        ],
      },
      {
        name: '(additional_contracts="$1"|environment=${1:ink::env::DefaultEnvironment}|keep_attr="$1") <- #[ink_e2e::test]',
        params: { startPos: [520, 8] },
        results: [
          { label: 'Add', edits: [{ text: '(backend(${1:node}))', startPos: [520, 23], endPos: [520, 23] }] },
          {
            label: 'Add',
            edits: [
              { text: '(environment=${1:ink::env::DefaultEnvironment})', startPos: [520, 23], endPos: [520, 23] },
            ],
          },
        ],
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS.concat([
      {
        name: '(env=${1:ink::env::DefaultEnvironment}|keep_attr="$1") <- #[ink::contract]',
        // Makes no modifications.
        // Sets the selection range at the beginning of `#[ink::contract]`.
        params: { startPos: [2, 0], endPos: [2, 0] },
        // Describes the expected code actions.
        results: [
          { label: 'Migrate', edits: [] },
          {
            label: 'Add',
            edits: [{ text: '(env=${1:ink::env::DefaultEnvironment})', startPos: [2, 15], endPos: [2, 15] }],
          },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
        ],
      },
      {
        name: 'mod erc20 {',
        params: { startPos: [3, 0], endPos: [3, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          {
            label: 'Add',
            edits: [{ text: '(env=${1:ink::env::DefaultEnvironment})', startPos: [2, 15], endPos: [2, 15] }],
          },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [38, 5], endPos: [38, 5] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [213, 9], endPos: [213, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [213, 9], endPos: [213, 9] }] },
        ],
      },
      {
        name: '#[ink::contract]|#[ink(env=crate::Environment)]',
        edits: [{ text: '#[ink::contract]\n#[ink(env=crate::Environment)]', startPos: [2, 0], endPos: [2, 17] }],
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink::contract(env=crate::Environment)]', startPos: [2, 0], endPos: [2, 16] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [39, 5], endPos: [39, 5] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [214, 9], endPos: [214, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [214, 9], endPos: [214, 9] }] },
        ],
      },
      {
        name: 'root level empty line',
        // i.e. empty line between `#![cfg_attr(not(feature = "std"), no_std, no_main)]` and `#[ink::contract]`
        params: { startPos: [1, 0], endPos: [1, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          {
            label: 'Add',
            edits: [{ text: '#[ink::trait_definition]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [{ text: '#[ink::chain_extension]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [{ text: '#[ink::storage_item]', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
          {
            label: 'Add',
            edits: [{ text: 'impl ink::env::Environment for ', isSnippet: true, startPos: [1, 0], endPos: [1, 0] }],
          },
        ],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- pub struct Erc20',
        edits: [{ text: '', startPos: [7, 4], endPos: [7, 19] }],
        params: { startPos: [9, 4], endPos: [9, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [9, 4], endPos: [9, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [9, 4], endPos: [9, 4] }] },
        ],
      },
      {
        name: 'anonymous <- #[ink(event)]',
        params: { startPos: [20, 4], endPos: [20, 4] },
        results: [{ label: 'Add', edits: [{ text: ', anonymous', startPos: [20, 15], endPos: [20, 15] }] }],
      },
      {
        name: '#[ink(event)]|#[ink(anonymous)]',
        edits: [{ text: '#[ink(event)]\n    #[ink(anonymous)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [22, 4], endPos: [22, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(event, anonymous)]', startPos: [20, 4], endPos: [20, 17] }] },
          { label: 'Add', edits: [{ text: '#[ink(topic)]', isSnippet: true, startPos: [27, 23], endPos: [27, 23] }] },
        ],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- pub struct Transfer',
        edits: [{ text: '', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [21, 4], endPos: [21, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [21, 4], endPos: [21, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [21, 4], endPos: [21, 4] }] },
        ],
      },
      {
        name: '`mod` level empty line',
        // i.e. empty line between `Erc20` storage struct and `Transfer` event struct.
        params: { startPos: [18, 0], endPos: [18, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', isSnippet: true, startPos: [18, 0], endPos: [18, 0] }] },
        ],
      },
      {
        name: 'impl Erc20 {',
        params: { startPos: [53, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(impl)]', startPos: [53, 4], endPos: [53, 4] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink(namespace="${1:my_namespace}")]', startPos: [53, 4], endPos: [53, 4] }],
          },
          {
            label: 'Add',
            edits: [{ text: '#[ink(constructor)]', isSnippet: true, startPos: [213, 9], endPos: [213, 9] }],
          },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [213, 9], endPos: [213, 9] }] },
        ],
      },
      {
        name: 'mod tests {',
        params: { startPos: [217, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::test]', isSnippet: true, startPos: [505, 9], endPos: [505, 9] }] },
        ],
      },
      {
        name: 'mod e2e_tests {',
        params: { startPos: [509, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::test]', isSnippet: true, startPos: [623, 9], endPos: [623, 9] }] },
          {
            label: 'Add',
            edits: [{ text: '#[ink_e2e::test]', isSnippet: true, startPos: [623, 9], endPos: [623, 9] }],
          },
        ],
      },
      {
        name: '(additional_contracts="$1"|environment=${1:ink::env::DefaultEnvironment}|keep_attr="$1") <- #[ink_e2e::test]',
        params: { startPos: [513, 8] },
        results: [
          { label: 'Add', edits: [{ text: '(additional_contracts="$1")', startPos: [513, 23], endPos: [513, 23] }] },
          {
            label: 'Add',
            edits: [
              { text: '(environment=${1:ink::env::DefaultEnvironment})', startPos: [513, 23], endPos: [513, 23] },
            ],
          },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [513, 23], endPos: [513, 23] }] },
        ],
      },
    ]),
  },
  {
    source: 'v5/events/event-def/src',
    testCases: [
      {
        name: '(anonymous|signature_topic) <- #[ink::event]',
        params: { startPos: [2, 0], endPos: [2, 0] },
        results: [
          { label: 'Add', edits: [{ text: '(anonymous)', startPos: [2, 12], endPos: [2, 12] }] },
          { label: 'Add', edits: [{ text: '(signature_topic="$1")', startPos: [2, 12], endPos: [2, 12] }] },
          { label: 'Extract', edits: [] },
        ],
      },
      {
        name: '#[ink::event(anonymous)]',
        edits: [{ text: '#[ink::event(anonymous)]', startPos: [2, 0], endPos: [2, 13] }],
        params: { startPos: [2, 0], endPos: [2, 0] },
        results: [{ label: 'Extract', edits: [] }],
      },
      {
        name: '#[ink::event(signature_topic="1111111111111111111111111111111111111111111111111111111111111111")]',
        edits: [
          {
            text: '#[ink::event(signature_topic="1111111111111111111111111111111111111111111111111111111111111111")]',
            startPos: [2, 0],
            endPos: [2, 13],
          },
        ],
        params: { startPos: [2, 0], endPos: [2, 0] },
        results: [{ label: 'Extract', edits: [] }],
      },
    ],
  },
  {
    source: 'v5/trait-erc20',
    testCases: TRAIT_ERC20_TESTS.concat([
      {
        name: '(keep_attr="$1"|namespace="${1:my_namespace}") <- #[ink::trait_definition]',
        params: { startPos: [3, 0], endPos: [3, 0] },
        results: [
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '(namespace="${1:my_namespace}")', startPos: [3, 23], endPos: [3, 23] }] },
        ],
      },
      {
        name: 'pub trait BaseErc20 {',
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '(namespace="${1:my_namespace}")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [33, 20], endPos: [33, 20] }] },
        ],
      },
      {
        name: 'missing method',
        edits: [{ text: '', startPos: [111, 8], endPos: [115, 9] }],
        params: { startPos: [110, 4], endPos: [110, 4] },
        results: [
          {
            label: 'Add',
            edits: [
              { text: 'fn total_supply(&self) -> Balance {', isSnippet: true, startPos: [194, 9], endPos: [194, 9] },
            ],
          },
          { label: 'Add', edits: [{ text: '#[ink(impl)]', startPos: [110, 4], endPos: [110, 4] }] },
        ],
      },
    ]),
  },
  {
    source: 'v4/trait-erc20',
    testCases: TRAIT_ERC20_TESTS.concat([
      {
        name: '(keep_attr="$1"|namespace="${1:my_namespace}") <- #[ink::trait_definition]',
        params: { startPos: [3, 0], endPos: [3, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '(namespace="${1:my_namespace}")', startPos: [3, 23], endPos: [3, 23] }] },
        ],
      },
      {
        name: 'pub trait BaseErc20 {',
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '(keep_attr="$1")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '(namespace="${1:my_namespace}")', startPos: [3, 23], endPos: [3, 23] }] },
          { label: 'Add', edits: [{ text: '#[ink(message)]', isSnippet: true, startPos: [33, 20], endPos: [33, 20] }] },
        ],
      },
      {
        name: 'missing method',
        edits: [{ text: '', startPos: [111, 8], endPos: [115, 9] }],
        params: { startPos: [110, 4], endPos: [110, 4] },
        results: [
          {
            label: 'Add',
            edits: [
              { text: 'fn total_supply(&self) -> Balance {', isSnippet: true, startPos: [192, 9], endPos: [192, 9] },
            ],
          },
          { label: 'Add', edits: [{ text: '#[ink(impl)]', startPos: [110, 4], endPos: [110, 4] }] },
        ],
      },
    ]),
  },
  {
    source: 'v5/psp22-extension',
    testCases: PSP22_CHAIN_EXTENSION_TESTS.concat([
      {
        name: '#[ink::chain_extension]',
        params: { startPos: [10, 0], endPos: [10, 0] },
        results: [],
      },
      {
        name: '#[ink::chain_extension]|#[ink::trait_definition] <- pub trait Psp22Extension',
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 39] }],
        params: { startPos: [11, 0], endPos: [11, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::chain_extension]', startPos: [11, 0], endPos: [11, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink::trait_definition]', startPos: [11, 0], endPos: [11, 0] }] },
        ],
      },
      {
        name: 'crate::CustomEnvironment <- self::CustomEnvironment',
        edits: [{ text: 'self::CustomEnvironment', startPos: [121, 22], endPos: [121, 46] }],
        params: { startPos: [121, 22], endPos: [121, 22] },
        results: [
          {
            label: 'Add',
            edits: [{ text: 'env=${1:crate::CustomEnvironment}', startPos: [121, 16], endPos: [121, 45] }],
          },
          { label: 'Add', edits: [{ text: ', keep_attr="$1"', startPos: [121, 45], endPos: [121, 45] }] },
        ],
      },
      {
        name: 'handle_status=${1:true} <- #[ink(function = 0x3d26)]',
        params: { startPos: [16, 4] },
        results: [
          { label: 'Add', edits: [{ text: ', handle_status=${1:true}', startPos: [16, 27], endPos: [16, 27] }] },
        ],
      },
      {
        name: '#[ink(function=${1:1}|handle_status=${1:true})] <- fn token_name(asset_id: u32)',
        edits: [{ text: '', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [17, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(function=${1:1})]', startPos: [17, 4], endPos: [17, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(handle_status=${1:true})]', startPos: [17, 4], endPos: [17, 4] }] },
        ],
      },
      {
        name: 'pub trait Psp22Extension {',
        params: { startPos: [11, 0], endPos: [11, 0] },
        results: [{ label: 'Add', edits: [{ text: '#[ink(function=${1:1})]', startPos: [76, 20], endPos: [76, 20] }] }],
      },
      {
        name: 'impl ink::env::Environment',
        edits: [{ text: '', startPos: [108, 0], endPos: [119, 1] }],
        params: { startPos: [106, 0], endPos: [106, 0] },
        results: [
          {
            label: 'Add',
            edits: [
              {
                text: 'impl ink::env::Environment for',
                isSnippet: true,
                startPos: [106, 29],
                endPos: [106, 29],
              },
            ],
          },
          { label: 'Add', edits: [{ text: 'Encode', startPos: [105, 28], endPos: [105, 28] }] },
          { label: 'Add', edits: [{ text: 'Decode', startPos: [105, 28], endPos: [105, 28] }] },
        ],
      },
      {
        name: 'Self::ErrorCode',
        edits: [{ text: 'core::result::Result<Vec<u8>, Self::ErrorCode>', startPos: [17, 36], endPos: [17, 51] }],
        params: { startPos: [17, 66], endPos: [17, 66] },
        results: [
          { label: 'Add', edits: [{ text: '${1:crate::Psp22Error}', startPos: [17, 66], endPos: [17, 81] }] },
          { label: 'Add', edits: [{ text: ', handle_status=${1:true}', startPos: [16, 27], endPos: [16, 27] }] },
        ],
      },
      {
        name: 'SCALE codec traits',
        edits: [{ text: '', startPos: [80, 0], endPos: [80, 46] }],
        params: { startPos: [81, 0], endPos: [81, 0] },
        results: [
          {
            label: 'Add',
            edits: [
              {
                text: '#[ink::scale_derive(${1:Encode}, ${2:Decode}, ${3:TypeInfo})]',
                startPos: [81, 0],
                endPos: [81, 0],
              },
            ],
          },
          { label: 'Add', edits: [{ text: '#[ink::scale_derive]', startPos: [81, 0], endPos: [81, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [81, 0], endPos: [81, 0] }] },
        ],
      },
    ]),
  },
  {
    source: 'v4/psp22-extension',
    testCases: PSP22_CHAIN_EXTENSION_TESTS.concat([
      {
        name: '#[ink::chain_extension]',
        params: { startPos: [10, 0], endPos: [10, 0] },
        results: [{ label: 'Migrate', edits: [] }],
      },
      {
        name: '#[ink::chain_extension]|#[ink::trait_definition] <- pub trait Psp22Extension',
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 23] }],
        params: { startPos: [11, 0], endPos: [11, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::chain_extension]', startPos: [11, 0], endPos: [11, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink::trait_definition]', startPos: [11, 0], endPos: [11, 0] }] },
        ],
      },
      {
        name: 'crate::CustomEnvironment <- self::CustomEnvironment',
        edits: [{ text: 'self::CustomEnvironment', startPos: [121, 22], endPos: [121, 46] }],
        params: { startPos: [121, 22], endPos: [121, 22] },
        results: [
          { label: 'Migrate', edits: [] },
          {
            label: 'Add',
            edits: [{ text: 'env=${1:crate::CustomEnvironment}', startPos: [121, 16], endPos: [121, 45] }],
          },
          { label: 'Add', edits: [{ text: ', keep_attr="$1"', startPos: [121, 45], endPos: [121, 45] }] },
        ],
      },
      {
        name: 'handle_status=${1:true} <- #[ink(extension = 0x3d26)]',
        params: { startPos: [16, 4] },
        results: [
          { label: 'Add', edits: [{ text: ', handle_status=${1:true}', startPos: [16, 28], endPos: [16, 28] }] },
        ],
      },
      {
        name: '#[ink(extension=${1:1}|handle_status=${1:true})] <- fn token_name(asset_id: u32)',
        edits: [{ text: '', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [17, 4] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink(extension=${1:1})]', startPos: [17, 4], endPos: [17, 4] }] },
          { label: 'Add', edits: [{ text: '#[ink(handle_status=${1:true})]', startPos: [17, 4], endPos: [17, 4] }] },
        ],
      },
      {
        name: 'pub trait Psp22Extension {',
        params: { startPos: [11, 0], endPos: [11, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '#[ink(extension=${1:1})]', startPos: [76, 20], endPos: [76, 20] }] },
        ],
      },
      {
        name: 'impl ink::env::Environment',
        edits: [{ text: '', startPos: [108, 0], endPos: [119, 1] }],
        params: { startPos: [106, 0], endPos: [106, 0] },
        results: [
          {
            label: 'Add',
            edits: [
              {
                text: 'impl ink::env::Environment for',
                isSnippet: true,
                startPos: [106, 29],
                endPos: [106, 29],
              },
            ],
          },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [106, 0], endPos: [106, 0] }] },
        ],
      },
      {
        name: 'Self::ErrorCode',
        edits: [{ text: 'core::result::Result<Vec<u8>, Self::ErrorCode>', startPos: [17, 36], endPos: [17, 51] }],
        params: { startPos: [17, 66], endPos: [17, 66] },
        results: [
          { label: 'Add', edits: [{ text: '${1:crate::Psp22Error}', startPos: [17, 66], endPos: [17, 81] }] },
          { label: 'Add', edits: [{ text: ', handle_status=${1:true}', startPos: [16, 28], endPos: [16, 28] }] },
        ],
      },
      {
        name: 'SCALE codec traits',
        edits: [{ text: '', startPos: [79, 0], endPos: [80, 58] }],
        params: { startPos: [80, 0], endPos: [80, 0] },
        results: [
          {
            label: 'Add',
            edits: [
              {
                text: '#[derive(${1:scale::Encode}, ${2:scale::Decode}, ${3:scale_info::TypeInfo})]',
                startPos: [80, 0],
                endPos: [80, 0],
              },
            ],
          },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [80, 0], endPos: [80, 0] }] },
        ],
      },
    ]),
  },
  {
    source: 'v5/non-packed-tuple-struct',
    testCases: [
      {
        name: '(derive=${1:true}) <- #[ink::storage_item]',
        params: { startPos: [2, 0], endPos: [2, 0] },
        results: [{ label: 'Add', edits: [{ text: '(derive=${1:true})', startPos: [2, 19], endPos: [2, 19] }] }],
      },
      {
        name: '#[ink::event|scale_derive|storage_item]|#[ink(anonymous|event|signature_topic|storage)] <- struct Contract(',
        edits: [{ text: '', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::event]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink::scale_derive]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(signature_topic="$1")]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [4, 0], endPos: [4, 0] }] },
        ],
      },
    ],
  },
  {
    source: 'v4/non-packed-tuple-struct',
    testCases: [
      {
        name: '(derive=${1:true}) <- #[ink::storage_item]',
        params: { startPos: [2, 0], endPos: [2, 0] },
        results: [
          { label: 'Migrate', edits: [] },
          { label: 'Add', edits: [{ text: '(derive=${1:true})', startPos: [2, 19], endPos: [2, 19] }] },
        ],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- struct Contract(',
        edits: [{ text: '', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { label: 'Add', edits: [{ text: '#[ink::storage_item]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(anonymous)]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(event)]', startPos: [4, 0], endPos: [4, 0] }] },
          { label: 'Add', edits: [{ text: '#[ink(storage)]', startPos: [4, 0], endPos: [4, 0] }] },
        ],
      },
    ],
  },
];

suite('Code Actions', function () {
  suiteSetup(async function () {
    // Activates the extension.
    await activateExtension();
  });

  // Iterates over all test case groups (see `ACTION_TESTS` doc and inline comments).
  for (const testGroup of ACTION_TESTS) {
    suite(testGroup.source, function () {
      const docUri = getDocumentUri(`${testGroup.source}/lib.rs`);
      let editor: vscode.TextEditor;
      let originalDoc: string;

      suiteSetup(async function () {
        // Creates an editor for the document at the beginning of each test group/suite.
        editor = await openDocument(docUri);
        // Backups the original document content (used for resetting the document content after each test case).
        originalDoc = editor.document.getText();
      });

      teardown(async function () {
        // Clears test case edits by setting the document's content the original source code after each test case.
        await setDocumentContent(editor, originalDoc);
      });

      // Iterates over all test cases.
      for (const testCase of testGroup.testCases) {
        test(testCase.name, async function () {
          // Applies test case modifications/edits (if any).
          if (testCase.edits?.length) {
            await applyTestEdits(editor, testCase.edits);
          }

          // Sets the selection range.
          const range = toRange(
            testCase.params?.startPos as [number, number],
            testCase.params?.endPos ?? testCase.params?.startPos,
          );

          // Triggers/computes code actions.
          const results = (await vscode.commands.executeCommand(
            'vscode.executeCodeActionProvider',
            docUri,
            range,
          )) as vscode.CodeAction[];

          // Verifies expected results.
          const expectedResults = testCase.results as Array<TestResultAction>;
          assert.equal(results.length, expectedResults.length);
          for (const [idx, expectedAction] of expectedResults.entries()) {
            const action = results[idx];
            const expectedEdits = expectedAction.edits;
            if (!action.edit) {
              assert.equal(expectedEdits.length, 0);
            } else {
              const workspaceEdit = action.edit;
              const edits = workspaceEdit.get(docUri);
              // `workspaceEdit.get` is unreliable for `SnippetTextEdit`s,
              // so we use the `Object.entries(workspaceEdit)` hack below instead of `edits.length`.
              // See below for details.
              assert.equal(Object.entries(workspaceEdit).length, expectedEdits.length);
              for (const [j, expectedItem] of expectedEdits.entries()) {
                const workspaceEdit = action.edit as vscode.WorkspaceEdit;
                const edit = edits[j];
                const expectedRange = toRange(expectedItem.startPos as [number, number], expectedItem.endPos);

                // Both `workspaceEdit.get(docUri)` and `workspaceEdit.entries()` don't return `SnippetTextEdit`s
                // instead returning undefined or empty lists for code actions that include `SnippetTextEdit`s.
                // At this time, no public API for `WorkspaceEdit` currently returns `SnippetTextEdit`s,
                // So when `workspaceEdit.get(docUri)` returns undefined
                // and the expected result contains a snippet (i.e. tab stop and/or placeholder),
                // we hack our way into obtaining a `SnippetTextEdit` object.
                if (!edit && (expectedItem.text.includes('$') || expectedItem.isSnippet)) {
                  const snippetObject = Object.entries(workspaceEdit)[j][1][0];
                  const snippetValue = snippetObject.edit.value as string;
                  const snippetRange = snippetObject.range as vscode.Range;
                  assertContainsText(snippetValue, expectedItem.text);
                  assert.deepEqual(snippetRange, expectedRange);
                } else {
                  assert.isObject(edit);
                  assertContainsText(edit.newText, expectedItem.text);
                  assert.deepEqual(edit.range, expectedRange);
                }
              }
            }
          }
        });
      }
    });
  }
});
