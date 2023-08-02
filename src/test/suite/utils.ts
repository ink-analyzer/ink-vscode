import * as vscode from 'vscode';
import * as path from 'path';
import { TestEdit } from './types';

export async function openDocument(docUri: vscode.Uri) /*: Promise<vscode.TextEditor>*/ {
  const doc = await vscode.workspace.openTextDocument(docUri);
  return vscode.window.showTextDocument(doc);
}

export const getDocumentUri = (relativePath: string) => {
  return vscode.Uri.file(path.resolve(__dirname, '../../../test-fixtures', relativePath));
};

export async function setDocumentContent(editor: vscode.TextEditor, content: string): Promise<boolean> {
  const range = new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(editor.document.getText().length),
  );
  return editor.edit((build) => build.replace(range, content));
}

export async function applyTestEdits(editor: vscode.TextEditor, edits: Array<TestEdit>) {
  for (const edit of edits) {
    await editor.edit((builder) => {
      const startPos = new vscode.Position(edit.startPos[0], edit.startPos[1]);
      if (edit.endPos) {
        const endPos = new vscode.Position(edit.endPos[0], edit.endPos[1]);
        const range = new vscode.Range(startPos, endPos);
        if (edit.text) {
          builder.replace(range, edit.text);
        } else {
          builder.delete(range);
        }
      } else {
        builder.insert(startPos, edit.text);
      }
    });
  }
}

export function removeWhitespace(text: string) {
  return text
    .split('')
    .filter((char) => !/\s/.test(char))
    .join('');
}
