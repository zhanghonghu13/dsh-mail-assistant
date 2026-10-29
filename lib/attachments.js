// Safe attachment persistence. File names are reduced to a single base name,
// collisions get a counter suffix, and every path stays inside the target
// directory.
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MAX_ATTACHMENTS_PER_SAVE = 20;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export function safeFilename(name) {
  const base = typeof name === 'string' ? name : '';
  return base
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 180) || 'attachment';
}

async function uniqueTarget(dir, filename) {
  let target = path.join(dir, filename);
  const extension = path.extname(filename);
  const stem = path.basename(filename, extension);
  let counter = 1;
  for (;;) {
    try {
      const info = await stat(target);
      if (!info.isFile()) return target;
      target = path.join(dir, `${stem} (${counter})${extension}`);
      counter += 1;
    } catch {
      return target;
    }
  }
}

/** Persist the selected attachments; returns saved paths in order. */
export async function saveAttachments({ attachments = [], indices = null, dir }) {
  if (typeof dir !== 'string' || dir.trim() === '') throw new Error('未配置附件保存目录。');
  const wanted = Array.isArray(indices) ? new Set(indices) : null;
  const selected = attachments.filter((_attachment, index) => wanted === null || wanted.has(index + 1));
  if (selected.length > MAX_ATTACHMENTS_PER_SAVE) {
    throw new Error(`一次最多保存 ${MAX_ATTACHMENTS_PER_SAVE} 个附件。`);
  }
  if (selected.length === 0) return { dir, saved: [] };
  await mkdir(dir, { recursive: true });
  const saved = [];
  for (const attachment of selected) {
    const size = Buffer.isBuffer(attachment.data) ? attachment.data.length : Number(attachment.size) || 0;
    if (size > MAX_ATTACHMENT_BYTES) throw new Error(`附件超过 25MB，已跳过：${safeFilename(attachment.filename)}`);
    const filename = safeFilename(attachment.filename);
    const target = await uniqueTarget(dir, filename);
    await writeFile(target, attachment.data);
    saved.push({ filename: path.basename(target), path: target, size });
  }
  return { dir, saved };
}

/** Size + SHA-256 fingerprint used to detect a file change after approval. */
export async function fingerprintFile(filePath) {
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(`附件不是文件：${filePath}`);
  const data = await readFile(filePath);
  return {
    path: filePath,
    size: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}
