import * as vscode from 'vscode';
import * as assert from 'assert';

import { applyTestEdits, getDocumentUri, openDocument, removeWhitespace, setDocumentContent } from './utils';
import { TestGroup, TestResult } from './types';

// Describes a collection of completions tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const COMPLETION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'erc20',
    // Defines test cases for the ink! entity file.
    testCases: [
      {
        name: 'ink::contract',
        // Replaces `#[ink::contract]` with `#[ink]` in the source code.
        edits: [{ text: '#[ink]', startPos: [2, 0], endPos: [2, 17] }],
        // Sets the cursor position at the end of the `#[ink` substring.
        params: { startPos: [2, 5] },
        // Describes the expected completions.
        results: [{ text: 'ink::contract' }],
      },
      {
        name: 'env=|keep_attr=',
        edits: [{ text: '#[ink::contract()]', startPos: [2, 0], endPos: [2, 17] }],
        params: { startPos: [2, 16] },
        results: [{ text: 'env=' }, { text: 'keep_attr=' }],
      },
      {
        name: 'storage',
        edits: [{ text: '#[ink(s)]', startPos: [7, 4], endPos: [7, 19] }],
        params: { startPos: [7, 11] },
        results: [{ text: 'storage' }],
      },
      {
        name: 'anonymous',
        edits: [{ text: '#[ink(event,)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 16] },
        results: [{ text: 'anonymous' }],
      },
      {
        name: 'constructor',
        edits: [{ text: '#[ink(con)]', startPos: [55, 8], endPos: [55, 27] }],
        params: { startPos: [55, 17] },
        results: [{ text: 'constructor' }],
      },
      {
        name: 'constructor -> default|payable|selector=',
        edits: [{ text: '#[ink(constructor,)]', startPos: [55, 8], endPos: [55, 27] }],
        params: { startPos: [55, 26] },
        results: [{ text: 'default' }, { text: 'payable' }, { text: 'selector=' }],
      },
      {
        name: 'message',
        edits: [{ text: '#[ink(me)]', startPos: [73, 8], endPos: [73, 23] }],
        params: { startPos: [73, 16] },
        results: [{ text: 'message' }],
      },
      {
        name: 'message -> default|payable|selector=',
        edits: [{ text: '#[ink(message,)]', startPos: [73, 8], endPos: [73, 23] }],
        params: { startPos: [73, 22] },
        results: [{ text: 'default' }, { text: 'payable' }, { text: 'selector=' }],
      },
      {
        name: 'test',
        edits: [{ text: '#[ink::te]', startPos: [271, 8], endPos: [271, 20] }],
        params: { startPos: [271, 17] },
        results: [{ text: 'test' }],
      },
    ],
  },
  {
    source: 'trait-flipper',
    testCases: [
      {
        name: 'trait_definition',
        edits: [{ text: '#[ink::tr]', startPos: [3, 0], endPos: [3, 24] }],
        params: { startPos: [3, 9] },
        results: [{ text: 'trait_definition' }],
      },
      {
        name: 'keep_attr=|namespace=',
        edits: [{ text: '#[ink::trait_definition()]', startPos: [3, 0], endPos: [73, 24] }],
        params: { startPos: [3, 24] },
        results: [{ text: 'keep_attr=' }, { text: 'namespace=' }],
      },
    ],
  },
  {
    source: 'psp22-extension',
    testCases: [
      {
        name: 'ink::chain_extension|ink::trait_definition',
        edits: [{ text: '#[ink]', startPos: [10, 0], endPos: [10, 23] }],
        params: { startPos: [10, 5] },
        results: [{ text: 'ink::chain_extension' }, { text: 'ink::trait_definition' }],
      },
      {
        name: '#[ink::chain_extension()]',
        edits: [{ text: '#[ink::chain_extension()]', startPos: [10, 0], endPos: [10, 23] }],
        params: { startPos: [10, 23] },
        results: [],
      },
      {
        name: 'extension=|handle_status=',
        edits: [{ text: '#[ink()]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 10] },
        results: [{ text: 'extension=' }, { text: 'handle_status=' }],
      },
      {
        name: 'handle_status=',
        edits: [{ text: '#[ink(extension = 0x3d26,)]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 29] },
        results: [{ text: 'handle_status=' }],
      },
    ],
  },
  {
    source: 'non-packed-tuple-struct',
    testCases: [
      {
        name: 'ink::storage_item',
        edits: [{ text: '#[ink]', startPos: [8, 0], endPos: [8, 20] }],
        params: { startPos: [8, 5] },
        results: [{ text: 'ink::storage_item' }],
      },
      {
        name: 'derive=',
        edits: [{ text: '#[ink::storage_item()]', startPos: [8, 0], endPos: [8, 20] }],
        params: { startPos: [8, 20] },
        results: [{ text: 'derive=' }],
      },
    ],
  },
];

suite('Completions', () => {
  // Iterates over all test case groups (see `COMPLETION_TESTS` doc and inline comments).
  for (const testGroup of COMPLETION_TESTS) {
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

          // Triggers/computes completions.
          const results = (await vscode.commands.executeCommand(
            'vscode.executeCompletionItemProvider',
            docUri,
            position,
          )) as vscode.CompletionList;

          // Verifies expected results.
          const expectedResults = {
            items: (testCase.results as Array<TestResult>).map((item) => ({
              label: item.text,
              kind: vscode.CompletionItemKind.Function,
            })),
          } as vscode.CompletionList;
          assert.equal(results.items.length, expectedResults.items.length);
          expectedResults.items.forEach((expectedItem, i) => {
            const item = results.items[i];
            assert.equal(removeWhitespace(item.label as string), removeWhitespace(expectedItem.label as string));
            assert.equal(item.kind, expectedItem.kind);
          });
        });
      }
    });
  }
});
