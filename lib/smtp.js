// Minimal SMTP client for the Mail Assistant plugin.
// Supports implicit TLS (465), STARTTLS (587/25), AUTH LOGIN, and a single
// message submission with dot-stuffed DATA.

import tls from 'node:tls';
import net from 'node:net';

class SmtpError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SmtpError';
  }
}

/** Frame the SMTP conversation over one connected socket. */
class SmtpIo {
  constructor(socket, timeoutMs) {
    this.socket = socket;
    this.timeoutMs = timeoutMs;
    this.buffer = Buffer.alloc(0);
    this.waiters = [];
    socket.on('data', (chunk) => this.#feed(chunk));
    socket.on('error', (error) => this.#fail(new SmtpError(`SMTP 连接错误：${error.message}`)));
    socket.on('close', () => this.#fail(new SmtpError('SMTP 连接已断开')));
  }

  #feed(chunk) {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    while (this.waiters.length > 0) {
      const index = this.buffer.indexOf('\r\n');
      if (index === -1) return;
      const line = this.buffer.subarray(0, index).toString('binary');
      this.buffer = this.buffer.subarray(index + 2);
      const waiter = this.waiters.shift();
      clearTimeout(waiter.timer);
      waiter.resolve(line);
    }
  }

  #fail(error) {
    this.failed = true;
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.waiters.length = 0;
  }

  writeLine(line) {
    this.socket.write(Buffer.from(`${line}\r\n`, 'binary'));
  }

  writeRaw(buffer) {
    this.socket.write(buffer);
  }

  readLine() {
    if (this.failed) return Promise.reject(new SmtpError('SMTP 连接已断开'));
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, timer: setTimeout(() => {
        const index = this.waiters.indexOf(waiter);
        if (index !== -1) this.waiters.splice(index, 1);
        reject(new SmtpError('SMTP 读取超时'));
      }, this.timeoutMs) };
      this.waiters.push(waiter);
    });
  }

  detach() {
    this.socket.removeAllListeners('data');
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('close');
  }
}

/** Read one (possibly multi-line) SMTP reply; returns {code, text}. */
async function readReply(io) {
  const lines = [];
  for (;;) {
    const line = await io.readLine();
    if (/^\d{3} /.test(line)) {
      lines.push(line);
      return { code: Number(line.slice(0, 3)), text: lines.join('\n') };
    }
    if (!/^\d{3}-/.test(line)) throw new SmtpError(`SMTP 应答格式异常：${line}`);
    lines.push(line);
  }
}

function connectTls(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, timeout: timeoutMs });
    socket.once('secureConnect', () => {
      socket.setTimeout(0);
      resolve(socket);
    });
    socket.once('error', reject);
    socket.once('timeout', () => reject(new SmtpError(`连接 ${host}:${port} 超时`)));
  });
}

function connectPlain(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.setTimeout(0);
      resolve(socket);
    });
    socket.once('error', reject);
    socket.once('timeout', () => reject(new SmtpError(`连接 ${host}:${port} 超时`)));
  });
}

/** Wrap a plain socket in TLS after STARTTLS; the plain listeners must be detached first. */
function startTls(socket, host, timeoutMs) {
  return new Promise((resolve, reject) => {
    const wrapped = tls.connect({ socket, servername: host, timeout: timeoutMs });
    wrapped.once('secureConnect', () => {
      wrapped.setTimeout(0);
      resolve(wrapped);
    });
    wrapped.once('error', reject);
    wrapped.once('timeout', () => reject(new SmtpError('STARTTLS 升级超时')));
  });
}

/**
 * Deliver one message.
 * Options: {host, port, user, password, from, recipients: [address], message: Buffer, timeoutMs}.
 */
export async function sendMail({ host, port, user, password, from, recipients, message, timeoutMs = 30000 }) {
  const useImplicitTls = port === 465;
  const socket = useImplicitTls
    ? await connectTls(host, port, timeoutMs)
    : await connectPlain(host, port, timeoutMs);
  let io = new SmtpIo(socket, timeoutMs);
  try {
    const expect = async (codes, what) => {
      const reply = await readReply(io);
      if (!codes.includes(reply.code)) {
        const last = reply.text.split('\n').at(-1) ?? '';
        throw new SmtpError(`SMTP ${what}失败（${reply.code}）：${last.trim()}`);
      }
      return reply;
    };

    await expect([220], '连接问候');
    io.writeLine('EHLO mail-assistant.local');
    const ehlo = await expect([250], 'EHLO');
    if (useImplicitTls) {
      // Implicit TLS already secured the socket.
    } else if (/STARTTLS/i.test(ehlo.text)) {
      io.writeLine('STARTTLS');
      await expect([220], 'STARTTLS');
      io.detach();
      const secured = await startTls(socket, host, timeoutMs);
      io = new SmtpIo(secured, timeoutMs);
      io.writeLine('EHLO mail-assistant.local');
      await expect([250], 'EHLO (TLS)');
    } else {
      throw new SmtpError('SMTP 服务器不支持 STARTTLS，无法安全发送；请在设置中改用 SSL 端口（如 465）');
    }

    io.writeLine('AUTH LOGIN');
    await expect([334], 'AUTH LOGIN');
    io.writeLine(Buffer.from(user, 'utf-8').toString('base64'));
    await expect([334], 'AUTH 用户名');
    io.writeLine(Buffer.from(password, 'utf-8').toString('base64'));
    await expect([235], 'AUTH 登录');

    if (!from || !from.includes('@')) throw new SmtpError('发件人地址无效');
    io.writeLine(`MAIL FROM:<${from}>`);
    await expect([250], 'MAIL FROM');

    const targets = [...new Set(recipients)].filter((address) => /@/.test(address));
    if (targets.length === 0) throw new SmtpError('邮件没有收件人');
    for (const address of targets) {
      io.writeLine(`RCPT TO:<${address}>`);
      await expect([250, 251], 'RCPT TO');
    }

    io.writeLine('DATA');
    await expect([354], 'DATA');
    const text = message.toString('binary');
    const stuffed = text.replace(/\r?\n/g, '\n').split('\n')
      .map((line) => (line.startsWith('.') ? `.${line}` : line))
      .join('\r\n');
    io.writeRaw(Buffer.from(`${stuffed}\r\n.\r\n`, 'binary'));
    await expect([250], 'DATA 结束');

    io.writeLine('QUIT');
    await readReply(io).catch(() => undefined);
    socket.destroy();
  } catch (error) {
    try { socket.destroy(); } catch { /* already gone */ }
    throw error;
  }
}
