import ExtensionManager from './manager';

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
