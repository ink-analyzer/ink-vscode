import * as assert from 'assert';

import { parseSnippet, SnippetToken, tokenizeSnippet } from '../../snippets';

const SNIPPET_TESTS: SnippetTest[] = [
  // Single tab stop and/or placeholder.
  { snippet: '$1', tokens: [SnippetToken.asTabStop(1)] },
  { snippet: 'selector=${1:1}', tokens: [SnippetToken.asText('selector='), SnippetToken.asPlaceholder('1', 1)] },
  {
    snippet: 'handle_status=${1:true}',
    tokens: [SnippetToken.asText('handle_status='), SnippetToken.asPlaceholder('true', 1)],
  },
  { snippet: 'env=${1:crate::}', tokens: [SnippetToken.asText('env='), SnippetToken.asPlaceholder('crate::', 1)] },
  {
    snippet: 'keep_attr="$1"',
    tokens: [SnippetToken.asText('keep_attr="'), SnippetToken.asTabStop(1), SnippetToken.asText('"')],
  },
  {
    snippet: 'namespace="${1:my_namespace}"',
    tokens: [
      SnippetToken.asText('namespace="'),
      SnippetToken.asPlaceholder('my_namespace', 1),
      SnippetToken.asText('"'),
    ],
  },

  // Multiple tab stops and/or placeholders.
  { snippet: '$1, $2', tokens: [SnippetToken.asTabStop(1), SnippetToken.asText(', '), SnippetToken.asTabStop(2)] },
  {
    snippet: 'extension=${1:1}, handle_status=${2:true}',
    tokens: [
      SnippetToken.asText('extension='),
      SnippetToken.asPlaceholder('1', 1),
      SnippetToken.asText(', handle_status='),
      SnippetToken.asPlaceholder('true', 2),
    ],
  },
  {
    snippet: 'env=${1:crate::}, keep_attr="$2"',
    tokens: [
      SnippetToken.asText('env='),
      SnippetToken.asPlaceholder('crate::', 1),
      SnippetToken.asText(', keep_attr="'),
      SnippetToken.asTabStop(2),
      SnippetToken.asText('"'),
    ],
  },
  {
    snippet: 'namespace="${1:my_namespace}", keep_attr="$2"',
    tokens: [
      SnippetToken.asText('namespace="'),
      SnippetToken.asPlaceholder('my_namespace', 1),
      SnippetToken.asText('", keep_attr="'),
      SnippetToken.asTabStop(2),
      SnippetToken.asText('"'),
    ],
  },

  // Multiple lines.
  // NOTE: `vscode.SnippetString` escapes closing curly brackets (i.e. `}` becomes `\}`)
  // so we have to account for that in normalized comparisons (by replacing `}` with `\\}`).
  // Ref: https://github.com/microsoft/vscode/blob/2aa8453e358ec38087102c653bc04387a2f94115/src/vs/workbench/api/common/extHostTypes.ts#L965-L967
  // NOTE: `utils.parseSnippet` also reduces indenting by one level on all new lines
  // (see inline docs at the call to `vscode.SnippetString.appendText` for rationale).
  // Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1255322331
  {
    snippet: '\n#[ink(storage)]\npub struct ${1:Storage} {\n    $2\n}\n\n',
    tokens: [
      SnippetToken.asText('\n#[ink(storage)]\npub struct '),
      SnippetToken.asPlaceholder('Storage', 1),
      SnippetToken.asText(' {\n    '),
      SnippetToken.asTabStop(2),
      SnippetToken.asText('\n}\n\n'),
    ],
    normalizedSnippet: '\n#[ink(storage)]\npub struct ${1:Storage} {\n$2\n\\}\n\n',
  },
  {
    snippet: '\n#[ink(constructor)]\npub fn ${1:new}() -> ${2:Self} {\n    ${3:todo!()}\n}\n\n',
    tokens: [
      SnippetToken.asText('\n#[ink(constructor)]\npub fn '),
      SnippetToken.asPlaceholder('new', 1),
      SnippetToken.asText('() -> '),
      SnippetToken.asPlaceholder('Self', 2),
      SnippetToken.asText(' {\n    '),
      SnippetToken.asPlaceholder('todo!()', 3),
      SnippetToken.asText('\n}\n\n'),
    ],
    normalizedSnippet: '\n#[ink(constructor)]\npub fn ${1:new}() -> ${2:Self} {\n${3:todo!()}\n\\}\n\n',
  },
];

type SnippetTest = {
  snippet: string;
  tokens: SnippetToken[];
  normalizedSnippet?: string;
};

suite('Snippet Parser', function () {
  for (const testCase of SNIPPET_TESTS) {
    test(testCase.snippet.replace(/\n/g, '\\n'), function () {
      // Verifies that the snippet tokenizer works.
      const tokens = tokenizeSnippet(testCase.snippet);
      assert.deepEqual(tokens, testCase.tokens);

      // Verifies that the snippet parser works.
      const result = parseSnippet(testCase.snippet);
      assert.equal(result?.value, testCase.normalizedSnippet ?? testCase.snippet);
    });
  }
});
