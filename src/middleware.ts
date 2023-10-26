import * as vscode from 'vscode';
import * as lsp_types from 'vscode-languageclient/node';

import * as snippets from './snippets';

// Code Actions middleware that adds support for snippets (tab stops and/or placeholders) in text edits returned by code actions.
// LSP (v3.17) only supports snippets in completions.
// Ref: https://github.com/microsoft/language-server-protocol/issues/592
// Ref: https://github.com/microsoft/language-server-protocol/issues/724
// NOTE: ink! Language Server doesn't support lazy code action resolution, so we don't have to implement that (for now).
// Ref: https://github.com/ink-analyzer/ink-analyzer/blob/lsp-server-v0.2.1/crates/lsp-server/src/initialize.rs#L75
export async function provideCodeActions(
  client: lsp_types.LanguageClient,
  document: vscode.TextDocument,
  range: vscode.Range,
  context: vscode.CodeActionContext,
  token: vscode.CancellationToken,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  _next: lsp_types.ProvideCodeActionsSignature,
): Promise<(vscode.Command | vscode.CodeAction)[] | null | undefined> {
  const params: lsp_types.CodeActionParams = {
    textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
    range: client.code2ProtocolConverter.asRange(range),
    context: await client.code2ProtocolConverter.asCodeActionContext(context, token),
  };
  return client
    .sendRequest(lsp_types.CodeActionRequest.type, params, token)
    .then((values): (vscode.CodeAction | vscode.Command)[] => {
      const results: (vscode.CodeAction | vscode.Command)[] = [];
      for (const item of values ?? []) {
        // No modifications needed for commands, we just forward them to VSCode.
        if (lsp_types.Command.is(item)) {
          results.push(client.protocol2CodeConverter.asCommand(item));
          continue;
        }

        const workspaceEdit = new vscode.WorkspaceEdit();
        // WorkspaceEdit.size doesn't count snippet edits for some reason, so we keep track of inserted edits ourselves.
        let hasEdits = false;
        // Iterates through all code action edits.
        for (const [id, edits] of Object.entries(item.edit?.changes ?? {})) {
          const uri = vscode.Uri.parse(id, true);
          const snippetEdits: (vscode.TextEdit | vscode.SnippetTextEdit)[] = [];
          // Parses all snippet edits or fallbacks to a normal text edit.
          for (const edit of edits) {
            // Retrieves snippet text (if any) from the data field.
            const snippetText = item.data?.snippets?.[edit.newText] ?? item.data?.snippet ?? '';
            const editRange = client.protocol2CodeConverter.asRange(edit.range);
            const parsedSnippet = snippetText
              ? snippets.parse(snippetText, snippets.createIndentingConfig(snippetText, document, editRange.start))
              : undefined;
            if (parsedSnippet) {
              // Create snippet edit.
              snippetEdits.push(new vscode.SnippetTextEdit(editRange, parsedSnippet as vscode.SnippetString));
            } else {
              // Fallback to a text edit if a snippet couldn't be parsed.
              snippetEdits.push(client.protocol2CodeConverter.asTextEdit(edit));
            }
          }

          // Set text edits (including snippets) for the workspace resource (if any).
          if (snippetEdits.length > 0) {
            workspaceEdit.set(uri, snippetEdits);
            hasEdits = true;
          }
        }

        // Create code actions for the text edits (if any).
        if (hasEdits) {
          const codeAction = new vscode.CodeAction(
            item.title,
            client.protocol2CodeConverter.asCodeActionKind(item.kind),
          );
          codeAction.edit = workspaceEdit;
          codeAction.isPreferred = item.isPreferred;
          results.push(codeAction);
        }
      }

      return results;
    });
}
