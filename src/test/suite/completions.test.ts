import * as vscode from 'vscode';
import * as assert from 'assert';

import {
  activateExtension,
  applyTestEdits,
  assertContainsText,
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
    results: [{ text: 'ink::contract', kind: vscode.CompletionItemKind.Field }],
  },
  {
    name: 'env=ink::env::DefaultEnvironment|keep_attr=""',
    edits: [{ text: '#[ink::contract()]', startPos: [2, 0], endPos: [2, 17] }],
    params: { startPos: [2, 16] },
    results: [
      { text: 'env=ink::env::DefaultEnvironment', kind: vscode.CompletionItemKind.Field },
      { text: 'keep_attr=""', kind: vscode.CompletionItemKind.Field },
    ],
  },
  {
    name: 'storage',
    edits: [{ text: '#[ink(st)]', startPos: [7, 4], endPos: [7, 19] }],
    params: { startPos: [7, 12] },
    results: [{ text: 'storage', kind: vscode.CompletionItemKind.Field }],
  },
  {
    name: 'constructor',
    edits: [{ text: '#[ink(con)]', startPos: [55, 8], endPos: [55, 27] }],
    params: { startPos: [55, 17] },
    results: [{ text: 'constructor', kind: vscode.CompletionItemKind.Field }],
  },
  {
    name: 'constructor -> default|payable|selector=1',
    edits: [{ text: '#[ink(constructor,)]', startPos: [55, 8], endPos: [55, 27] }],
    params: { startPos: [55, 26] },
    results: [
      { text: 'default', kind: vscode.CompletionItemKind.Field },
      { text: 'payable', kind: vscode.CompletionItemKind.Field },
      { text: 'selector=1', kind: vscode.CompletionItemKind.Field },
    ],
  },
  {
    name: 'message',
    edits: [{ text: '#[ink(me)]', startPos: [73, 8], endPos: [73, 23] }],
    params: { startPos: [73, 16] },
    results: [{ text: 'message', kind: vscode.CompletionItemKind.Field }],
  },
  {
    name: 'message -> default|payable|selector=1',
    edits: [{ text: '#[ink(message,)]', startPos: [73, 8], endPos: [73, 23] }],
    params: { startPos: [73, 22] },
    results: [
      { text: 'default', kind: vscode.CompletionItemKind.Field },
      { text: 'payable', kind: vscode.CompletionItemKind.Field },
      { text: 'selector=1', kind: vscode.CompletionItemKind.Field },
    ],
  },
  {
    name: 'ink_e2e::test',
    edits: [{ text: '#[ink_e2e::te]', startPos: [513, 8], endPos: [513, 24] }],
    params: { startPos: [513, 21] },
    results: [{ text: 'test', kind: vscode.CompletionItemKind.Field }],
  },
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
  {
    name: 'trait_definition',
    edits: [{ text: '#[ink::tr]', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [3, 9] },
    results: [{ text: 'trait_definition', kind: vscode.CompletionItemKind.Field }],
  },
  {
    name: 'keep_attr=""|namespace="my_namespace"',
    edits: [{ text: '#[ink::trait_definition()]', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [3, 24] },
    results: [
      { text: 'keep_attr=""', kind: vscode.CompletionItemKind.Field },
      { text: 'namespace="my_namespace"', kind: vscode.CompletionItemKind.Field },
    ],
  },
];
const COMPLETION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: 'root level entity completions',
        params: { startPos: [1, 0] },
        results: [
          // VS Code sorts entity completions alphabetically.
          { text: '#[ink::chain_extension(', isLabel: true, kind: vscode.CompletionItemKind.Class },
          { text: '#[ink::event]', isLabel: true, kind: vscode.CompletionItemKind.Struct },
          { text: 'Environment', isLabel: true, kind: vscode.CompletionItemKind.Enum }, // positioned by #[ink::scale_derive(TypeInfo)]
          { text: '#[ink::storage_item]', isLabel: true, kind: vscode.CompletionItemKind.Struct },
          { text: '#[ink::trait_definition]', isLabel: true, kind: vscode.CompletionItemKind.Class },
          { text: 'ink::combine_extensions!', isLabel: true, kind: vscode.CompletionItemKind.Struct },
        ],
      },
      {
        name: 'anonymous|signature_topic=""',
        edits: [{ text: '#[ink(event,)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 16] },
        results: [
          { text: 'anonymous', kind: vscode.CompletionItemKind.Field },
          { text: 'signature_topic=""', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: '`mod` level entity completions',
        params: { startPos: [18, 0] },
        results: [
          { text: '#[ink(event)]', isLabel: true, kind: vscode.CompletionItemKind.Struct },
          { text: '#[ink::event]', isLabel: true, kind: vscode.CompletionItemKind.Struct },
        ],
      },
      {
        name: '`struct` level entity completions',
        // Inserts new line at the end of the `Approval` event struct.
        edits: [{ text: '\n', startPos: [37, 23], endPos: [37, 23] }],
        params: { startPos: [38, 0] },
        results: [{ text: '#[ink(topic)]', isLabel: true, kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: '`impl` level entity completions',
        params: { startPos: [71, 0] },
        results: [
          { text: '#[ink(constructor)]', isLabel: true, kind: vscode.CompletionItemKind.Function },
          { text: '#[ink(message)]', isLabel: true, kind: vscode.CompletionItemKind.Function },
        ],
      },
      {
        name: 'ink::test',
        edits: [{ text: '#[ink::te]', startPos: [276, 8], endPos: [276, 20] }],
        params: { startPos: [276, 17] },
        results: [{ text: 'test', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'test `mod` level entity completions',
        params: { startPos: [228, 0] },
        results: [{ text: '#[ink::test]', isLabel: true, kind: vscode.CompletionItemKind.Function }],
      },
      {
        name: 'backend(node)|environment=ink::env::DefaultEnvironment <- #[ink_e2e::test()]',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [
          { text: 'backend(node)', kind: vscode.CompletionItemKind.Field },
          { text: 'environment=ink::env::DefaultEnvironment', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'node|runtime_only <- #[ink_e2e::test(backend())]',
        edits: [{ text: '#[ink_e2e::test(backend())]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 32] },
        results: [
          { text: 'node', kind: vscode.CompletionItemKind.Field },
          { text: 'runtime_only', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'url="ws://127.0.0.1:9000" <- #[ink_e2e::test(backend(node()))]',
        edits: [{ text: '#[ink_e2e::test(backend(node()))]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 37] },
        results: [{ text: 'url="ws://127.0.0.1:9000"', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'sandbox=ink_e2e::MinimalSandbox <- #[ink_e2e::test(backend(runtime_only()))]',
        edits: [{ text: '#[ink_e2e::test(backend(runtime_only()))]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 45] },
        results: [{ text: 'sandbox=ink_e2e::MinimalSandbox', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'e2e test `mod` level entity completions',
        params: { startPos: [519, 0] },
        results: [
          { text: '#[ink::test]', isLabel: true, kind: vscode.CompletionItemKind.Function },
          { text: '#[ink_e2e::test]', isLabel: true, kind: vscode.CompletionItemKind.Function },
        ],
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS.concat([
      {
        name: 'root level entity completions',
        params: { startPos: [1, 0] },
        results: [
          // VS Code sorts entity completions alphabetically.
          { text: 'Environment', isLabel: true, kind: vscode.CompletionItemKind.Enum }, // positioned by #[derive(scale_info::TypeInfo)]
          { text: '#[ink::chain_extension]', isLabel: true, kind: vscode.CompletionItemKind.Class },
          { text: '#[ink::storage_item]', isLabel: true, kind: vscode.CompletionItemKind.Struct },
          { text: '#[ink::trait_definition]', isLabel: true, kind: vscode.CompletionItemKind.Class },
        ],
      },
      {
        name: 'anonymous',
        edits: [{ text: '#[ink(event,)]', startPos: [20, 4], endPos: [20, 17] }],
        params: { startPos: [20, 16] },
        results: [{ text: 'anonymous', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: '`mod` level entity completions',
        params: { startPos: [18, 0] },
        results: [{ text: '#[ink(event)]', isLabel: true, kind: vscode.CompletionItemKind.Struct }],
      },
      {
        name: '`struct` level entity completions',
        // Inserts new line at the end of the `Approval` event struct.
        edits: [{ text: '\n', startPos: [37, 23], endPos: [37, 23] }],
        params: { startPos: [38, 0] },
        results: [{ text: '#[ink(topic)]', isLabel: true, kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: '`impl` level entity completions',
        params: { startPos: [71, 0] },
        results: [
          { text: '#[ink(constructor)]', isLabel: true, kind: vscode.CompletionItemKind.Function },
          { text: '#[ink(message)]', isLabel: true, kind: vscode.CompletionItemKind.Function },
        ],
      },
      {
        name: 'ink::test',
        edits: [{ text: '#[ink::te]', startPos: [271, 8], endPos: [271, 20] }],
        params: { startPos: [271, 17] },
        results: [{ text: 'test', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'test `mod` level entity completions',
        params: { startPos: [224, 0] },
        results: [{ text: '#[ink::test]', isLabel: true, kind: vscode.CompletionItemKind.Function }],
      },
      {
        name: 'additional_contracts=""|environment=ink::env::DefaultEnvironment|keep_attr="" <- #[ink_e2e::test()]',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [
          { text: 'additional_contracts=""', kind: vscode.CompletionItemKind.Field },
          { text: 'environment=ink::env::DefaultEnvironment', kind: vscode.CompletionItemKind.Field },
          { text: 'keep_attr=""', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'e2e test `mod` level entity completions',
        params: { startPos: [512, 0] },
        results: [
          { text: '#[ink::test]', isLabel: true, kind: vscode.CompletionItemKind.Function },
          { text: '#[ink_e2e::test]', isLabel: true, kind: vscode.CompletionItemKind.Function },
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
        results: [
          { text: 'anonymous', kind: vscode.CompletionItemKind.Field },
          { text: 'signature_topic=""', kind: vscode.CompletionItemKind.Field },
        ],
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
        results: [
          { text: 'ink::chain_extension', kind: vscode.CompletionItemKind.Field },
          { text: 'ink::trait_definition', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: '#[ink::chain_extension()]',
        edits: [{ text: '#[ink::chain_extension()]', startPos: [10, 0], endPos: [10, 39] }],
        params: { startPos: [10, 23] },
        results: [{ text: 'extension=1', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'function=1|handle_status=true',
        edits: [{ text: '#[ink()]', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [16, 10] },
        results: [
          { text: 'function=1', kind: vscode.CompletionItemKind.Field },
          { text: 'handle_status=true', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'handle_status=true',
        edits: [{ text: '#[ink(function = 0x3d26,)]', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [16, 28] },
        results: [{ text: 'handle_status=true', kind: vscode.CompletionItemKind.Field }],
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
        results: [
          { text: 'ink::chain_extension', kind: vscode.CompletionItemKind.Field },
          { text: 'ink::trait_definition', kind: vscode.CompletionItemKind.Field },
        ],
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
        results: [
          { text: 'extension=1', kind: vscode.CompletionItemKind.Field },
          { text: 'handle_status=true', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'handle_status=true',
        edits: [{ text: '#[ink(extension = 0x3d26,)]', startPos: [16, 4], endPos: [16, 30] }],
        params: { startPos: [16, 29] },
        results: [{ text: 'handle_status=true', kind: vscode.CompletionItemKind.Field }],
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
        results: [
          { text: 'ink::event', kind: vscode.CompletionItemKind.Field },
          { text: 'ink::scale_derive', kind: vscode.CompletionItemKind.Field },
          { text: 'ink::storage_item', kind: vscode.CompletionItemKind.Field },
        ],
      },
      {
        name: 'derive=true',
        edits: [{ text: '#[ink::storage_item()]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 20] },
        results: [{ text: 'derive=true', kind: vscode.CompletionItemKind.Field }],
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
        results: [{ text: 'ink::storage_item', kind: vscode.CompletionItemKind.Field }],
      },
      {
        name: 'derive=true',
        edits: [{ text: '#[ink::storage_item()]', startPos: [2, 0], endPos: [2, 20] }],
        params: { startPos: [2, 20] },
        results: [{ text: 'derive=true', kind: vscode.CompletionItemKind.Field }],
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
              kind: item.kind,
            })),
          } as vscode.CompletionList;
          assert.equal(results.items.length, expectedResults.items.length);
          expectedResults.items.forEach((expectedItem, i) => {
            const item = results.items[i];
            const isPartialLabel = (testCase.results as Array<TestResult>)[i].isLabel;
            if (isPartialLabel) {
              assertContainsText(item.label as string, expectedItem.label as string);
            } else {
              assert.equal(removeWhitespace(item.label as string), removeWhitespace(expectedItem.label as string));
            }
            assert.equal(item.kind, expectedItem.kind);
          });
        });
      }
    });
  }
});
