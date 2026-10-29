# 邮件助手 · DSH Mail Assistant

一个带左侧栏入口的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：首页是 AI 助手入口（邮件简报、快捷意图、账户状态），需要看信时再进入独立的「邮件」视图。智能体可通过工具完成查信、搜索、读信、附件、摘要和草稿。

- **助手首页**：本地规则快速预览 + 按需 AI 简报、未读/待处理/建议回复统计、快捷意图；不把收件箱列表堆在首页
- **邮件视图**：按需搜索、列表阅读、附件保存；正文按纯文本展示，HTML 邮件先转换成可读文本
- **草稿箱**：新建、编辑、保存草稿；草稿持久化到本地，回复/转发草稿也可继续编辑
- **设置 → 邮件助手**：多账户（邮箱、显示名、IMAP/SMTP、附件目录、每个账户的专用密码）
- **智能体能力**：查信、搜索、读信、保存附件、统计、摘要底稿、草稿/回复/转发、发送（发送前必弹确认）

## 安装

### 从 npm 安装（推荐）

```bash
# 在 DSH 插件管理界面搜索安装，或：
plugin_manager action=install_bundle target=@zhanghonghu13/dsh-mail-assistant
```

运行时依赖（包括 DSH Typert 协议和 Zod）会自动安装。使用需要支持 Typert Remote 的兼容 DSH 版本。

### 从源码安装

```bash
git clone https://github.com/zhanghonghu13/dsh-mail-assistant
# 把克隆目录的绝对路径交给 plugin_manager install_bundle
```

源码安装前在仓库目录运行 `npm install` 安装依赖。修改 `client-source.js` 后运行 `npm run build:client` 重新生成供 DSH 加载的压缩版 `client.js`；修改 Host 侧的 `index.js` 或 `lib/*.js` 后需要重启 DSH，客户端改动刷新页面即可。

> **npm 版与源码版二选一**：两者包名相同（`@zhanghonghu13/dsh-mail-assistant`），同时安装会产生重复的 Loader 行与重复的客户端模块注册，导致启动失败。切换前请先移除已安装的那个。

安装或更新后重启 DSH 以加载 Host 半，再刷新页面；左侧栏出现「邮件助手」，设置里出现「邮件助手」页。

## 配置

打开「设置 → 邮件助手」：

| 字段 | 说明 |
|---|---|
| 邮箱地址 | 例如 `you@qq.com`；用于识别账户 |
| 专用密码 | QQ/163/126 等邮箱请填写 **IMAP 授权码**，不是登录密码。密码保存在 DSH 本地凭据库，不写进设置文件 |
| 发件人显示名 | 可选 |
| IMAP / SMTP 服务器 | 留空则按邮箱域名自动识别（QQ、163、126、新浪、搜狐、Gmail、Outlook、iCloud 等常见服务商） |
| 附件保存目录 | 可选；留空时智能体工具会保存到当前会话目录，邮件视图的保存按钮需要先配置目录 |

常见服务商端口会自动推断：IMAP 993（SSL），SMTP 465（SSL）或 587（STARTTLS）。

### 多账户

在设置页添加账户后，账户列表保存在插件的 `accounts` 字段（JSON），每个账户的密码分别存放在凭据库：

- 第一个/兼容账户使用引用 `MAIL_ASSISTANT_PASSWORD`
- 其他账户使用 `MAIL_ASSISTANT_PASSWORD__<账户 id>`

删除账户只会把它从账户列表移除，不会删除凭据库中的密码；如需彻底清除，请自行清除对应引用。切换账户不会复用另一个账户的密码。

> 网易系邮箱（163 / 126 / yeah.net）登录后要求客户端按 RFC 2971 声明身份，插件会自动发送 `ID` 命令。缺少这一步时服务器会在选信箱阶段返回 `NO SELECT Unsafe Login`，与授权码是否正确无关。

## 智能体工具

