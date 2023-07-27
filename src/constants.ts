export const EXTENSION_ID = 'ink-analyzer';

function getCommandId(name: string): string {
  return `${EXTENSION_ID}.${name}`;
}

export const COMMANDS = {
  restart: getCommandId('restart'),
  stop: getCommandId('stop'),
};
