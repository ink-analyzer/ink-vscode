import * as os from 'os';
import * as vscode from 'vscode';
import * as lsp_types from 'vscode-languageclient/node';

import { COMMANDS, EXTENSION_ID } from './constants';
import * as middleware from './middleware';
import * as utils from './utils';

// Visual cue UX delay to let the users see that their clicks have an effect.
const VISUAL_CUE_DELAY = 100; // in ms.

// Global object for managing extension state.
export default class ExtensionManager {
  readonly context: vscode.ExtensionContext;
  private statusBar: vscode.StatusBarItem;
  private client?: lsp_types.LanguageClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subscriptions: ((client: lsp_types.LanguageClient, manager: ExtensionManager) => any)[] = [];

  private state: ExtensionState = {
    server: 'stopped',
    message: 'Click to start ink! Language Server.',
    rustAnalyzer: false,
    notifyRustAnalyzerEnable: true,
  };

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

    this.updateStatus('stopped');
  }

  updateStatus(status: ServerStatus, message?: string) {
    this.state = {
      ...this.state,
      server: status,
      message,
      rustAnalyzer: utils.isRustAnalyzerEnabled(),
    };
    this.updateUI();
  }

  // Initializes the language client (if it isn't already).
  private async initialize() {
    if (!this.client) {
      // Creates, configures and starts the language client/server.
      let serverPath;

      // Reads server path from settings (if set and exists).
      const config = vscode.workspace.getConfiguration(EXTENSION_ID);
      let configServerPath = config.get<string>('server.path');
      if (!!configServerPath) {
        if (configServerPath.startsWith('~/')) {
          configServerPath = configServerPath.replace(/^~/, os.homedir());
        }
        await vscode.workspace.fs.stat(vscode.Uri.parse(configServerPath)).then(
          () => {
            serverPath = configServerPath as string;
          },
          () => {
            //
          },
        );
      }

      // Sets the server path to the default bundled binary for the OS (if it exists).
      if (!serverPath) {
        const bundledServerPath = vscode.Uri.joinPath(
          this.context.extensionUri,
          'server',
          `ink-lsp-server${process.platform === 'win32' ? '.exe' : ''}`,
        );
        await vscode.workspace.fs.stat(bundledServerPath).then(
          () => {
            serverPath = bundledServerPath.fsPath;
          },
          () => {
            //
          },
        );
      }

      if (!serverPath) {
        // Shows error message if server binary is missing.
        const message =
          'No ink! Language Server binary found.\n\n' +
          'Please follow [these instructions](https://github.com/ink-analyzer/ink-analyzer/tree/master/crates/lsp-server#installation)' +
          ' to install the ink! Language Server.\n\n' +
          'Then set `ink-analyzer.server.path` in your settings to the path to the installed executable binary.';
        vscode.window.showErrorMessage(message, 'Got it');

        // Update state with error details.
        this.updateStatus('error', message);
      } else {
        // Creates a language client if the server binary exists.
        // Sets options for the language server.
        const serverOptions: lsp_types.ServerOptions = {
          run: { command: serverPath, transport: lsp_types.TransportKind.stdio },
          debug: {
            command: serverPath,
            transport: lsp_types.TransportKind.stdio,
          },
        };
        // Sets options for the language client.
        const clientOptions: lsp_types.LanguageClientOptions = {
          // Register the server for Rust files.
          documentSelector: [{ scheme: 'file', language: 'rust' }],
          // Enable markdown parsing.
          markdown: {
            supportHtml: true,
          },
          middleware: {
            // Code Actions middleware that adds support for snippets (see function doc for details).
            provideCodeActions: (
              document: vscode.TextDocument,
              range: vscode.Range,
              context: vscode.CodeActionContext,
              token: vscode.CancellationToken,
              next: lsp_types.ProvideCodeActionsSignature,
            ) => {
              return middleware.provideCodeActions(
                this.client as lsp_types.LanguageClient,
                document,
                range,
                context,
                token,
                next,
              );
            },
          },
        };
        // Creates the language client.
        this.client = new lsp_types.LanguageClient(EXTENSION_ID, 'ink! analyzer', serverOptions, clientOptions);
      }
    }
  }

  async start() {
    // Initializes the language client (if necessary/possible).
    await this.initialize();

    if (!this.client) {
      return;
    }

    // Starts the language client which in turn launches the language server.
    this.updateStatus('starting');
    this.client.start().then(
      () => {
        // Timeout is for a visual UX cue.
        setTimeout(() => {
          this.updateStatus('started');

          // Process subscriptions.
          this.processSubscriptions();
        }, VISUAL_CUE_DELAY);
      },
      () => {
        this.updateStatus(
          'stopped',
          'Failed to start ink! Language Server..\n\n' +
            'Make sure the ink-lsp-server binary has executable permissions.',
        );
      },
    );
  }

  async restart() {
    // Stop and dispose existing client.
    // We dispose the existing client because user may be restarting because some settings have changed
    // (e.g. the language server path).
    if (this.client) {
      await this.client?.stop();
      await this.client.dispose();
      this.client = undefined;
    }

    // Start new client.
    return this.start();
  }

  stop() {
    if (!this.client) {
      return;
    }

    // Stops the language client which in turn stops the language server.
    this.updateStatus('stopping');
    this.client.stop().then(
      () => {
        // Timeout is for a visual UX cue.
        setTimeout(() => {
          this.updateStatus('stopped', 'ink! Language Server was stopped.');
        }, VISUAL_CUE_DELAY);
      },
      () => {
        this.updateStatus('error', 'Failed to stop ink! Language Server.');
      },
    );
  }

  private updateUI() {
    // Updates and shows status bar.
    this.updateStatusBar();

    // Notifies user to enable/install rust-analyzer (if it isn't enabled/installed and the user hasn't been notified already).
    if (!this.state.rustAnalyzer && this.state.notifyRustAnalyzerEnable) {
      this.state.notifyRustAnalyzerEnable = false;
      vscode.window.showWarningMessage(
        `You don't have the rust-analyzer (rust-lang.rust-analyzer) extension enabled. 
            ink! is built on top of Rust, so you'll have a much better experience with both rust-analyzer and ink! analyzer enabled.`,
        'Got it',
      );
    }
  }

  private updateStatusBar() {
    let status = '';
    let icon = '';
    let progressPrefix = '';
    let progressSuffix = '';
    let command = COMMANDS.restart;
    let color = undefined;
    let bgColor = undefined;
    const createProjectTooltip = `[Create new project](command:${COMMANDS.createProject})`;
    const restartServerTooltip = `[Restart language server](command:${COMMANDS.restart})`;
    const stopServerTooltip = `[Stop language server](command:${COMMANDS.stop})`;
    let tooltipCommands = [restartServerTooltip, stopServerTooltip];

    switch (this.state.server) {
      case 'starting': {
        status = 'Starting ink! Language Server ...';
        icon = '$(sync~spin)';
        progressPrefix = 'starting';
        command = COMMANDS.stop;
        tooltipCommands = [stopServerTooltip];
        break;
      }
      case 'started': {
        status = 'ink! analyzer is ready!';
        command = COMMANDS.stop;
        tooltipCommands = [createProjectTooltip, restartServerTooltip, stopServerTooltip];
        break;
      }
      case 'stopping': {
        status = 'Stopping  ink! Language Server ...';
        icon = '$(sync~spin)';
        progressPrefix = 'stopping';
        tooltipCommands = [restartServerTooltip];
        break;
      }
      case 'warning': {
        status = this.state.message ?? '';
        icon = '$(warning)';
        color = 'statusBarItem.warningForeground';
        bgColor = 'statusBarItem.warningBackground';
        break;
      }
      case 'stopped': {
        status = this.state.message ?? '';
        icon = `$(stop-circle)`;
        color = 'statusBarItem.errorForeground';
        bgColor = 'statusBarItem.errorBackground';
        tooltipCommands = [restartServerTooltip];
        break;
      }
      case 'error': {
        status = this.state.message ?? '';
        icon = `$(error)`;
        color = 'statusBarItem.errorForeground';
        bgColor = 'statusBarItem.errorBackground';
        tooltipCommands = [restartServerTooltip];
        break;
      }
      case 'initializing': {
        status = 'Initializing new ink! project ...';
        icon = '$(sync~spin)';
        progressSuffix = ': initializing new project';
        break;
      }
      default: {
        break;
      }
    }

    this.statusBar.text = [
      icon,
      progressPrefix,
      'ink! analyzer',
      progressSuffix,
      progressPrefix || progressSuffix ? '...' : '',
    ]
      .filter(Boolean)
      .join(' ');
    this.statusBar.command = command;
    this.statusBar.color = color ? new vscode.ThemeColor(color) : undefined;
    this.statusBar.backgroundColor = bgColor ? new vscode.ThemeColor(bgColor) : undefined;
    this.statusBar.tooltip = new vscode.MarkdownString(status);
    this.statusBar.tooltip.isTrusted = true;
    if (tooltipCommands.length > 0) {
      this.statusBar.tooltip.appendMarkdown(tooltipCommands.map((txt) => `\n\n${txt}`).join(''));
    }
    this.statusBar.show();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCommand(command: string, handler: (manager: ExtensionManager) => (...args: any[]) => any): this {
    this.context.subscriptions.push(vscode.commands.registerCommand(command, handler(this)));
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStart(handler: (client: lsp_types.LanguageClient, manager: ExtensionManager) => any) {
    this.subscriptions.push(handler);

    if (this.client) {
      this.processSubscriptions();
    }
  }

  private processSubscriptions() {
    if (this.client) {
      for (const handler of this.subscriptions) {
        handler(this.client, this);
      }
    }
  }
}

type ServerStatus = 'starting' | 'started' | 'stopping' | 'stopped' | 'error' | 'warning' | 'initializing';

type ExtensionState = {
  server: ServerStatus;
  message?: string;
  rustAnalyzer: boolean;
  notifyRustAnalyzerEnable: boolean;
};
