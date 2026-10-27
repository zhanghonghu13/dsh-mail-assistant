# 邮件助手 · DSH Mail Assistant

一个带左侧栏入口的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：

- **左侧栏入口**：信封图标「邮件助手」，点击进入主面板
- **设置 → 邮件助手**：填写邮箱地址、专用密码（IMAP 授权码）、IMAP/SMTP 服务器、附件目录
- **智能体能力**：查信、搜索、读信、保存附件、起草并发送邮件（发送前必弹确认）

配置完成后，直接对智能体说「看看最近有什么邮件」「找一下小明发来的报告」「把附件存到桌面」「帮我给张三写封邮件」即可。

## 安装

### 从 npm 安装（推荐）

```bash
# 在 DSH 插件管理界面搜索安装，或：
plugin_manager action=install_bundle target=@zhanghonghu13/dsh-mail-assistant
```

依赖 `@deepseek-ai/schemastery` 与 `@deepseek-ai/cosmokit` 会自动安装。

### 从源码安装

```bash
git clone https://github.com/zhanghonghu13/dsh-mail-assistant
# 把克隆目录的绝对路径交给 plugin_manager install_bundle
```

源码目录内已自带 `node_modules/@deepseek-ai/` 下的两个运行时依赖（MIT，保留其 LICENSE），因此源码安装无需联网拉依赖。

> **npm 版与源码版二选一**：两者包名相同（`@zhanghonghu13/dsh-mail-assistant`），同时安装会产生重复的 Loader 行与重复的客户端模块注册，导致启动失败。切换前请先移除已安装的那个。

安装后刷新页面：左侧栏出现「邮件助手」，设置里出现「邮件助手」页。

## 配置

打开「设置 → 邮件助手」：

| 字段 | 说明 |
|---|---|
| 邮箱地址 | 例如 `you@qq.com` |
| 专用密码 | QQ/163/126 等邮箱请填写 **IMAP 授权码**，不是登录密码。密码保存在 DSH 本地凭据库（`.credentials.yaml`），不会写进设置文件 |
| 发件人显示名 | 可选 |
| IMAP / SMTP 服务器 | 留空则按邮箱域名自动识别（QQ、163、126、新浪、搜狐、Gmail、Outlook、iCloud 等常见服务商） |
| 附件保存目录 | 可选；留空时存到当前会话目录 |

常见服务商端口会自动推断：IMAP 993（SSL），SMTP 465（SSL）或 587（STARTTLS）。

## 智能体工具

| 工具 | 作用 |
|---|---|
| `mail_list` | 按文件夹列出最近邮件（uid、发件人、主题、日期、未读标记） |
| `mail_search` | 组合搜索：关键词、发件人、收件人、日期范围、未读 |
| `mail_read` | 读取一封邮件：主题、收发件人、正文（可限字符数）、附件列表 |
| `mail_save_attachments` | 保存附件到指定目录（默认设置目录或会话目录），返回保存路径 |
| `mail_send` | 起草并发送；支持抄送/密送、HTML 正文、最多 3 个附件 |

### 发送需要确认

`mail_send` 每次调用都会经过 DSH 的审批流程，由用户在界面中确认后才真正投递。审批提示包含收件人与主题。

## 安全

- 专用密码存放在 DSH 凭据库（`ctx.credentials`），不进入插件配置与日志
- 邮件正文、主题、发件人、附件名一律视为**不可信外部数据**：读取结果带有提示，不会把邮件内容当作用户指令执行
- 只通过 TLS（IMAP 993 / SMTP 465 或 STARTTLS）连接邮箱服务器

## 实现说明

```
mail-assistant/
├── index.js          # Host 半：Config、工具注册、发送审批闸门、系统提示
├── client.js         # 浏览器半：侧边栏图标、主面板、设置页表单
├── lib/imap.js       # 最小 IMAP4rev1 客户端（LOGIN/SELECT/SEARCH/FETCH/LOGOUT）
├── lib/smtp.js       # 最小 SMTP 客户端（SSL/STARTTLS、AUTH LOGIN、DATA）
├── lib/mime.js       # MIME 解析与构造（multipart、RFC2047、QP/base64、GBK 等字符集）
├── lib/providers.js  # 常见邮箱服务商端点预设
├── cordis.patch.yml  # 插入一行 Loader 配置
├── locale/{en,zh}.json
├── icon.svg
└── tests/            # 离线测试
```

- Host 半注册 5 个工具，并通过 `tools/pre-execute` 对 `mail_send` 返回 `ask`，接入 DSH 审批
- 设置页通过 `ctx.configForms` + `ctx.remote.credentials` 持久化：配置进插件行配置，密码进凭据库
- 设置命名空间从 `configForms.describe()` 镜像动态解析，兼容 `include:` 前缀组合
- 客户端渲染有错误边界，单个页面渲染失败不会影响整个应用启动

## 测试

```bash
node tests/mime-test.mjs          # MIME 解析/构造往返
node tests/imap-parser-test.mjs   # IMAP 响应解析（字面量、RFC2047、多字面量）
node tests/apply-test.mjs         # Host 工具注册、审批闸门、schema 校验
node tests/client-test.mjs        # 客户端注册 + 真实 React 渲染（需 react/react-dom）
```

`client-test.mjs` 需要 `react` 与 `react-dom`（v18）：

```bash
npm install react@18 react-dom@18
```

## 许可

以 [MIT License](LICENSE) 开源。自带依赖 `@deepseek-ai/schemastery` 与 `@deepseek-ai/cosmokit` 同为 MIT 许可，其 LICENSE 文件随包附带。
