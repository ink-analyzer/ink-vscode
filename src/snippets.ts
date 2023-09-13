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
export function tokenize(snippet: string): SnippetToken[] {
  let snippetTokens: SnippetToken[] = [];
  if (snippet !== '') {
    // Finds a single tab stop or placeholder.
    // NOTE: We recurse on the suffix to make the tokenization exhaustive.
    const matches = snippet.match(
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
          const suffixSnippets = tokenize(parsedSnippet.suffix);
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
export function parse(text: string, indentingConfig?: IndentingConfig): vscode.SnippetString | undefined {
  const tokens = tokenize(text);
  if (tokens.length) {
    // Composes `vscode.SnippetString` from the parsed.
    const snippet = new vscode.SnippetString();

    // Parse indenting based on config.
    let indentPattern = undefined;
    let indentReplacement = undefined;
    if (indentingConfig?.reduce || indentingConfig?.removeAll) {
      const matches = text.match(/^\n*(?<indent>[^\S\r\n]+)/m);
      const indent = matches?.groups?.indent;
      if (indent) {
        indentPattern = new RegExp(`\n${indent}`, 'g');
        indentReplacement = indentingConfig?.removeAll ? '' : indent.replace(/^\s{4}|\t/, '');
      }
    }

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
          let text = token.text ?? '';
          if (text && (indentingConfig?.reduce || indentingConfig?.removeAll) && indentPattern) {
            // This is a hack to play nicely with VS Code whitespace "normalization" for snippet edits.
            // See doc for `createIndentingConfig` function below for details, rationale and references.
            text = text.replace(indentPattern, `\n${indentReplacement ?? ''}`);
          }
          snippet.appendText(text);
          break;
        }
      }
    }

    return snippet;
  }

  return undefined;
}

// Indenting config used by snippet parser.
type IndentingConfig = {
  // Reduce indenting by one-level.
  reduce: boolean;
  // Remove all top-level indenting.
  removeAll: boolean;
  // The character before the "insert" position.
  prevCharacter?: string;
};

// Determines whether, indenting/formatting for snippets needs to be "de-normalized" based on the snippet, text document and an insert position.
// "De-normalizing" of indenting/formatting is necessary because VS Code "normalizes" whitespace/indenting for snippet edits
// by auto inserting extra whitespace/indenting after new lines (this behaviour can't be disabled).
// So we remove either top-level or one level of indenting (i.e. tabs and spaces after new lines) on all lines,
// and let VSCode handle the indenting/formatting.
// Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1255322331
// Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1258274787
// Ref: https://github.com/microsoft/language-server-protocol/issues/724#issuecomment-631558796
export function createIndentingConfig(
  snippet: string,
  document: vscode.TextDocument,
  position: vscode.Position,
): IndentingConfig {
  if (position.character === 0) {
    return {
      reduce: false,
      removeAll: false,
      prevCharacter: position.line === 0 ? undefined : '\n',
    };
  }

  // Only suggest "de-normalization" (i.e reducing indenting) if we're inserting after whitespace, a comment,
  // a block (i.e. `}`) or a statement (i.e. `;`), or at the beginning a block
  // (i.e. after `{`) but only when the indenting is more than 1 level (i.e. 5 or more spaces or multiple tabs).
  // (VS Code doesn't seem to "normalize" whitespace except in the above cases).
  const prevCharacter = document.getText(new vscode.Range(position.translate(0, -1), position));
  const isAfterWhitespaceBlockOrStatement = /\s|}|;/.test(prevCharacter);
  const isAtBeginningOfBlock = prevCharacter === '{';
  const isMoreThanOneLevelIndented = /^\n*([^\S\r\n\t]{5,}|[^\S\r\n ]{2,})/g.test(snippet);
  // Determines if insert position is after a comment.
  // NOTE: works for rustdoc as well since '//' is a substring of '///'.
  const line = document.lineAt(position);
  const commentStart = line.text.indexOf('//');
  const isAfterComment = commentStart > -1 && position.character > commentStart;
  return {
    reduce: isAfterWhitespaceBlockOrStatement || isAfterComment || (isAtBeginningOfBlock && isMoreThanOneLevelIndented),
    removeAll: isAfterWhitespaceBlockOrStatement || isAfterComment,
    prevCharacter: prevCharacter,
  };
}
