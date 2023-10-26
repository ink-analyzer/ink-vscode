import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { NEW_PROJECT_ACTIVATION_FILE } from './constants';

export function isRustAnalyzerEnabled() {
  return !!vscode.extensions.getExtension('rust-lang.rust-analyzer');
}

export function workspaceFsDir() {
  return vscode.workspace.workspaceFolders?.find((item) => item.uri.fsPath);
}

export function workspaceFsPath() {
  return workspaceFsDir()?.uri.fsPath;
}

export function workspaceFsDirName() {
  return workspaceFsDir()?.name;
}

export function isUninitializedProject() {
  const projectPath = workspaceFsPath();
  return !!(projectPath && fs.existsSync(path.join(projectPath, NEW_PROJECT_ACTIVATION_FILE)));
}
