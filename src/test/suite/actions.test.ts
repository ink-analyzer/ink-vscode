import * as vscode from 'vscode';
import * as assert from 'assert';

import { applyTestEdits, getDocumentUri, openDocument, removeWhitespace, setDocumentContent, toRange } from './utils';
import { TestGroup, TestResult } from './types';

// Describes a collection of actions tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ACTION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'erc20',
    // Defines test cases for the ink! entity file.
    testCases: [
      {
        name: '(env=$1|keep_attr="$1") <- #[ink::contract]',
        // Makes no modifications.
        // Sets the selection range at the beginning of `#[ink::contract]`.
        params: { startPos: [2, 0], endPos: [2, 0] },
        // Describes the expected code actions.
        results: [
          { text: '(env=$1)', startPos: [2, 15], endPos: [2, 15] },
          { text: '(keep_attr="$1")', startPos: [2, 15], endPos: [2, 15] },
        ],
      },
      {
        name: '#[ink::contract]',
        // Removes `#[ink::contract]` from the source code.
        edits: [{ text: '', startPos: [2, 0], endPos: [2, 17] }],
        // Sets the selection range at the beginning of the `mod` declaration.
        params: { startPos: [3, 0], endPos: [3, 0] },
        // Describes the expected code actions.
        results: [{ text: '#[ink::contract]', startPos: [3, 0], endPos: [3, 0] }],
      },
      {
        name: '#[ink(storage)]',
        params: { startPos: [7, 4], endPos: [7, 4] },
        results: [],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- pub struct Erc20',
        edits: [{ text: '', startPos: [7, 4], endPos: [7, 19] }],
        params: { startPos: [9, 4], endPos: [9, 4] },
        results: [
          { text: '#[ink::storage_item]', startPos: [9, 4], endPos: [9, 4] },
          { text: '#[ink(anonymous)]', startPos: [9, 4], endPos: [9, 4] },
          { text: '#[ink(event)]', startPos: [9, 4], endPos: [9, 4] },
          { text: '#[ink(storage)]', startPos: [9, 4], endPos: [9, 4] },
        ],
      },
      {
        name: 'anonymous <- #[ink(event)]',
        params: { startPos: [20, 4], endPos: [20, 4] },
        results: [{ text: ', anonymous', startPos: [20, 15], endPos: [20, 15] }],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- pub struct Transfer',
        edits: [{ text: '', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [21, 4], endPos: [21, 4] },
        results: [
          { text: '#[ink::storage_item]', startPos: [21, 4], endPos: [21, 4] },
          { text: '#[ink(anonymous)]', startPos: [21, 4], endPos: [21, 4] },
          { text: '#[ink(event)]', startPos: [21, 4], endPos: [21, 4] },
          { text: '#[ink(storage)]', startPos: [21, 4], endPos: [21, 4] },
        ],
      },
      {
        name: 'default|payable|selector=$1 <- #[ink(constructor)]',
        params: { startPos: [55, 8] },
        results: [
          { text: ', default', startPos: [55, 25], endPos: [55, 25] },
          { text: ', payable', startPos: [55, 25], endPos: [55, 25] },
          { text: ', selector=${1:1}', startPos: [55, 25], endPos: [55, 25] },
        ],
      },
      {
        name: '#[ink::test]|#[ink(constructor|default|message|payable|selector=${1:1})] <- pub fn new(total_supply: Balance)',
        edits: [{ text: '', startPos: [55, 8], endPos: [55, 27] }],
        params: { startPos: [56, 8] },
        results: [
          { text: '#[ink::test]', startPos: [56, 8], endPos: [56, 8] },
          { text: '#[ink(constructor)]', startPos: [56, 8], endPos: [56, 8] },
          { text: '#[ink(default)]', startPos: [56, 8], endPos: [56, 8] },
          { text: '#[ink(message)]', startPos: [56, 8], endPos: [56, 8] },
          { text: '#[ink(payable)]', startPos: [56, 8], endPos: [56, 8] },
          { text: '#[ink(selector=${1:1})]', startPos: [56, 8], endPos: [56, 8] },
        ],
      },
      {
        name: 'default|payable|selector=$1 <- #[ink(message)]',
        params: { startPos: [73, 8] },
        results: [
          { text: ', default', startPos: [73, 21], endPos: [73, 21] },
          { text: ', payable', startPos: [73, 21], endPos: [73, 21] },
          { text: ', selector=${1:1}', startPos: [73, 21], endPos: [73, 21] },
        ],
      },
      {
        name: '#[ink::test]|#[ink(constructor|default|message|payable|selector=${1:1})] <- pub fn total_supply(&self)',
        edits: [{ text: '', startPos: [73, 8], endPos: [73, 23] }],
        params: { startPos: [74, 8] },
        results: [
          { text: '#[ink::test]', startPos: [74, 8], endPos: [74, 8] },
          { text: '#[ink(constructor)]', startPos: [74, 8], endPos: [74, 8] },
          { text: '#[ink(default)]', startPos: [74, 8], endPos: [74, 8] },
          { text: '#[ink(message)]', startPos: [74, 8], endPos: [74, 8] },
          { text: '#[ink(payable)]', startPos: [74, 8], endPos: [74, 8] },
          { text: '#[ink(selector=${1:1})]', startPos: [74, 8], endPos: [74, 8] },
        ],
      },
      {
        name: '#[ink::test]',
        params: { startPos: [271, 8] },
        results: [],
      },
    ],
  },
  {
    source: 'trait-flipper',
    testCases: [
      {
        name: '(keep_attr="$1"|namespace="${1:my_namespace}") <- #[ink::trait_definition]',
        params: { startPos: [3, 0], endPos: [3, 0] },
        results: [
          { text: '(keep_attr="$1")', startPos: [3, 23], endPos: [3, 23] },
          { text: '(namespace="${1:my_namespace}")', startPos: [3, 23], endPos: [3, 23] },
        ],
      },
      {
        name: '#[ink::chain_extension]|#[ink::trait_definition] <- pub trait BaseErc20',
        edits: [{ text: '', startPos: [3, 0], endPos: [3, 24] }],
        params: { startPos: [4, 0], endPos: [4, 0] },
        results: [
          { text: '#[ink::chain_extension]', startPos: [4, 0], endPos: [4, 0] },
          { text: '#[ink::trait_definition]', startPos: [4, 0], endPos: [4, 0] },
        ],
      },
    ],
  },
  {
    source: 'psp22-extension',
    testCases: [
      {
        name: '#[ink::chain_extension]',
        params: { startPos: [10, 0], endPos: [10, 0] },
        results: [],
      },
      {
        name: '#[ink::chain_extension]|#[ink::trait_definition] <- pub trait Psp22Extension',
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 23] }],
        params: { startPos: [11, 0], endPos: [11, 0] },
        results: [
          { text: '#[ink::chain_extension]', startPos: [11, 0], endPos: [11, 0] },
          { text: '#[ink::trait_definition]', startPos: [11, 0], endPos: [11, 0] },
        ],
      },
      {
        name: 'default|payable|selector=$1 <- #[ink(extension = 0x3d26)]',
        params: { startPos: [16, 28] },
        results: [{ text: ', handle_status=${1:true}', startPos: [16, 28], endPos: [16, 28] }],
      },
      {
        name: '#[ink::test]|#[ink(extension=${1:1}|handle_status=${1:true})] <- fn token_name(asset_id: u32)',
        edits: [{ text: '', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [17, 4] },
        results: [
          { text: '#[ink::test]', startPos: [17, 4], endPos: [17, 4] },
          { text: '#[ink(extension=${1:1})]', startPos: [17, 4], endPos: [17, 4] },
          { text: '#[ink(handle_status=${1:true})]', startPos: [17, 4], endPos: [17, 4] },
        ],
      },
    ],
  },
  {
    source: 'non-packed-tuple-struct',
    testCases: [
      {
        name: '(derive=${1:true}) <- #[ink::storage_item]',
        params: { startPos: [8, 0], endPos: [8, 0] },
        results: [{ text: '(derive=${1:true})', startPos: [8, 19], endPos: [8, 19] }],
      },
      {
        name: '#[ink::storage_item]|#[ink(anonymous|event|storage)] <- struct Contract(',
        edits: [{ text: '', startPos: [8, 0], endPos: [8, 20] }],
        params: { startPos: [10, 0], endPos: [10, 0] },
        results: [
          { text: '#[ink::storage_item]', startPos: [10, 0], endPos: [10, 0] },
          { text: '#[ink(anonymous)]', startPos: [10, 0], endPos: [10, 0] },
          { text: '#[ink(event)]', startPos: [10, 0], endPos: [10, 0] },
          { text: '#[ink(storage)]', startPos: [10, 0], endPos: [10, 0] },
        ],
      },
    ],
  },
];

