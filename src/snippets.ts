import * as vscode from 'vscode';

// A snippet token.
export class SnippetToken {
  text?: string;
  tabStop?: number;
  type: SnippetTokenType;

  constructor(type: SnippetTokenType, text?: string, tabStop?: number) {
    this.text = text;
    this.tabStop = tabStop;
    this.type = type;
  }

  // Convenience method for creating a snippet `text` token.
  static asText(text: string) {
    return new SnippetToken('text', text, undefined);
  }

  // Convenience method for creating a snippet `tab stop` token.
  static asTabStop(index: number) {
    return new SnippetToken('tabStop', undefined, index);
  }

  // Convenience method for creating a snippet `placeholder` token.
  static asPlaceholder(text: string, index?: number) {
    return new SnippetToken('placeholder', text, index);
  }
}

export type SnippetTokenType = 'text' | 'tabStop' | 'placeholder';

// Tokenizes snippet text (if any) into a sequence of tokens of specific types (i.e. `text`, `tabStop` or `placeholder`)
// if and only if it has at least one tab stop or placeholder.
// Ref: https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax
export function tokenizeSnippet(snippet: string): SnippetToken[] {
  let snippetTokens: SnippetToken[] = [];
  if (snippet !== '') {
    // Finds a single tab stop or placeholder.
    // NOTE: We recurse on the suffix to make the tokenization exhaustive.
    const matches = snippet?.match(
      /(?<prefix>[^$]*)\$(?:(?<tabstop>[0-9]+)|({(?<tabstop_alt>[0-9]+):(?<placeholder>[^}]+)}))(?<suffix>[\s\S]*)/m,
    );
    const parsedSnippet = matches?.groups;
    if (parsedSnippet && (parsedSnippet.tabstop || (parsedSnippet.tabstop_alt && parsedSnippet.placeholder))) {
      const normalizedTabStop = parsedSnippet.tabstop || parsedSnippet.tabstop_alt;
      const tabStop = normalizedTabStop ? parseInt(normalizedTabStop ?? '') : undefined;
      if (typeof tabStop === 'number') {
        if (parsedSnippet.prefix) {
          snippetTokens.push(SnippetToken.asText(parsedSnippet.prefix));
        }
        if (tabStop) {
          if (parsedSnippet.placeholder) {
            snippetTokens.push(SnippetToken.asPlaceholder(parsedSnippet.placeholder, tabStop));
          } else {
            snippetTokens.push(SnippetToken.asTabStop(tabStop));
          }
        }
        if (parsedSnippet.suffix) {
          // Recurse on the suffix to find more tab stops and/or placeholders.
          const suffixSnippets = tokenizeSnippet(parsedSnippet.suffix);
          if (suffixSnippets.length) {
            snippetTokens = snippetTokens.concat(suffixSnippets);
          } else {
            // Adds suffix as a `text` token if it doesn't include any snippets.
            snippetTokens.push(SnippetToken.asText(parsedSnippet.suffix));
          }
        }
      }
    }
  }

  return snippetTokens;
}

// Parses snippet text (if any) into a `vscode.SnippetString` if and only if it has at least one tab stop or placeholder.
// Ref: https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax
export function parseSnippet(snippet: string): vscode.SnippetString | undefined {
  const tokens = tokenizeSnippet(snippet);
  if (tokens.length) {
    // Composes `vscode.SnippetString` from the parsed
    const snippet = new vscode.SnippetString();
    for (const token of tokens) {
      switch (token.type) {
        case 'tabStop': {
          snippet.appendTabstop(token.tabStop);
          break;
        }
        case 'placeholder': {
          snippet.appendPlaceholder(token.text ?? '', token.tabStop);
          break;
        }
        default: {
          // Hack: VSCode auto inserts extra spaces/indenting after every new line for snippet edits (this behaviour can't be disabled).
          // So we reduce indenting (i.e. tabs and spaces) by one level for all new lines and let VSCode handle the formatting/indenting.
          // Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1255322331
          // Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1258274787
          // Ref: https://github.com/microsoft/language-server-protocol/issues/724#issuecomment-631558796
          // Ref: https://github.com/ink-analyzer/ink-analyzer/blob/analyzer-v0.7.1/crates/analyzer/src/analysis/utils.rs#L457-L471
          snippet.appendText((token.text ?? '').replace(/\n([^\S\r\n\t]{4}|[^\S\r\n ])/g, '\n'));
          break;
        }
      }
    }

    return snippet;
  }

  return undefined;
}
