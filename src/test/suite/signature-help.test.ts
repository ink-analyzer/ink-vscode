import * as vscode from 'vscode';
import * as assert from 'assert';

import { activateExtension, applyTestEdits, getDocumentUri, openDocument, setDocumentContent } from './utils';
import { TestCase, TestGroup, TestResult } from './types';

// Describes a collection of signature help tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ERC20_TESTS: Array<TestCase> = [
  {
    name: 'env: impl Environment, keep_attr: &str',
    // Replaces `#[ink::contract]` with `#[ink::contract()]` in the source code.
    edits: [{ text: '#[ink::contract()]', startPos: [2, 0], endPos: [2, 17] }],
    // Sets the cursor position at the end of the `#[ink::contract(` substring.
    params: { startPos: [2, 16] },
    // Describes the expected signature help.
    results: [{ text: 'env: impl Environment, keep_attr: &str' }],
  },
  {
    name: 'storage',
    params: { startPos: [7, 10] },
    results: [{ text: 'storage' }],
  },
  {
    name: 'constructor, default, payable, selector: u32 | _',
    params: { startPos: [55, 14] },
    results: [{ text: 'constructor, default, payable, selector: u32 | _' }],
  },
  {
    name: '[] <- test',
    edits: [{ text: '#[ink::test()]', startPos: [271, 8], endPos: [271, 20] }],
    params: { startPos: [271, 20] },
    results: [],
  },
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
  {
    name: 'keep_attr: &str, namespace: &str',
    edits: [{ text: '#[ink::trait_definition()]', startPos: [3, 0], endPos: [3, 24] }],
    params: { startPos: [3, 24] },
    results: [{ text: 'keep_attr: &str, namespace: &str' }],
  },
];
const STORAGE_ITEMS_TESTS: Array<TestCase> = [
  {
    name: 'derive: bool',
    edits: [{ text: '#[ink::storage_item()]', startPos: [2, 0], endPos: [2, 20] }],
    params: { startPos: [2, 20] },
    results: [{ text: 'derive: bool' }],
  },
];
const SIGNATURE_HELP_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: 'event, anonymous, signature_topic: &str',
        params: { startPos: [20, 10] },
        results: [{ text: 'event, anonymous, signature_topic: &str' }],
      },
      {
        name: 'message, default, payable, selector: u32 | _ | @',
        params: { startPos: [73, 14] },
        results: [{ text: 'message, default, payable, selector: u32 | _ | @' }],
      },
      {
        name: 'backend: node | runtime_only, environment: impl Environment',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [{ text: 'backend: node | runtime_only, environment: impl Environment' }],
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS.concat([
      {
        name: 'event, anonymous',
        params: { startPos: [20, 10] },
        results: [{ text: 'event, anonymous' }],
      },
      {
        name: 'message, default, payable, selector: u32 | _',
        params: { startPos: [73, 14] },
        results: [{ text: 'message, default, payable, selector: u32 | _' }],
      },
      {
        name: 'additional_contracts: &str, environment: impl Environment, keep_attr: &str',
        edits: [{ text: '#[ink_e2e::test()]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [{ text: 'additional_contracts: &str, environment: impl Environment, keep_attr: &str' }],
      },
    ]),
  },
  {
    source: 'v5/events',
    testCases: [
      {
        name: '#[ink::event(anonymous)]',
        edits: [{ text: '#[ink::event(anonymous, )]', startPos: [2, 0], endPos: [2, 24] }],
        params: { startPos: [2, 24] },
        results: [{ text: 'anonymous, signature_topic: &str' }],
      },
      {
        name: 'anonymous, signature_topic: &str <- #[ink::event()]',
        edits: [{ text: '#[ink::event()]', startPos: [2, 0], endPos: [2, 24] }],
        params: { startPos: [2, 13] },
        results: [{ text: 'anonymous, signature_topic: &str' }],
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
        name: 'extension: u16 <- #[ink::chain_extension()]',
        edits: [{ text: '#[ink::chain_extension()]', startPos: [10, 0], endPos: [10, 39] }],
        params: { startPos: [10, 23] },
        results: [{ text: 'extension: u16' }],
      },
      {
        name: 'function: u16, handle_status: bool',
        params: { startPos: [16, 10] },
        results: [{ text: 'function: u16, handle_status: bool' }],
      },
    ],
  },
  {
    source: 'v4/psp22-extension',
    testCases: [
      {
        name: '#[ink::chain_extension()]',
        edits: [{ text: '#[ink::chain_extension()]', startPos: [10, 0], endPos: [10, 23] }],
        params: { startPos: [10, 23] },
        results: [],
      },
      {
        name: 'extension: u32, handle_status: bool',
        params: { startPos: [16, 10] },
        results: [{ text: 'extension: u32, handle_status: bool' }],
      },
    ],
  },
  {
    source: 'v5/non-packed-tuple-struct',
    testCases: STORAGE_ITEMS_TESTS,
  },
  {
    source: 'v4/non-packed-tuple-struct',
    testCases: STORAGE_ITEMS_TESTS,
  },
];

suite('Signature Help', function () {
  suiteSetup(async function () {
    // Activates the extension.
    await activateExtension();
  });

  // Iterates over all test case groups (see `SIGNATURE_HELP_TESTS` doc and inline comments).
  for (const testGroup of SIGNATURE_HELP_TESTS) {
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

          // Triggers/computes signature help.
          const result = (await vscode.commands.executeCommand(
            'vscode.executeSignatureHelpProvider',
            docUri,
            position,
          )) as vscode.SignatureHelp;

          // Verifies expected results.
          const expectedResults = testCase.results as Array<TestResult>;
          assert.equal(result?.signatures?.length ?? 0, expectedResults.length);
          expectedResults.forEach((expectedItem, i) => {
            const item = result.signatures[i];
            assert.equal(item.label, expectedItem.text);
          });
        });
      }
    });
  }
});