suite('Code Actions', () => {
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
        test(testCase.name, async () => {
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
          const expectedResults = testCase.results as Array<TestResult>;
          assert.equal(results.length, expectedResults.length);
          expectedResults.forEach((expectedItem, i) => {
            const item = results[i];
            const workspaceEdit = item.edit as vscode.WorkspaceEdit;
            const edit = workspaceEdit.get(docUri)[0];
            const expectedRange = toRange(expectedItem.startPos as [number, number], expectedItem.endPos);

            // Both `workspaceEdit.get(docUri)` and `workspaceEdit.entries()` don't return `SnippetTextEdit`s
            // instead returning undefined or empty lists for code actions that include `SnippetTextEdit`s.
            // At this time, no public API for `WorkspaceEdit` currently returns `SnippetTextEdit`s,
            // So when `workspaceEdit.get(docUri)` returns undefined
            // and the expected result contains a snippet (i.e. tab stop and/or placeholder),
            // we hack our way into obtaining a `SnippetTextEdit` object.
            if (!edit && expectedItem.text.includes('$')) {
              const snippetObject = Object.entries(workspaceEdit)[0][1][0];
              const snippetValue = snippetObject.edit.value as string;
              const snippetRange = snippetObject.range as vscode.Range;
              assert.equal(removeWhitespace(snippetValue), removeWhitespace(expectedItem.text));
              assert.deepEqual(snippetRange, expectedRange);
            } else {
              assert.equal(removeWhitespace(edit.newText), removeWhitespace(expectedItem.text));
              assert.deepEqual(edit.range, expectedRange);
            }
          });
        });
      }
    });
  }
});
