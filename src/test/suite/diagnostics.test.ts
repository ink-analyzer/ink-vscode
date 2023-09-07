import * as vscode from 'vscode';
import * as assert from 'assert';

import { activateExtension, applyTestEdits, getDocumentUri, openDocument, setDocumentContent, sleep } from './utils';
import { TestGroup } from './types';

// Describes a collection of diagnostics tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const DIAGNOSTICS_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'erc20',
    // Defines test cases for the ink! entity file.
    testCases: [
      {
        name: 'well defined contract',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'missing `#[ink::contract]`',
        // Removes `#[ink::contract]`.
        edits: [{ text: '', startPos: [2, 0], endPos: [2, 17] }],
        // Expects 10 diagnostic errors/warnings (i.e 1 storage, 2 events, 1 constructor and 6 messages without a contract parent).
        results: 10,
      },
      {
        name: 'missing `#[ink(storage)]`',
        // Removes `#[ink(storage)]`.
        edits: [{ text: '', startPos: [7, 4], endPos: [7, 19] }],
        // missing storage.
        results: 1,
      },
      {
        name: 'no ink! constructor(s)',
        // Removes `#[ink(constructor)]`.
        edits: [{ text: '', startPos: [55, 8], endPos: [55, 27] }],
        // no constructor(s).
        results: 1,
      },
      {
        name: 'no ink! message(s)',
        // Removes all `#[ink(message)]` annotations.
        edits: [
          { text: '', startPos: [73, 8], endPos: [73, 23] },
          { text: '', startPos: [81, 8], endPos: [81, 23] },
          { text: '', startPos: [102, 8], endPos: [102, 23] },
          { text: '', startPos: [128, 8], endPos: [128, 23] },
          { text: '', startPos: [141, 8], endPos: [141, 23] },
          { text: '', startPos: [167, 8], endPos: [167, 23] },
        ],
        // no message(s).
        results: 1,
      },
    ],
  },
  {
    source: 'flipper',
    testCases: [
      {
        name: 'well defined contract',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'missing `#[ink::contract]`',
        // Removes `#[ink::contract]`.
        edits: [{ text: '', startPos: [2, 0], endPos: [2, 17] }],
        // 1 storage, 2 constructors and 2 messages without a contract parent.
        results: 5,
      },
      {
        name: 'missing `#[ink(storage)]`',
        // Removes `#[ink(storage)]`.
        edits: [{ text: '', startPos: [4, 4], endPos: [4, 19] }],
        // missing storage.
        results: 1,
      },
      {
        name: 'no ink! constructor(s)',
        // Removes all `#[ink(constructor)]` annotations.
        edits: [
          { text: '', startPos: [11, 8], endPos: [11, 27] },
          { text: '', startPos: [17, 8], endPos: [17, 27] },
        ],
        // no constructor(s).
        results: 1,
      },
      {
        name: 'no ink! message(s)',
        // Removes all `#[ink(message)]` annotations.
        edits: [
          { text: '', startPos: [23, 8], endPos: [23, 23] },
          { text: '', startPos: [29, 8], endPos: [29, 23] },
        ],
        // no message(s).
        results: 1,
      },
    ],
  },
  {
    source: 'trait-flipper',
    testCases: [
      {
        name: 'well defined trait definition',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'missing `#[ink::trait_definition]`',
        // Removes `#[ink::trait_definition]`.
        edits: [{ text: '', startPos: [3, 0], endPos: [3, 24] }],
        // 2 messages without a trait definition nor impl parent.
        results: 2,
      },
      {
        name: 'no ink! message(s)',
        // Removes all `#[ink(message)]` annotations.
        edits: [
          { text: '', startPos: [34, 8], endPos: [34, 23] },
          { text: '', startPos: [39, 8], endPos: [39, 23] },
        ],
        // 1 trait level "missing message(s)", 2 method level "not a message" errors,
        // however the 2 method level errors are silenced by VS Code since the trait level one covers their range.
        results: 1,
      },
    ],
  },
  {
    source: 'psp22-extension',
    testCases: [
      {
        name: 'well defined chain extension',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'missing `#[ink::chain_extension]`',
        // Removes `#[ink::chain_extension]`.
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 23] }],
        // 11 extensions without a chain extension parent.
        results: 11,
      },
      {
        name: 'missing `ErrorCode` type',
        edits: [{ text: '', startPos: [12, 4], endPos: [12, 32] }],
        // missing `ErrorCode` type.
        results: 1,
      },
    ],
  },
  {
    source: 'non-packed-tuple-struct',
    testCases: [
      {
        name: 'well defined storage item',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
    ],
  },
];

suite('Diagnostics', function () {
  suiteSetup(async function () {
    // Activates the extension.
    await activateExtension();
  });

  // Iterates over all test case groups (see `DIAGNOSTICS_TESTS` doc and inline comments).
  for (const testGroup of DIAGNOSTICS_TESTS) {
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

          // Gets diagnostics (blocks for 500ms to wait for diagnostic notifications from language server).
          // NOTE: Needed a max of about ~300ms on an AMD Ryzen 5900X CPU, so 60% headroom seems reasonable :-).
          await sleep(500);
          const results = vscode.languages.getDiagnostics(docUri);

          // Verifies expected results.
          const expectedResults = testCase.results as number;
          assert.equal(results.length, expectedResults);
        });
      }
    });
  }
});
