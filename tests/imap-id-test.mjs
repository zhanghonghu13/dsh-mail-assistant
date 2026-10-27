// Offline check for the RFC 2971 ID handshake that NetEase (163/126) requires
// before SELECT: without ID the server answers "NO SELECT Unsafe Login".
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ImapClient } from '../lib/imap.js';

// The fake server uses a throwaway self-signed cert; trust is irrelevant here.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const here = path.dirname(fileURLToPath(import.meta.url));
const certDir = path.join(here, 'fixtures');
const key = fs.readFileSync(path.join(certDir, 'localhost-key.pem'));
const cert = fs.readFileSync(path.join(certDir, 'localhost-cert.pem'));

/**
 * Minimal IMAP server that mimics NetEase: SELECT fails with "Unsafe Login"
 * until the client sends ID (unless requireId is disabled).
 */
function startServer({ requireId = true, rejectId = false } = {}) {
  const state = { sawId: false, requireId, rejectId };
  const server = tls.createServer({ key, cert }, (socket) => {
    socket.write('* OK IMAP4rev1 Server ready\r\n');
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let index;
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const match = /^(\S+)\s+(\S+)(?:\s+(.*))?$/.exec(line);
        if (!match) continue;
        const [, tag, command] = match;
        if (/^LOGIN$/i.test(command)) {
          socket.write(`${tag} OK LOGIN completed\r\n`);
        } else if (/^ID$/i.test(command)) {
          if (rejectId) {
            socket.write(`${tag} BAD Command not supported\r\n`);
          } else {
            state.sawId = true;
            socket.write('* ID ("name" "fake-server")\r\n');
            socket.write(`${tag} OK ID completed\r\n`);
          }
        } else if (/^SELECT$/i.test(command)) {
          if (requireId && !state.sawId) {
            socket.write(`${tag} NO SELECT Unsafe Login. Please contact kefu@188.com for help\r\n`);
          } else {
            socket.write('* 2 EXISTS\r\n* OK [UIDVALIDITY 7] UIDs valid\r\n');
            socket.write(`${tag} OK [READ-WRITE] SELECT completed\r\n`);
          }
        } else if (/^LOGOUT$/i.test(command)) {
          socket.write('* BYE logging out\r\n');
          socket.write(`${tag} OK LOGOUT completed\r\n`);
          socket.end();
        } else {
          socket.write(`${tag} BAD Unknown command\r\n`);
        }
      }
    });
    socket.on('error', () => {});
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port, state });
    });
  });
}

async function connectTo(port) {
  const client = new ImapClient({
    host: '127.0.0.1',
    port,
    user: 'user@163.com',
    password: 'secret',
    timeoutMs: 5000,
  });
  await client.connect();
  return client;
}

// 1. NetEase-style server: ID unlocks SELECT.
{
  const { server, port, state } = await startServer({ requireId: true });
  const client = await connectTo(port);
  await client.login();
  assert.equal(state.sawId, true, 'ID must be sent right after LOGIN');
  const mailbox = await client.select('INBOX');
  assert.equal(mailbox.exists, 2);
  await client.logout();
  server.close();
  console.log('ok 1 - ID is sent after LOGIN and unlocks SELECT');
}

// 2. Server without ID support answers BAD: login must still succeed.
{
  const { server, port } = await startServer({ requireId: false, rejectId: true });
  const client = await connectTo(port);
  await client.login();
  const mailbox = await client.select('INBOX');
  assert.equal(mailbox.exists, 2);
  await client.logout();
  server.close();
  console.log('ok 2 - a BAD answer to ID does not break login');
}

// 3. Control: without ID the same server still refuses, so the test is meaningful.
{
  const { server, port } = await startServer({ requireId: true, rejectId: true });
  const client = await connectTo(port);
  await client.login();
  await assert.rejects(() => client.select('INBOX'), /Unsafe Login/);
  client.close();
  server.close();
  console.log('ok 3 - control: no usable ID still yields Unsafe Login');
}

console.log(`\n${path.basename(fileURLToPath(import.meta.url))}: all checks passed`);
