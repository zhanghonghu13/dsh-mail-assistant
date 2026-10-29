// Offline protocol tests. Only a loopback fake TLS server and fixture credentials are used.
import tls from 'node:tls';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { ImapClient } from '../lib/imap.js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // only for this isolated fake server
const key = readFileSync(new URL('./fixtures/localhost-key.pem', import.meta.url));
const cert = readFileSync(new URL('./fixtures/localhost-cert.pem', import.meta.url));
const commands = [];
const server = tls.createServer({ key, cert }, (socket) => {
  socket.write('* OK fake IMAP ready\r\n');
  let pending = '';
  socket.on('data', (bytes) => {
    pending += bytes.toString('utf8');
    let end;
    while ((end = pending.indexOf('\r\n')) !== -1) {
      const line = pending.slice(0, end);
      pending = pending.slice(end + 2);
      commands.push(line);
      const [tag, ...words] = line.split(' ');
      const command = words.join(' ');
      if (command === 'UID SEARCH FROM "deepseek.com"') {
        // Fragment a normal SEARCH response across TLS writes.
        socket.write('* SE');
        socket.write(`ARCH 12 42\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH SINCE 01-Jan-2020') {
        socket.write(`* SEARCH 12 42 77\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH FROM "missing.example"') {
        socket.write(`* SEARCH\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH FROM "error.example"') {
        socket.write(`${tag} NO cannot search\r\n`);
      } else if (command === 'UID SEARCH FROM "no-response.example"') {
        socket.write(`* OK unrelated response\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH FROM "esearch.example"') {
        socket.write(`* ESEARCH (TAG "${tag}") UID ALL 12,42\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH FROM "malformed.example"') {
        socket.write(`* SEARCH 12 not-a-uid 42\r\n${tag} OK SEARCH completed\r\n`);
      } else if (command === 'UID SEARCH FROM "overflow.example"') {
        socket.write(`* SEARCH 4294967296\r\n${tag} OK SEARCH completed\r\n`);
      } else {
        socket.write(`${tag} BAD unexpected fake command\r\n`);
      }
    }
  });
  socket.on('error', () => {});
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const client = new ImapClient({ host: '127.0.0.1', port: server.address().port, user: 'fixture', password: 'fixture', timeoutMs: 3000 });
try {
  await client.connect();
  assert.deepEqual(await client.searchUid('FROM "deepseek.com"'), [12, 42]);
  assert.deepEqual(await client.searchUid('SINCE 01-Jan-2020'), [12, 42, 77]);
  assert.deepEqual(await client.searchUid('FROM "missing.example"'), []);
  await assert.rejects(client.searchUid('FROM "error.example"'), /cannot search/);
  await assert.rejects(client.searchUid('FROM "no-response.example"'), /没有 SEARCH 响应/);
  await assert.rejects(client.searchUid('FROM "esearch.example"'), /没有 SEARCH 响应/);
  await assert.rejects(client.searchUid('FROM "malformed.example"'), /无效的 UID/);
  await assert.rejects(client.searchUid('FROM "overflow.example"'), /无效的 UID/);
  assert.equal(commands.length, 8);
  console.log('Offline IMAP SEARCH protocol tests passed.');
} finally {
  client.close();
  await new Promise((resolve) => server.close(resolve));
}