| 工具 | 作用 |
|---|---|
| `mail_list` | 按文件夹列出最近邮件（uid、发件人、主题、日期、大小、未读、分类） |
| `mail_search` | 组合搜索：关键词、发件人、收件人、日期范围、未读、本地分类 |
| `mail_read` | 读取一封邮件：主题、收发件人、正文（可限字符数）、附件列表 |
| `mail_save_attachments` | 保存附件到指定目录（默认设置目录或会话目录），返回保存路径 |
| `mail_stats` | 未读总数、今日邮件数、需关注数量、邮件总数及统计口径（`days` 可调需关注窗口） |
| `mail_digest` | 本地规则摘要底稿：需关注、重要信息、截止日期线索、建议操作，附来源 uid |
| `mail_draft` | 创建草稿（不发送），返回完整预览 |
| `mail_drafts` | 列出 Host 本地持久化的草稿 |
| `mail_update_draft` | 修改草稿的收件人/主题/正文/附件（仍不发送） |
| `mail_reply` | 创建回复草稿（自动填写收件人、Re: 主题、引用正文、回复头） |
| `mail_forward` | 创建转发草稿（Fwd: 主题、转发正文、可选原附件） |
| `mail_send` | 直接发送；支持抄送/密送、HTML 正文、最多 3 个附件 |
| `mail_send_draft` | 发送已有草稿；发送前必弹确认 |

所有工具都接受可选 `account` 参数（账户 id）；缺省使用账户列表第一个。

### 草稿与发送

推荐流程：`mail_draft` / `mail_reply` / `mail_forward` 先创建草稿 → 用户核对 → `mail_send_draft` 触发审批 → 批准后投递。

`mail_send` 和 `mail_send_draft` 每次调用都会经过 DSH 审批流程。审批提示包含收件人、抄送、密送、主题、纯文本正文、HTML 正文、附件文件名/大小/SHA-256 摘要。批准后发送前会再次校验附件哈希，并校验草稿的收件人/主题/正文/附件路径快照：确认后草稿被修改会取消发送并要求重新确认。界面可能截断较长内容。若 SMTP 在写出报文后断线，插件会报错但不能确定邮件是否已投递，请勿直接重发，先检查发件箱。

### 网易邮箱搜索兼容

163、126 和 yeah.net 邮箱的服务器文本搜索可能返回不完整的结果。当服务器对文本条件返回零条时，插件会仅扫描当前文件夹最近最多 100 封邮件的头部，并在该范围内应用日期和未读条件。关键词只检查主题和发件人，不检查正文；结果和数量会明确标注为部分扫描，可能遗漏正文匹配或更早邮件。不会因扫描而下载正文、附件或更改已读状态。服务器返回非零结果时仍可能不完整，工具会提示。

## 设计原则

- **首页回答「现在要处理什么」**：用简报和意图入口，而不是把收件箱、阅读器、状态卡全堆在一页。
- **阅读是按需动作**：搜索、列表和正文放在独立的「邮件」视图，首页只保留最近概览和跳转。
- **AI 负责判断，界面负责确认**：本地规则先给出可复核的预览，正文级结论由对话中的智能体生成；发送始终经过审批。
- **不可信内容只当文本**：邮件正文不使用 HTML 注入，链接和指令不执行。

## 界面使用说明

