// Common mailbox providers' IMAP/SMTP endpoints, inferred from the address domain.

const PRESETS = {
  'qq.com': { imapHost: 'imap.qq.com', imapPort: 993, smtpHost: 'smtp.qq.com', smtpPort: 465 },
  'foxmail.com': { imapHost: 'imap.qq.com', imapPort: 993, smtpHost: 'smtp.qq.com', smtpPort: 465 },
  '163.com': { imapHost: 'imap.163.com', imapPort: 993, smtpHost: 'smtp.163.com', smtpPort: 465 },
  '126.com': { imapHost: 'imap.126.com', imapPort: 993, smtpHost: 'smtp.126.com', smtpPort: 465 },
  'yeah.net': { imapHost: 'imap.yeah.net', imapPort: 993, smtpHost: 'smtp.yeah.net', smtpPort: 465 },
  'sina.com': { imapHost: 'imap.sina.com', imapPort: 993, smtpHost: 'smtp.sina.com', smtpPort: 465 },
  'sohu.com': { imapHost: 'imap.sohu.com', imapPort: 993, smtpHost: 'smtp.sohu.com', smtpPort: 465 },
  '139.com': { imapHost: 'imap.139.com', imapPort: 993, smtpHost: 'smtp.139.com', smtpPort: 465 },
  '189.cn': { imapHost: 'imap.189.cn', imapPort: 993, smtpHost: 'smtp.189.cn', smtpPort: 465 },
  'aliyun.com': { imapHost: 'imap.aliyun.com', imapPort: 993, smtpHost: 'smtp.aliyun.com', smtpPort: 465 },
  'gmail.com': { imapHost: 'imap.gmail.com', imapPort: 993, smtpHost: 'smtp.gmail.com', smtpPort: 465 },
  'outlook.com': { imapHost: 'imap-mail.outlook.com', imapPort: 993, smtpHost: 'smtp-mail.office.com', smtpPort: 587 },
  'hotmail.com': { imapHost: 'imap-mail.outlook.com', imapPort: 993, smtpHost: 'smtp-mail.office.com', smtpPort: 587 },
  'live.com': { imapHost: 'imap-mail.outlook.com', imapPort: 993, smtpHost: 'smtp-mail.office.com', smtpPort: 587 },
  'icloud.com': { imapHost: 'imap.mail.me.com', imapPort: 993, smtpHost: 'smtp.mail.me.com', smtpPort: 465 },
};

/** Infer IMAP/SMTP endpoints for an email address; null when the domain is unknown. */
export function providerPreset(email) {
  const domain = String(email).split('@')[1]?.toLowerCase().trim();
  if (!domain) return undefined;
  return PRESETS[domain];
}
