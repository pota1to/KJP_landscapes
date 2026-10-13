import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForUrl(url, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  await Promise.race([exited, delay(1000)]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

export async function startTestSite(rootPath) {
  const port = await getFreePort();
  const child = spawn('python3', [
    '-m', 'http.server', String(port),
    '--bind', '127.0.0.1',
    '--directory', rootPath
  ], { stdio: 'ignore' });
  const origin = `http://127.0.0.1:${port}`;
  await waitForUrl(`${origin}/index.html`);

  return {
    origin,
    async close() {
      await stopProcess(child);
    }
  };
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.eventHandlers = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        for (const handler of this.eventHandlers.get(message.method) || []) {
          handler(message.params);
        }
        return;
      }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new CdpClient(socket);
  }

  async send(method, params = {}) {
    const id = this.nextId++;
    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return await response;
  }

  on(method, handler) {
    const handlers = this.eventHandlers.get(method) || [];
    handlers.push(handler);
    this.eventHandlers.set(method, handlers);
  }

  close() {
    this.socket.close();
  }
}

export async function launchBrowser({ javascriptEnabled = true } = {}) {
  const port = await getFreePort();
  const profile = mkdtempSync(join(tmpdir(), 'kjp-browser-test-'));
  const child = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  await waitForUrl(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: 'PUT'
  });
  const target = await targetResponse.json();
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setScriptExecutionDisabled', { value: !javascriptEnabled });
  const browserErrors = [];
  client.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    browserErrors.push(exceptionDetails.exception?.description || exceptionDetails.text);
  });
  client.on('Runtime.consoleAPICalled', ({ type, args }) => {
    if (type !== 'error') return;
    browserErrors.push(args.map(argument => argument.value || argument.description || '').join(' '));
  });

  const evaluate = async expression => {
    const response = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || 'Browser evaluation failed');
    }
    return response.result.value;
  };

  const setViewport = async ({ width, height }) => {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await delay(100);
  };

  return {
    async goto(url, viewport = { width: 1200, height: 900 }) {
      await setViewport(viewport);
      await client.send('Page.navigate', { url });
      const started = Date.now();
      while (Date.now() - started < 10000) {
        const readyState = await evaluate('document.readyState');
        if (readyState === 'complete') break;
        await delay(50);
      }
      await delay(150);
    },
    evaluate,
    async click(selector) {
      const clicked = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return false;
        element.click();
        return true;
      })()`);
      if (!clicked) throw new Error(`Cannot click missing selector: ${selector}`);
      await delay(50);
    },
    async press(key) {
      await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
      await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
      await delay(50);
    },
    setViewport,
    getErrors() {
      return [...browserErrors];
    },
    clearErrors() {
      browserErrors.length = 0;
    },
    async close() {
      client.close();
      await stopProcess(child);
      rmSync(profile, { recursive: true, force: true });
    }
  };
}
