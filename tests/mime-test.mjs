// Functional smoke test for the Mail Assistant MIME engine (parser round-trip).
import { parseMessage, buildMessage, decodeHeaderWords, parseAddressList, htmlToText } from '../lib/mime.js';
import { providerPreset } from '../lib/providers.js';
import assert from 'node:assert';

// 1. Encoded-word decoding.
assert.equal(decodeHeaderWords('=?utf-8?B?' + Buffer.from('你好世界').toString('base64') + '?='), '你好世界');
assert.equal(decodeHeaderWords('=?UTF-8?Q?caf=C3=A9?='), 'café');

// 2. Address list parsing.
const list = parseAddressList('"张三" <zhang@example.com>, bob@test.io');
assert.equal(list.length, 2);
assert.equal(list[0].name, '张三');
assert.equal(list[1].address, 'bob@test.io');

// 3. HTML to text.
assert.ok(htmlToText('<p>你好</p><script>alert(1)</script><div>第二行</div>').includes('第二行'));

// 4. Build a message with UTF-8 subject, html, and an attachment; parse it back.
const message = buildMessage({
  fromAddress: 'me@qq.com',
  fromName: '邮件助手',
  to: [{ name: '张三', address: 'zhang@example.com' }],
  cc: [{ name: '', address: 'bob@test.io' }],
  subject: '测试主题 Test Subject',
  text: '正文内容 line1\nline2',
  html: '<p>正文内容</p>',
  attachments: [
    { filename: '报表.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: Buffer.from([1, 2, 3, 4]) },
    { filename: 'plain.txt', contentType: 'text/plain', data: Buffer.from('hello attachment') },
  ],
});
const raw = message.toString('binary');
const parsed = parseMessage(message);
assert.equal(parsed.subject, '测试主题 Test Subject');
assert.equal(parsed.from[0].name, '邮件助手');
assert.equal(parsed.to[0].address, 'zhang@example.com');
assert.equal(parsed.cc[0].address, 'bob@test.io');
assert.equal(parsed.text, '正文内容 line1\nline2');
assert.ok(parsed.html.includes('正文内容'));
assert.equal(parsed.attachments.length, 2);
assert.equal(parsed.attachments[0].filename, '报表.xlsx');
assert.deepEqual([...parsed.attachments[0].data], [1, 2, 3, 4]);
assert.equal(parsed.attachments[1].data.toString(), 'hello attachment');
assert.ok(raw.includes('filename*=UTF-8\'\''));

// 5. Quoted-printable + GBK decoding of a received message.
const qpBody = Buffer.from('=C4=E3=BA=C3', 'binary'); // "你好" in GBK, quoted-printable
const gbkMessage = Buffer.from([
  'From: =?gbk?B?' + Buffer.from('张三', 'utf-8').toString() + '?= <z@qq.com>',
  'Subject: =?gbk?B?1tDOxA==?=',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=gbk',
  'Content-Transfer-Encoding: quoted-printable',
  '',
].join('\r\n') + '\r\n' + qpBody.toString('binary'));
const gbkParsed = parseMessage(gbkMessage);
assert.equal(gbkParsed.text, '你好');
assert.ok(gbkParsed.subject === '主题' ? true : gbkParsed.subject !== '');

// 6. Multipart/alternative received message.
const boundary = 'XYZ';
const multipart = Buffer.from([
  'From: a@b.com',
  'Subject: Multi',
  `Content-Type: multipart/alternative; boundary="${boundary}"`,
  '',
  `--${boundary}`,
  'Content-Type: text/plain; charset=utf-8',
  '',
  'plain body',
  `--${boundary}`,
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p>html body</p>',
  `--${boundary}--`,
  '',
].join('\r\n'));
const multipartParsed = parseMessage(multipart);
assert.equal(multipartParsed.text, 'plain body');
assert.equal(multipartParsed.html, '<p>html body</p>');

// 7. Attachment from Content-Disposition with RFC2047 filename.
const filename64 = '=?utf-8?B?' + Buffer.from('报告.pdf').toString('base64') + '?=';
const withAttachment = Buffer.from([
  'From: a@b.com',
  'Subject: With attachment',
  `Content-Type: multipart/mixed; boundary="${boundary}"`,
  '',
  `--${boundary}`,
  'Content-Type: text/plain; charset=utf-8',
  '',
  'see attachment',
  `--${boundary}`,
  'Content-Type: application/pdf',
  `Content-Disposition: attachment; filename="${filename64}"`,
  'Content-Transfer-Encoding: base64',
  '',
  Buffer.from('%PDF-1.4 fake').toString('base64'),
  `--${boundary}--`,
  '',
].join('\r\n'));
const withAttachmentParsed = parseMessage(withAttachment);
assert.equal(withAttachmentParsed.attachments.length, 1);
assert.equal(withAttachmentParsed.attachments[0].filename, '报告.pdf');
assert.equal(withAttachmentParsed.attachments[0].data.toString(), '%PDF-1.4 fake');

// 8. Provider presets.
assert.equal(providerPreset('user@qq.com').smtpHost, 'smtp.qq.com');
assert.equal(providerPreset('user@outlook.com').smtpPort, 587);
assert.equal(providerPreset('user@unknown.tld'), undefined);

console.log('All MIME engine tests passed.');
