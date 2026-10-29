// Mail Assistant — browser half.
// The module id MUST equal the installed package name (see package.json), so
// this file ships with the same identity as the npm package.
// Registers the sidebar glyph, the workbench page, and the Settings section
// (multi-account config + per-account credentials).

import { TYPERT_REMOTE } from './lib/remote.js';

window.__ModuleLoader__.load({
  id: '@zhanghonghu13/dsh-mail-assistant',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Dictionary namespace owned by this plugin. */
    const NS = 'mailAssistant';
    const PASSWORD_REF = 'MAIL_ASSISTANT_PASSWORD';
    const passwordRefFor = (id) => (id === 'default' ? PASSWORD_REF : `${PASSWORD_REF}__${id}`);

    const en = {
      panelLabel: 'Mail',
      panelTitle: '✉️ Mail Assistant',
      workbenchIntro: 'Your mailbox at a glance — read-only unless you confirm in the conversation.',
      homeIntro: 'Let the agent summarize, find and draft mail. Bodies are shown as plain text, and every send asks for your confirmation.',
      tabHome: 'Assistant',
      tabMail: 'Mail',
      tabDrafts: 'Drafts',
      tabActivity: 'Activity',
      briefTitle: 'Mail brief',
      briefSubtitle: 'Local rules · last {days} days · headers only',
      briefBadge: 'Local preview',
      briefGenerate: 'Generate brief',
      briefRefresh: 'Refresh brief',
      briefEmpty: 'No brief yet. Generate a local preview, then ask the agent for a body-aware summary.',
      briefNoAttention: 'The local rules found nothing urgent.',
      briefNoImportant: 'No important messages in this range.',
      briefNoDeadline: 'No deadline hints in subjects.',
      aiBriefBadge: 'AI brief',
      briefAiSubtitle: 'AI analysis · last {days} days',
      briefAi: 'Generate AI brief',
      briefAiHint: 'Uses the default DSH model to read a bounded set of message bodies.',
      briefAiRegenerate: 'Regenerate AI brief',
      briefAiRunning: 'Reading and analyzing mail…',
      briefAiUnavailable: 'AI brief is unavailable right now.',
      briefAiPrivacy: 'AI brief uses the default DSH model. Only the messages shown as read are sent for analysis.',
      briefAiModel: 'Model',
      briefAiRead: 'Read {read} of {scanned} headers',
      briefAiPartial: 'Only the read messages above were analyzed; the rest were not.',
      briefAiReply: 'Suggested reply',
      briefAiTodo: 'To handle',
      briefAiInfo: 'Information',
      briefAiNoItems: 'No items need attention in this range.',
      briefAiActions: 'Suggested actions',
      toBeHandled: 'To handle',
      suggestedReply: 'Suggested reply',
      briefRange: 'Range',
      briefScanned: 'Scanned {count} headers',
      daysShort: '{count}d',
      setupTitle: 'Connect a mailbox first',
      setupBody: 'The assistant can read mail only after an account is configured. Sending stays in the conversation and always asks for confirmation.',
      setupStep1: 'Open Settings → Mail Assistant from the sidebar foot.',
      setupStep2: 'Add your address and a dedicated IMAP password.',
      setupStep3: 'Come back here and test the connection.',
      setupPath: 'Settings path: sidebar foot → Settings → Mail Assistant.',
      reloadConfig: 'Reload configuration',
      connectionIssue: 'Mailbox needs attention',
      connectionIssueHint: 'Check the address, dedicated password, and server settings before retrying.',
      mailViewTitle: 'Mail',
      mailViewHint: 'A focused place to search and read; the assistant remains the default view.',
      mailSearchPlaceholder: 'Search subject, sender or body…',
      mailSearchAdvanced: 'More filters',
      mailSearchHide: 'Fewer filters',
      mailSearchClear: 'Clear search',
      mailSearchResults: 'Search results',
      mailSearchHint: 'Press Enter to search. Text search may be incomplete on some providers.',
      mailReaderEmptyTitle: 'Select a message',
      mailReaderEmptyBody: 'Choose a message on the left, or ask the assistant to find one for you.',
      mailPlainTextNotice: 'Plain text only. Links and instructions inside mail are not executed.',
      messageFrom: 'From',
      messageTo: 'To',
      messageCc: 'Cc',
      messageDate: 'Date',
      messageNoBody: 'This message has no readable text body.',
      messageExpand: 'Show full text',
      messageCollapse: 'Show less',
      messageChars: '{count} characters',
      draftPreview: 'Preview body',
      activityHint: 'Recent actions and the optional in-window reminder. No message bodies are stored here.',
      allMail: 'All mail',
      searchScope: 'Search',
      openMail: 'Browse mail',
      totalMessages: 'Total',
      settingsLabel: 'Mail Assistant',
      account: 'Account',
      accounts: 'Accounts',
      accountId: 'Account id',
      addAccount: 'Add account',
      removeAccount: 'Remove account',
      accountNote: 'Removing an account only edits this list; the saved password stays in the credential store.',
      email: 'Email address',
      emailHint: 'For QQ, 163, and similar providers use the IMAP authorization code, not the login password.',
      password: 'Dedicated password',
      passwordHint: 'Stored in the Harness credential store, not the settings file. Leave blank to keep the current password.',
      passwordStatus: 'Password saved',
      passwordUnset: 'No password saved',
      checkingPassword: 'Checking…',
      clearPassword: 'Clear saved password',
      senderName: 'Sender display name',
      senderNameHint: 'Shown to recipients; defaults to the bare address.',
      imapServer: 'IMAP server',
      imapServerHint: 'Auto-detected for common providers; leave blank to use the default.',
      imapPlaceholder: 'e.g. imap.qq.com',
      smtpServer: 'SMTP server',
      smtpServerHint: 'Auto-detected for common providers; leave blank to use the default.',
      smtpPlaceholder: 'e.g. smtp.qq.com',
      downloadDir: 'Attachment directory',
      downloadDirHint: 'Where attachments are saved; the workbench save button needs this directory.',
      downloadDirPlaceholder: 'e.g. D:\\MailAttachments',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      saveFailed: 'The Host did not accept these values; please review and retry.',
      invalidAccounts: 'Each account needs a unique id and a valid email address.',
      readOnly: 'This deployment stores settings read-only.',
      unavailable: 'Mail Assistant settings are unavailable until the Host serves them.',
      securityNote: 'Passwords are stored in the local Harness credential store and are passed to your mail provider only.',
      sendingNeedsApproval: 'Every outgoing message asks for your confirmation before it is sent.',
      statusTitle: 'Mailbox status',
      statusUnknown: 'Unknown',
      statusIncomplete: 'Configuration incomplete',
      statusUntested: 'Not tested',
      statusConnected: 'Connected',
      statusFailed: 'Connection failed',
      statusUnavailable: 'Status unavailable',
      connection: 'Connection',
      credentials: 'Credentials',
      checkConnection: 'Test connection',
      checking: 'Testing…',
      testUnavailable: 'Connection test unavailable',
      testedAt: 'Last connection test',
      statsTitle: 'Mailbox statistics',
      unread: 'Unread',
      today: 'Today',
      attention: 'Needs attention',
      total: 'Total',
      statsFailed: 'Statistics failed — no numbers are shown.',
      statsScope: 'Scope',
      computedAt: 'Computed',
      quickTitle: 'Quick actions',
      refreshMail: 'Refresh mail',
      refreshStats: 'Refresh stats',
      refreshList: 'Refresh',
      searchMail: 'Search mail',
      searchMailHint: 'Search subjects, senders and bodies.',
      composeMail: 'Compose mail',
      summaryMail: 'Local digest',
      drafts: 'Drafts',
      operationLog: 'Activity',
      actionFailed: 'Action failed. Please try again.',
      mailRequestFailed: 'Unable to load mailbox data. Check the connection and retry.',
      copyHint: 'Copies a prompt; paste it into a conversation.',
      copiedHint: 'Prompt copied. Paste it into a conversation; nothing was sent.',
      copyUnavailable: 'Could not access the clipboard. Select and copy the prompt below, then paste it into a conversation.',
      promptRefresh: 'Please list my recent emails.',
      promptCompose: 'Help me draft an email. Ask me for the recipient and details before sending.',
      promptSearch: 'Help me search my emails. Ask me what to search for.',
      promptDigest: 'Please read my emails from the last {days} days with uid and write a Chinese brief with source uids.',
      promptReply: 'Please read mail uid {uid} and draft a reply for me; do not send until I confirm.',
      promptForward: 'Please read mail uid {uid} and draft a forward; ask me for the recipients first.',
      recentTitle: 'Recent mail',
      recentEmpty: 'No recent mail.',
      recentNotLoaded: 'No mail loaded yet. Select Refresh mail to load it.',
      recentUnavailable: 'Recent mail is unavailable until the Host provides it.',
      loading: 'Loading…',
      dataFailed: 'Could not load this information.',
      retry: 'Retry',
      retryHint: 'Check the mailbox settings and connection, then try again.',
      noSubject: '(No subject)',
      noSender: 'Unknown sender',
      readMail: 'Read',
      loadMore: 'Load more',
      messageTitle: 'Message',
      closeMessage: 'Close',
      truncated: 'Message truncated',
      attachments: 'Attachments',
      attachmentSize: 'bytes',
      saveAttachment: 'Save',
      saveUnavailable: 'Configure an attachment directory in Settings to save attachments.',
      savedTo: 'Saved to',
      replyPrompt: 'Reply',
      forwardPrompt: 'Forward',
      searchTitle: 'Search mail',
      searchQuery: 'Keyword',
      searchFrom: 'From',
      searchTo: 'To',
      searchSince: 'Since',
      searchBefore: 'Before',
      searchUnreadOnly: 'Unread only',
      searchCategory: 'Category',
      categoryAny: 'Any category',
      categoryWork: 'Work',
      categoryNotification: 'Notification',
      categoryPersonal: 'Personal',
      categoryPromotion: 'Promotion',
      categoryOther: 'Other',
      runSearch: 'Search',
      searchNeedsCriteria: 'Enter at least one condition (or choose unread only).',
      clearSearch: 'Clear',
      searchEmpty: 'No matching mail in this range.',
      searchSourceServer: 'Server search',
      searchSourceHeader: 'Header scan (partial)',
      searchScanned: 'scanned',
      digestTitle: 'Local digest',
      digestHint: 'Rule-based: reads subjects, senders and read flags only. No message body, no model call.',
      digestDays: 'Range',
      digestGenerate: 'Generate digest',
      digestNeedsAttention: 'Needs attention',
      digestImportant: 'Important',
      digestDeadlines: 'Deadline hints',
      digestSuggestions: 'Suggested actions',
      digestEmpty: 'Nothing in this range.',
      digestConfidenceExplicit: 'explicit',
      digestConfidenceInferred: 'unconfirmed',
      copyDigestPrompt: 'Copy AI brief prompt',
      draftsTitle: 'Drafts',
      draftsEmpty: 'No drafts yet. Start a new draft or ask the agent to create one.',
      draftsNotSent: 'Drafts are not sent from this page. Confirm in the conversation so the approval step stays in control.',
      draftCreatedAt: 'Created',
      draftUpdatedAt: 'Updated',
      draftInReplyTo: 'In reply to',
      newDraft: 'New mail',
      draftEditorTitle: 'Draft',
      draftNewTitle: 'New mail',
      draftRecipient: 'To',
      draftCc: 'Cc',
      draftBcc: 'Bcc',
      draftSubject: 'Subject',
      draftBody: 'Body',
      draftSave: 'Save draft',
      draftSaving: 'Saving…',
      draftSaved: 'Saved',
      draftUnsaved: 'Unsaved changes',
      draftCancel: 'Cancel',
      draftDelete: 'Delete',
      draftDeleteConfirm: 'Delete this draft?',
      draftSendHint: 'Sending stays in the conversation and always asks for your confirmation.',
      draftNoSubject: '(no subject)',
      draftSourceManual: 'Manual',
      draftSourceAi: 'AI draft',
      draftSourceReply: 'Reply',
      draftSourceForward: 'Forward',
      draftStatusReview: 'Needs review',
      draftStatusSaved: 'Saved',
      draftBack: 'Back to drafts',
      draftAccount: 'Account',
      draftAttachmentsReadonly: 'Attachments are kept from the original draft; editing attachments comes next.',
      logTitle: 'Recent activity',
      logEmpty: 'No activity recorded yet.',
      logOk: 'ok',
      logFailed: 'failed',
      reminderTitle: 'Unread reminder',
      reminderEnable: 'Poll while this panel is open',
      reminderMinutes: 'Interval (minutes)',
      reminderNotice: 'New mail since the last check: {count} unread.',
      reminderAttention: '{count} messages now need attention.',
      reminderScope: 'Only runs while this DSH window is open; there is no background push.',
      guidance: 'Configure your mailbox in Settings → Mail Assistant.',
      missingAddress: 'Email address missing',
      missingPassword: 'Password missing',
      notAvailable: 'Unavailable',
      refreshedAt: 'Last successful refresh',
      secondsAgo: 'just now',
    };

    const zh = {
      panelLabel: '邮件助手',
      panelTitle: '✉️ 邮件助手',
      workbenchIntro: '你的邮箱一目了然——只有你在对话中确认后才会发送邮件。',
      homeIntro: '让 AI 帮你总结、查找和起草邮件；正文只按纯文本展示，发送前始终需要你确认。',
      tabHome: '助手',
      tabMail: '邮件',
      tabDrafts: '草稿',
      tabActivity: '记录',
      briefTitle: '邮件简报',
      briefSubtitle: '本地规则 · 最近 {days} 天 · 只读头部',
      briefBadge: '本地预览',
      briefGenerate: '生成简报',
      briefRefresh: '刷新简报',
      briefEmpty: '还没有生成简报。可先看本地预览，再让 AI 读取正文生成结论。',
      briefNoAttention: '本地规则没有发现需要立即处理的邮件。',
      briefNoImportant: '该范围内暂无重要信息。',
      briefNoDeadline: '主题中没有截止日期线索。',
      aiBriefBadge: 'AI 简报',
      briefAiSubtitle: 'AI 分析 · 最近 {days} 天',
      briefAi: '生成 AI 简报',
      briefAiHint: '使用 DSH 默认模型读取有限数量的正文后生成。',
      briefAiRegenerate: '重新生成 AI 简报',
      briefAiRunning: '正在读取和分析邮件…',
      briefAiUnavailable: '暂时无法生成 AI 简报。',
      briefAiPrivacy: 'AI 简报使用 DSH 默认模型；只会分析显示为「已读取」的邮件正文。',
      briefAiModel: '模型',
      briefAiRead: '已读取 {read}/{scanned} 封头部',
      briefAiPartial: '只分析了上方已读取的邮件，其余邮件未做正文分析。',
      briefAiReply: '建议回复',
      briefAiTodo: '待处理',
      briefAiInfo: '信息',
      briefAiNoItems: '该范围内没有需要处理的邮件。',
      briefAiActions: '建议行动',
      toBeHandled: '待我处理',
      suggestedReply: '建议回复',
      briefRange: '范围',
      briefScanned: '已扫描 {count} 封头部',
      daysShort: '{count} 天',
      setupTitle: '先连接一个邮箱',
      setupBody: '配置账户后助手才能读取邮件；发送仍在对话中完成，并且每次都会请求确认。',
      setupStep1: '从左侧栏底部打开「设置 → 邮件助手」。',
      setupStep2: '添加邮箱地址和专用 IMAP 密码。',
      setupStep3: '回到这里测试连接。',
      setupPath: '设置路径：左侧栏底部 → 设置 → 邮件助手。',
      reloadConfig: '重新加载配置',
      connectionIssue: '邮箱需要处理',
      connectionIssueHint: '请检查邮箱地址、专用密码和服务器设置后重试。',
      mailViewTitle: '邮件',
      mailViewHint: '需要搜索或阅读时再进入；默认仍从助手开始。',
      mailSearchPlaceholder: '搜索主题、发件人或正文…',
      mailSearchAdvanced: '更多条件',
      mailSearchHide: '收起条件',
      mailSearchClear: '清除搜索',
      mailSearchResults: '搜索结果',
      mailSearchHint: '按回车搜索；部分邮箱服务商的文本搜索可能不完整。',
      mailReaderEmptyTitle: '选择一封邮件',
      mailReaderEmptyBody: '从左侧选择邮件，或回到助手让 AI 帮你查找。',
      mailPlainTextNotice: '仅按纯文本展示，邮件中的链接和指令不会被执行。',
      messageFrom: '发件人',
      messageTo: '收件人',
      messageCc: '抄送',
      messageDate: '时间',
      messageNoBody: '这封邮件没有可读的文本正文。',
      messageExpand: '展开全文',
      messageCollapse: '收起',
      messageChars: '{count} 字',
      draftPreview: '展开正文',
      activityHint: '最近动作和可选的窗口内提醒；这里不保存正文。',
      allMail: '全部邮件',
      searchScope: '搜索',
      openMail: '浏览邮件',
      totalMessages: '总数',
      settingsLabel: '邮件助手',
      account: '账户',
      accounts: '邮箱账户',
      accountId: '账户 id',
      addAccount: '添加账户',
      removeAccount: '删除账户',
      accountNote: '删除账户只修改列表，不会删除凭据库中已保存的密码。',
      email: '邮箱地址',
      emailHint: 'QQ、163 等邮箱请使用 IMAP 授权码/专用密码，而不是登录密码。',
      password: '专用密码',
      passwordHint: '保存在 Harness 本地凭据库中，不写入设置文件；留空表示保持当前密码不变。',
      passwordStatus: '已保存密码',
      passwordUnset: '未保存密码',
      checkingPassword: '检查中…',
      clearPassword: '清除该账户的密码',
      senderName: '发件人显示名',
      senderNameHint: '收件人看到的名字；留空则显示邮箱地址。',
      imapServer: 'IMAP 服务器',
      imapServerHint: '常见邮箱会自动识别；留空使用默认值。',
      imapPlaceholder: '例如 imap.qq.com',
      smtpServer: 'SMTP 服务器',
      smtpServerHint: '常见邮箱会自动识别；留空使用默认值。',
      smtpPlaceholder: '例如 smtp.qq.com',
      downloadDir: '附件保存目录',
      downloadDirHint: '附件保存位置；工作台的保存按钮需要先填写此目录。',
      downloadDirPlaceholder: '例如 D:\\MailAttachments',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      saveFailed: '本次保存未被接受，请检查后重试。',
      invalidAccounts: '每个账户都需要唯一的 id 和有效的邮箱地址。',
      readOnly: '本部署的设置为只读。',
      unavailable: '邮件助手设置暂不可用。',
      securityNote: '专用密码保存在本机凭据库中，只会在连接邮箱服务器时使用。',
      sendingNeedsApproval: '每一封外发邮件都会先请你确认，批准后才会发出。',
      statusTitle: '邮箱状态',
      statusUnknown: '未知',
      statusIncomplete: '配置不完整',
      statusUntested: '未测试',
      statusConnected: '已连接',
      statusFailed: '连接失败',
      statusUnavailable: '状态不可用',
      connection: '连接状态',
      credentials: '凭据状态',
      checkConnection: '测试连接',
      checking: '测试中…',
      testUnavailable: '连接测试不可用',
      testedAt: '上次连接测试',
      statsTitle: '邮箱统计',
      unread: '未读',
      today: '今日',
      attention: '需关注',
      total: '总数',
      statsFailed: '统计失败，不显示数字。',
      statsScope: '口径',
      computedAt: '统计时间',
      quickTitle: '快捷操作',
      refreshMail: '刷新邮件',
      refreshStats: '刷新统计',
      refreshList: '刷新',
      searchMail: '搜索邮件',
      searchMailHint: '按主题、发件人或正文查找。',
      composeMail: '写邮件',
      summaryMail: '本地摘要',
      drafts: '草稿',
      operationLog: '操作记录',
      actionFailed: '操作失败，请重试。',
      mailRequestFailed: '暂时无法读取邮箱数据，请检查连接后重试。',
      copyHint: '复制指令后，请到对话中粘贴。',
      copiedHint: '指令已复制，请到对话中粘贴；不会自动发送。',
      copyUnavailable: '无法访问剪贴板，请选中并复制下方指令，再到对话中粘贴。',
      promptRefresh: '请帮我查看最近的邮件。',
      promptCompose: '请帮我起草邮件，先询问收件人和具体内容，发送前请我确认。',
      promptSearch: '请帮我搜索邮件，先询问我想搜索的内容。',
      promptDigest: '请读取我最近 {days} 天的邮件（带 uid），生成中文简报，并标注来源 uid。',
      promptReply: '请读取 uid {uid} 的邮件并帮我起草回复，我确认前不要发送。',
      promptForward: '请读取 uid {uid} 的邮件并起草转发，先询问我要发给谁。',
      recentTitle: '最近邮件',
      recentEmpty: '暂无最近邮件。',
      recentNotLoaded: '尚未加载邮件，请点击「刷新邮件」。',
      recentUnavailable: 'Host 尚未提供最近邮件，暂时无法显示。',
      loading: '加载中…',
      dataFailed: '加载失败，请稍后重试。',
      retry: '重试',
      retryHint: '请检查邮箱设置和连接后重试。',
      noSubject: '（无主题）',
      noSender: '未知发件人',
      readMail: '阅读',
      loadMore: '加载更多',
      messageTitle: '邮件正文',
      closeMessage: '关闭',
      truncated: '邮件内容已截断',
      attachments: '附件',
      attachmentSize: '字节',
      saveAttachment: '保存',
      saveUnavailable: '请先在设置中配置附件保存目录。',
      savedTo: '已保存到',
      replyPrompt: '回复',
      forwardPrompt: '转发',
      searchTitle: '搜索邮件',
      searchQuery: '关键词',
      searchFrom: '发件人',
      searchTo: '收件人',
      searchSince: '起始日期',
      searchBefore: '结束日期',
      searchUnreadOnly: '仅未读',
      searchCategory: '分类',
      categoryAny: '全部分类',
      categoryWork: '工作',
      categoryNotification: '通知',
      categoryPersonal: '个人',
      categoryPromotion: '推广',
      categoryOther: '其他',
      runSearch: '搜索',
      searchNeedsCriteria: '请至少填写一个条件（或勾选仅未读）。',
      clearSearch: '清除',
      searchEmpty: '该范围内没有匹配的邮件。',
      searchSourceServer: '服务器搜索',
      searchSourceHeader: '头部扫描（部分）',
      searchScanned: '已扫描',
      digestTitle: '本地摘要',
      digestHint: '规则分析：只读主题、发件人和已读状态，不读正文、不调用模型。',
      digestDays: '范围',
      digestGenerate: '生成摘要',
      digestNeedsAttention: '需要关注',
      digestImportant: '重要信息',
      digestDeadlines: '截止日期线索',
      digestSuggestions: '建议操作',
      digestEmpty: '该范围内没有内容。',
      digestConfidenceExplicit: '明确',
      digestConfidenceInferred: '待确认',
      copyDigestPrompt: '复制 AI 简报指令',
      draftsTitle: '草稿',
      draftsEmpty: '暂无草稿。可以直接新建，或让智能体创建。',
      draftsNotSent: '此页面不发送草稿。请回到对话中确认，让审批步骤保持唯一。',
      draftCreatedAt: '创建时间',
      draftUpdatedAt: '更新时间',
      draftInReplyTo: '回复自',
      newDraft: '新建邮件',
      draftEditorTitle: '草稿',
      draftNewTitle: '新建邮件',
      draftRecipient: '收件人',
      draftCc: '抄送',
      draftBcc: '密送',
      draftSubject: '主题',
      draftBody: '正文',
      draftSave: '保存草稿',
      draftSaving: '保存中…',
      draftSaved: '已保存',
      draftUnsaved: '有未保存修改',
      draftCancel: '取消',
      draftDelete: '删除',
      draftDeleteConfirm: '确定删除这封草稿吗？',
      draftSendHint: '发送仍在对话中完成，并始终需要你确认。',
      draftNoSubject: '（无主题）',
      draftSourceManual: '手动创建',
      draftSourceAi: 'AI 起草',
      draftSourceReply: '回复',
      draftSourceForward: '转发',
      draftStatusReview: '待审核',
      draftStatusSaved: '已保存',
      draftBack: '返回草稿列表',
      draftAccount: '账户',
      draftAttachmentsReadonly: '附件沿用原草稿，附件编辑将在后续版本提供。',
      logTitle: '最近操作',
      logEmpty: '暂无操作记录。',
      logOk: '成功',
      logFailed: '失败',
      reminderTitle: '未读提醒',
      reminderEnable: '面板打开时定时检查',
      reminderMinutes: '间隔（分钟）',
      reminderNotice: '自上次检查以来有新邮件：未读 {count} 封。',
      reminderAttention: '目前有 {count} 封需要关注。',
      reminderScope: '仅在当前 DSH 窗口打开时运行，不是后台推送。',
      refreshedAt: '上次成功刷新',
      guidance: '请在「设置 → 邮件助手」中配置邮箱。',
      missingAddress: '未填写邮箱地址',
      missingPassword: '未保存密码',
      notAvailable: '不可用',
      secondsAgo: '刚刚',
    };

    // ---------------------------------------------------------------- styles
    const css = `
      .ma-panel{display:flex;flex-direction:column;align-items:center;padding:48px 24px;overflow-y:auto;height:100%}
      .ma-card,.ma-box{min-width:0;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);border-radius:14px}
      .ma-workbench{height:100%;overflow:auto;box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);padding:24px clamp(16px,3.5vw,40px) 40px;font-family:inherit}
      .ma-workbench *{box-sizing:border-box}
      .ma-shell{max-width:1060px;margin:0 auto}
      .ma-title{display:flex;align-items:center;gap:12px;color:var(--dsw-alias-label-primary);font-size:22px;font-weight:600;margin:0;line-height:1.3}
      .ma-intro{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.65;margin:3px 0 0}
      .ma-muted{color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.55;margin:0}
      .ma-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:16px}
      .ma-brand{display:flex;align-items:flex-start;gap:12px;min-width:0}
      .ma-brandMark{display:grid;place-items:center;width:38px;height:38px;flex:none;border-radius:11px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-brand-primary)}
      .ma-brandText{min-width:0}
      .ma-topMeta{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding-top:2px}
      .ma-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l3);border-radius:999px;padding:3px 10px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;white-space:nowrap;background:transparent}
      .ma-pillOk{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-border-l3)}
      .ma-pillWarn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-border-l3)}
      .ma-pillIdle{color:var(--dsw-alias-label-secondary)}
      .ma-accountPill{max-width:250px;overflow:hidden;text-overflow:ellipsis;display:inline-block}
      .ma-accountSelect{border:1px solid var(--dsw-alias-border-l3);border-radius:999px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:3px 9px;max-width:230px}
      .ma-accountSelect:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
      .ma-tabs{display:flex;align-items:center;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l2);margin-bottom:16px;overflow-x:auto}
      .ma-tab{appearance:none;border:0;border-bottom:2px solid transparent;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;padding:9px 12px;cursor:pointer;white-space:nowrap}
      .ma-tab:hover{color:var(--dsw-alias-label-primary)}
      .ma-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary)}
      .ma-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .ma-brief{padding:20px 22px}
      .ma-briefHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .ma-briefHeading{display:flex;align-items:flex-start;gap:11px;min-width:0}
      .ma-spark{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-brand-primary);font-size:17px;line-height:1}
      .ma-briefTitle{font-size:16px;line-height:1.35;font-weight:600;margin:0;color:var(--dsw-alias-label-primary)}
      .ma-briefSub{font-size:12px;line-height:1.5;margin:3px 0 0;color:var(--dsw-alias-label-secondary)}
      .ma-briefTools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .ma-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--dsw-alias-border-l2);border-radius:10px;overflow:hidden;margin:16px 0 18px;background:var(--dsw-alias-bg-base)}
      .ma-metric{padding:11px 14px;min-width:0}
      .ma-metric + .ma-metric{border-left:1px solid var(--dsw-alias-border-l2)}
      .ma-metricValue{font-size:21px;line-height:1.2;font-weight:600;color:var(--dsw-alias-label-primary)}
      .ma-metricLabel{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);margin-top:2px}
      .ma-briefGrid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:22px}
      .ma-briefAside{min-width:0;border-left:1px solid var(--dsw-alias-border-l1);padding-left:22px}
      .ma-briefSection{min-width:0}
      .ma-briefSection + .ma-briefSection{border-top:1px solid var(--dsw-alias-border-l1);margin-top:12px;padding-top:12px}
      .ma-sectionTitle{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;line-height:1.5;margin:0 0 4px;color:var(--dsw-alias-label-primary);text-transform:none}
      .ma-sectionCount{font-weight:400;color:var(--dsw-alias-label-tertiary)}
      .ma-briefList{list-style:none;margin:0;padding:0}
      .ma-briefItem{padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .ma-briefItem:last-child{border-bottom:0}
      .ma-briefTop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
      .ma-aiSummaryBox{padding:2px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-bottom:6px}
      .ma-aiSummary{font-size:13px;line-height:1.7;color:var(--dsw-alias-label-primary);margin:0 0 4px;overflow-wrap:anywhere}
      .ma-briefSubject{display:block;width:100%;text-align:left;border:0;background:none;padding:0;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:600;line-height:1.5;cursor:pointer;overflow-wrap:anywhere}
      .ma-briefSubject:hover{color:var(--dsw-alias-brand-primary);text-decoration:underline}
      .ma-briefMeta{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);margin:2px 0 0;overflow-wrap:anywhere}
      .ma-briefEmpty{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin:6px 0 0}
      .ma-briefEmptyState{margin:4px 0 0}
      .ma-briefFooter{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l1);margin-top:16px;padding-top:14px}
      .ma-briefNotice{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);max-width:62ch;margin:0}
      .ma-briefNotice p{margin:0 0 3px}
      .ma-actionsRow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
      .ma-actionCard{display:flex;flex-direction:column;align-items:flex-start;gap:5px;text-align:left;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;padding:13px 14px;cursor:pointer;min-height:76px}
      .ma-actionCard:hover:enabled{background:var(--dsw-alias-interactive-bg-hover)}
      .ma-actionCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
      .ma-actionCard:disabled{cursor:not-allowed;opacity:.6}
      .ma-actionIcon{font-size:16px;line-height:1;color:var(--dsw-alias-brand-primary)}
      .ma-actionLabel{font-size:13px;font-weight:600;line-height:1.4}
      .ma-actionHint{font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
      .ma-banner{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dsw-alias-state-warn-primary);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:11px 14px;margin-bottom:14px}
      .ma-bannerText{min-width:0}
      .ma-bannerTitle{font-size:13px;font-weight:600;line-height:1.5;color:var(--dsw-alias-label-primary);margin:0}
      .ma-bannerBody{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);margin:2px 0 0;overflow-wrap:anywhere}
      .ma-setup{padding:24px;max-width:720px}
      .ma-setupTitle{font-size:17px;line-height:1.4;font-weight:600;margin:0 0 6px;color:var(--dsw-alias-label-primary)}
      .ma-setupSteps{margin:14px 0 0;padding-left:20px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.8}
      .ma-setupPath{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin:14px 0 0}
      .ma-view{display:flex;flex-direction:column;gap:13px;min-width:0}
      .ma-viewHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;min-width:0}
      .ma-viewTitle{font-size:16px;line-height:1.4;font-weight:600;margin:0;color:var(--dsw-alias-label-primary)}
      .ma-viewHint{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);margin:2px 0 0}
      .ma-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .ma-searchForm{display:flex;flex-direction:column;gap:9px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
      .ma-searchRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .ma-searchInputWrap{flex:1;min-width:180px}
      .ma-searchInput{width:100%;height:34px;border:1px solid var(--dsw-alias-border-l4);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:5px 10px}
      .ma-searchInput:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
      .ma-searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}
      .ma-filterGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      .ma-field{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:var(--dsw-alias-label-secondary);min-width:0}
      .ma-field input,.ma-field select{width:100%;border:1px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:5px 8px;min-width:0;height:31px}
      .ma-field input[type="checkbox"]{width:auto;height:auto;margin:5px 0 0;padding:0;border:0;background:transparent}
      .ma-field input:focus,.ma-field select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
      .ma-searchActions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .ma-searchHint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary);margin:0}
      .ma-split{display:grid;grid-template-columns:minmax(290px,350px) minmax(0,1fr);gap:13px;align-items:start;min-width:0}
      .ma-listPane{overflow:hidden}
      .ma-listHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);min-height:45px}
      .ma-listTitle{font-size:13px;line-height:1.4;font-weight:600;margin:0;color:var(--dsw-alias-label-primary)}
      .ma-listSub{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);margin:1px 0 0}
      .ma-listScroll{max-height:calc(100vh - 330px);overflow:auto}
      .ma-mailList{list-style:none;margin:0;padding:0}
      .ma-mailItem{border-bottom:1px solid var(--dsw-alias-border-l1)}
      .ma-mailItem:last-child{border-bottom:0}
      .ma-mailItemRow{display:flex;width:100%;gap:9px;text-align:left;border:0;background:transparent;padding:10px 13px;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;min-width:0}
      .ma-mailItemRow:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .ma-mailItemRow:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .ma-mailItemRow:disabled{opacity:.6;cursor:default}
      .ma-mailItemRow[aria-current="true"]{background:var(--dsw-alias-interactive-bg-hover-accent)}
      .ma-unreadDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);flex:none;margin-top:7px}
      .ma-unreadSpacer{width:6px;flex:none}
      .ma-mailItemBody{min-width:0;flex:1}
      .ma-mailItemTop{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
      .ma-mailFrom{font-size:12.5px;line-height:1.45;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ma-mailDate{font-size:11px;line-height:1.45;color:var(--dsw-alias-label-tertiary);flex:none}
      .ma-mailSubject{font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ma-mailMeta{display:flex;align-items:center;gap:5px;margin-top:3px;min-height:16px}
      .ma-badge{border-radius:999px;padding:1px 7px;font-size:10.5px;line-height:16px;border:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);display:inline-block;white-space:nowrap}
      .ma-badgeSet{color:var(--dsw-alias-state-success-primary)}
      .ma-badgeQuiet{font-size:10px;line-height:15px;padding:0 6px;color:var(--dsw-alias-label-tertiary)}
      .ma-listFooter{padding:9px 13px;border-top:1px solid var(--dsw-alias-border-l1);background:transparent}
      .ma-reader{overflow:hidden;position:sticky;top:12px;min-width:0}
      .ma-readerHead{padding:16px 18px 13px;border-bottom:1px solid var(--dsw-alias-border-l2)}
      .ma-readerTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;min-width:0}
      .ma-readerHeading{min-width:0;flex:1}
      .ma-readerSubject{font-size:16px;line-height:1.5;font-weight:600;margin:0;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
      .ma-readerMeta{display:grid;grid-template-columns:auto minmax(0,1fr);gap:3px 10px;margin:10px 0 0;font-size:12px;line-height:1.55}
      .ma-metaLabel{color:var(--dsw-alias-label-tertiary)}
      .ma-metaValue{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
      .ma-readerBody{padding:16px 18px;font-size:13.5px;line-height:1.75;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;max-width:76ch;width:100%;margin:0 auto;background:var(--dsw-alias-bg-overlay);max-height:calc(100vh - 430px);overflow:auto}
      .ma-readerBody.isCollapsed{max-height:280px;overflow:hidden}
      .ma-readerBody.isCollapsed::after{content:"";display:block;height:22px}
      .ma-readerActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0;max-width:100%}
      .ma-readerNote{padding:0 18px 13px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);margin:0}
      .ma-readerEmpty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:260px;padding:28px 22px;color:var(--dsw-alias-label-secondary)}
      .ma-readerEmptyIcon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);margin-bottom:10px}
      .ma-readerEmptyTitle{font-size:14px;font-weight:600;line-height:1.5;margin:0;color:var(--dsw-alias-label-primary)}
      .ma-readerEmptyBody{font-size:12px;line-height:1.6;margin:4px 0 0;max-width:38ch}
      .ma-attachmentBox{border-top:1px solid var(--dsw-alias-border-l1);padding:12px 18px 15px}
      .ma-attachmentTitle{font-size:12px;font-weight:600;line-height:1.5;margin:0 0 5px;color:var(--dsw-alias-label-primary)}
      .ma-attachmentList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
      .ma-attachmentItem{display:flex;align-items:center;gap:8px;min-width:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
      .ma-attachmentName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ma-draft{padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .ma-draft:last-child{border-bottom:0}
      .ma-draftSubject{font-size:13px;font-weight:600;line-height:1.5;margin:0;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
      .ma-draftMeta{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary);margin:2px 0 0;overflow-wrap:anywhere}
      .ma-draftBody{font-size:12.5px;line-height:1.65;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0 0;max-height:8.5em;overflow:hidden}
      .ma-draftDetails summary{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-brand-primary);cursor:pointer;margin-top:5px}
      .ma-draftTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .ma-draftActions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:8px}
      .ma-draftFormCard{padding:18px 20px}
      .ma-draftFields{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .ma-fieldWide{grid-column:1/-1}
      .ma-textarea{width:100%;min-height:240px;resize:vertical;border:1px solid var(--dsw-alias-border-l4);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.7;padding:9px 11px}
      .ma-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
      .ma-draftFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l1);margin-top:14px;padding-top:12px}
      .ma-logList{list-style:none;margin:0;padding:0}
      .ma-logItem{display:flex;align-items:baseline;gap:8px;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
      .ma-logItem:last-child{border-bottom:0}
      .ma-logTime{color:var(--dsw-alias-label-tertiary);flex:none}
      .ma-logOk{color:var(--dsw-alias-state-success-primary)}
      .ma-logFailed{color:var(--dsw-alias-state-error-primary)}
      .ma-reminderCard{border-top:1px solid var(--dsw-alias-border-l1);margin-top:12px;padding-top:12px}
      .ma-inlineLabel{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
      .ma-inlineSelect{border:1px solid var(--dsw-alias-border-l4);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:2px 6px;margin-left:4px}
      .ma-form{display:flex;flex-direction:column;width:100%}
      .ma-row{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
      .ma-rowLabel{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
      .ma-rowTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
      .ma-rowHint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
      .ma-control{display:flex;align-items:center;gap:8px;flex-shrink:0}
      .ma-input{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-base);min-height:32px;min-width:220px;color:var(--dsw-alias-label-primary);font:inherit;padding:4px 10px;box-sizing:border-box}
      .ma-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
      .ma-portInput{min-width:88px;text-align:right}
      .ma-button{border:1px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:6px 14px;cursor:pointer}
      .ma-button:hover:enabled{background:var(--dsw-alias-interactive-bg-hover)}
      .ma-button:disabled{opacity:.55;cursor:default}
      .ma-primaryButton{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
      .ma-primaryButton:hover:enabled{background:var(--dsw-alias-interactive-bg-hover-accent)}
      .ma-smallButton{font-size:12px;padding:3px 9px}
      .ma-actions{display:flex;align-items:center;gap:12px;padding:16px 0;flex-wrap:wrap}
      .ma-saveState{color:var(--dsw-alias-label-secondary);font-size:13px}
      .ma-error{color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:1.5}
      .ma-note{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:12px 0 0}
      .ma-section{display:flex;flex-direction:column;width:100%;flex:1}
      .ma-sectionList{display:flex;flex-direction:column;gap:5px;margin:8px 0 0;padding-left:18px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.6}
      .ma-empty{padding:8px 0}
      .ma-toast{border-left:3px solid var(--dsw-alias-brand-primary);padding:8px 12px;margin:8px 0 0;background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:1.55}
      .ma-notices{display:flex;flex-direction:column;gap:6px;margin-top:12px}
      .ma-footerNote{display:flex;align-items:flex-start;gap:7px;font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);margin:14px 0 0}
      .ma-linkButton{border:0;background:none;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;cursor:pointer;padding:1px 2px;text-align:left}
      .ma-linkButton:hover{text-decoration:underline}
      .ma-summaryText{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.7;max-height:13em;overflow:auto;margin:8px 0 0}
      @media(max-width:880px){.ma-briefGrid{grid-template-columns:1fr}.ma-briefAside{border-left:0;padding-left:0;border-top:1px solid var(--dsw-alias-border-l1);padding-top:14px;margin-top:10px}.ma-actionsRow{grid-template-columns:1fr 1fr}.ma-split{grid-template-columns:1fr}.ma-reader{position:static}.ma-readerBody{max-height:none}.ma-listScroll{max-height:360px}.ma-filterGrid{grid-template-columns:1fr 1fr}.ma-topbar{flex-direction:column;gap:10px}.ma-topMeta{justify-content:flex-start}.ma-workbench{padding:20px 14px 32px}}
      @media(max-width:560px){.ma-actionsRow{grid-template-columns:1fr}.ma-metrics{grid-template-columns:1fr 1fr}.ma-metric:nth-child(3){border-left:0;border-top:1px solid var(--dsw-alias-border-l2)}.ma-filterGrid{grid-template-columns:1fr}.ma-searchRow{align-items:stretch}.ma-searchRow > *{flex:1}.ma-row{flex-direction:column;gap:10px}.ma-control{flex-wrap:wrap;max-width:100%}.ma-input{min-width:0;max-width:100%}.ma-accountSelect{max-width:100%}.ma-draftFields{grid-template-columns:1fr}.ma-fieldWide{grid-column:auto}}
    `;
    const cssTag = '@local/dsh-mail-assistant/styles';
    if (typeof document !== 'undefined') {
      let tag = document.querySelector(`style[data-plugin-css="${cssTag}"]`);
      if (tag === null || tag === undefined) {
        tag = document.createElement('style');
        tag.dataset.pluginCss = cssTag;
        document.head.appendChild(tag);
      }
      // HMR and repeated module loads must refresh the existing tag too.
      tag.textContent = css;
    }

    // ---------------------------------------------------------------- helpers
    function makeStore(initial) {
      let value = initial;
      const listeners = new Set();
      return {
        getSnapshot: () => value,
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
        set(next) {
          if (Object.is(next, value)) return;
          value = next;
          for (const listener of listeners) listener();
        },
      };
    }

    function useStore(store, selector = (value) => value) {
      const read = () => selector(store.getSnapshot());
      return React.useSyncExternalStore(
        (listener) => store.subscribe(listener),
        read,
        read,
      );
    }

    /** Envelope glyph for the sidebar rail; props: {size, active}. */
    function MailGlyph({ size = 18, active = false }) {
      const px = Math.max(12, Math.min(28, Number(size) || 18));
      return h('svg', {
        viewBox: '0 0 64 64',
        width: px,
        height: px,
        'aria-hidden': true,
        style: {
          display: 'block',
          color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
        },
      },
      h('rect', {
        x: 4, y: 14, width: 56, height: 38, rx: 6,
        fill: 'none', stroke: 'currentColor', strokeWidth: 5,
      }),
      h('path', {
        d: 'M8 20 L32 40 L56 20',
        fill: 'none', stroke: 'currentColor', strokeWidth: 5,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M42 10 q6 -6 12 -1 q6 5 -1 11 z',
        fill: 'currentColor', opacity: 0.9,
      }));
    }

    /** Render failures become a visible message instead of a blank slot. */
    class RenderBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      componentDidCatch(error) {
        console.error('[mail-assistant] page render failed', error);
      }

      render() {
        if (this.state.error) {
          return h('div', { className: 'ma-section' },
            h('p', { className: 'ma-error', role: 'alert' },
              `邮件助手界面渲染失败：${String(this.state.error?.message ?? this.state.error)}`));
        }
        return this.props.children;
      }
    }

    function guarded(Component) {
      return function Guarded(props) {
        return h(RenderBoundary, null, h(Component, props));
      };
    }

    const FALLBACK_SCOPE_STORE = makeStore({ status: 'unavailable', revision: 0, writable: false, value: {}, base: {}, user: {} });
    const FALLBACK_PASSWORD_STORE = makeStore({ configured: false, known: false });
    const FALLBACK_WORKBENCH_STORE = makeStore({});
    const identityTranslate = (key) => key;

    const CATEGORY_LABEL_KEYS = {
      work: 'categoryWork', notification: 'categoryNotification', personal: 'categoryPersonal',
      promotion: 'categoryPromotion', other: 'categoryOther',
    };

    function formatTime(iso, locale) {
      if (typeof iso !== 'string') return '';
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      try { return date.toLocaleString(locale === 'zh' ? 'zh-CN' : undefined); } catch { return date.toISOString(); }
    }

    /** Compact date for list rows: time today, month/day this year, date otherwise. */
    function formatListDate(iso, locale) {
      if (typeof iso !== 'string') return '';
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      const now = new Date();
      const tag = locale === 'zh' ? 'zh-CN' : undefined;
      try {
        if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
        }
        if (date.getFullYear() === now.getFullYear()) {
          return date.toLocaleDateString(tag, { month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString(tag, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return date.toISOString().slice(0, 10);
      }
    }

    /** Show the display name when present; the full address stays in the title. */
    function senderLabel(value) {
      const text = String(value || '').trim();
      if (text === '') return '';
      const first = text.split(',')[0].trim();
      const match = /^(.*?)\s*<([^>]+)>\s*$/.exec(first);
      if (match) return (match[1].replace(/^"|"$/g, '').trim() || match[2]).trim();
      return first;
    }

    function formatBytes(value) {
      const size = Number(value);
      if (!Number.isFinite(size) || size < 0) return '';
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    function looksLikeCssTemplate(text) {
      const selectors = text.match(/(?:^|\n)\s*(?:#outlook\s+a|body|table|td|img|p|@media|@import|\.mj-[\w-]+|\.moz-[\w-]+)[^\n{]*\{/gim) || [];
      return selectors.length >= 2 && (text.match(/[{}]/g) || []).length >= 4;
    }

    function stripBalancedCssBlocks(text) {
      let output = '';
      let depth = 0;
      for (const char of text) {
        if (char === '{') { depth += 1; continue; }
        if (char === '}' && depth > 0) { depth -= 1; continue; }
        if (depth === 0) output += char;
      }
      return output.replace(/^\s*(?:#outlook\s+a|body|table|td|img|p|@media|@import|\.mj-[\w-]+|\.moz-[\w-]+)[^\n]*$/gim, '');
    }

    /** Normalize a decoded body for the reading pane and hide template CSS noise. */
    function cleanBodyText(value) {
      let text = String(value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\u0000/g, '');
      if (looksLikeCssTemplate(text)) text = stripBalancedCssBlocks(text);
      return text
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // ------------------------------------------------------------- workbench
    // ------------------------------------------------------------- assistant
    function MailPanel(props) {
      const { translate, workbench } = props;
      const t = typeof translate === 'function' ? translate : identityTranslate;
      const adapter = workbench && typeof workbench.getSnapshot === 'function' && typeof workbench.subscribe === 'function' ? workbench : null;
      const data = useStore(adapter || FALLBACK_WORKBENCH_STORE) || {};
      const locale = (typeof navigator !== 'undefined' && navigator.language) || 'zh-CN';
      const [view, setView] = React.useState('home');
      const [busy, setBusy] = React.useState(false);
      const [actionError, setActionError] = React.useState('');
      const [copyState, setCopyState] = React.useState({ status: 'idle', text: '' });
      const [advancedOpen, setAdvancedOpen] = React.useState(false);
      const [readerExpanded, setReaderExpanded] = React.useState(false);
      const [searchForm, setSearchForm] = React.useState({ query: '', from: '', to: '', since: '', before: '', unreadOnly: false, category: '' });
      const [draftForm, setDraftForm] = React.useState(null);
      const [draftDirty, setDraftDirty] = React.useState(false);
      const [reminder, setReminder] = React.useState(() => {
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ma.reminder') : null;
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed && typeof parsed.enabled === 'boolean') return { enabled: parsed.enabled, minutes: Number(parsed.minutes) || 10 };
        } catch { /* ignore */ }
        return { enabled: false, minutes: 10 };
      });

      const accountsState = data.accounts || {};
      const accounts = Array.isArray(accountsState.list) ? accountsState.list : [];
      const accountId = data.accountId || '';
      const currentAccount = accounts.find((entry) => entry.id === accountId) || accounts[0] || null;
      const connection = data.connection || {};
      const statsState = data.stats || {};
      const recent = data.recent || {};
      const message = data.message || null;
      const search = data.search || null;
      const digest = data.digest || null;
      const draftsState = data.drafts || {};
      const logState = data.log || {};
      const overviewState = data.overview || {};
      const aiBriefState = data.aiBrief || {};
      const actions = adapter?.actions || {};
      const digestDays = Number(data.digestDays) || 7;

      const run = async (fn) => {
        setBusy(true);
        setActionError('');
        setCopyState({ status: 'idle', text: '' });
        try {
          return await fn();
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          setActionError(message === 'mail request failed' || /mail request failed/i.test(message)
            ? t('mailRequestFailed')
            : message || t('actionFailed'));
          return undefined;
        } finally {
          setBusy(false);
        }
      };
      const copyPrompt = async (text) => {
        setActionError('');
        try {
          if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') throw new Error('clipboard');
          await navigator.clipboard.writeText(text);
          setCopyState({ status: 'copied', text: '' });
        } catch {
          setCopyState({ status: 'manual', text });
        }
      };
      const openMessage = (uid) => {
        setView('mail');
        setReaderExpanded(false);
        return run(() => actions.read(uid));
      };
      const generateDigest = (days) => run(() => actions.digest(days || digestDays));
      const refreshOverview = () => {
        if (typeof actions.overview === 'function') return run(() => actions.overview());
        return generateDigest(digestDays);
      };
      const splitAddresses = (value) => String(value || '')
        .split(/[,;\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
      const draftToForm = (draft) => ({
        id: draft.id,
        accountId: draft.accountId || currentAccount?.id || '',
        to: draft.to || '',
        cc: draft.cc || '',
        bcc: draft.bcc || '',
        subject: draft.subject || '',
        body: draft.body || '',
        status: draft.status || 'saved',
        source: draft.source || 'manual',
        updatedAt: draft.updatedAt || draft.createdAt || '',
        attachments: Array.isArray(draft.attachments) ? draft.attachments : [],
        inReplyTo: draft.inReplyTo || '',
      });
      const startNewDraft = () => {
        setDraftForm(draftToForm({ id: '', accountId: currentAccount?.id || '', to: '', cc: '', bcc: '', subject: '', body: '', status: 'saved', source: 'manual' }));
        setDraftDirty(false);
      };
      const openDraft = (draft) => {
        setDraftForm(draftToForm(draft));
        setDraftDirty(false);
      };
      const closeDraftEditor = () => {
        if (draftDirty && typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(t('draftUnsaved'))) return;
        setDraftForm(null);
        setDraftDirty(false);
      };
      const editDraftField = (key, value) => {
        setDraftForm((current) => (current === null ? current : { ...current, [key]: value }));
        setDraftDirty(true);
      };
      const saveDraft = async () => {
        if (draftForm === null) return;
        const payload = {
          to: splitAddresses(draftForm.to),
          cc: splitAddresses(draftForm.cc),
          bcc: splitAddresses(draftForm.bcc),
          subject: draftForm.subject,
          body: draftForm.body,
          // The editor is a plain-text surface; drop any stale HTML alternative.
          html: '',
        };
        const value = await run(() => (draftForm.id
          ? actions.updateDraft({ id: draftForm.id, ...payload })
          : actions.createDraft({ accountId: draftForm.accountId || currentAccount?.id, ...payload })));
        if (value) {
          setDraftForm(draftToForm(value));
          setDraftDirty(false);
        }
      };
      const openReplyDraft = async (uid) => {
        const value = await run(() => actions.createReplyDraft(uid));
        if (value) {
          setView('drafts');
          setDraftForm(draftToForm(value));
          setDraftDirty(false);
        }
      };
      const deleteDraft = async () => {
        if (draftForm?.id === '') return;
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(t('draftDeleteConfirm'))) return;
        const ok = await run(() => actions.deleteDraft(draftForm.id));
        if (ok === true || ok === false) {
          if (ok === false) await run(() => actions.loadDrafts());
          setDraftForm(null);
          setDraftDirty(false);
        }
      };

      React.useEffect(() => {
        if (data.service === 'ready' && typeof actions.init === 'function') actions.init();
      }, [data.service]); // eslint-disable-line react-hooks/exhaustive-deps
      React.useEffect(() => {
        if (!reminder.enabled || typeof actions.stats !== 'function') return undefined;
        const id = setInterval(() => { actions.stats({ reminder: true }).catch(() => {}); }, Math.max(1, reminder.minutes) * 60000);
        return () => clearInterval(id);
      }, [reminder.enabled, reminder.minutes, adapter]); // eslint-disable-line react-hooks/exhaustive-deps
      React.useEffect(() => {
        setReaderExpanded(false);
      }, [message?.status, message?.value?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
      React.useEffect(() => {
        if (view === 'drafts' && !draftsState.status && typeof actions.loadDrafts === 'function') run(() => actions.loadDrafts());
        if (view === 'activity' && !logState.status && typeof actions.loadLog === 'function') run(() => actions.loadLog());
      }, [view, draftsState.status, logState.status]); // eslint-disable-line react-hooks/exhaustive-deps
      React.useEffect(() => {
        setDraftForm(null);
        setDraftDirty(false);
      }, [accountId]);
      React.useEffect(() => {
        if (view !== 'home' && accountsState.status === 'ready' && accounts.length === 0) setView('home');
      }, [accounts.length, accountsState.status, view]);
      const updateReminder = (patch) => {
        const next = { ...reminder, ...patch };
        setReminder(next);
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ma.reminder', JSON.stringify(next)); } catch { /* ignore */ }
      };

      const statusKey = (() => {
        if (accountsState.status === 'error') return 'statusUnavailable';
        if (accountsState.status === 'loading' || accountsState.status === 'idle') return 'statusUnknown';
        if (accounts.length === 0) return 'statusIncomplete';
        if (currentAccount && currentAccount.configured === false) return 'statusIncomplete';
        return {
          tested: null, connected: 'statusConnected', failed: 'statusFailed', untested: 'statusUntested',
          unknown: 'statusUnknown', incomplete: 'statusIncomplete', unavailable: 'statusUnavailable', testing: 'statusUnknown',
        }[connection.status] || 'statusUntested';
      })();
      const statusTone = statusKey === 'statusConnected' ? 'Ok'
        : statusKey === 'statusFailed' || statusKey === 'statusIncomplete' || statusKey === 'statusUnavailable' ? 'Warn' : 'Idle';
      const protocolKey = (value) => ({
        ok: 'statusConnected', failed: 'statusFailed', incomplete: 'statusIncomplete',
        unavailable: 'statusUnavailable', untested: 'statusUntested',
      }[value] || 'statusUnknown');

      const categoryBadge = (category) => {
        const key = CATEGORY_LABEL_KEYS[category];
        return key ? h('span', { className: 'ma-badge ma-badgeQuiet', key: `cat-${category}` }, t(key)) : null;
      };

      const searchHasCriteria = ['query', 'from', 'to', 'since', 'before', 'category']
        .some((key) => String(searchForm[key] || '').trim() !== '') || searchForm.unreadOnly === true;
      const statsValue = statsState.value || null;
      const digestValue = digest?.value || null;
      const aiBriefValue = aiBriefState.value || null;
      const searchValue = search?.status === 'ready' ? search.value : null;
      const selectedUid = message?.status === 'ready' ? message.value.uid : null;
      const bodyText = message?.status === 'ready' ? cleanBodyText(message.value.text) : '';
      const longBody = bodyText.length > 2600;
      const shownBody = longBody && !readerExpanded ? bodyText.slice(0, 2600) : bodyText;

      const showSetup = accountsState.status === 'ready' && accounts.length === 0;
      const showConnectionBanner = !showSetup && (
        accountsState.status === 'error'
        || connection.status === 'failed'
        || connection.status === 'incomplete'
        || connection.status === 'unavailable'
        || currentAccount?.configured === false
      );
      const connectionProblem = accountsState.status === 'error' ? t('dataFailed')
        : currentAccount?.configured === false ? t('missingPassword')
        : connection.status === 'failed' ? t('statusFailed')
        : connection.status === 'unavailable' ? t('statusUnavailable')
        : t('statusIncomplete');
      const connectionDetail = currentAccount && (connection.imap || connection.smtp)
        ? `IMAP：${t(protocolKey(connection.imap))} · SMTP：${t(protocolKey(connection.smtp))}。`
        : '';

      const messageView = message ? h('section', { className: 'ma-card ma-reader', 'aria-label': t('messageTitle') },
        message.status === 'ready'
          ? h(React.Fragment, null,
            h('div', { className: 'ma-readerHead' },
              h('div', { className: 'ma-readerTop' },
                h('div', { className: 'ma-readerHeading' },
                  h('h2', { className: 'ma-readerSubject' }, message.value.subject || t('noSubject')),
                  h('dl', { className: 'ma-readerMeta' },
                    h('dt', { className: 'ma-metaLabel' }, t('messageFrom')),
                    h('dd', { className: 'ma-metaValue' }, message.value.from || t('noSender')),
                    h('dt', { className: 'ma-metaLabel' }, t('messageTo')),
                    h('dd', { className: 'ma-metaValue' }, `${message.value.to || '-'}${message.value.cc ? `　${t('messageCc')}：${message.value.cc}` : ''}`),
                    h('dt', { className: 'ma-metaLabel' }, t('messageDate')),
                    h('dd', { className: 'ma-metaValue' }, formatTime(message.value.date, locale)))),
                h('div', { className: 'ma-readerActions' },
                  h('button', {
                    type: 'button', className: 'ma-button ma-smallButton', disabled: busy || typeof actions.createReplyDraft !== 'function',
                    onClick: () => openReplyDraft(message.value.uid),
                  }, t('replyPrompt')),
                  h('button', {
                    type: 'button', className: 'ma-button ma-smallButton', disabled: busy,
                    onClick: () => copyPrompt(t('promptForward').replace('{uid}', String(message.value.uid))),
                  }, t('forwardPrompt')),
                  h('button', { type: 'button', className: 'ma-button ma-smallButton', onClick: actions.closeMessage }, t('closeMessage')))),
              message.value.truncated ? h('span', { className: 'ma-badge' }, t('truncated')) : null),
            h('div', { className: `ma-readerBody${longBody && !readerExpanded ? ' isCollapsed' : ''}` }, shownBody || t('messageNoBody')),
            longBody ? h('p', { className: 'ma-readerNote' },
              h('button', {
                type: 'button', className: 'ma-linkButton', disabled: busy,
                onClick: () => setReaderExpanded((value) => !value),
              }, readerExpanded ? t('messageCollapse') : t('messageExpand')),
              ` · ${t('messageChars', { count: String(bodyText.length) })}`) : null,
            message.value.attachments?.length > 0
              ? h('div', { className: 'ma-attachmentBox' },
                h('h3', { className: 'ma-attachmentTitle' }, t('attachments')),
                currentAccount && currentAccount.downloadDirConfigured === false
                  ? h('p', { className: 'ma-muted' }, t('saveUnavailable'))
                  : null,
                h('ul', { className: 'ma-attachmentList' }, ...message.value.attachments.map((attachment) => h('li', { className: 'ma-attachmentItem', key: attachment.index },
                  h('span', { className: 'ma-attachmentName', title: attachment.filename }, `${attachment.filename} · ${formatBytes(attachment.size) || `${attachment.size} ${t('attachmentSize')}`}`),
                  typeof actions.saveAttachment === 'function'
                    ? h('button', {
                      type: 'button', className: 'ma-button ma-smallButton', style: { marginLeft: 'auto' },
                      disabled: busy || (currentAccount !== null && currentAccount.downloadDirConfigured === false),
                      onClick: () => run(() => actions.saveAttachment(message.value.uid, attachment.index)),
                    }, t('saveAttachment'))
                    : null))),
                Array.isArray(data.savedFiles) && data.savedFiles.length > 0
                  ? h('p', { className: 'ma-muted', style: { marginTop: 8 } }, `${t('savedTo')}：${data.savedFiles.map((file) => file.path).join('；')}`)
                  : null)
              : null,
            h('p', { className: 'ma-readerNote' }, t('mailPlainTextNotice')))
          : h('div', { className: 'ma-readerEmpty' },
            h('div', { className: 'ma-readerEmptyIcon' }, h(MailGlyph, { size: 20 })),
            h('p', { className: 'ma-readerEmptyTitle' }, message.status === 'loading' ? t('loading') : t('dataFailed')),
            h('p', { className: 'ma-readerEmptyBody' }, t('retryHint'))))
        : h('div', { className: 'ma-readerEmpty' },
          h('div', { className: 'ma-readerEmptyIcon' }, h(MailGlyph, { size: 20 })),
          h('p', { className: 'ma-readerEmptyTitle' }, t('mailReaderEmptyTitle')),
          h('p', { className: 'ma-readerEmptyBody' }, t('mailReaderEmptyBody')));

      const mailRow = (item) => {
        const selected = selectedUid !== null && selectedUid === item.uid;
        return h('li', { className: 'ma-mailItem', key: `${item.uid}-${item.date}` },
          h('button', {
            type: 'button', className: 'ma-mailItemRow', 'aria-current': selected ? 'true' : undefined,
            disabled: busy || !Number.isInteger(item.uid),
            onClick: () => openMessage(item.uid),
          },
          item.seen === false ? h('span', { className: 'ma-unreadDot', 'aria-label': t('unread') }) : h('span', { className: 'ma-unreadSpacer' }),
          h('span', { className: 'ma-mailItemBody' },
            h('span', { className: 'ma-mailItemTop' },
              h('span', { className: 'ma-mailFrom', title: item.from || t('noSender') }, senderLabel(item.from) || t('noSender')),
              h('span', { className: 'ma-mailDate' }, formatListDate(item.date, locale))),
            h('span', { className: 'ma-mailSubject' }, item.subject || t('noSubject')),
            h('span', { className: 'ma-mailMeta' }, categoryBadge(item.category)))));
      };

      const aiItems = aiBriefValue?.items || [];
      const todoCount = aiBriefValue
        ? String(aiItems.filter((item) => item.kind !== 'info').length)
        : digestValue ? String(digestValue.needsAttention.length) : statsValue ? String(statsValue.attention) : '—';
      const replyCount = aiBriefValue ? String(aiItems.filter((item) => item.kind === 'reply').length) : '—';
      const briefMetrics = h('div', { className: 'ma-metrics' },
        ...[
          ['unread', statsValue ? String(statsValue.unread) : '—'],
          ['toBeHandled', todoCount],
          ['suggestedReply', replyCount],
        ].map(([key, value]) => h('div', { className: 'ma-metric', key },
          h('div', { className: 'ma-metricValue' }, value),
          h('div', { className: 'ma-metricLabel' }, t(key)))));

      const briefSection = (title, count, children, empty, key) => h('section', { className: 'ma-briefSection', key },
        h('h3', { className: 'ma-sectionTitle' }, title, count > 0 ? h('span', { className: 'ma-sectionCount' }, `(${count})`) : null),
        count > 0 ? children : h('p', { className: 'ma-briefEmpty' }, empty));

      const overviewFailed = (overviewState.status === 'error' || digest?.status === 'error') && digest?.status !== 'ready';
      const startAiBrief = () => {
        if (typeof actions.aiBrief === 'function') return run(() => actions.aiBrief(digestDays));
        return copyPrompt(t('promptDigest', { days: String(digestDays) }));
      };
      const aiKindLabel = (kind) => kind === 'reply' ? t('briefAiReply') : kind === 'todo' ? t('briefAiTodo') : t('briefAiInfo');
      const aiBriefBody = aiBriefValue
        ? h(React.Fragment, null,
          h('div', { className: 'ma-aiSummaryBox' },
            h('p', { className: 'ma-aiSummary' }, aiBriefValue.summary || t('briefAiNoItems')),
            h('p', { className: 'ma-briefNotice' }, `${t('briefAiModel')}：${aiBriefValue.provider}/${aiBriefValue.model} · ${t('briefAiRead', { read: String(aiBriefValue.read), scanned: String(aiBriefValue.scanned) })}`)),
          aiItems.length > 0
            ? h('ul', { className: 'ma-briefList' }, ...aiItems.map((item) => h('li', { className: 'ma-briefItem', key: `ai-${item.uid}` },
              h('div', { className: 'ma-briefTop' },
                h('button', { type: 'button', className: 'ma-briefSubject', onClick: () => openMessage(item.uid) }, item.subject || t('noSubject')),
                h('span', { className: 'ma-badge' }, aiKindLabel(item.kind))),
              h('p', { className: 'ma-briefMeta' }, `${senderLabel(item.from) || t('noSender')} · uid ${item.uid} · ${item.why || t('briefAiInfo')}`),
              item.deadline ? h('p', { className: 'ma-briefMeta' }, `${t('digestDeadlines')}：${item.deadline}${item.confidence === 'inferred' ? `（${t('digestConfidenceInferred')}）` : ''}`) : null)))
            : h('p', { className: 'ma-briefEmpty' }, t('briefAiNoItems')),
          aiBriefValue.actions.length > 0
            ? h('section', { className: 'ma-briefSection' },
              h('h3', { className: 'ma-sectionTitle' }, t('briefAiActions')),
              h('ul', { className: 'ma-sectionList' }, ...aiBriefValue.actions.map((line, index) => h('li', { key: index }, line))))
            : null,
          h('div', { className: 'ma-briefFooter' },
            h('div', { className: 'ma-briefNotice' },
              h('p', null, `${aiBriefValue.notice} ${t('briefAiPrivacy')}`),
              aiBriefValue.partial ? h('p', null, t('briefAiPartial')) : null),
            h('button', { type: 'button', className: 'ma-button', disabled: busy, onClick: startAiBrief }, t('briefAiRegenerate'))))
        : (digestValue
          ? h(React.Fragment, null,
            aiBriefState.status === 'error' ? h('p', { className: 'ma-error', role: 'alert' }, t('briefAiUnavailable')) : null,
            h('div', { className: 'ma-briefGrid' },
              briefSection(t('digestNeedsAttention'), digestValue.needsAttention.length,
                h('ul', { className: 'ma-briefList' }, ...digestValue.needsAttention.slice(0, 3).map((item) => h('li', { className: 'ma-briefItem', key: `a-${item.uid}` },
                  h('button', { type: 'button', className: 'ma-briefSubject', onClick: () => openMessage(item.uid) }, item.subject || t('noSubject')),
                  h('p', { className: 'ma-briefMeta' }, `${senderLabel(item.from) || t('noSender')} · ${item.reason}`)))),
                t('briefNoAttention'), 'attention'),
              h('div', { className: 'ma-briefAside' },
                briefSection(t('digestImportant'), digestValue.important.length,
                  h('ul', { className: 'ma-briefList' }, ...digestValue.important.slice(0, 2).map((item) => h('li', { className: 'ma-briefItem', key: `i-${item.uid}` },
                    h('button', { type: 'button', className: 'ma-briefSubject', onClick: () => openMessage(item.uid) }, item.subject || t('noSubject')),
                    h('p', { className: 'ma-briefMeta' }, senderLabel(item.from) || t('noSender'))))),
                  t('briefNoImportant'), 'important'),
                briefSection(t('digestSuggestions'), digestValue.suggestions.length,
                  h('ul', { className: 'ma-sectionList' }, ...digestValue.suggestions.slice(0, 3).map((line, index) => h('li', { key: index }, line))),
                  t('digestEmpty'), 'suggestions'))),
            digestValue.deadlines.length > 0
              ? h('p', { className: 'ma-briefMeta', style: { marginTop: 10 } },
                `${t('digestDeadlines')}：${digestValue.deadlines.slice(0, 2).map((item) => `${item.text}（${item.subject}）`).join('；')}`)
              : null,
            h('div', { className: 'ma-briefFooter' },
              h('p', { className: 'ma-briefNotice' }, `${digestValue.notice}${digestValue.scanned ? ` ${t('briefScanned', { count: String(digestValue.scanned) })}` : ''}`),
              h('button', {
                type: 'button', className: 'ma-button ma-primaryButton', disabled: busy || aiBriefState.status === 'loading',
                onClick: startAiBrief,
              }, aiBriefState.status === 'loading' ? t('briefAiRunning') : t('briefAi'))))
          : h('div', { className: 'ma-briefEmptyState' },
            h('p', { className: 'ma-briefEmpty' }, overviewFailed ? t('dataFailed') : digest?.status === 'loading' || overviewState.status === 'loading' ? t('loading') : t('briefEmpty')),
            h('div', { className: 'ma-toolbar' },
              h('button', {
                type: 'button', className: 'ma-button ma-primaryButton', disabled: busy || !accounts.length,
                onClick: overviewFailed ? refreshOverview : () => generateDigest(digestDays),
              }, overviewFailed ? t('retry') : t('briefGenerate')),
              h('button', {
                type: 'button', className: 'ma-button', disabled: busy,
                onClick: startAiBrief,
              }, `✦ ${t('briefAi')}`))));

      const briefBody = aiBriefBody;
      const homeView = showSetup
        ? h('section', { className: 'ma-card ma-setup' },
          h('h2', { className: 'ma-setupTitle' }, t('setupTitle')),
          h('p', { className: 'ma-muted' }, t('setupBody')),
          h('ol', { className: 'ma-setupSteps' },
            h('li', null, t('setupStep1')),
            h('li', null, t('setupStep2')),
            h('li', null, t('setupStep3'))),
          h('p', { className: 'ma-setupPath' }, t('setupPath')),
          h('button', { type: 'button', className: 'ma-button ma-smallButton', style: { marginTop: 12 }, disabled: busy || typeof actions.init !== 'function', onClick: () => run(() => actions.init()) }, t('reloadConfig')))
        : h(React.Fragment, null,
          h('section', { className: 'ma-card ma-brief', 'aria-label': t('briefTitle') },
            h('div', { className: 'ma-briefHead' },
              h('div', { className: 'ma-briefHeading' },
                h('span', { className: 'ma-spark', 'aria-hidden': true }, '✦'),
                h('div', null,
                  h('h2', { className: 'ma-briefTitle' }, t('briefTitle')),
                  h('p', { className: 'ma-briefSub' }, aiBriefValue ? t('briefAiSubtitle', { days: String(digestDays) }) : t('briefSubtitle', { days: String(digestDays) })))),
              h('div', { className: 'ma-briefTools' },
                h('span', { className: 'ma-badge' }, aiBriefValue ? t('aiBriefBadge') : t('briefBadge')),
                h('label', { className: 'ma-inlineLabel' }, t('briefRange'),
                  h('select', {
                    className: 'ma-inlineSelect', value: String(digestDays), disabled: busy,
                    onChange: (event) => generateDigest(Number(event.target.value)),
                  }, [1, 7, 30].map((days) => h('option', { key: days, value: String(days) }, t('daysShort', { count: String(days) }))))),
                h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: refreshOverview }, t('briefRefresh')))),
            statsValue || digestValue ? briefMetrics : null,
            briefBody),
          h('div', { className: 'ma-actionsRow' },
            h('button', { type: 'button', className: 'ma-actionCard', disabled: busy, onClick: () => { setView('mail'); setAdvancedOpen(false); } },
              h('span', { className: 'ma-actionIcon', 'aria-hidden': true }, '⌕'),
              h('span', { className: 'ma-actionLabel' }, t('searchMail')),
              h('span', { className: 'ma-actionHint' }, t('searchMailHint'))),
            h('button', { type: 'button', className: 'ma-actionCard', disabled: busy, onClick: () => copyPrompt(t('promptCompose')) },
              h('span', { className: 'ma-actionIcon', 'aria-hidden': true }, '✎'),
              h('span', { className: 'ma-actionLabel' }, t('composeMail')),
              h('span', { className: 'ma-actionHint' }, t('copyHint'))),
            h('button', { type: 'button', className: 'ma-actionCard', disabled: busy, onClick: () => setView('mail') },
              h('span', { className: 'ma-actionIcon', 'aria-hidden': true }, '✉'),
              h('span', { className: 'ma-actionLabel' }, t('openMail')),
              h('span', { className: 'ma-actionHint' }, t('mailViewHint')))));

      const mailView = h('section', { className: 'ma-view' },
        h('div', { className: 'ma-viewHead' },
          h('div', null,
            h('h2', { className: 'ma-viewTitle' }, t('mailViewTitle')),
            h('p', { className: 'ma-viewHint' }, t('mailViewHint'))),
          h('div', { className: 'ma-toolbar' },
            h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy || !accounts.length, onClick: () => run(() => actions.refresh()) }, t('refreshMail')))),
        h('form', {
          className: 'ma-searchForm',
          onSubmit: (event) => {
            event.preventDefault();
            if (!searchHasCriteria) return;
            run(() => actions.search({ ...searchForm }));
          },
        },
        h('div', { className: 'ma-searchRow' },
          h('div', { className: 'ma-searchInputWrap' }, h('input', {
            type: 'search', className: 'ma-searchInput', value: searchForm.query,
            placeholder: t('mailSearchPlaceholder'), 'aria-label': t('searchQuery'),
            onChange: (event) => setSearchForm({ ...searchForm, query: event.target.value }),
          })),
          h('button', { type: 'submit', className: 'ma-button ma-primaryButton', disabled: busy || !searchHasCriteria }, t('runSearch')),
          search ? h('button', {
            type: 'button', className: 'ma-button',
            onClick: () => { setSearchForm({ query: '', from: '', to: '', since: '', before: '', unreadOnly: false, category: '' }); actions.clearSearch?.(); },
          }, t('mailSearchClear')) : null,
          h('button', {
            type: 'button', className: 'ma-button ma-smallButton', 'aria-expanded': advancedOpen,
            onClick: () => setAdvancedOpen((value) => !value),
          }, advancedOpen ? t('mailSearchHide') : t('mailSearchAdvanced'))),
        advancedOpen ? h('div', { className: 'ma-filterGrid' },
          h('label', { className: 'ma-field' }, t('searchFrom'),
            h('input', { 'aria-label': t('searchFrom'), value: searchForm.from, onChange: (event) => setSearchForm({ ...searchForm, from: event.target.value }) })),
          h('label', { className: 'ma-field' }, t('searchTo'),
            h('input', { 'aria-label': t('searchTo'), value: searchForm.to, onChange: (event) => setSearchForm({ ...searchForm, to: event.target.value }) })),
          h('label', { className: 'ma-field' }, t('searchSince'),
            h('input', { 'aria-label': t('searchSince'), type: 'date', value: searchForm.since, onChange: (event) => setSearchForm({ ...searchForm, since: event.target.value }) })),
          h('label', { className: 'ma-field' }, t('searchBefore'),
            h('input', { 'aria-label': t('searchBefore'), type: 'date', value: searchForm.before, onChange: (event) => setSearchForm({ ...searchForm, before: event.target.value }) })),
          h('label', { className: 'ma-field' }, t('searchCategory'),
            h('select', { 'aria-label': t('searchCategory'), value: searchForm.category, onChange: (event) => setSearchForm({ ...searchForm, category: event.target.value }) },
              h('option', { value: '' }, t('categoryAny')),
              ['work', 'notification', 'personal', 'promotion', 'other'].map((value) => h('option', { key: value, value }, t(CATEGORY_LABEL_KEYS[value]))))),
          h('label', { className: 'ma-field' }, t('searchUnreadOnly'),
            h('input', { type: 'checkbox', checked: searchForm.unreadOnly, onChange: (event) => setSearchForm({ ...searchForm, unreadOnly: event.target.checked }) })))
          : null,
        h('p', { className: 'ma-searchHint' }, t('mailSearchHint'))),
        searchValue ? h('p', { className: 'ma-muted' },
          `${searchValue.source === 'header_scan' ? t('searchSourceHeader') : t('searchSourceServer')} · ${searchValue.matches}${searchValue.scanned ? ` · ${t('searchScanned')} ${searchValue.scanned}` : ''}`,
          searchValue.notice ? ` · ${searchValue.notice}` : '') : null,
        search?.status === 'error' ? h('p', { className: 'ma-error', role: 'alert' }, t('dataFailed')) : null,
        h('div', { className: 'ma-split' },
          h('section', { className: 'ma-card ma-listPane', 'aria-label': search ? t('mailSearchResults') : t('recentTitle') },
            h('div', { className: 'ma-listHead' },
              h('div', null,
                h('p', { className: 'ma-listTitle' }, search ? t('mailSearchResults') : t('recentTitle')),
                h('p', { className: 'ma-listSub' }, search ? t('searchScope') : `${recent.folder || 'INBOX'}${recent.total ? ` · ${recent.total}` : ''}`))),
            h('div', { className: 'ma-listScroll' },
              search?.status === 'loading' || (!search && recent.status === 'loading')
                ? h('p', { className: 'ma-muted ma-empty', style: { padding: '12px 14px' } }, t('loading'))
                : search
                  ? searchValue
                    ? searchValue.messages.length === 0
                      ? h('p', { className: 'ma-muted ma-empty', style: { padding: '12px 14px' } }, t('searchEmpty'))
                      : h('ul', { className: 'ma-mailList' }, ...searchValue.messages.map(mailRow))
                    : h('p', { className: 'ma-muted ma-empty', style: { padding: '12px 14px' } }, t('dataFailed'))
                  : recent.status === 'ready'
                    ? recent.items.length === 0
                      ? h('p', { className: 'ma-muted ma-empty', style: { padding: '12px 14px' } }, t('recentEmpty'))
                      : h('ul', { className: 'ma-mailList' }, ...recent.items.map(mailRow))
                    : h('p', { className: 'ma-muted ma-empty', style: { padding: '12px 14px' } },
                      recent.status === 'loading' ? t('loading') : recent.status === 'error' ? t('dataFailed') : t('recentNotLoaded'))),
            !search && recent.status === 'ready' && recent.items.length < Math.min(recent.total || 0, 50) && typeof actions.refreshMore === 'function'
              ? h('div', { className: 'ma-listFooter' },
                h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => run(() => actions.refreshMore()) }, t('loadMore')))
              : null),
          messageView));

      const draftsList = draftsState.status === 'ready' ? draftsState.list : [];
      const draftSourceLabel = (source) => ({
        manual: t('draftSourceManual'), ai: t('draftSourceAi'), reply: t('draftSourceReply'), forward: t('draftSourceForward'),
      }[source] || t('draftSourceManual'));
      const draftStatusLabel = (status) => status === 'review' ? t('draftStatusReview') : t('draftStatusSaved');
      const draftEditor = draftForm === null ? null : h('section', { className: 'ma-view ma-draftEditor', 'aria-label': t('draftEditorTitle') },
        h('div', { className: 'ma-viewHead' },
          h('div', null,
            h('button', { type: 'button', className: 'ma-linkButton', onClick: closeDraftEditor }, `← ${t('draftBack')}`),
            h('h2', { className: 'ma-viewTitle' }, draftForm.id ? (draftForm.subject || t('draftNoSubject')) : t('draftNewTitle')),
            h('p', { className: 'ma-viewHint' }, `${draftSourceLabel(draftForm.source)} · ${draftStatusLabel(draftForm.status)}${draftDirty ? ` · ${t('draftUnsaved')}` : ''}`)),
          h('div', { className: 'ma-toolbar' },
            draftForm.id ? h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: deleteDraft }, t('draftDelete')) : null,
            h('button', { type: 'button', className: 'ma-button', disabled: busy, onClick: closeDraftEditor }, t('draftCancel')),
            h('button', { type: 'button', className: 'ma-button ma-primaryButton', disabled: busy, onClick: saveDraft }, busy ? t('draftSaving') : t('draftSave')))),
        h('section', { className: 'ma-card ma-draftFormCard' },
          h('div', { className: 'ma-draftFields' },
            h('label', { className: 'ma-field' }, t('draftAccount'),
              h('input', { className: 'ma-input', value: currentAccount?.email || '', readOnly: true, 'aria-label': t('draftAccount') })),
            h('label', { className: 'ma-field' }, t('draftRecipient'),
              h('input', { className: 'ma-input', value: draftForm.to, placeholder: 'a@example.com', 'aria-label': t('draftRecipient'), onChange: (event) => editDraftField('to', event.target.value) })),
            h('label', { className: 'ma-field' }, t('draftCc'),
              h('input', { className: 'ma-input', value: draftForm.cc, 'aria-label': t('draftCc'), onChange: (event) => editDraftField('cc', event.target.value) })),
            h('label', { className: 'ma-field' }, t('draftBcc'),
              h('input', { className: 'ma-input', value: draftForm.bcc, 'aria-label': t('draftBcc'), onChange: (event) => editDraftField('bcc', event.target.value) })),
            h('label', { className: 'ma-field ma-fieldWide' }, t('draftSubject'),
              h('input', { className: 'ma-input', value: draftForm.subject, 'aria-label': t('draftSubject'), onChange: (event) => editDraftField('subject', event.target.value) })),
            h('label', { className: 'ma-field ma-fieldWide' }, t('draftBody'),
              h('textarea', { className: 'ma-textarea', rows: 14, value: draftForm.body, 'aria-label': t('draftBody'), onChange: (event) => editDraftField('body', event.target.value) }))),
          draftForm.inReplyTo ? h('p', { className: 'ma-draftMeta' }, `${t('draftInReplyTo')}：${draftForm.inReplyTo}`) : null,
          draftForm.attachments?.length > 0 ? h('p', { className: 'ma-draftMeta' }, `${t('attachments')}：${draftForm.attachments.map((file) => file.filename).join('、')} · ${t('draftAttachmentsReadonly')}`) : null,
          h('div', { className: 'ma-draftFooter' },
            h('span', { className: 'ma-muted' }, draftDirty ? t('draftUnsaved') : t('draftSaved')),
            h('span', { className: 'ma-muted' }, t('draftSendHint')))));
      const draftsView = draftEditor || h('section', { className: 'ma-view' },
        h('div', { className: 'ma-viewHead' },
          h('div', null,
            h('h2', { className: 'ma-viewTitle' }, t('draftsTitle')),
            h('p', { className: 'ma-viewHint' }, t('draftsNotSent'))),
          h('div', { className: 'ma-toolbar' },
            h('button', { type: 'button', className: 'ma-button ma-primaryButton', disabled: busy, onClick: startNewDraft }, `＋ ${t('newDraft')}`),
            h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => run(() => actions.loadDrafts()) }, t('refreshList')))),
        h('section', { className: 'ma-card' },
          draftsState.status === 'ready'
            ? draftsList.length === 0
              ? h('p', { className: 'ma-muted ma-empty', style: { padding: 16 } }, t('draftsEmpty'))
              : h('div', null, ...draftsList.map((draft) => h('article', { className: 'ma-draft', key: draft.id },
                h('div', { className: 'ma-draftTop' },
                  h('p', { className: 'ma-draftSubject' }, draft.subject || t('draftNoSubject')),
                  h('span', { className: 'ma-badge' }, draftStatusLabel(draft.status))),
                h('p', { className: 'ma-draftMeta' }, `${t('draftRecipient')}：${draft.to || '-'} · ${draftSourceLabel(draft.source)}`),
                h('p', { className: 'ma-draftBody' }, draft.body || '-'),
                draft.attachments?.length > 0 ? h('p', { className: 'ma-draftMeta' }, `${t('attachments')}：${draft.attachments.map((file) => file.filename).join('、')}`) : null,
                h('div', { className: 'ma-draftActions' },
                  h('p', { className: 'ma-draftMeta' }, `${t('draftUpdatedAt')}：${formatTime(draft.updatedAt || draft.createdAt, locale)}`),
                  h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => openDraft(draft) }, t('draftEditorTitle'))))))
            : h('p', { className: 'ma-muted ma-empty', style: { padding: 16 } }, draftsState.status === 'error' ? t('dataFailed') : t('loading'))));

      const logEntries = logState.status === 'ready' ? logState.entries : [];
      const activityView = h('section', { className: 'ma-view' },
        h('div', { className: 'ma-viewHead' },
          h('div', null,
            h('h2', { className: 'ma-viewTitle' }, t('logTitle')),
            h('p', { className: 'ma-viewHint' }, t('activityHint'))),
          h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => run(() => actions.loadLog()) }, t('refreshList'))),
        h('section', { className: 'ma-card', style: { padding: '4px 16px 14px' } },
          logState.status === 'ready'
            ? logEntries.length === 0
              ? h('p', { className: 'ma-muted ma-empty', style: { padding: '10px 0' } }, t('logEmpty'))
              : h('ul', { className: 'ma-logList' }, ...logEntries.slice(0, 30).map((entry, index) => h('li', { className: 'ma-logItem', key: index },
                h('span', { className: 'ma-logTime' }, formatTime(entry.at, locale)),
                h('span', { className: entry.ok ? 'ma-logOk' : 'ma-logFailed' }, entry.ok ? t('logOk') : t('logFailed')),
                h('span', null, `${entry.action}${entry.detail ? ` · ${entry.detail}` : ''}`))))
            : h('p', { className: 'ma-muted ma-empty', style: { padding: '10px 0' } }, logState.status === 'error' ? t('dataFailed') : t('loading')),
          h('div', { className: 'ma-reminderCard' },
            h('div', { className: 'ma-viewHead', style: { marginBottom: 4 } },
              h('h3', { className: 'ma-sectionTitle' }, t('reminderTitle')),
              h('span', { className: 'ma-muted' }, t('reminderScope'))),
            h('div', { className: 'ma-toolbar' },
              h('label', { className: 'ma-inlineLabel' },
                h('input', {
                  type: 'checkbox', checked: reminder.enabled,
                  onChange: (event) => {
                    const enabled = event.target.checked;
                    updateReminder({ enabled });
                    if (enabled && typeof actions.stats === 'function') actions.stats({ reminder: true }).catch(() => {});
                  },
                }), ' ', t('reminderEnable')),
              h('label', { className: 'ma-inlineLabel' }, t('reminderMinutes'),
                h('select', {
                  className: 'ma-inlineSelect', value: String(reminder.minutes),
                  onChange: (event) => updateReminder({ minutes: Number(event.target.value) }),
                }, [5, 10, 30].map((minutes) => h('option', { key: minutes, value: String(minutes) }, String(minutes)))))),
            data.reminderNotice ? h('div', { className: 'ma-toast', role: 'status' }, data.reminderNotice) : null)));

      const tabs = [['home', t('tabHome')], ['mail', t('tabMail')], ['drafts', t('tabDrafts')], ['activity', t('tabActivity')]];
      const activeView = view === 'mail' ? mailView : view === 'drafts' ? draftsView : view === 'activity' ? activityView : homeView;

      return h('div', { className: 'ma-workbench' }, h('div', { className: 'ma-shell' },
        h('header', { className: 'ma-topbar' },
          h('div', { className: 'ma-brand' },
            h('div', { className: 'ma-brandMark' }, h(MailGlyph, { size: 22 })),
            h('div', { className: 'ma-brandText' },
              h('h1', { className: 'ma-title' }, t('panelTitle')),
              h('p', { className: 'ma-intro' }, t('homeIntro')))),
          h('div', { className: 'ma-topMeta' },
            accounts.length > 1
              ? h('select', {
                className: 'ma-accountSelect', value: accountId, 'aria-label': t('account'),
                onChange: (event) => run(() => actions.selectAccount(event.target.value)),
              }, ...accounts.map((entry) => h('option', { key: entry.id, value: entry.id }, `${entry.email}${entry.configured ? '' : ' ⚠'}`)))
              : currentAccount ? h('span', { className: 'ma-pill ma-accountPill', title: currentAccount.email }, currentAccount.email) : null,
            h('span', { className: `ma-pill ma-pill${statusTone}`, role: 'status' }, t(statusKey)),
            accounts.length > 0 && !showConnectionBanner && typeof actions.checkConnection === 'function'
              ? h('button', {
                type: 'button', className: 'ma-button ma-smallButton',
                disabled: busy || connection.status === 'testing',
                onClick: () => run(() => actions.checkConnection()),
              }, connection.status === 'testing' ? t('checking') : t('checkConnection'))
              : null)),
        accounts.length > 0
          ? h('nav', { className: 'ma-tabs', role: 'tablist' }, ...tabs.map(([key, label]) => h('button', {
            key, type: 'button', role: 'tab', className: 'ma-tab', 'aria-selected': view === key ? 'true' : 'false',
            onClick: () => setView(key),
          }, label)))
          : null,
        h('div', { className: 'ma-notices' },
          showConnectionBanner
            ? h('div', { className: 'ma-banner', role: 'alert' },
              h('div', { className: 'ma-bannerText' },
                h('p', { className: 'ma-bannerTitle' }, t('connectionIssue')),
                h('p', { className: 'ma-bannerBody' }, `${connectionProblem} ${connectionDetail}${t('connectionIssueHint')}`)),
              typeof actions.checkConnection === 'function' && currentAccount?.configured !== false
                ? h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => run(() => actions.checkConnection()) }, t('checkConnection'))
                : accountsState.status === 'error'
                  ? h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled: busy, onClick: () => run(() => actions.init()) }, t('retry'))
                  : null)
            : null,
          actionError ? h('p', { className: 'ma-error', role: 'alert' }, actionError) : null,
          copyState.status === 'copied' ? h('p', { className: 'ma-muted', role: 'status' }, t('copiedHint')) : null,
          copyState.status === 'manual'
            ? h('div', { role: 'status' },
              h('p', { className: 'ma-muted' }, t('copyUnavailable')),
              h('p', { className: 'ma-summaryText' }, copyState.text))
            : null),
        activeView,
        view === 'drafts' ? null : h('p', { className: 'ma-footerNote' }, `ⓘ ${t('sendingNeedsApproval')}`)));
    }

    // -------------------------------------------------------- settings section
    const TEXT_FIELDS = [
      { key: 'email', label: 'email', hint: 'emailHint' },
      { key: 'senderName', label: 'senderName', hint: 'senderNameHint' },
    ];

    function SettingsRow(props) {
      return h('div', { className: 'ma-row' },
        h('div', { className: 'ma-rowLabel' },
          h('span', { className: 'ma-rowTitle' }, props.title),
          props.hint && h('span', { className: 'ma-rowHint' }, props.hint)),
        h('div', { className: 'ma-control' }, props.children));
    }

    function accountsFromSnapshot(accepted) {
      let list = [];
      if (typeof accepted.accounts === 'string' && accepted.accounts.trim() !== '') {
        try {
          const parsed = JSON.parse(accepted.accounts);
          if (Array.isArray(parsed)) list = parsed;
        } catch { list = []; }
      }
      if (list.length === 0) {
        list = [{
          id: 'default',
          email: accepted.email || '',
          senderName: accepted.senderName || '',
          imapHost: accepted.imapHost || '',
          imapPort: accepted.imapPort || 0,
          smtpHost: accepted.smtpHost || '',
          smtpPort: accepted.smtpPort || 0,
          downloadDir: accepted.downloadDir || '',
        }];
      }
      return list.map((entry, index) => ({
        id: typeof entry.id === 'string' && entry.id.trim() !== '' ? entry.id : `account${index + 1}`,
        email: entry.email || '',
        senderName: entry.senderName || '',
        imapHost: entry.imapHost || '',
        imapPort: entry.imapPort || '',
        smtpHost: entry.smtpHost || '',
        smtpPort: entry.smtpPort || '',
        downloadDir: entry.downloadDir || '',
      }));
    }

    function MailSettings(props) {
      const {
        translate, scope, password, savePassword, clearPassword, refreshPassword,
        describePassword, savePasswordFor, clearPasswordFor,
      } = props;
      const t = typeof translate === 'function' ? translate : identityTranslate;
      const scopeStore = scope && typeof scope.subscribe === 'function' ? scope : FALLBACK_SCOPE_STORE;
      const passwordStore = password && typeof password.subscribe === 'function' ? password : FALLBACK_PASSWORD_STORE;
      const savePwd = typeof savePassword === 'function' ? savePassword : () => Promise.resolve(false);
      const clearPwd = typeof clearPassword === 'function' ? clearPassword : () => Promise.resolve();
      const refresh = typeof refreshPassword === 'function' ? refreshPassword : () => {};
      const describePwd = typeof describePassword === 'function' ? describePassword : null;
      const savePwdFor = typeof savePasswordFor === 'function' ? savePasswordFor : null;
      const clearPwdFor = typeof clearPasswordFor === 'function' ? clearPasswordFor : null;
      const snapshot = useStore(scopeStore);
      const passwordState = useStore(passwordStore);
      const accepted = snapshot.status === 'ready' ? (snapshot.value ?? {}) : {};
      const revision = snapshot.revision;
      const [accounts, setAccounts] = React.useState(() => accountsFromSnapshot(accepted));
      const [index, setIndex] = React.useState(0);
      const [passwordDraft, setPasswordDraft] = React.useState('');
      // Seed the legacy account from the credential mirror so the row does not
      // briefly read "no password" while the per-account describe is in flight.
      const [passwordFlags, setPasswordFlags] = React.useState(() => (
        passwordState.known === true ? { default: passwordState.configured === true } : {}
      ));
      const [phase, setPhase] = React.useState('idle');
      const [error, setError] = React.useState('');
      const [touched, setTouched] = React.useState(false);
      const disabled = !snapshot.writable || phase === 'saving';
      const current = accounts[Math.min(index, Math.max(0, accounts.length - 1))] || null;
      const currentId = current?.id || 'default';

      const lastRevision = React.useRef(revision);
      React.useEffect(() => {
        if (lastRevision.current !== revision) {
          lastRevision.current = revision;
          if (!touched) setAccounts(accountsFromSnapshot(accepted));
        }
      }, [revision, snapshot.status]); // eslint-disable-line react-hooks/exhaustive-deps

      React.useEffect(() => { refresh(); }, [refresh]);
      React.useEffect(() => {
        let active = true;
        if (!describePwd) {
          setPasswordFlags((flags) => ({ ...flags, [currentId]: passwordState.configured === true }));
          return () => { active = false; };
        }
        describePwd(currentId).then((configured) => {
          if (active) setPasswordFlags((flags) => ({ ...flags, [currentId]: configured === true }));
        }).catch(() => { if (active) setPasswordFlags((flags) => ({ ...flags, [currentId]: false })); });
        return () => { active = false; };
      }, [currentId, describePwd, passwordState.configured]);

      const edit = (key, value) => {
        setAccounts((list) => list.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry)));
        setTouched(true);
        setPhase('idle');
      };
      const editPassword = (value) => { setPasswordDraft(value); setPhase('idle'); };

      const save = async () => {
        setPhase('saving');
        setError('');
        try {
          const normalized = accounts.map((entry) => ({
            id: entry.id,
            email: String(entry.email || '').trim(),
            senderName: String(entry.senderName || '').trim(),
            imapHost: String(entry.imapHost || '').trim(),
            imapPort: Number(entry.imapPort || 0),
            smtpHost: String(entry.smtpHost || '').trim(),
            smtpPort: Number(entry.smtpPort || 0),
            downloadDir: String(entry.downloadDir || '').trim(),
          }));
          const seenIds = new Set();
          for (const account of normalized) {
            const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account.email);
            if (!/^[A-Za-z0-9_-]{1,32}$/.test(account.id) || seenIds.has(account.id) || !validEmail) {
              throw new Error('invalid-accounts');
            }
            seenIds.add(account.id);
          }
          await scopeStore.set('accounts', JSON.stringify(normalized));
          // Keep the legacy single-account fields in sync for older readers.
          if (normalized.length > 0 && normalized[0].id === 'default') {
            await scopeStore.set('email', normalized[0].email);
            await scopeStore.set('senderName', normalized[0].senderName);
          }
          if (passwordDraft.trim() !== '') {
            const value = passwordDraft.trim();
            const ok = savePwdFor ? await savePwdFor(currentId, value) : await savePwd(value);
            if (!ok) throw new Error('password');
          }
          setPasswordDraft('');
          setTouched(false);
          setPhase('saved');
          refresh();
          if (describePwd) {
            const configured = await describePwd(currentId).catch(() => false);
            setPasswordFlags((flags) => ({ ...flags, [currentId]: configured === true }));
          }
        } catch (cause) {
          setError(cause && cause.message === 'invalid-accounts' ? t('invalidAccounts') : t('saveFailed'));
          setPhase('idle');
        }
      };

      const clearSavedPassword = async () => {
        setError('');
        try {
          if (clearPwdFor) await clearPwdFor(currentId);
          else await clearPwd();
          refresh();
          setPasswordFlags((flags) => ({ ...flags, [currentId]: false }));
        } catch {
          setError(t('saveFailed'));
        }
      };

      const addAccount = () => {
        const used = new Set(accounts.map((entry) => entry.id));
        let number = accounts.length + 1;
        while (used.has(`account${number}`)) number += 1;
        setAccounts([...accounts, { id: `account${number}`, email: '', senderName: '', imapHost: '', imapPort: '', smtpHost: '', smtpPort: '', downloadDir: '' }]);
        setIndex(accounts.length);
        setTouched(true);
        setPhase('idle');
      };
      const removeAccount = () => {
        if (accounts.length <= 1) return;
        setAccounts(accounts.filter((_entry, entryIndex) => entryIndex !== index));
        setIndex(0);
        setTouched(true);
        setPhase('idle');
      };

      if (snapshot.status !== 'ready') {
        return h('div', { className: 'ma-section' },
          h('p', { className: 'ma-intro', role: 'status' }, t('unavailable')));
      }

      const input = (key, { type = 'text', className = 'ma-input', placeholder = '' } = {}) => h('input', {
        type,
        className,
        value: current?.[key] ?? '',
        placeholder,
        disabled,
        onChange: (event) => { edit(key, event.target.value); },
      });

      return h('div', { className: 'ma-section' },
        h('div', { className: 'ma-form' },
          h('h3', { className: 'ma-rowTitle', style: { margin: '4px 0 8px' } }, t('accounts')),
          h('div', { className: 'ma-toolbar', style: { marginBottom: 8 } },
            h('select', {
              value: String(index), 'aria-label': t('account'), disabled,
              onChange: (event) => { setIndex(Number(event.target.value)); setPasswordDraft(''); },
            }, ...accounts.map((entry, entryIndex) => h('option', { key: `${entry.id}-${entryIndex}`, value: String(entryIndex) },
              `${entry.email || t('missingAddress')} (${entry.id})`))),
            h('button', { type: 'button', className: 'ma-button ma-smallButton', disabled, onClick: addAccount }, t('addAccount')),
            h('button', {
              type: 'button', className: 'ma-button ma-smallButton', disabled: disabled || accounts.length <= 1,
              onClick: removeAccount,
            }, t('removeAccount'))),
          h(SettingsRow, { title: t('accountId'), hint: t('accountNote') },
            h('input', {
              className: 'ma-input', value: current?.id ?? '', disabled,
              'aria-label': t('accountId'),
              onChange: (event) => {
                const value = event.target.value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
                edit('id', value);
              },
            })),
          h(SettingsRow, { title: t('email'), hint: t('emailHint') },
            h('input', {
              type: 'email', className: 'ma-input', 'aria-label': t('email'),
              value: current?.email ?? '', placeholder: 'you@example.com', disabled,
              onChange: (event) => { edit('email', event.target.value); },
            })),
          h(SettingsRow, { title: t('password'), hint: t('passwordHint') },
            h('input', {
              type: 'password', className: 'ma-input', 'aria-label': t('password'),
              value: passwordDraft,
              placeholder: passwordFlags[currentId] ? '••••••••' : '',
              autoComplete: 'new-password', disabled,
              onChange: (event) => { editPassword(event.target.value); },
            })),
          h('div', { className: 'ma-row' },
            h('div', { className: 'ma-rowLabel' },
              h('span', { className: 'ma-rowTitle' },
                passwordFlags[currentId] === undefined ? t('checkingPassword')
                  : passwordFlags[currentId] ? t('passwordStatus') : t('passwordUnset'))),
            h('div', { className: 'ma-control' },
              h('button', { type: 'button', className: 'ma-button', disabled, onClick: clearSavedPassword }, t('clearPassword')))),
          ...TEXT_FIELDS.slice(1).map((field) => h(SettingsRow, {
            key: field.key,
            title: t(field.label),
            hint: field.hint ? t(field.hint) : '',
          }, input(field.key))),
          h(SettingsRow, { title: t('imapServer'), hint: t('imapServerHint') },
            input('imapHost', { placeholder: t('imapPlaceholder') }),
            input('imapPort', { type: 'number', className: 'ma-input ma-portInput', placeholder: '993' })),
          h(SettingsRow, { title: t('smtpServer'), hint: t('smtpServerHint') },
            input('smtpHost', { placeholder: t('smtpPlaceholder') }),
            input('smtpPort', { type: 'number', className: 'ma-input ma-portInput', placeholder: '465' })),
          h(SettingsRow, { title: t('downloadDir'), hint: t('downloadDirHint') },
            input('downloadDir', { placeholder: t('downloadDirPlaceholder') }))),
        h('div', { className: 'ma-actions' },
          h('button', {
            type: 'button', className: 'ma-button ma-primaryButton',
            disabled: disabled || phase === 'saved',
            onClick: save,
          }, phase === 'saving' ? t('saving') : phase === 'saved' ? t('saved') : t('save')),
          phase === 'saved' && h('span', { className: 'ma-saveState', role: 'status' }, t('saved')),
          error !== '' && h('span', { className: 'ma-error', role: 'alert' }, error),
          !snapshot.writable && h('span', { className: 'ma-saveState' }, t('readOnly'))),
        h('p', { className: 'ma-note' }, t('securityNote')),
        h('p', { className: 'ma-note' }, t('sendingNeedsApproval')));
    }

    // ------------------------------------------------------------------ apply
    return {
      inject: ['slots', 'locale', 'remote', 'configForms'],
      apply(ctx) {
        // A registration failure must never abort the whole web boot; log and continue.
        const safely = (label, run) => {
          try {
            return run();
          } catch (error) {
            console.error(`[mail-assistant] ${label} failed`, error);
            return undefined;
          }
        };

        safely('dictionaries', () => ctx.effect(() => ctx.locale.register(NS, { en, zh })));
        const t = safely('locale binding', () => ctx.locale.bind(NS)) ?? ((key) => key);

        // Password presence mirror, refreshed through the Host credentials remote.
        const passwordStore = makeStore({ configured: false, known: false });
        let credentialsApi = null;
        let credentialSequence = 0;
        const refreshPassword = () => {
          const api = credentialsApi;
          const sequence = ++credentialSequence;
          if (!api || typeof api.describe !== 'function') {
            passwordStore.set({ configured: false, known: false });
            return;
          }
          let request;
          try {
            request = api.describe([PASSWORD_REF]);
          } catch {
            if (sequence === credentialSequence && api === credentialsApi) passwordStore.set({ configured: false, known: false });
            return;
          }
          Promise.resolve(request).then((response) => {
            if (sequence !== credentialSequence || api !== credentialsApi) return;
            // Remote calls resolve to {ok, value}; the record lives in `value`.
            const record = response && response.ok === true ? response.value : null;
            const info = record?.[PASSWORD_REF];
            passwordStore.set({ configured: info?.configured === true, known: typeof info?.configured === 'boolean' });
          }).catch(() => {
            if (sequence !== credentialSequence || api !== credentialsApi) return;
            passwordStore.set({ configured: false, known: false });
          });
        };
        safely('credential mirror', () => {
          ctx.inject(['remote.credentials'], (child) => {
            const api = child.remote.credentials;
            credentialsApi = api;
            safely('credential events', () => {
              child.effect(() => child.remote.$on('credentials/reference-updated', () => {
                passwordStore.set({ configured: false, known: false });
                refreshPassword();
              }));
            });
            child.effect(() => () => {
              if (credentialsApi !== api) return;
              credentialsApi = null;
              credentialSequence += 1;
              passwordStore.set({ configured: false, known: false });
            });
            refreshPassword();
          });
        });

        const savePassword = (value) => {
          const api = credentialsApi;
          if (!api || typeof api.set !== 'function') return Promise.resolve(false);
          return api.set(PASSWORD_REF, value).then((response) => response?.ok === true).catch(() => false);
        };
        const clearPassword = () => {
          const api = credentialsApi;
          if (!api || typeof api.unset !== 'function') return Promise.resolve();
          return api.unset(PASSWORD_REF);
        };
        const savePasswordFor = (id, value) => {
          const api = credentialsApi;
          if (!api || typeof api.set !== 'function') return Promise.resolve(false);
          return api.set(passwordRefFor(id), value).then((response) => response?.ok === true).catch(() => false);
        };
        const clearPasswordFor = (id) => {
          const api = credentialsApi;
          if (!api || typeof api.unset !== 'function') return Promise.resolve();
          return api.unset(passwordRefFor(id));
        };
        const describePassword = (id) => {
          const api = credentialsApi;
          if (!api || typeof api.describe !== 'function') return Promise.resolve(false);
          const ref = passwordRefFor(id);
          return api.describe([ref]).then((response) => (
            response && response.ok === true ? response.value?.[ref]?.configured === true : false
          )).catch(() => false);
        };

        // The Settings form is served under the plugin's profile entry id, which
        // composition may prefix (e.g. "include:mail-assistant").
        const FALLBACK_SCOPE = { status: 'unavailable', revision: 0, writable: false, value: {}, base: {}, user: {} };
        let scope = null;
        const scopeListeners = new Set();
        const notifyScope = () => {
          for (const listener of scopeListeners) listener();
        };
        const scopeFacade = {
          getSnapshot: () => (scope === null ? FALLBACK_SCOPE : scope.getSnapshot()),
          subscribe: (listener) => {
            scopeListeners.add(listener);
            return () => { scopeListeners.delete(listener); };
          },
          set: (field, value) => (scope === null ? Promise.resolve(false) : scope.set(field, value)),
          unset: (field) => (scope === null ? Promise.resolve(false) : scope.unset(field)),
        };
        safely('config form binding', () => {
          const mirror = ctx.configForms.describe();
          const bind = () => {
            if (scope !== null) return;
            const namespaces = mirror.getSnapshot()?.view?.namespaces ?? [];
            const match = namespaces.find((entry) => entry.ns === 'mail-assistant')
              ?? namespaces.find((entry) => typeof entry.ns === 'string' && entry.ns.endsWith('mail-assistant'));
            if (match === undefined) return;
            const form = ctx.configForms.get(match.ns);
            scope = form;
            safely('config form subscription', () => ctx.effect(() => form.subscribe(notifyScope)));
            notifyScope();
          };
          safely('config describe', () => mirror.ensure?.());
          ctx.effect(() => mirror.subscribe(bind));
          bind();
        });

        // Workbench state and actions. The Remote API is read-only and never
        // exposes credentials; sending always goes through the conversation.
        const workbenchState = makeStore({ service: 'unavailable', accountId: '', accounts: { status: 'idle', list: [] }, overview: { status: 'idle' } });
        const workbench = { getSnapshot: workbenchState.getSnapshot, subscribe: workbenchState.subscribe, actions: {} };
        let mailApi = null;
        let epoch = 0;
        const sequences = { connection: 0, stats: 0, recent: 0, message: 0, search: 0, digest: 0, overview: 0, drafts: 0, draftWrite: 0, log: 0, accounts: 0, saved: 0 };
        const get = () => workbenchState.getSnapshot();
        const patch = (fields) => workbenchState.set({ ...get(), ...fields });
        const bump = (section) => { sequences[section] += 1; return sequences[section]; };
        const stale = (section, seq, requestEpoch) => requestEpoch !== epoch || seq !== sequences[section];

        const callRemote = async (section, method, args) => {
          const api = mailApi;
          if (!api || typeof api[method] !== 'function') throw new Error('mail service unavailable');
          const requestEpoch = epoch;
          const seq = bump(section);
          const previous = get()[section];
          patch({ [section]: { ...(previous && previous.status === 'ready' ? previous : {}), status: 'loading' } });
          try {
            const result = args === undefined ? await api[method]() : await api[method](args);
            if (stale(section, seq, requestEpoch)) return null;
            if (!result || result.ok !== true) {
              const detail = result?.error?.message || result?.error?.code || result?.message;
              throw new Error(typeof detail === 'string' && detail !== '' ? detail : 'mail request failed');
            }
            return result.value;
          } catch (error) {
            if (stale(section, seq, requestEpoch)) return null;
            patch({ [section]: { status: 'error' } });
            throw error;
          }
        };

        const loadAccounts = async () => {
          const value = await callRemote('accounts', 'accounts');
          if (value === null) return null;
          patch({ accounts: { status: 'ready', list: value.accounts || [], defaultId: value.defaultId || '' } });
          return value;
        };

        const selectAccount = async (id) => {
          epoch += 1;
          patch({
            accountId: id,
            connection: { status: 'untested' }, stats: {}, recent: {}, message: null, search: null, digest: null, drafts: {}, log: {},
            overview: { status: 'idle' }, aiBrief: { status: 'idle' }, savedFiles: [],
          });
        };

        const requireAccount = () => {
          const value = get();
          const list = value.accounts?.list || [];
          if (list.length === 0) throw new Error('no account');
          return value.accountId || list[0].id;
        };
        const folder = () => 'INBOX';

        const markConnection = (value) => ({
          status: value.status === 'incomplete' ? 'incomplete' : value.status === 'unavailable' ? 'unavailable'
            : value.imap.status === 'ok' && value.smtp.status === 'ok' ? 'connected'
            : value.imap.status === 'failed' || value.smtp.status === 'failed' ? 'failed' : 'untested',
          imap: value.imap.status,
          smtp: value.smtp.status,
          ...(value.status === 'tested' ? { testedAt: new Date().toISOString() } : {}),
        });

        const onConnected = (api) => {
          if (!api) return;
          mailApi = api;
          workbench.actions = {
            init: async () => {
              try {
                const value = await loadAccounts();
                if (value === null) return;
                const first = get().accounts.list[0];
                const current = get().accountId || '';
                if (first && (!current || !get().accounts.list.some((entry) => entry.id === current))) patch({ accountId: first.id });
                if (!first) return;
                await workbench.actions.overview().catch(() => {});
              } catch { /* surfaced by the sections */ }
            },
            selectAccount: async (id) => {
              await selectAccount(id);
              await workbench.actions.overview().catch(() => {});
            },
            overview: async () => {
              const api = mailApi;
              if (!api) return;
              const loadLegacyOverview = async () => {
                const results = await Promise.allSettled([
                  workbench.actions.refresh(),
                  workbench.actions.stats(),
                  workbench.actions.digest(Number(get().digestDays) || 7),
                ]);
                const failure = results.find((result) => result.status === 'rejected');
                if (failure) throw failure.reason;
                patch({ overview: { status: 'ready', at: new Date().toISOString() }, aiBrief: { status: 'idle' } });
              };
              if (typeof api.overview !== 'function') {
                await loadLegacyOverview();
                return;
              }
              const now = new Date();
              const days = Number(get().digestDays) || 7;
              try {
                const value = await callRemote('overview', 'overview', {
                  accountId: requireAccount(), folder: folder(), days, limit: 50,
                  localDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                  localOffsetMinutes: -now.getTimezoneOffset(),
                });
                if (value === null) return;
                const stats = value.stats;
                const digest = value.digest;
                const items = Array.isArray(value.recent) ? value.recent : [];
                patch({
                  overview: { status: 'ready', at: new Date().toISOString() },
                  stats: { status: 'ready', value: stats, at: new Date().toISOString() },
                  digest: { status: 'ready', value: digest },
                  digestDays: value.days || days,
                  aiBrief: { status: 'idle' },
                  recent: {
                    status: 'ready', items, total: stats?.total ?? 0, folder: value.folder || folder(),
                    refreshedAt: new Date().toISOString(), limit: items.length,
                  },
                });
              } catch (error) {
                // Older Host halves may not expose overview yet. Keep the
                // assistant usable with the original read-only endpoints.
                try { await loadLegacyOverview(); } catch { throw error; }
              }
            },
            checkConnection: async () => {
              const value = await callRemote('connection', 'checkConnection', { accountId: requireAccount() });
              if (value !== null) patch({ connection: markConnection(value) });
            },
            refresh: async () => {
              const value = await callRemote('recent', 'list', { accountId: requireAccount(), folder: folder(), limit: 20 });
              if (value !== null) patch({ recent: { status: 'ready', items: value.messages || [], total: value.total ?? 0, folder: value.folder, refreshedAt: new Date().toISOString(), limit: 20 } });
            },
            refreshMore: async () => {
              const value = await callRemote('recent', 'list', { accountId: requireAccount(), folder: folder(), limit: 50 });
              if (value !== null) patch({ recent: { status: 'ready', items: value.messages || [], total: value.total ?? 0, folder: value.folder, refreshedAt: new Date().toISOString(), limit: 50 } });
            },
            stats: async (options = {}) => {
              const now = new Date();
              const value = await callRemote('stats', 'stats', {
                accountId: requireAccount(), folder: folder(),
                localDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                localOffsetMinutes: -now.getTimezoneOffset(),
                days: Number(get().digestDays) || 7,
              });
              if (value === null) return;
              patch({ stats: { status: 'ready', value, at: new Date().toISOString() } });
              if (options.reminder === true) {
                const previous = get().reminderLastUnread;
                const previousAttention = get().reminderLastAttention;
                const notices = [];
                if (typeof previous === 'number' && value.unread > previous) {
                  notices.push(t('reminderNotice').replace('{count}', String(value.unread)));
                }
                if (typeof previousAttention === 'number' && value.attention > previousAttention) {
                  notices.push(t('reminderAttention').replace('{count}', String(value.attention)));
                }
                if (notices.length > 0) patch({ reminderNotice: notices.join(' ') });
                patch({ reminderLastUnread: value.unread, reminderLastAttention: value.attention });
              }
            },
            read: async (uid) => {
              const value = await callRemote('message', 'read', { accountId: requireAccount(), folder: get().recent?.folder || folder(), uid });
              if (value !== null) patch({ message: { status: 'ready', value }, savedFiles: [] });
            },
            closeMessage: () => { bump('message'); patch({ message: null, savedFiles: [] }); },
            search: async (form) => {
              const args = { accountId: requireAccount(), folder: folder(), limit: 30 };
              for (const key of ['query', 'from', 'to', 'since', 'before', 'category']) {
                if (typeof form?.[key] === 'string' && form[key].trim() !== '') args[key] = form[key].trim();
              }
              if (form?.unreadOnly === true) args.unreadOnly = true;
              const value = await callRemote('search', 'search', args);
              if (value !== null) patch({ search: { status: 'ready', value } });
            },
            clearSearch: () => { bump('search'); patch({ search: null }); },
            digest: async (days) => {
              const value = await callRemote('digest', 'digest', { accountId: requireAccount(), folder: folder(), days: days || 7, limit: 50 });
              if (value !== null) patch({ digest: { status: 'ready', value }, digestDays: days || 7, aiBrief: { status: 'idle' } });
            },
            aiBrief: async (days) => {
              const value = await callRemote('aiBrief', 'aiBrief', {
                accountId: requireAccount(), folder: folder(), days: days || get().digestDays || 7, maxBodies: 10,
              });
              if (value !== null) patch({ aiBrief: { status: 'ready', value }, digestDays: days || get().digestDays || 7 });
              return value;
            },
            loadDrafts: async () => {
              const value = await callRemote('drafts', 'drafts', { accountId: requireAccount() });
              if (value !== null) patch({ drafts: { status: 'ready', list: value.drafts || [] } });
            },
            createDraft: async (form) => {
              const value = await callRemote('draftWrite', 'draftCreate', {
                accountId: form.accountId || requireAccount(),
                to: form.to, cc: form.cc, bcc: form.bcc,
                subject: form.subject, body: form.body, html: form.html || '',
              });
              if (value !== null) await workbench.actions.loadDrafts().catch(() => {});
              return value;
            },
            updateDraft: async (form) => {
              const value = await callRemote('draftWrite', 'draftUpdate', {
                id: form.id, to: form.to, cc: form.cc, bcc: form.bcc,
                subject: form.subject, body: form.body, html: form.html || '',
              });
              if (value !== null) await workbench.actions.loadDrafts().catch(() => {});
              return value;
            },
            deleteDraft: async (id) => {
              const value = await callRemote('draftWrite', 'draftDelete', { id });
              if (value !== null) await workbench.actions.loadDrafts().catch(() => {});
              if (value === null) return false;
              return value.deleted !== false;
            },
            createReplyDraft: async (uid) => {
              const value = await callRemote('draftWrite', 'draftReply', {
                accountId: requireAccount(), folder: get().recent?.folder || folder(), uid,
              });
              if (value !== null) await workbench.actions.loadDrafts().catch(() => {});
              return value;
            },
            loadLog: async () => {
              const value = await callRemote('log', 'log');
              if (value !== null) patch({ log: { status: 'ready', entries: value.entries || [] } });
            },
            saveAttachment: async (uid, index) => {
              const value = await callRemote('saved', 'saveAttachments', {
                accountId: requireAccount(), folder: get().recent?.folder || folder(), uid, indices: [index],
              });
              if (value !== null) patch({ savedFiles: value.saved || [] });
            },
          };
          epoch += 1;
          patch({ service: 'ready', connection: { status: 'untested' }, overview: { status: 'idle' }, aiBrief: { status: 'idle' } });
        };

        safely('mail remote mount', () => {
          if (typeof ctx.remote?.$mount !== 'function') return;
          ctx.effect(() => {
            let active = true;
            let unmount;
            let uninject;
            let configReloadTimer = null;
            const resetForConfig = () => {
              epoch += 1;
              patch({ recent: {}, message: null, search: null, digest: null, stats: {}, overview: { status: 'idle' }, aiBrief: { status: 'idle' }, savedFiles: [] });
              if (typeof setTimeout !== 'function') return;
              if (configReloadTimer !== null) clearTimeout(configReloadTimer);
              configReloadTimer = setTimeout(() => {
                configReloadTimer = null;
                if (!active || !mailApi || get().service !== 'ready') return;
                workbench.actions.init().catch(() => {});
              }, 250);
            };
            const unsubscribeScope = scopeFacade.subscribe(resetForConfig);
            const unsubscribePassword = passwordStore.subscribe(resetForConfig);
            Promise.resolve(ctx.remote.$mount(TYPERT_REMOTE)).then((dispose) => {
              if (!active) { if (typeof dispose === 'function') dispose(); return; }
              unmount = dispose;
              uninject = ctx.inject(['remote.mailAssistant'], (child) => {
                if (!active) return;
                const api = child.remote.mailAssistant;
                onConnected(api);
                child.effect(() => () => {
                  if (mailApi !== api) return;
                  mailApi = null;
                  workbench.actions = {};
                  epoch += 1;
                  patch({ service: 'unavailable', accounts: { status: 'idle', list: [] }, recent: {}, message: null, search: null, digest: null, stats: {}, overview: { status: 'idle' }, aiBrief: { status: 'idle' }, drafts: {}, log: {}, savedFiles: [] });
                });
              });
            }).catch(() => { if (active) patch({ accounts: { status: 'error', list: [] } }); });
            return () => {
              active = false; mailApi = null; workbench.actions = {};
              epoch += 1;
              if (configReloadTimer !== null) clearTimeout(configReloadTimer);
              unsubscribeScope(); unsubscribePassword();
              if (typeof uninject === 'function') uninject();
              if (typeof unmount === 'function') unmount();
            };
          });
        });

        safely('sidebar entry', () => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'mail-assistant',
          order: 10,
          label: () => t('panelLabel'),
        }, MailGlyph)));

        safely('main panel', () => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'mail-assistant',
          locale: NS,
          inject: () => ({ translate: t, scope: scopeFacade, password: passwordStore, workbench }),
        }, guarded(MailPanel))));

        safely('settings section', () => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'mail-assistant',
          order: 30,
          label: () => t('settingsLabel'),
          locale: NS,
          inject: () => ({
            translate: t, scope: scopeFacade, password: passwordStore,
            savePassword, clearPassword, refreshPassword,
            describePassword, savePasswordFor, clearPasswordFor,
          }),
        }, guarded(MailSettings))));
      },
    };
  },
});