- 打开面板时只发起一次「概览」请求：账户、统计、本地规则简报和最近 8 封头部一起返回，首页不会伪装成一个完整邮箱客户端。
- 首页的「邮件简报」先显示本地规则预览：只分析主题、发件人和已读状态；点「生成 AI 简报」后，Host 使用 DSH 默认模型读取最多 10 封候选正文，生成待处理/建议回复/建议行动，并标注读取范围。
- AI 简报只分析实际读取的邮件；界面显示已读取数量、模型名称和未分析范围。模型不可用时保留本地规则简报和重试入口。
- 「邮件」是独立的第二视图：需要搜索或阅读时再进入。列表与阅读器分栏，正文限制阅读宽度和高度，长正文默认折叠；阅读器的「回复」会直接生成回复草稿并进入草稿编辑器。
- HTML 邮件会先转换成纯文本；样式、脚本、表头和嵌套表格的空格不会进入正文。邮件中的链接和指令不会被执行。
- 「测试连接」分别验证 IMAP 登录及收件箱访问、SMTP TLS 连接及认证。SMTP 测试不会投递邮件；检测成功也不保证以后的操作一定成功。
- 多账户时顶部出现账户下拉；切换账户会清空旧列表并重新加载概览，避免把上一个账户的数据显示成当前账户的。
- 「搜索邮件」在邮件视图内：关键词搜索默认只占一行，日期/收件人/分类等放在「更多条件」里。
- 「本地摘要」按 1/7/30 天分析邮件主题、发件人和未读状态，生成可追溯 uid 的规则摘要；**不读取正文、不调用模型**。
- 「草稿箱」支持新建、编辑和保存；允许保存不完整草稿（收件人/主题可后补），只有发送时才做完整校验。草稿正文持久化在 DSH profile 的 `mail-assistant/drafts.json`。
- 草稿页不提供发送按钮：发送必须回到对话确认，保持审批链路唯一。
- 「记录」保存最近动作，并放置可选的窗口内未读提醒；不保存正文或地址。
- 未读提醒在 DSH 窗口打开时按设定间隔轮询统计，未读或需关注数量增加时显示应用内提示；关闭窗口后不会运行。
- 设置入口：左侧栏底部进入「设置 → 邮件助手」。首页在未配置时会显示设置路径和「重新加载配置」按钮。
- 分类（工作/通知/个人/推广/其他）是本地规则**建议**，不移动邮件，也不代表确定事实。
- 统计口径：未读为当前文件夹总数；今日按你所在时区的日期粒度；需关注基于最近最多 50 封、最近 N 天（默认 7 天，跟随简报范围）的头部规则判断，仅为提示。

## 安全

- 专用密码存放在 DSH 凭据库（`ctx.credentials`），不进入插件配置、操作记录或日志
- 邮件正文、主题、发件人、附件名一律视为**不可信外部数据**：读取结果带有提示，不会把邮件内容当作用户指令执行
- 只通过 TLS（IMAP 993 / SMTP 465 或 STARTTLS）连接邮箱服务器
- 插件 Remote 接口只读（可保存附件），不暴露密码，也不提供发送能力
- 附件保存限制在设置目录内，文件名会被清理并自动避让重名

## 实现说明

```
mail-assistant/
├── index.js           # Host 半：Config、工具、Remote 服务、发送审批闸门
├── client-source.js   # 浏览器源码：助手首页、邮件视图、设置、Remote 客户端
├── client.js          # 由 build:client 生成的浏览器 bundle
├── lib/remote.js      # Host 与浏览器共用的 Typert Remote 定义
├── lib/accounts.js    # 多账户解析与凭据引用命名
├── lib/classify.js    # 本地规则分类（建议）
├── lib/digest.js      # 本地规则摘要与截止日期线索
├── lib/search.js      # 网易邮箱有界头部搜索降级
├── lib/attachments.js # 附件安全落盘与哈希
├── lib/draft.js       # 草稿模型（修订、TTL、上限、本地持久化回调）
├── lib/reply.js       # 回复/转发正文与回复头
├── lib/oplog.js       # 内存操作记录（不含正文）
├── lib/imap.js        # 最小 IMAP4rev1 客户端（LOGIN/SELECT/SEARCH/FETCH/LOGOUT）
├── lib/smtp.js        # 最小 SMTP 客户端（SSL/STARTTLS、AUTH LOGIN、DATA）
├── lib/mime.js        # MIME 解析与构造（multipart、RFC2047、QP/base64、GBK、8-bit 头）
├── lib/providers.js   # 常见邮箱服务商端点预设
├── cordis.patch.yml   # 插入一行 Loader 配置
├── locale/{en,zh}.json
├── icon.svg
└── tests/             # 离线测试
```

