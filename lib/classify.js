// Rule-based message classification. Non-destructive: it only labels messages
// for display, never moves mail. Rules are intentionally simple and explainable.
const RULES = [
  {
    category: 'promotion',
    patterns: [/促销|优惠|折扣|活动|限时|秒杀|特价|下单|购买|会员|积分|红包|抽奖|推广|营销|退订|unsubscribe/i,
      /no-?reply.*promo|newsletter|marketing/i],
  },
  {
    category: 'notification',
    patterns: [/通知|提醒|告警|alert|notice|notification|验证码|verification|verify|安全|security|登录|login/i,
      /github|gitlab|jira|confluence|pipeline|workflow|build|deploy|billing|invoice|账单|发票|收据|receipt/i,
      /no-?reply|do-?not-?reply|system|noreply/i],
  },
  {
    category: 'work',
    patterns: [/会议|meeting|周报|月报|report|项目|project|需求|合同|报价|审批|approval|deadline|截止|汇报|安排|日程/i],
  },
  {
    category: 'personal',
    patterns: [/家庭|家人|朋友|生日|聚会|周末|聚餐|旅行|问候|谢谢|感谢/i],
  },
];

const PROMOTION_SENDERS = /(?:^|[.@-])(?:mail|mailer|marketing|news|newsletter|promo|edm|push)(?:[.@-]|$)/i;
const NOREPLY_SENDERS = /(?:^|[.@-])(?:no-?reply|do-?not-?reply|noreply|notification|notify|system|service|support)(?:[.@-]|$)/i;

/**
 * Classify one message from its decoded headers.
 * Returns one of work | notification | personal | promotion | other.
 * Suggestion only; callers must not present it as a confirmed fact.
 */
export function classifyMessage({ subject = '', from = '', to = '' } = {}) {
  const text = `${subject}\n${from}\n${to}`;
  const sender = String(from || '');
  let best = null;
  for (const rule of RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) score += 1;
      if (pattern.test(sender)) score += 1;
    }
    if (rule.category === 'promotion' && PROMOTION_SENDERS.test(sender)) score += 2;
    if (rule.category === 'notification' && NOREPLY_SENDERS.test(sender)) score += 1;
    if (score > 0 && (best === null || score > best.score)) best = { category: rule.category, score };
  }
  return best === null ? 'other' : best.category;
}

export const CATEGORY_LABELS = {
  work: '工作',
  notification: '通知',
  personal: '个人',
  promotion: '推广',
  other: '其他',
};
