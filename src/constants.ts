export const EXTENSION_ID = 'ink-analyzer';

export const NEW_PROJECT_ACTIVATION_FILE = 'new-ink-project';

function getCommandId(name: string): string {
  return `${EXTENSION_ID}.${name}`;
}

export const COMMANDS = {
  restart: getCommandId('restart'),
  stop: getCommandId('stop'),
  createProject: getCommandId('createProject'),
};
