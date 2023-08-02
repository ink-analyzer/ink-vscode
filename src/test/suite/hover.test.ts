import * as vscode from 'vscode';
import * as assert from 'assert';

import { applyTestEdits, getDocumentUri, openDocument, setDocumentContent } from './utils';
import { TestGroup, TestResult } from './types';

// Describes a collection of hover content tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const HOVER_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'erc20',
    // Defines test cases for the ink! entity file.
    testCases: [
      {
        name: '#[ink::contract]',
        // Makes no modifications.
        // Sets the cursor position inside `#[ink::contract]`.
        params: { startPos: [2, 8] },
        // Expects the hover content to contain the substring "`#[ink::contract]`".
        results: [{ text: '`#[ink::contract]`' }],
      },
      {
        name: '#[ink::contract(env = E: impl Environment)]',
        // Replaces `#[ink::contract]` with `#[ink::contract(env=MyEnvironment)]`.
        edits: [{ text: '#[ink::contract(env=MyEnvironment)]', startPos: [2, 0], endPos: [2, 17] }],
        // Sets the cursor position at the end of the `env` substring.
        params: { startPos: [2, 19] },
        // Expects the hover content to contain the substring "`#[ink::contract(env = E: impl Environment)]`".
        results: [{ text: '`#[ink::contract(env = E: impl Environment)]`' }],
      },
      {
        name: '#[ink::contract(keep_attr = N: string)]',
        edits: [{ text: '#[ink::contract(keep_attr="foo,bar")]', startPos: [2, 0], endPos: [2, 17] }],
        params: { startPos: [2, 25] },
        results: [{ text: '`#[ink::contract(keep_attr = N: string)]`' }],
      },
      {
        name: '#[ink(storage)]',
        params: { startPos: [7, 11] },
        results: [{ text: '`#[ink(storage)]`' }],
      },
      {
        name: '#[ink(event)]',
        params: { startPos: [20, 11] },
        results: [{ text: '`#[ink(event)]`' }],
      },
      {
        name: '#[ink(anonymous)]',
        edits: [{ text: '#[ink(event, anonymous)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 19] },
        results: [{ text: '`#[ink(anonymous)]`' }],
      },
      {
        name: '#[ink(constructor)]',
        params: { startPos: [55, 15] },
        results: [{ text: '`#[ink(constructor)]`' }],
      },
      {
        name: '#[ink(default)]',
        edits: [{ text: '#[ink(constructor, default)]', startPos: [55, 8], endPos: [55, 27] }],
        params: { startPos: [55, 29] },
        results: [{ text: '`#[ink(default)]`' }],
      },
      {
        name: '#[ink(message)]',
        params: { startPos: [73, 15] },
        results: [{ text: '`#[ink(message)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _)] <- #[ink(message, selector=_)]',
        edits: [{ text: '#[ink(message, selector=_)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _)] <- #[ink(message, selector=1)]',
        edits: [{ text: '#[ink(message, selector=1)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _)] <- #[ink(message, selector=0xA)]',
        edits: [{ text: '#[ink(message, selector=0xA)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _)]`' }],
      },
      {
        name: '#[ink::test]',
        params: { startPos: [271, 16] },
        results: [{ text: '`#[ink::test]`' }],
      },
    ],
  },

  {
    source: 'trait-flipper',
    testCases: [
      {
        name: '#[ink::trait_definition]',
        params: { startPos: [3, 8] },
        results: [{ text: '`#[ink::trait_definition]`' }],
      },
      {
        name: '#[ink::trait_definition(keep_attr = N: string)]',
        edits: [{ text: '#[ink::trait_definition(keep_attr="foo,bar")]', startPos: [3, 0], endPos: [3, 24] }],
        params: { startPos: [3, 26] },
        results: [{ text: '`#[ink::trait_definition(keep_attr = N: string)]`' }],
      },
      {
        name: '#[ink::trait_definition(namespace = N: string)]',
        edits: [{ text: '#[ink::trait_definition(namespace="my_namespace")]', startPos: [3, 0], endPos: [3, 24] }],
        params: { startPos: [3, 26] },
        results: [{ text: '`#[ink::trait_definition(namespace = N: string)]`' }],
      },
    ],
  },
  {
    source: 'psp22-extension',
    testCases: [
      {
        name: '#[ink::chain_extension]',
        params: { startPos: [10, 8] },
        results: [{ text: '`#[ink::chain_extension]`' }],
      },
      {
        name: '#[ink(extension = N: u32)]',
        params: { startPos: [16, 11] },
        results: [{ text: '`#[ink(extension = N: u32)]`' }],
      },
      {
        name: '#[ink(handle_status = flag: bool)]',
        edits: [{ text: '#[ink(extension = 0x3d26, handle_status=true)]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 32] },
        results: [{ text: '`#[ink(handle_status = flag: bool)]`' }],
      },
    ],
  },
  {
    source: 'non-packed-tuple-struct',
    testCases: [
      {
        name: '#[ink::storage_item]',
        params: { startPos: [8, 8] },
        results: [{ text: '`#[ink::storage_item]`' }],
      },
      {
        name: '#[ink::storage_item(derive = flag: bool)]',
        edits: [{ text: '#[ink::storage_item(derive=false)]', startPos: [8, 0], endPos: [8, 20] }],
        params: { startPos: [8, 22] },
        results: [{ text: '`#[ink::storage_item(derive = flag: bool)]`' }],
      },
    ],
  },
];

suite('Hover', () => {
  // Iterates over all test case groups (see `HOVER_TESTS` doc and inline comments).
  for (const testGroup of HOVER_TESTS) {
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

          // Sets the position.
          const position = new vscode.Position(
            testCase.params?.startPos[0] as number,
            testCase.params?.startPos[1] as number,
          );

          // Triggers/gets hover content.
          const results = (await vscode.commands.executeCommand(
            'vscode.executeHoverProvider',
            docUri,
            position,
          )) as vscode.Hover[];

          // Verifies expected results.
          const expectedResults = testCase.results as Array<TestResult>;
          expectedResults.forEach((expectedItem, i) => {
            const item = results[i];
            assert.equal(!!item.contents.length, !!expectedItem.text);
            if (expectedItem.text) {
              assert.ok(
                (item.contents as vscode.MarkdownString[])
                  .map((md) => md.value)
                  .join('\n')
                  .includes(expectedItem.text),
              );
            }
          });
        });
      }
    });
  }
});
