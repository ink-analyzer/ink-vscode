import * as vscode from 'vscode';

import * as commands from './commands';
import { COMMANDS } from './constants';
import ExtensionManager from './manager';
import * as services from './services';
import * as utils from './utils';

let manager: ExtensionManager;

// Extension is activated.
export function activate(context: vscode.ExtensionContext) {
  // Creates an extension manager instance.
  manager = new ExtensionManager(context);

  // Initializes and starts the language client/server.
  manager.start();

  // Registers commands for the extension.
  manager
    // Restarts the language server.
    .registerCommand(COMMANDS.restart, commands.restartServer)
    // Stops the language server.
    .registerCommand(COMMANDS.stop, commands.stopServer)
    // Creates a new project.
    .registerCommand(COMMANDS.createProject, commands.createProject);

  // Initialize project (if necessary).
  if (utils.isUninitializedProject()) {
    manager.onStart(services.initializeProject);
  }
}

// Extension is deactivated.
export function deactivate() {
  if (!manager) {
    return undefined;
  }
  // Stops the language client/server.
  return manager.stop();
}
