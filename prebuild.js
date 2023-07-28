// A build script that downloads the latest ink! Language Server (ink-lsp-server) binary for the target platform (if none exists yet at /server/ink-lsp-server[.exe]).

const fs = require('node:fs');
const https = require('node:https');
const fetch = require('node-fetch');
const zlib = require('node:zlib');
const stream = require('node:stream');
const child_process = require('node:child_process');
const { promisify } = require('node:util');
const chalk = require('chalk');
const AdmZip = require('adm-zip');

const pipeline = promisify(stream.pipeline);
const log = console.log;

const BINARY_INSTALL_INSTRUCTIONS =
  "You'll need to:\n" +
  '- clone the ink! Analyzer repository\n' +
  '- manually build an ink-lsp-server binary\n' +
  '- copy the binary into the a `./server` directory in the project root\n' +
  '- make the binary executable\n\n' +
  'Please find further instructions at: ' +
  chalk.blue.underline('https://github.com/ink-analyzer/ink-analyzer/tree/master/crates/lsp-server#installation');

(async () => {
  log('🔎 Searching for ink-lsp-server binary ...');
  const target = getBinaryTarget();

  const serverPath = `./server/ink-lsp-server${process.platform === 'win32' ? '.exe' : ''}`;
  let stat = fs.statSync(serverPath, { throwIfNoEntry: false });
  let binaryExists = stat && stat.isFile();
  if (binaryExists && verifyBinary(serverPath)) {
    // Exits successfully if a binary exists at the expected location.
    exitWithSuccess(serverPath);
  }

  // Tries to fix binaries permissions for the existing binary.
  if (binaryExists && fixBinaryPermissions(serverPath)) {
    // Exits successfully if the executable permissions were added successfully to the existing binary.
    exitWithSuccess(serverPath);
  }

  // Exits with an error if ink! Analyzer doesn't ship ink-lsp-server binaries for this platform.
  if (!target) {
    exitWithError(
      chalk.red("ink! Analyzer doesn't currently ship ink-lsp-server binaries for your platform: ") +
        target +
        '\n' +
        BINARY_INSTALL_INSTRUCTIONS,
    );
  }

  // Tries to download, decompress and configure the target binary otherwise exits with an error.
  let newServerPath = await setupBinaryForTarget(target).catch(() => {
    exitWithError(
      chalk.red('Failed to setup a binary for your platform: ') + target + '\n' + BINARY_INSTALL_INSTRUCTIONS,
    );
  });
  // Exits successfully if an executable was downloaded and configured for this target.
  exitWithSuccess(newServerPath);
})();

// Returns a supported Rust binary target for ink-lsp-server or undefined otherwise.
// Ref: https://github.com/ink-analyzer/ink-analyzer/blob/lsp-server-v0.2.1/.github/workflows/release.yaml#L28-L44
// Ref: https://doc.rust-lang.org/nightly/rustc/platform-support.html
function getBinaryTarget() {
  // Ref: https://nodejs.org/api/process.html#processplatform
  let os;
  switch (process.platform) {
    case 'win32': {
      os = 'pc-windows-msvc';
      break;
    }
    case 'linux': {
      os = 'unknown-linux-gnu';
      break;
    }
    case 'darwin': {
      os = 'apple-darwin';
      break;
    }
    default: {
      return;
    }
  }

  // Ref: https://nodejs.org/api/process.html#processarch
  let arch;
  switch (process.arch) {
    case 'x64': {
      arch = 'x86_64';
      break;
    }
    case 'ia32': {
      if (process.platform === 'win32') {
        arch = 'i686';
        break;
      }
      // ink-lsp-server only releases 32 bit x86 binaries for windows.
      return;
    }
    case 'arm64': {
      arch = 'aarch64';
      break;
    }
    default: {
      return;
    }
  }

  return `${arch}-${os}`;
}

// Exits with a success message and exit code.
function exitWithSuccess(path) {
  log(chalk.green('✅ An executable ink-lsp-server binary is available at:'), path);
  process.exit(0);
}

// Exits with an error message.
function exitWithError(message) {
  log(`❌ ${message}`);
  process.exit(1);
}

// Verifies that the binary is executable on this platform.
function verifyBinary(path) {
  log('⌛ Verifying binary/executable at: ', path);
  try {
    const result = child_process.execSync(`${path} -V`, { timeout: 100 });
    // `ink-lsp-server -v` returns something like `ink-lsp-server x.y.z` when it works.
    return result.toString().includes('ink-lsp-server');
  } catch (e) {
    log('Binary verification failed.');
  }
  return false;
}

// Attempts to add executable permissions to the binary.
function fixBinaryPermissions(path) {
  // Assume permissions are always fine on works on Windows.
  if (process.platform === 'win32') {
    return true;
  }

  log('⚒️ Attempting to add executable permissions to the binary at: ', path);
  // Fix permissions on Linux and macOS (may work for others but these are the primary targets).
  try {
    child_process.execSync(`chmod +x ${path}`, { timeout: 100 });
    // The binary should be able to pass verification after the above command.
    return verifyBinary(path);
  } catch (e) {
    log('Failed to fix binary permissions.');
  }
  return false;
}

