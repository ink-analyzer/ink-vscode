import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp_types from 'vscode-languageclient/node';

import { NEW_PROJECT_ACTIVATION_FILE } from './constants';
import ExtensionManager from './manager';
import * as utils from './utils';

export async function initializeProject(client: lsp_types.LanguageClient, manager: ExtensionManager) {
  if (!utils.isUninitializedProject()) {
    // Fail silently if the project is already initialized.
    return;
  }

  // Update status bar.
  manager.updateStatus('initializing');

  function notifyError() {
    // Notify user of failure.
    vscode.window.showErrorMessage('Failed to initialize ink! project.');
    manager.updateStatus('error', 'Failed to initialize ink! project.');
  }

  const projectName = utils.workspaceFsDirName();
  const projectPath = utils.workspaceFsPath();
  if (!projectName || !projectPath) {
    notifyError();
    return;
  }

  const params: lsp_types.ExecuteCommandParams = {
    command: 'createProject',
    arguments: [
      {
        name: projectName,
        root: vscode.Uri.file(projectPath).toString(),
      },
    ],
  };
  client.sendRequest(lsp_types.ExecuteCommandRequest.type, params).then(() => {
    // Update status bar.
    manager.updateStatus('started');

    // Delete placeholder activation file if request is successful.
    fs.unlinkSync(path.join(projectPath, NEW_PROJECT_ACTIVATION_FILE));

    // This is a hack to save the workspace edit that the language server sends in response to a successful request
    // (VS Code doesn't do this automatically).
    // Ref: https://github.com/microsoft/vscode-languageserver-node/issues/1272
    // Ref: https://github.com/microsoft/vscode-languageserver-node/pull/1273
    // FIXME: Remove this and intercept and save workspace edits in middleware when `middleware.workspace.handleApplyEdit` ships.
    // NOTE: Expected in `vscode-languageclient` version 9.0.2
    // Tracks creation of project files.
    let hasCreatedLib = false;
    let hasCreatedCargo = false;
    vscode.workspace.onDidCreateFiles((event) => {
      if (!hasCreatedLib || !hasCreatedCargo) {
        hasCreatedLib = hasCreatedLib || !!event.files.find((uri) => uri.path.endsWith('lib.rs'));
        hasCreatedCargo = hasCreatedCargo || !!event.files.find((uri) => uri.path.endsWith('Cargo.toml'));
      }
    });
    // Tracks updating of project files.
    let hasSavedLib = false;
    let hasSavedCargo = false;
    vscode.workspace.onDidChangeTextDocument((event) => {
      const isLib = event.document.uri.path.endsWith('lib.rs');
      const isCargo = !isLib && event.document.uri.path.endsWith('Cargo.toml');
      if ((isLib && hasCreatedLib && !hasSavedLib) || (isCargo && hasCreatedCargo && !hasSavedCargo)) {
        // Saves the document.
        event.document.save();

        // Updates state of project files.
        hasSavedLib = hasSavedLib || isLib;
        hasSavedCargo = hasSavedCargo || isCargo;
      }
    });
  }, notifyError);
}
