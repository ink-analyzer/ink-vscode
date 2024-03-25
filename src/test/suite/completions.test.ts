import * as vscode from 'vscode';
import * as assert from 'assert';

import {
  activateExtension,
  applyTestEdits,
  getDocumentUri,
  openDocument,
  removeWhitespace,
  setDocumentContent,
} from './utils';
import { TestCase, TestGroup, TestResult } from './types';

// Describes a collection of completions tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ERC20_TESTS: Array<TestCase> = [
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
    name: 'env=ink::env::DefaultEnvironment|keep_attr=""',
    edits: [{ text: '#[ink::contract()]', startPos: [2, 0], endPos: [2, 17] }],
    params: { startPos: [2, 16] },
    results: [{ text: 'env=ink::env::DefaultEnvironment' }, { text: 'keep_attr=""' }],
  },
  {
    name: 'storage',
    edits: [{ text: '#[ink(st)]', startPos: [7, 4], endPos: [7, 19] }],
    params: { startPos: [7, 12] },
    results: [{ text: 'storage' }],
  },
  {
    name: 'constructor',
    edits: [{ text: '#[ink(con)]', startPos: [55, 8], endPos: [55, 27] }],
    params: { startPos: [55, 17] },
    results: [{ text: 'constructor' }],
  },
  {
    name: 'constructor -> default|payable|selector=1',
    edits: [{ text: '#[ink(constructor,)]', startPos: [55, 8], endPos: [55, 27] }],
    params: { startPos: [55, 26] },
    results: [{ text: 'default' }, { text: 'payable' }, { text: 'selector=1' }],
  },
  {
    name: 'message',
    edits: [{ text: '#[ink(me)]', startPos: [73, 8], endPos: [73, 23] }],
    params: { startPos: [73, 16] },
    results: [{ text: 'message' }],
  },
  {
    name: 'message -> default|payable|selector=1',
    edits: [{ text: '#[ink(message,)]', startPos: [73, 8], endPos: [73, 23] }],
    params: { startPos: [73, 22] },
    results: [{ text: 'default' }, { text: 'payable' }, { text: 'selector=1' }],
  },
  {
    name: 'ink_e2e::test',
    edits: [{ text: '#[ink_e2e::te]', startPos: [513, 8], endPos: [513, 24] }],
    params: { startPos: [513, 21] },
    results: [{ text: 'test' }],
  },
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
  {
    name: 'trait_definition',
    edits: [{ text: '#[ink::tr]', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [3, 9] },
    results: [{ text: 'trait_definition' }],
  },
  {
    name: 'keep_attr=""|namespace="my_namespace"',
    edits: [{ text: '#[ink::trait_definition()]', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [3, 24] },
    results: [{ text: 'keep_attr=""' }, { text: 'namespace="my_namespace"' }],
  },
];
const COMPLETION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: 'anonymous|signature_topic=""',
        edits: [{ text: '#[ink(event,)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 16] },
        results: [{ text: 'anonymous' }, { text: 'signature_topic=""' }],
      },
      {
        name: 'ink::test',
        edits: [{ text: '#[ink::te]', startPos: [276, 8], endPos: [276, 20] }],
        params: { startPos: [276, 17] },
        results: [{ text: 'test' }],
      },
      {
        name: 'backend(node)|environment=ink::env::DefaultEnvironment <- #[ink_e2e::test()]',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [{ text: 'backend(node)' }, { text: 'environment=ink::env::DefaultEnvironment' }],
      },
      {
        name: 'node|runtime_only <- #[ink_e2e::test(backend())]',
        edits: [{ text: '#[ink_e2e::test(backend())]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 32] },
        results: [{ text: 'node' }, { text: 'runtime_only' }],
      },
      {
        name: 'url="ws://127.0.0.1:9000" <- #[ink_e2e::test(backend(node()))]',
        edits: [{ text: '#[ink_e2e::test(backend(node()))]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 37] },
        results: [{ text: 'url="ws://127.0.0.1:9000"' }],
      },
      {
        name: 'sandbox=ink_e2e::MinimalSandbox <- #[ink_e2e::test(backend(runtime_only()))]',
        edits: [{ text: '#[ink_e2e::test(backend(runtime_only()))]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 45] },
        results: [{ text: 'sandbox=ink_e2e::MinimalSandbox' }],
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS.concat([
      {
        name: 'anonymous',
        edits: [{ text: '#[ink(event,)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 16] },
        results: [{ text: 'anonymous' }],
      },
      {
        name: 'ink::test',
        edits: [{ text: '#[ink::te]', startPos: [271, 8], endPos: [271, 20] }],
        params: { startPos: [271, 17] },
        results: [{ text: 'test' }],
      },
      {
        name: 'additional_contracts=""|environment=ink::env::DefaultEnvironment|keep_attr="" <- #[ink_e2e::test()]',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [
          { text: 'additional_contracts=""' },
          { text: 'environment=ink::env::DefaultEnvironment' },
          { text: 'keep_attr=""' },
        ],
      },
    ]),
  },
  {
    source: 'v5/events/event-def/src',
    testCases: [
      {
        name: 'anonymous|signature_topic=""',
        edits: [{ text: '#[ink::event()]', startPos: [2, 0], endPos: [20, 13] }],
        params: { startPos: [2, 13] },
        results: [{ text: 'anonymous' }, { text: 'signature_topic=""' }],
      },
      {
        name: '#[ink::event(anonymous)]',
        edits: [{ text: '#[ink::event(anonymous,)]', startPos: [2, 0], endPos: [20, 13] }],
        params: { startPos: [2, 23] },
        results: [],
      },
      {
        name: '#[ink::event(signature_topic="")]',
        edits: [{ text: '#[ink::event(signature_topic="",)]', startPos: [2, 0], endPos: [20, 13] }],
        params: { startPos: [2, 32] },
        results: [],
      },
    ],
  },
  {
    source: 'v5/trait-erc20',
    testCases: TRAIT_ERC20_TESTS,
  },
  {
    source: 'v4/trait-erc20',
    testCases: TRAIT_ERC20_TESTS,
  },
  {
    source: 'v5/psp22-extension',
    testCases: [
      {
        name: 'ink::chain_extension|ink::trait_definition',
        edits: [{ text: '#[ink]', startPos: [10, 0], endPos: [10, 39] }],
        params: { startPos: [10, 5] },
        results: [{ text: 'ink::chain_extension' }, { text: 'ink::trait_definition' }],
      },
      {
        name: '#[ink::chain_extension()]',
        edits: [{ text: '#[ink::chain_extension()]', startPos: [10, 0], endPos: [10, 39] }],
        params: { startPos: [10, 23] },
        results: [{ text: 'extension=1' }],
      },
      {
        name: 'function=1|handle_status=true',
        edits: [{ text: '#[ink()]', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [16, 10] },
        results: [{ text: 'function=1' }, { text: 'handle_status=true' }],
      },
      {
        name: 'handle_status=true',
        edits: [{ text: '#[ink(function = 0x3d26,)]', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [16, 28] },
        results: [{ text: 'handle_status=true' }],
      },
    ],
  },
  {
    source: 'v4/psp22-extension',
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
        name: 'extension=1|handle_status=true',
        edits: [{ text: '#[ink()]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 10] },
        results: [{ text: 'extension=1' }, { text: 'handle_status=true' }],
      },
      {
        name: 'handle_status=true',
        edits: [{ text: '#[ink(extension = 0x3d26,)]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 29] },
        results: [{ text: 'handle_status=true' }],
      },
    ],
  },
  {
    source: 'v5/non-packed-tuple-struct',
    testCases: [
      {
        name: 'ink::storage_item',
        edits: [{ text: '#[ink]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 5] },
        results: [{ text: 'ink::event' }, { text: 'ink::scale_derive' }, { text: 'ink::storage_item' }],
      },
      {
        name: 'derive=true',
        edits: [{ text: '#[ink::storage_item()]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 20] },
        results: [{ text: 'derive=true' }],
      },
    ],
  },
  {
    source: 'v4/non-packed-tuple-struct',
    testCases: [
      {
        name: 'ink::storage_item',
        edits: [{ text: '#[ink]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 5] },
        results: [{ text: 'ink::storage_item' }],
      },
      {
        name: 'derive=true',
        edits: [{ text: '#[ink::storage_item()]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 20] },
        results: [{ text: 'derive=true' }],
      },
    ],
  },
];

suite('Completions', function () {
  suiteSetup(async function () {
    // Activates the extension.
    await activateExtension();
  });

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
        test(testCase.name, async function () {
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
