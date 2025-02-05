import * as vscode from 'vscode';
import * as assert from 'assert';

import { activateExtension, applyTestEdits, getDocumentUri, openDocument, setDocumentContent } from './utils';
import { TestCase, TestGroup, TestResult } from './types';

// Describes a collection of hover content tests to run against
// optionally modified ink! smart contract code in the `test-fixtures` directory in the project root.
const ERC20_TESTS: Array<TestCase> = [
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
    name: '#[ink_e2e::test(environment = E: impl Environment)]',
    edits: [{ text: '#[ink_e2e::test(environment=MyEnvironment)]', startPos: [513, 8], endPos: [513, 24] }],
    params: { startPos: [513, 24] },
    results: [{ text: '`#[ink_e2e::test(environment = E: impl Environment)]`' }],
  },
];
const TRAIT_ERC20_TESTS: Array<TestCase> = [
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
];
const STORAGE_ITEMS_TESTS: Array<TestCase> = [
  {
    name: '#[ink::storage_item]',
    params: { startPos: [2, 8] },
    results: [{ text: '`#[ink::storage_item]`' }],
  },
  {
    name: '#[ink::storage_item(derive = flag: bool)]',
    edits: [{ text: '#[ink::storage_item(derive=false)]', startPos: [2, 0], endPos: [2, 20] }],
    params: { startPos: [2, 22] },
    results: [{ text: '`#[ink::storage_item(derive = flag: bool)]`' }],
  },
];
const HOVER_TESTS: Array<TestGroup> = [
  {
    // Reads source code from the `v5/erc20/lib.rs` contract in `test-fixtures` directory.
    source: 'v5/erc20',
    // Defines test cases for the ink! entity file.
    testCases: ERC20_TESTS.concat([
      {
        name: '#[ink(selector = S: u32 | _ | @)] <- #[ink(message, selector=_)]',
        edits: [{ text: '#[ink(message, selector=_)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _ | @)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _ | @)] <- #[ink(message, selector=@)]',
        edits: [{ text: '#[ink(message, selector=@)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _ | @)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _ | @)] <- #[ink(message, selector=1)]',
        edits: [{ text: '#[ink(message, selector=1)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _ | @)]`' }],
      },
      {
        name: '#[ink(selector = S: u32 | _ | @)] <- #[ink(message, selector=0xA)]',
        edits: [{ text: '#[ink(message, selector=0xA)]', startPos: [73, 8], endPos: [73, 27] }],
        params: { startPos: [73, 25] },
        results: [{ text: '`#[ink(selector = S: u32 | _ | @)]`' }],
      },
      {
        name: '#[ink::test]',
        params: { startPos: [276, 16] },
        results: [{ text: '`#[ink::test]`' }],
      },
      {
        name: '#[ink_e2e::test]',
        params: { startPos: [520, 20] },
        results: [{ text: '`#[ink_e2e::test]`' }],
      },
      {
        name: '#[ink_e2e::test(backend(node|runtime_only))] <- backend',
        edits: [
          {
            text: '#[ink_e2e::test(backend(node))]',
            startPos: [520, 8],
            endPos: [520, 24],
          },
        ],
        params: { startPos: [520, 24] },
        results: [{ text: '`#[ink_e2e::test(backend(node|runtime_only))]`' }],
      },
      {
        name: '#[ink_e2e::test(backend(node|runtime_only))] <- node',
        edits: [
          {
            text: '#[ink_e2e::test(backend(node))]',
            startPos: [520, 8],
            endPos: [520, 24],
          },
        ],
        params: { startPos: [520, 32] },
        results: [{ text: '`#[ink_e2e::test(backend(node|runtime_only))]`' }],
      },
      {
        name: '#[ink_e2e::test(backend(node(url = U: string))]',
        edits: [
          {
            text: '#[ink_e2e::test(backend(node(url="ws://127.0.0.1:9000"))]',
            startPos: [520, 8],
            endPos: [520, 24],
          },
        ],
        params: { startPos: [520, 37] },
        results: [{ text: '`#[ink_e2e::test(backend(node(url = U: string))]`' }],
      },
      {
        name: '#[ink_e2e::test(backend(node|runtime_only))] <- runtime_only',
        edits: [
          {
            text: '#[ink_e2e::test(backend(runtime_only))]',
            startPos: [520, 8],
            endPos: [520, 24],
          },
        ],
        params: { startPos: [520, 32] },
        results: [{ text: '`#[ink_e2e::test(backend(node|runtime_only))]`' }],
      },
      {
        name: '#[ink_e2e::test(backend(runtime_only(sandbox = S: impl ink_sandbox::Sandbox))]',
        edits: [
          {
            text: '#[ink_e2e::test(backend(runtime_only(sandbox=ink_e2e::DefaultSandbox))]',
            startPos: [520, 8],
            endPos: [520, 24],
          },
        ],
        params: { startPos: [520, 45] },
        results: [{ text: '`#[ink_e2e::test(backend(runtime_only(sandbox = S: impl ink_sandbox::Sandbox))]`' }],
      },
      {
        name: '`additional_contracts` is deprecated',
        edits: [
          {
            text: '#[ink_e2e::test(additional_contracts="adder/Cargo.toml flipper/Cargo.toml")]',
            startPos: [513, 8],
            endPos: [513, 24],
          },
        ],
        params: { startPos: [513, 24] },
        results: [{ text: '`additional_contracts` is deprecated' }],
      },
      {
        name: '`keep_attr` for `ink_e2e::test` attribute macro is deprecated',
        edits: [{ text: '#[ink_e2e::test(keep_attr="foo,bar")]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [{ text: '`keep_attr` for `ink_e2e::test` attribute macro is deprecated' }],
      },
    ]),
  },
  {
    source: 'v4/erc20',
    testCases: ERC20_TESTS.concat([
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
      {
        name: '#[ink_e2e::test]',
        params: { startPos: [513, 20] },
        results: [{ text: '`#[ink_e2e::test]`' }],
      },
      {
        name: '#[ink_e2e::test(additional_contracts = S: string)]',
        edits: [
          {
            text: '#[ink_e2e::test(additional_contracts="adder/Cargo.toml flipper/Cargo.toml")]',
            startPos: [513, 8],
            endPos: [513, 24],
          },
        ],
        params: { startPos: [513, 24] },
        results: [{ text: '`#[ink_e2e::test(additional_contracts = S: string)]`' }],
      },
      {
        name: '#[ink_e2e::test(keep_attr = N: string)]',
        edits: [{ text: '#[ink_e2e::test(keep_attr="foo,bar")]', startPos: [513, 8], endPos: [513, 24] }],
        params: { startPos: [513, 24] },
        results: [{ text: '`#[ink_e2e::test(keep_attr = N: string)]`' }],
      },
    ]),
  },
  {
    source: 'v5/events',
    testCases: [
      {
        name: '#[ink::event]',
        params: { startPos: [2, 11] },
        results: [{ text: '`#[ink::event]`' }],
      },
      {
        name: '#[ink::event(anonymous)]',
        params: { startPos: [2, 14] },
        results: [{ text: '`#[ink::event(anonymous)]`' }],
      },
      {
        name: '#[ink::event(signature_topic = S: string)]',
        edits: [
          {
            text: '#[ink::event(signature_topic = "1111111111111111111111111111111111111111111111111111111111111111")]',
            startPos: [2, 0],
            endPos: [2, 24],
          },
        ],
        params: { startPos: [2, 14] },
        results: [{ text: '`#[ink::event(signature_topic = S: string)]`' }],
      },
      {
        name: '#[ink(signature_topic = S: string)]',
        params: { startPos: [23, 10] },
        results: [{ text: '`#[ink(signature_topic = S: string)]`' }],
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
        name: '#[ink::chain_extension]',
        params: { startPos: [10, 8] },
        results: [{ text: '`#[ink::chain_extension]`' }],
      },
      {
        name: '#[ink(function = N: u16)]',
        params: { startPos: [16, 11] },
        results: [{ text: '`#[ink(function = N: u16)]`' }],
      },
      {
        name: '#[ink(handle_status = flag: bool)]',
        edits: [{ text: '#[ink(function = 0x3d26, handle_status=true)]', startPos: [16, 4], endPos: [16, 29] }],
        params: { startPos: [16, 32] },
        results: [{ text: '`#[ink(handle_status = flag: bool)]`' }],
      },
    ],
  },
  {
    source: 'v4/psp22-extension',
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
    source: 'v5/non-packed-tuple-struct',
    testCases: STORAGE_ITEMS_TESTS,
  },
  {
    source: 'v4/non-packed-tuple-struct',
    testCases: STORAGE_ITEMS_TESTS,
  },
];

suite('Hover', function () {
  suiteSetup(async function () {
    // Activates the extension.
    await activateExtension();
  });

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
