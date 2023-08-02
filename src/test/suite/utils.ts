import * as vscode from 'vscode';
import * as path from 'path';
import { TestEdit } from './types';

// Opens a document and returns a `TextEditor` for manipulating it.
export async function openDocument(docUri: vscode.Uri) /*: Promise<vscode.TextEditor>*/ {
  const doc = await vscode.workspace.openTextDocument(docUri);
  return vscode.window.showTextDocument(doc);
}

// Returns the Uri for an ink! smart contract in the `test-fixtures` directory, given its relative path.
export function getDocumentUri(relativePath: string) {
  return vscode.Uri.file(path.resolve(__dirname, '../../../test-fixtures', relativePath));
}

// Replaces the contents of a document.
export async function setDocumentContent(editor: vscode.TextEditor, content: string): Promise<boolean> {
  const range = new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(editor.document.getText().length),
  );
  return editor.edit((build) => build.replace(range, content));
}

// Applies a list of `TestEdit`s to a document given its editor.
export async function applyTestEdits(editor: vscode.TextEditor, edits: Array<TestEdit>) {
  await editor.edit((builder) => {
    for (const edit of edits) {
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
    }
  });
}

// Removes whitespace from a string (e.g. to simplify text comparisons by ignoring whitespace formatting).
export function removeWhitespace(text: string) {
  return text
    .split('')
    .filter((char) => !/\s/.test(char))
    .join('');
}

// Blocks execution (sleeps) for `delay` ms.
// (useful for waiting for editor state to update e.g. waiting for diagnostic notifications after making document updates).
export async function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Returns a range, given a start position and an optional end position.
export function toRange(startPos: [number, number], endPos?: [number, number]) {
  const start = new vscode.Position(startPos[0], startPos[1]);
  const end = endPos ? new vscode.Position(endPos[0], endPos[1]) : start;
  return new vscode.Range(start, end);
}
