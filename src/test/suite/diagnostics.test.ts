import * as vscode from 'vscode';
import * as assert from 'assert';

import { activateExtension, applyTestEdits, getDocumentUri, openDocument, setDocumentContent, sleep } from './utils';
import { TestCase, TestGroup } from './types';

// Describes a collection of diagnostics tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ERC20_TESTS: Array<TestCase> = [
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
    // Expects 10 diagnostic errors/warnings
    // (i.e 1 storage, 2 events, 1 constructor and 6 messages without a contract parent).
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
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
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
    // 6 messages without a trait definition nor impl parent.
    results: 6,
  },
  {
    name: 'no ink! message(s)',
    // Removes all `#[ink(message)]` annotations from the implementation.
    edits: [
      { text: '', startPos: [6, 4], endPos: [6, 19] },
      { text: '', startPos: [10, 4], endPos: [10, 19] },
      { text: '', startPos: [14, 4], endPos: [14, 19] },
      { text: '', startPos: [18, 4], endPos: [18, 19] },
      { text: '', startPos: [23, 4], endPos: [23, 19] },
      { text: '', startPos: [27, 4], endPos: [27, 19] },
    ],
    // 1 trait level "missing message(s)", 6 method level "not a message" errors.
    results: 7,
  },
];
const PSP22_CHAIN_EXTENSION_TESTS: Array<TestCase> = [
  {
    name: 'well defined chain extension',
    // Makes no modifications.
    // Expects no diagnostic errors/warnings.
    results: 0,
  },
  {
    name: 'missing `ErrorCode` type',
    edits: [{ text: '', startPos: [12, 4], endPos: [12, 32] }],
    // missing `ErrorCode` type.
    results: 1,
  },
];
const DIAGNOSTICS_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: 'conflicting `anonymous` and `signature_topic`',
        edits: [
          {
            text: '#[ink::event(anonymous, signature_topic="1111111111111111111111111111111111111111111111111111111111111111")]',
            startPos: [20, 4],
            endPos: [20, 17],
          },
        ],
        // conflicting `anonymous` and `signature_topic` arguments.
        results: 1,
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS,
  },
  {
    source: 'v5/events/event-def/src',
    testCases: [
      {
        name: 'well defined event 2.0',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'conflicting `anonymous` and `signature_topic`',
        edits: [
          {
            text: '#[ink::event(anonymous, signature_topic="1111111111111111111111111111111111111111111111111111111111111111")]',
            startPos: [2, 0],
            endPos: [2, 13],
          },
        ],
        // conflicting `anonymous` and `signature_topic` arguments.
        results: 1,
      },
    ],
  },
  {
    source: 'v5/wildcard-selector',
    testCases: [
      {
        name: 'well defined wildcard selectors',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
      {
        name: 'missing wildcard selector on message',
        edits: [
          {
            text: '',
            startPos: [18, 21],
            endPos: [18, 35],
          },
        ],
        // missing wildcard selector.
        results: 1,
      },
      {
        name: 'missing message with wildcard selector',
        edits: [
          {
            text: '',
            startPos: [17, 8],
            endPos: [27, 9],
          },
        ],
        // missing message with wildcard complement selector.
        results: 1,
      },
      {
        name: 'missing wildcard complement selector on message',
        edits: [
          {
            text: '',
            startPos: [30, 21],
            endPos: [30, 35],
          },
        ],
        // missing wildcard complement selector.
        results: 1,
      },
      {
        name: 'missing message with wildcard complement selector',
        edits: [
          {
            text: '',
            startPos: [29, 8],
            endPos: [33, 9],
          },
        ],
        // missing message with wildcard complement selector.
        results: 1,
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
    testCases: PSP22_CHAIN_EXTENSION_TESTS.concat([
      {
        name: 'missing `#[ink::chain_extension]`',
        // Removes `#[ink::chain_extension(extension = 13)]`.
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 39] }],
        // 11 extensions without a chain extension parent.
        results: 11,
      },
    ]),
  },
  {
    source: 'v4/psp22-extension',
    testCases: PSP22_CHAIN_EXTENSION_TESTS.concat([
      {
        name: 'missing `#[ink::chain_extension]`',
        // Removes `#[ink::chain_extension]`.
        edits: [{ text: '', startPos: [10, 0], endPos: [10, 23] }],
        // 11 extensions without a chain extension parent.
        results: 11,
      },
    ]),
  },
  {
    source: 'v5/non-packed-tuple-struct',
    testCases: [
      {
        name: 'well defined storage item',
        // Makes no modifications.
        // Expects no diagnostic errors/warnings.
        results: 0,
      },
    ],
  },
  {
    source: 'v4/non-packed-tuple-struct',
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
          // NOTE: Needed a max of about ~300ms on an AMD Ryzen 5900X CPU, so ~2x headroom seems reasonable :-).
          await sleep(1000);
          const results = vscode.languages.getDiagnostics(docUri);

          // Verifies expected results.
          const expectedResults = testCase.results as number;
          assert.equal(results.length, expectedResults);
        });
      }
    });
  }
});
