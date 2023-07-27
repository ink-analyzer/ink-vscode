import * as vscode from 'vscode';

// Parses snippet text (if any) into a vscode.SnippetString object (if possible).
// Ref: https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax
export function parseSnippet(snippet?: string): vscode.SnippetString | undefined {
  if (typeof snippet === 'string' && snippet !== '') {
    // ink! Analyzer only returns one tab stop or placeholder, so we only need to parse those (for now).
    // Ref: https://github.com/ink-analyzer/ink-analyzer/blob/analyzer-v0.7.1/crates/analyzer/src/analysis/utils.rs#L423-L435
    const matches = snippet?.match(
      /(?<prefix>[^$]*)\$(?:(?<tabstop>[0-9]+)|({(?<tabstop_alt>[0-9]+):(?<placeholder>[^}]+)}))(?<suffix>[\s\S]*)/m,
    );
    const parsedSnippet = matches?.groups;
    if (parsedSnippet && (parsedSnippet.tabstop || (parsedSnippet.tabstop_alt && parsedSnippet.placeholder))) {
      const normalizedTabStop = parsedSnippet.tabstop || parsedSnippet.tabstop_alt;
      const tabStop = normalizedTabStop ? parseInt(normalizedTabStop ?? '') : undefined;
      if (typeof tabStop === 'number') {
        const snippetString = new vscode.SnippetString();
        if (parsedSnippet.prefix) {
          snippetString.appendText(parsedSnippet.prefix);
        }
        if (tabStop) {
          if (parsedSnippet.placeholder) {
            snippetString.appendPlaceholder(parsedSnippet.placeholder, tabStop);
          } else {
            snippetString.appendTabstop(tabStop);
          }
        }
        if (parsedSnippet.suffix) {
          // Hack: VSCode auto inserts extra padding space after every new line for snippet edits (this behaviour can't be disabled).
          // So we strip any spaces after the last new line character (ink! Analyzer never adds more than one new line character) and let VSCode handle the formatting.
          // Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1255322331
          // Ref: https://github.com/microsoft/vscode/issues/145374#issuecomment-1258274787
          // Ref: https://github.com/microsoft/language-server-protocol/issues/724#issuecomment-631558796
          // Ref: https://github.com/ink-analyzer/ink-analyzer/blob/analyzer-v0.7.1/crates/analyzer/src/analysis/utils.rs#L457-L471
          const suffix = parsedSnippet.suffix.replace(/\n\s+$/, '\n');
          snippetString.appendText(suffix);
        }
        return snippetString;
      }
    }
  }

  return undefined;
}

export function isRustAnalyzerEnabled(): boolean {
  return !!vscode.extensions.getExtension('rust-lang.rust-analyzer');
}
