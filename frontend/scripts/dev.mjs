import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const frontendRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(frontendRoot);
const backendRoot = join(repoRoot, 'backend');
const backendPython = join(backendRoot, '.venv', 'Scripts', 'python.exe');
const viteEntry = join(frontendRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const backendPort = 8001;
const vitePort = 5173;

let backendProcess = null;
let frontendProcess = null;

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  child.on('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });

  return child;
}

function waitForBackend(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // Retry until the backend becomes ready.
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Backend did not become ready at ${url}`));
        return;
      }

      setTimeout(tick, 1000);
    };

    void tick();
  });
}

function shutdown() {
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
}

async function main() {
  if (!existsSync(backendPython)) {
    throw new Error(`Backend virtual environment not found: ${backendPython}`);
  }

  backendProcess = spawnProcess(backendPython, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(backendPort)], {
    cwd: backendRoot,
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);

  await waitForBackend(`http://127.0.0.1:${backendPort}/api/health`);

  if (!existsSync(viteEntry)) {
    throw new Error(`Vite entry not found: ${viteEntry}`);
  }

  frontendProcess = spawnProcess(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', String(vitePort)], {
    cwd: frontendRoot,
  });

  const exitHandler = (child) => {
    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (typeof code === 'number' && code !== 0) {
        process.exitCode = code;
      }
    });
  };

  exitHandler(backendProcess);
  exitHandler(frontendProcess);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  shutdown();
  process.exit(1);
});