// Downloads, decompresses and configures an ink-lsp-server for the target platform.
async function setupBinaryForTarget(target) {
  log(`📦 Downloading ink-lsp-server binary for ${target} ...`);

  // Cleans server directory.
  fs.rmSync('./server', { force: true, recursive: true });
  try {
    fs.mkdirSync('./server');
  } catch (e) {}

  // Downloads the latest release of ink-lsp-server binary for the target platform.
  let asset = await getLatestBinaryDownloadUrl(target);
  const archivePath = `./server/${asset.name}`;
  const serverPath = `./server/ink-lsp-server${process.platform === 'win32' ? '.exe' : ''}`;
  await downloadAsset(asset.browser_download_url, archivePath);

  // Unpack and rename assets.
  switch (asset.content_type) {
    case 'application/gzip': {
      await decompressGzipAsset(archivePath, serverPath).catch(() => {
        // Exits with an error message alerting the user that we failed to decompress the binary.
        exitWithError(
          chalk.red('Failed to decompress the binary for your platform: ') +
            archivePath +
            '\n' +
            BINARY_INSTALL_INSTRUCTIONS,
        );
      });
      if (fixBinaryPermissions(serverPath)) {
        // Deletes the archive.
        fs.rmSync(archivePath);
        // Returns the new server path.
        return serverPath;
      }
      break;
    }
    case 'application/zip': {
      if (decompressZipAsset(archivePath, './server', `ink-lsp-server${process.platform === 'win32' ? '.exe' : ''}`)) {
        if (fixBinaryPermissions(serverPath)) {
          // Deletes the archive.
          fs.rmSync(archivePath);
          // Returns the new server path.
          return serverPath;
        }
      } else {
        // Exits with an error message alerting the user that we failed to decompress the binary.
        exitWithError(
          chalk.red('Failed to decompress the binary for your platform: ') +
            archivePath +
            '\n' +
            BINARY_INSTALL_INSTRUCTIONS,
        );
      }
      break;
    }
    default: {
      throw new Error(`Unsupported file type: ${archivePath}`);
    }
  }
  throw new Error('Failed to setup binary');
}

// Returns (if any) the download URL for the latest ink-lsp-server binary for this platform/target.
async function getLatestBinaryDownloadUrl(target) {
  const res = await fetch('https://api.github.com/repos/ink-analyzer/ink-analyzer/releases/latest');
  if (res) {
    const data = await res.json();
    return data.assets.find((item) => item.name.toLowerCase().includes(target.toLowerCase()));
  }
}

// Downloads an asset to a destination path.
function downloadAsset(url, path) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    https
      .get(
        url,
        {
          headers: {
            Accept: 'application/octet-stream',
            'User-Agent': 'ink! Analyzer',
          },
        },
        (res) => {
          if ([301, 302].includes(res.statusCode) && res.headers['location']) {
            // Follows redirects.
            downloadAsset(res.headers['location'], path).then(resolve).catch(reject);
          } else if (res.statusCode === 200) {
            // Downloads the file.
            const file = fs.createWriteStream(path);
            const size = parseInt(res.headers['content-length']);
            let received = 0;

            res
              .on('data', (data) => {
                received += data.length;
                const percentage = ((received * 100) / size).toFixed(2);
                const ratio = Math.floor(percentage / 10);
                const duration = ((performance.now() - start) / 1000).toFixed(2); // in seconds.
                const bar = Array.from(Array(10).keys())
                  .map((i) => (i <= ratio ? '===' : '   '))
                  .join('');
                let displaySize = size;
                let displayUnits = 'bytes';
                if (size >= 1024 ** 2) {
                  displaySize = (displaySize / 1024 ** 2).toFixed(2);
                  displayUnits = 'MB';
                } else if (size >= 1024) {
                  displaySize = (displaySize / 1024).toFixed(2);
                  displayUnits = 'kB';
                }
                process.stdout.write(
                  `Downloading ${displaySize} ${displayUnits} [${bar}] ${percentage}% ${duration}s\r`,
                );
              })
              .pipe(file)
              .on('finish', () => {
                process.stdout.write('\n');
              })
              .on('error', () => {
                fs.unlink(path, () => {
                  reject(new Error('Failed to write to file.'));
                });
              });

            file.on('finish', () => {
              file.close();
              resolve({ path, size });
            });

            file.on('error', () => {
              fs.unlink(path, () => {
                reject(new Error('Failed to write to file.'));
              });
            });
          } else {
            // Handles failures.
            reject(new Error(`Failed to download file: status: ${res.statusCode}`));
          }
        },
      )
      .on('error', (e) => {
        reject(e);
      });
  });
}

// Decompresses an asset to a destination path.
function decompressGzipAsset(src, dest) {
  // Handles .gzip files with node:zlib.
  const input = fs.createReadStream(src);
  const output = fs.createWriteStream(dest);
  return pipeline(input, zlib.createGunzip(), output);
}

function decompressZipAsset(src, destDir, destFilename) {
  // Handles .zip files with adm-zip.
  const zip = new AdmZip(src);
  const zipEntries = zip.getEntries();
  const executable = zipEntries.find((entry) => entry.entryName.endsWith('.exe'));
  if (executable && executable.name) {
    return zip.extractEntryTo(executable.name, destDir, false, true, false, destFilename);
  }
  return false;
}
