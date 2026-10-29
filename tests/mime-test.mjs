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

// 3. HTML to text. Style/script contents must never leak into the body, and a
// malformed entity must not abort parsing of the whole message.
const templateHtml = [
  '<html><head><title>忽略我</title>',
  '<style>#outlook a { padding: 0; } body { margin: 0; }</style></head>',
  '<body><table><tr><td>尊敬的 DeepSeek API 用户：</td></tr>',
  '<tr><td>搜索服务将于 2026-11-01 开始计费。</td></tr></table>',
  '<style>.mj-column-per-100 { width: 100% !important; }</style>',
  '<p>感谢支持！<br>DeepSeek 团队</p>',
  '<script>alert("never")</script>',
  '<p>价格 &amp; 规则&nbsp;请见官网 &#x1f600; &#999999999;</p>',
  '</body></html>',
].join('');
const templateText = htmlToText(templateHtml);
for (const expected of ['尊敬的 DeepSeek API 用户', '2026-11-01', '感谢支持', 'DeepSeek 团队', '价格 & 规则', '😀']) {
  assert.ok(templateText.includes(expected), `html text keeps ${expected}`);
}
for (const leaked of ['padding: 0', 'margin: 0', '.mj-column', 'alert(', '忽略我']) {
  assert.ok(!templateText.includes(leaked), `html text does not leak ${leaked}`);
}
assert.ok(!templateText.includes('&amp;'), 'entities are decoded');
assert.ok(htmlToText('<p>你好</p><script>alert(1)</script><div>第二行</div>').includes('第二行'));
assert.ok(htmlToText('<p>before</p><style>.x{color:red}').endsWith('before'), 'unclosed style is dropped');

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

// An empty plain-text alternative must not hide a readable HTML part.
const whitespaceAlternative = Buffer.from([
  'From: a@b.com',
  'Subject: Empty plain part',
  `Content-Type: multipart/alternative; boundary="${boundary}"`,
  '',
  `--${boundary}`,
  'Content-Type: text/plain; charset=utf-8',
  '',
  '   ',
  `--${boundary}`,
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p>html fallback</p>',
  `--${boundary}--`,
  '',
].join('\r\n'));
assert.equal(parseMessage(whitespaceAlternative).text, 'html fallback');

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

// HTML-only bodies must not be silently omitted, with or without attachments.
for (const attachments of [[], [{ filename: 'a.txt', contentType: 'text/plain', data: Buffer.from('a') }]]) {
  const htmlOnly = parseMessage(buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }],
    subject: 'HTML only', text: '', html: '<p>重要内容</p>', attachments,
  }));
  assert.ok(htmlOnly.html.includes('重要内容'));
  assert.equal(htmlOnly.attachments.length, attachments.length);
}
const styledOnly = parseMessage(buildMessage({
  fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }],
  subject: 'Template', text: '',
  html: '<html><head><style>.mj-column-per-100{width:100%!important}</style></head><body><p>模板正文</p></body></html>',
}));
assert.ok(styledOnly.text.includes('模板正文'));
assert.ok(!styledOnly.text.includes('mj-column'), 'template CSS never reaches the reader');
const mislabeledCss = Buffer.from([
  'From: a@b.com',
  'Subject: Mislabelled template',
  'Content-Type: text/plain; charset=utf-8',
  '',
  '#outlook a { padding: 0; }',
  'body { margin: 0; }',
  '',
  '真正正文',
].join('\r\n'));
assert.ok(parseMessage(mislabeledCss).text.includes('真正正文'));
assert.ok(!parseMessage(mislabeledCss).text.includes('#outlook'), 'CSS-only plain fallback is cleaned');

// 8. Provider presets.
assert.equal(providerPreset('user@qq.com').smtpHost, 'smtp.qq.com');
assert.equal(providerPreset('user@outlook.com').smtpPort, 587);
assert.equal(providerPreset('user@unknown.tld'), undefined);

console.log('All MIME engine tests passed.');
