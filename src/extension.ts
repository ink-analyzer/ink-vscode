import * as vscode from 'vscode';

import ExtensionManager from './manager';
import * as commands from './commands';
import { COMMANDS } from './constants';

let manager: ExtensionManager;

// Extension is activated
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
    .registerCommand(COMMANDS.stop, commands.stopServer);
}

// Extension is deactivated
export function deactivate() {
  if (!manager) {
    return undefined;
  }
  // Stops the language client/server.
  return manager.stop();
}
