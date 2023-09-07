import * as vscode from 'vscode';
import * as assert from 'assert';

import { activateExtension, applyTestEdits, getDocumentUri, openDocument, setDocumentContent, toRange } from './utils';
import { TestGroup, TestResult } from './types';

// Describes a collection of inlay hints tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ACTION_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'erc20',
    // Defines test cases for the ink! entity file.
    testCases: [
      {
        name: 'None',
        // Makes no modifications.
        // Sets the selection range to span the contents of the entire document.
        // NOTE: Omitting params would also work in this case.
        params: { startPos: [0, 0], endPos: [626, 0] },
        // Describes the expected inlay hints.
        results: [],
      },
      {
        name: '#[ink::contract(env: impl Environment = MyEnvironment, keep_attr: &str = "foo,bar")]',
        // Replaces `#[ink::contract]` with `#[ink::contract(env=MyEnvironment, keep_attr="foo,bar")]` in the source code.
        edits: [
          { text: '#[ink::contract(env=MyEnvironment, keep_attr="foo,bar")]', startPos: [2, 0], endPos: [2, 17] },
        ],
        // Omits the selection range thus implicitly selecting the entire document.
        // Describes the expected inlay hints.
        results: [
          { text: ': impl Environment', startPos: [2, 19] },
          { text: ': &str', startPos: [2, 44] },
        ],
      },
      {
        name: '#[ink(message, selector: u32 | _ = _)]',
        edits: [{ text: '#[ink(message, selector=_)]', startPos: [73, 8], endPos: [73, 23] }],
        results: [{ text: ': u32 | _', startPos: [73, 31] }],
      },
      {
        name: '#[ink_e2e::test(additional_contracts: &str = "adder/Cargo.toml flipper/Cargo.toml", environment: impl Environment = MyEnvironment, keep_attr: &str = "foo,bar")]',
        edits: [
          {
            text: '#[ink_e2e::test(additional_contracts="adder/Cargo.toml flipper/Cargo.toml", environment=MyEnvironment, keep_attr="foo,bar")]',
            startPos: [271, 8],
            endPos: [271, 20],
          },
        ],
        results: [
          { text: ': &str', startPos: [271, 44] },
          { text: ': impl Environment', startPos: [271, 95] },
          { text: ': &str', startPos: [271, 120] },
        ],
      },
    ],
  },
  {
    source: 'trait-flipper',
    testCases: [
      {
        name: 'None',
        results: [],
      },
      {
        name: '#[ink::trait_definition(namespace: &str = "my_namespace", keep_attr: &str = "foo,bar")]',
        edits: [
          {
            text: '#[ink::trait_definition(namespace="my_namespace", keep_attr="foo,bar")]',
            startPos: [3, 0],
            endPos: [3, 24],
          },
        ],
        results: [
          { text: ': &str', startPos: [3, 33] },
          { text: ': &str', startPos: [3, 59] },
        ],
      },
    ],
  },
  {
    source: 'psp22-extension',
    testCases: [
      {
        name: 'extension: u32 = ... | env: impl Environment =  = crate::CustomEnvironment | selector: u32 | _ = ...',
        results: [
          // extensions.
          { text: ': u32', startPos: [16, 19] },
          { text: ': u32', startPos: [19, 19] },
          { text: ': u32', startPos: [22, 19] },
          { text: ': u32', startPos: [27, 19] },
          { text: ': u32', startPos: [30, 19] },
          { text: ': u32', startPos: [33, 19] },
          { text: ': u32', startPos: [41, 19] },
          { text: ': u32', startPos: [46, 19] },
          { text: ': u32', startPos: [55, 19] },
          { text: ': u32', startPos: [63, 19] },
          { text: ': u32', startPos: [71, 19] },
          // contract `env`.
          { text: ': impl Environment', startPos: [121, 19] },
          // selectors.
          { text: ': u32 | _', startPos: [144, 31] },
          { text: ': u32 | _', startPos: [150, 31] },
          { text: ': u32 | _', startPos: [156, 31] },
          { text: ': u32 | _', startPos: [164, 31] },
          { text: ': u32 | _', startPos: [170, 31] },
          { text: ': u32 | _', startPos: [177, 31] },
          { text: ': u32 | _', startPos: [191, 31] },
          { text: ': u32 | _', startPos: [205, 31] },
          { text: ': u32 | _', startPos: [222, 31] },
          { text: ': u32 | _', startPos: [236, 31] },
          { text: ': u32 | _', startPos: [252, 31] },
        ],
      },
    ],
  },
  {
    source: 'non-packed-tuple-struct',
    testCases: [
      {
        name: 'None',
        results: [],
      },
      {
        name: '#[ink::storage_item(derive=false)]',
        edits: [{ text: '#[ink::storage_item(derive=false)]', startPos: [8, 0], endPos: [8, 20] }],
        results: [{ text: ': bool', startPos: [8, 26] }],
      },
    ],
  },
];

suite('Inlay Hints', function () {
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

          // Sets the selection range or default to selecting the entire document.
          const range = testCase.params
            ? toRange(
                testCase.params?.startPos as [number, number],
                testCase.params?.endPos ?? testCase.params?.startPos,
              )
            : new vscode.Range(
                editor.document.lineAt(0).range.start,
                editor.document.lineAt(editor.document.lineCount - 1).range.end,
              );

          // Triggers/computes inlay hints.
          const results = (await vscode.commands.executeCommand(
            'vscode.executeInlayHintProvider',
            docUri,
            range,
          )) as vscode.InlayHint[];

          // Verifies expected results.
          const expectedResults = testCase.results as Array<TestResult>;
          assert.equal(results.length, expectedResults.length);
          expectedResults.forEach((expectedItem, i) => {
            const item = results[i];
            assert.equal(item.label, expectedItem.text);
            assert.deepEqual(
              item.position,
              new vscode.Position(expectedItem.startPos?.[0] as number, expectedItem.startPos?.[1] as number),
            );
          });
        });
      }
    });
  }
});
