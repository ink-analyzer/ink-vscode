import * as vscode from 'vscode';

export function isRustAnalyzerEnabled(): boolean {
  return !!vscode.extensions.getExtension('rust-lang.rust-analyzer');
}