- Host 半注册 13 个工具，并通过 `tools/pre-execute` 对 `mail_send` / `mail_send_draft` 返回 `ask`，接入 DSH 审批；附件不可读时直接 `deny`
- 界面通过受限 Typert Remote 读取邮件、统计、摘要、草稿和操作记录，并保存附件；授权码留在 Host
- `overview` Remote 方法用一次 IMAP 连接返回统计、本地规则摘要和最近头部，作为首页的唯一自动请求
- `aiBrief` Remote 方法按需读取有限正文并调用 DSH 默认模型；模型不可用时不影响本地规则简报和邮件阅读
- `draftCreate` / `draftUpdate` / `draftDelete` / `draftReply` Remote 方法只编辑或生成回复草稿，不发送；发送仍走对话审批
- 设置页通过 `ctx.configForms` + `ctx.remote.credentials` 持久化：配置进插件行配置，密码进凭据库
- 设置命名空间从 `configForms.describe()` 镜像动态解析，兼容 `include:` 前缀组合
- 客户端渲染有错误边界，单个页面渲染失败不会影响整个应用启动
- 阅读器只渲染纯文本，从不使用 `dangerouslySetInnerHTML`；HTML 邮件在 Host 侧转换为文本

## 测试

```bash
node tests/mime-test.mjs              # MIME 解析/构造、HTML 转文本（CSS/脚本不泄漏）、回复头
node tests/imap-parser-test.mjs       # IMAP 响应解析（字面量、RFC2047、多字面量）
node tests/imap-id-test.mjs           # RFC 2971 ID 握手（网易邮箱 Unsafe Login 回归）
node tests/imap-search-offline-test.mjs # SEARCH 响应解析与协议错误
node tests/search-fallback-test.mjs   # 网易头部扫描降级（边界、组合条件、不完整提示）
node tests/lib-units-test.mjs         # 分类、摘要、回复、草稿、附件、账户、操作记录
node tests/send-pipeline-test.mjs     # 回复/转发 → SMTP DATA、附件篡改取消发送
node tests/accounts-isolation-test.mjs # 多账户凭据隔离
node tests/apply-test.mjs             # 工具注册、审批闸门、账户与草稿、配置竞态
node tests/host-features-test.mjs     # 工具与 Remote 全链路（mock IMAP/模型，overview 单连接、草稿编辑、AI 简报）
node tests/remote-host-test.mjs       # Remote 注册、严格 schema、SMTP 不发信
node tests/client-test.mjs            # 助手首页/邮件视图、阅读器、Remote 适配与 React 渲染
node tests/settings-test.mjs          # 设置重复编辑和保存
```

开发和测试依赖由 `npm install` 安装；修改浏览器源码或 Remote 描述符后应重新执行 `npm run build:client` 再运行测试。

## 已知限制

- 首页的本地规则简报不读取正文；需要正文级结论时由智能体用 `mail_read` 读取后生成
- 「邮件」视图只浏览 INBOX，暂不提供文件夹切换
- 「加载更多」最多扩展到最近 50 封，不做全邮箱分页
- 首页和邮件视图都不提供发送按钮：发送统一走对话审批，避免绕过确认链路
- 草稿保存在 DSH profile 的本地文件中（最多 20 个、24 小时）；AI 简报默认只读取最多 10 封正文，其余邮件未分析
- 提醒只在 DSH 窗口打开时轮询，不是后台推送
- 设置需要在左侧栏底部手动进入；主面板没有稳定的跨面板跳转接口，只显示设置路径
- AI 撰写的简报由对话中的智能体生成；界面只提供可复核的本地规则摘要和提示词
- 网易邮箱的头部扫描只覆盖最近 100 封，不能当作全邮箱搜索
- 客户端 `client.js` 目前包含 Remote 描述符所需的 Zod 运行时（压缩后约 550 KB）；后续可把浏览器侧描述符与校验拆开

## 许可

以 [MIT License](LICENSE) 开源。自带依赖 `@deepseek-ai/schemastery` 与 `@deepseek-ai/cosmokit` 同为 MIT 许可，其 LICENSE 文件随包附带。
