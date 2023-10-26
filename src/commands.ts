import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { NEW_PROJECT_ACTIVATION_FILE } from './constants';
import ExtensionManager from './manager';
import * as utils from './utils';

export function restartServer(manager: ExtensionManager) {
  return () => {
    manager.restart();
  };
}

export function stopServer(manager: ExtensionManager) {
  return () => {
    manager.stop();
  };
}

export function createProject() {
  return async () => {
    const workspaceDir = utils.workspaceFsPath();
    const workspaceParentUri = workspaceDir ? vscode.Uri.file(path.join(workspaceDir, '..')) : undefined;

    const folders = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      defaultUri: workspaceParentUri,
      openLabel: 'Select a parent folder for your ink! project',
    });

    const parentDir = folders?.[0].fsPath;
    if (!parentDir) {
      vscode.window.showErrorMessage('Failed to select parent folder.');
      return;
    }

    const defaultProjectName = 'hello_ink';
    const projectName = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: defaultProjectName,
      prompt: 'Enter a project name for your new ink! project',
      value: defaultProjectName,
      validateInput(value: string): string | undefined {
        // Ref: <https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field>.
        // Ref: <https://github.com/paritytech/cargo-contract/blob/v3.2.0/crates/build/src/new.rs#L34-L52>.
        if (!/^\p{L}[\p{L}\p{N}_-]*$/u.test(value)) {
          return 'ink! project names must begin with an alphabetic character, and only contain alphanumeric characters, underscores and hyphens';
        }
      },
    });
    if (!projectName) {
      vscode.window.showErrorMessage('Failed to create ink! project.');
      return;
    }

    const projectDir = path.join(parentDir as string, projectName as string);

    if (fs.existsSync(projectDir)) {
      vscode.window.showErrorMessage(`Can't overwrite an existing folder: "${projectDir}"`);
      return;
    }

    // Creates new project folder and adds placeholder file for activating the extension.
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, NEW_PROJECT_ACTIVATION_FILE), '');

    // Opens new project folder.
    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir));
  };
}
