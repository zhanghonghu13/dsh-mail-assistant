// Mail Assistant — browser half.
// The module id MUST equal the installed package name (see package.json), so
// this file ships with the same identity as the npm package.
// Registers the sidebar glyph, the main panel page, and the Settings section
// that stores the mailbox address (row config) and the dedicated password
// (Host credential store).

window.__ModuleLoader__.load({
  id: '@zhanghonghu13/dsh-mail-assistant',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Dictionary namespace owned by this plugin. */
    const NS = 'mailAssistant';
    const PASSWORD_REF = 'MAIL_ASSISTANT_PASSWORD';

    const en = {
      panelLabel: 'Mail',
      panelTitle: '✉️ Mail Assistant',
      panelIntro: 'The agent can check mail, read messages, save attachments, and draft and send email once your mailbox is configured.',
      configuredAs: 'Configured mailbox',
      notConfigured: 'Not configured yet',
      passwordSaved: 'password saved',
      passwordMissing: 'password missing',
      capabilitiesTitle: 'What you can ask',
      capabilityList: 'List recent mail — “看看最近有什么邮件”\nSearch mail — “找一下小明发来的报告”\nRead a message — “读一下 uid 42 那封”\nSave attachments — “把附件存到桌面”\nDraft and send — “帮我给张三写封邮件”',
      openSettingsHint: 'Open Settings → Mail Assistant to configure your mailbox address and dedicated password.',
      settingsLabel: 'Mail Assistant',
      email: 'Email address',
      emailHint: 'For QQ, 163, and similar providers use the IMAP authorization code, not the login password.',
      password: 'Dedicated password',
      passwordHint: 'Stored in the Harness credential store, not the settings file. Leave blank to keep the current password.',
      passwordStatus: 'Password saved',
      passwordUnset: 'No password saved',
      clearPassword: 'Clear saved password',
      senderName: 'Sender display name',
      senderNameHint: 'Shown to recipients; defaults to the bare address.',
      imapServer: 'IMAP server',
      imapServerHint: 'Auto-detected for common providers; leave blank to use the default.',
      smtpServer: 'SMTP server',
      smtpServerHint: 'Auto-detected for common providers; leave blank to use the default.',
      port: 'Port',
      downloadDir: 'Attachment directory',
      downloadDirHint: 'Where mail_save_attachments drops files; empty uses the current session directory.',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      saveFailed: 'The Host did not accept these values; please review and retry.',
      readOnly: 'This deployment stores settings read-only.',
      unavailable: 'Mail Assistant settings are unavailable until the Host serves them.',
      securityNote: 'The password is stored in the local Harness credential store and is passed to your mail provider only.',
      sendingNeedsApproval: 'Every outgoing message asks for your confirmation before it is sent.',
    };

    const zh = {
      panelLabel: '邮件助手',
      panelTitle: '✉️ 邮件助手',
      panelIntro: '配置邮箱后，智能体可以帮你查信、读信、保存附件，还能起草和发送邮件。',
      configuredAs: '已配置邮箱',
      notConfigured: '尚未配置',
      passwordSaved: '已保存密码',
      passwordMissing: '未保存密码',
      capabilitiesTitle: '你可以这样说',
      capabilityList: '查信 —「看看最近有什么邮件」\n搜索 —「找一下小明发来的报告」\n读信 —「读一下 uid 42 那封」\n存附件 —「把附件存到桌面」\n起草发送 —「帮我给张三写封邮件」',
      openSettingsHint: '在左侧栏底部打开「设置 → 邮件助手」，填写邮箱地址和专用密码。',
      settingsLabel: '邮件助手',
      email: '邮箱地址',
      emailHint: 'QQ、163 等邮箱请使用 IMAP 授权码/专用密码，而不是登录密码。',
      password: '专用密码',
      passwordHint: '保存在 Harness 本地凭据库中，不写入设置文件；留空表示保持当前密码不变。',
      passwordStatus: '已保存密码',
      passwordUnset: '未保存密码',
      clearPassword: '清除已保存的密码',
      senderName: '发件人显示名',
      senderNameHint: '收件人看到的名字；留空则显示邮箱地址。',
      imapServer: 'IMAP 服务器',
      imapServerHint: '常见邮箱会自动识别；留空使用默认值。',
      smtpServer: 'SMTP 服务器',
      smtpServerHint: '常见邮箱会自动识别；留空使用默认值。',
      port: '端口',
      downloadDir: '附件保存目录',
      downloadDirHint: '保存附件的位置；留空时保存到当前会话目录。',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      saveFailed: '本次保存未被接受，请检查后重试。',
      readOnly: '本部署的设置为只读。',
      unavailable: '邮件助手设置暂不可用。',
      securityNote: '专用密码保存在本机凭据库中，只会在连接邮箱服务器时使用。',
      sendingNeedsApproval: '每一封外发邮件都会先请你确认，批准后才会发出。',
    };

    // ---------------------------------------------------------------- styles
    const css = [
      '.ma-panel{display:flex;flex-direction:column;align-items:center;padding:48px 24px;overflow-y:auto;height:100%}',
      '.ma-card{display:flex;flex-direction:column;gap:16px;width:100%;max-width:560px}',
      '.ma-title{display:flex;align-items:center;gap:12px;color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600;margin:0}',
      '.ma-intro{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px;margin:0}',
      '.ma-status{display:flex;flex-direction:column;gap:8px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);padding:14px 16px;background:var(--dsw-alias-bg-base)}',
      '.ma-statusRow{display:flex;justify-content:space-between;gap:16px;color:var(--dsw-alias-label-primary);font-size:13px}',
      '.ma-statusDim{color:var(--dsw-alias-label-tertiary)}',
      '.ma-sectionTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;margin:8px 0 0}',
      '.ma-capabilities{display:flex;flex-direction:column;gap:6px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;white-space:pre-wrap;margin:0}',
      '.ma-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}',
      '.ma-form{display:flex;flex-direction:column;width:100%}',
      '.ma-row{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.ma-rowLabel{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}',
      '.ma-rowTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}',
      '.ma-rowHint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}',
      '.ma-control{display:flex;align-items:center;gap:8px;flex-shrink:0}',
      '.ma-input{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);min-height:32px;min-width:220px;color:var(--dsw-alias-label-primary);font:inherit;padding:4px 10px;box-sizing:border-box}',
      '.ma-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.ma-input[aria-invalid="true"]{border-color:var(--dsw-alias-state-error-primary)}',
      '.ma-portInput{min-width:88px;text-align:right}',
      '.ma-button{border:1px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:6px 14px;cursor:pointer}',
      '.ma-button:hover:enabled{background:var(--dsw-alias-interactive-bg-hover)}',
      '.ma-button:disabled{opacity:.55;cursor:default}',
      '.ma-primaryButton{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.ma-primaryButton:hover:enabled{background:var(--dsw-alias-interactive-bg-hover-accent)}',
      '.ma-actions{display:flex;align-items:center;gap:12px;padding:16px 0;flex-wrap:wrap}',
      '.ma-saveState{color:var(--dsw-alias-label-secondary);font-size:13px}',
      '.ma-error{color:var(--dsw-alias-state-error-primary);font-size:13px}',
      '.ma-note{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:12px 0 0}',
      '.ma-section{display:flex;flex-direction:column;width:100%;flex:1}',
      '.ma-badge{border-radius:999px;padding:2px 10px;font-size:12px;line-height:18px;border:.5px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary)}',
      '.ma-badgeSet{color:var(--dsw-alias-state-success-primary)}',
    ].join('');
    const cssTag = '@local/dsh-mail-assistant/styles';
    if (typeof document !== 'undefined' && document.querySelector(`style[data-plugin-css="${cssTag}"]`) === null) {
      const tag = document.createElement('style');
      tag.dataset.pluginCss = cssTag;
      tag.textContent = css;
      document.head.appendChild(tag);
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

    // ------------------------------------------------------------- main panel
    function MailPanel(props) {
      const { translate, scope, password } = props;
      const t = typeof translate === 'function' ? translate : identityTranslate;
      const scopeStore = scope && typeof scope.subscribe === 'function' ? scope : FALLBACK_SCOPE_STORE;
      const passwordStore = password && typeof password.subscribe === 'function' ? password : FALLBACK_PASSWORD_STORE;
      const snapshot = useStore(scopeStore);
      const passwordState = useStore(passwordStore);
      const configured = snapshot.status === 'ready' && !!(snapshot.value && snapshot.value.email);
      return h('div', { className: 'ma-panel' },
        h('div', { className: 'ma-card' },
          h('h1', { className: 'ma-title' }, t('panelTitle')),
          h('p', { className: 'ma-intro' }, t('panelIntro')),
          h('div', { className: 'ma-status' },
            h('div', { className: 'ma-statusRow' },
              h('span', null, configured ? t('configuredAs') : t('notConfigured')),
              h('span', { className: 'ma-statusDim' },
                configured ? snapshot.value.email : '—')),
            configured && h('div', { className: 'ma-statusRow' },
              h('span', { className: 'ma-statusDim' }, t('password') + '：'),
              h('span', { className: passwordState.configured ? 'ma-badge ma-badgeSet' : 'ma-badge' },
                passwordState.configured ? t('passwordSaved') : t('passwordMissing'))),
            configured && h('div', { className: 'ma-statusRow' },
              h('span', { className: 'ma-statusDim' }, 'IMAP / SMTP'),
              h('span', { className: 'ma-statusDim' },
                `${snapshot.value.imapHost || '自动'} · ${snapshot.value.smtpHost || '自动'}`))),
          h('h2', { className: 'ma-sectionTitle' }, t('capabilitiesTitle')),
          h('p', { className: 'ma-capabilities' }, t('capabilityList')),
          h('p', { className: 'ma-hint' }, t('sendingNeedsApproval')),
          h('p', { className: 'ma-hint' }, t('openSettingsHint'))));
    }

    // -------------------------------------------------------- settings section
    const TEXT_FIELDS = [
      { key: 'email', label: 'email', hint: 'emailHint', type: 'text' },
      { key: 'senderName', label: 'senderName', hint: 'senderNameHint', type: 'text' },
    ];

    function SettingsRow(props) {
      return h('div', { className: 'ma-row' },
        h('div', { className: 'ma-rowLabel' },
          h('span', { className: 'ma-rowTitle' }, props.title),
          props.hint && h('span', { className: 'ma-rowHint' }, props.hint)),
        h('div', { className: 'ma-control' }, props.children));
    }

    /** Shared fallbacks keep a missing store from crashing a render. */
    const FALLBACK_SCOPE_STORE = makeStore({
      status: 'unavailable',
      revision: 0,
      writable: false,
      value: {},
      base: {},
      user: {},
    });
    const FALLBACK_PASSWORD_STORE = makeStore({ configured: false, known: false });

    const identityTranslate = (key) => key;

    function MailSettings(props) {
      const { translate, scope, password, savePassword, clearPassword, refreshPassword } = props;
      const t = typeof translate === 'function' ? translate : identityTranslate;
      const scopeStore = scope && typeof scope.subscribe === 'function' ? scope : FALLBACK_SCOPE_STORE;
      const passwordStore = password && typeof password.subscribe === 'function' ? password : FALLBACK_PASSWORD_STORE;
      const savePwd = typeof savePassword === 'function' ? savePassword : () => Promise.resolve(false);
      const clearPwd = typeof clearPassword === 'function' ? clearPassword : () => Promise.resolve();
      const refresh = typeof refreshPassword === 'function' ? refreshPassword : () => {};
      const snapshot = useStore(scopeStore);
      const passwordState = useStore(passwordStore);
      const accepted = snapshot.status === 'ready' ? (snapshot.value ?? {}) : {};
      const normalizeAccepted = (values) => ({
        ...values,
        imapPort: values.imapPort || '',
        smtpPort: values.smtpPort || '',
      });
      const [draft, setDraft] = React.useState(() => ({ ...normalizeAccepted(accepted), touched: false }));
      const [passwordDraft, setPasswordDraft] = React.useState('');
      const [phase, setPhase] = React.useState('idle');
      const [error, setError] = React.useState('');
      const disabled = !snapshot.writable || phase === 'saving';

      // Adopt externally changed values when the user has not touched the form.
      const revision = snapshot.revision;
      const lastRevision = React.useRef(revision);
      React.useEffect(() => {
        if (lastRevision.current !== revision) {
          lastRevision.current = revision;
          setDraft((current) => (current.touched ? current : { ...normalizeAccepted(accepted), touched: false }));
        }
      }, [revision]); // eslint-disable-line react-hooks/exhaustive-deps

      React.useEffect(() => { refresh(); }, [refresh]);

      const edit = (key, value) => {
        setDraft((current) => ({ ...current, touched: true, [key]: value }));
      };

      const save = async () => {
        setPhase('saving');
        setError('');
        try {
          const fields = [...TEXT_FIELDS.map((field) => field.key), 'imapHost', 'imapPort', 'smtpHost', 'smtpPort', 'downloadDir'];
          for (const field of fields) {
            const isPort = field.endsWith('Port');
            const nextText = String(draft[field] ?? '');
            const nextValue = isPort ? Number(nextText || 0) : nextText;
            const previousText = String(accepted[field] ?? '');
            const same = isPort
              ? Number(previousText || 0) === nextValue
              : previousText === nextText;
            if (same) continue;
            if (nextText === '' || (isPort && !Number.isFinite(nextValue))) await scopeStore.unset(field);
            else await scopeStore.set(field, nextValue);
          }
          if (passwordDraft.trim() !== '') {
            const ok = await savePwd(passwordDraft.trim());
            if (!ok) throw new Error('password');
          }
          setPasswordDraft('');
          setDraft((current) => ({ ...current, touched: false }));
          setPhase('saved');
          refresh();
        } catch (cause) {
          setError(t('saveFailed'));
          setPhase('idle');
        }
      };

      const clearSavedPassword = async () => {
        setError('');
        try {
          await clearPwd();
          refresh();
        } catch {
          setError(t('saveFailed'));
        }
      };

      if (snapshot.status !== 'ready') {
        return h('div', { className: 'ma-section' },
          h('p', { className: 'ma-intro', role: 'status' }, t('unavailable')));
      }

      const input = (key, { type = 'text', className = 'ma-input', placeholder = '' } = {}) => h('input', {
        type,
        className,
        value: draft[key] ?? '',
        placeholder,
        disabled,
        onChange: (event) => { edit(key, event.target.value); },
      });

      return h('div', { className: 'ma-section' },
        h('div', { className: 'ma-form' },
          h(SettingsRow, { title: t('email'), hint: t('emailHint') },
            h('input', {
              type: 'email',
              className: 'ma-input',
              'aria-label': t('email'),
              value: draft.email ?? '',
              placeholder: 'you@example.com',
              disabled,
              onChange: (event) => { edit('email', event.target.value); },
            })),
          h(SettingsRow, {
            title: t('password'),
            hint: t('passwordHint'),
          },
            h('input', {
              type: 'password',
              className: 'ma-input',
              'aria-label': t('password'),
              value: passwordDraft,
              placeholder: passwordState.configured ? '••••••••' : '',
              autoComplete: 'new-password',
              disabled,
              onChange: (event) => { setPasswordDraft(event.target.value); },
            })),
          passwordState.configured && h('div', { className: 'ma-row' },
            h('div', { className: 'ma-rowLabel' },
              h('span', { className: 'ma-rowTitle' }, t('passwordStatus'))),
            h('div', { className: 'ma-control' },
              h('button', { type: 'button', className: 'ma-button', disabled, onClick: clearSavedPassword },
                t('clearPassword')))),
          ...TEXT_FIELDS.slice(1).map((field) => h(SettingsRow, {
            key: field.key,
            title: t(field.label),
            hint: field.hint ? t(field.hint) : '',
          }, input(field.key))),
          h(SettingsRow, { title: t('imapServer'), hint: t('imapServerHint') },
            input('imapHost', { placeholder: 'imap.qq.com' }),
            input('imapPort', { type: 'number', className: 'ma-input ma-portInput', placeholder: '993' })),
          h(SettingsRow, { title: t('smtpServer'), hint: t('smtpServerHint') },
            input('smtpHost', { placeholder: 'smtp.qq.com' }),
            input('smtpPort', { type: 'number', className: 'ma-input ma-portInput', placeholder: '465' })),
          h(SettingsRow, { title: t('downloadDir'), hint: t('downloadDirHint') },
            input('downloadDir', { placeholder: 'D:\\MailAttachments' }))),
        h('div', { className: 'ma-actions' },
          h('button', {
            type: 'button',
            className: 'ma-button ma-primaryButton',
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
        // Cordis guards `remote.credentials` by inject, so the API is captured from
        // the child context that declares it, never through the plugin context.
        const passwordStore = makeStore({ configured: false, known: false });
        let credentialsApi = null;
        const refreshPassword = () => {
          const api = credentialsApi;
          if (!api || typeof api.describe !== 'function') {
            passwordStore.set({ configured: false, known: false });
            return;
          }
          api.describe([PASSWORD_REF]).then((record) => {
            const info = record?.[PASSWORD_REF];
            passwordStore.set({ configured: info?.configured === true, known: true });
          }).catch(() => {
            passwordStore.set({ configured: false, known: false });
          });
        };
        safely('credential mirror', () => {
          ctx.inject(['remote.credentials'], (child) => {
            credentialsApi = child.remote.credentials;
            safely('credential events', () => {
              child.effect(() => child.remote.$on('credentials/reference-updated', refreshPassword));
            });
            refreshPassword();
          });
        });

        const savePassword = (value) => {
          const api = credentialsApi;
          if (!api || typeof api.set !== 'function') return Promise.resolve(false);
          return api.set(PASSWORD_REF, value).then(() => true).catch(() => false);
        };
        const clearPassword = () => {
          const api = credentialsApi;
          if (!api || typeof api.unset !== 'function') return Promise.resolve();
          return api.unset(PASSWORD_REF);
        };

        // The Settings form is served under the plugin's profile entry id, which
        // composition may prefix (e.g. "include:mail-assistant"). Resolve the
        // namespace from the describe mirror instead of guessing it.
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
          inject: () => ({ translate: t, scope: scopeFacade, password: passwordStore }),
        }, guarded(MailPanel))));

        safely('settings section', () => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'mail-assistant',
          order: 30,
          label: () => t('settingsLabel'),
          locale: NS,
          inject: () => ({ translate: t, scope: scopeFacade, password: passwordStore, savePassword, clearPassword, refreshPassword }),
        }, guarded(MailSettings))));
      },
    };
  },
});
