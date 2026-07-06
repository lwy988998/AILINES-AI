export type UserIntent = 'plan' | 'ask';

export type IntentResult = {
  intent: UserIntent;
  confidence: number;
  reason: string;
  normalizedInput: string;
  suggestedGoal: string;
  suggestedQuestion: string;
};

function normalizeInput(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

const askPatterns = [
  /如何/,
  /怎么/,
  /怎样/,
  /为什么/,
  /怎么办/,
  /注册/,
  /安装/,
  /配置/,
  /登录/,
  /登陆/,
  /下载/,
  /账号/,
  /帐号/,
  /失败/,
  /报错/,
  /无法/,
  /不能/,
  /打不开/,
  /连接不上/,
  /steam/i,
  /github\s*怎么\s*注册/i,
  /python\s*怎么\s*安装/i,
  /pip\s*安装\s*失败/i,
  /v\s*s\s*code\s*怎么\s*配置/i,
  /vscode\s*怎么\s*配置/i,
  /how\s+(to|do|can|should)\b/i,
  /what\s+(is|are|does)\b/i,
  /why\b/i,
  /install|setup|configure|config|register|sign\s*up|login|log\s*in|download|account|error|failed|failure|cannot|can't|unable|not\s+working|won't\s+open/i,
];

const planPatterns = [
  /我想学/,
  /学习/,
  /入门/,
  /系统学/,
  /掌握/,
  /提升/,
  /路线/,
  /课程/,
  /计划/,
  /从零开始/,
  /自学/,
  /学会/,
  /learn\b/i,
  /study\b/i,
  /roadmap\b/i,
  /course\b/i,
  /curriculum\b/i,
  /plan\b/i,
  /beginner|from\s+scratch|master\b|improve\b/i,
];

const knownPlanTopics = [
  /三角函数/,
  /微积分/,
  /线性代数/,
  /高等数学/,
  /代数/,
  /几何/,
  /概率/,
  /统计/,
  /python/i,
  /javascript/i,
  /typescript/i,
  /react/i,
  /vue/i,
  /java\b/i,
  /rust/i,
  /golang|\bgo\b/i,
  /c\+\+/i,
  /excel/i,
  /ppt/i,
  /word/i,
  /photoshop|\bps\b/i,
  /figma/i,
  /摄影/,
  /设计/,
  /英语/,
  /日语/,
  /韩语/,
  /机器学习/,
  /深度学习/,
  /人工智能/,
  /大模型|llm/i,
];

function countMatches(patterns: RegExp[], text: string) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

export function detectUserIntent(input: string): IntentResult {
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput) {
    return {
      intent: 'plan',
      confidence: 0.3,
      reason: 'empty input defaults to plan fallback',
      normalizedInput,
      suggestedGoal: normalizedInput,
      suggestedQuestion: normalizedInput,
    };
  }

  const askScore = countMatches(askPatterns, normalizedInput);
  const planScore = countMatches(planPatterns, normalizedInput);
  const topicScore = countMatches(knownPlanTopics, normalizedInput);

  if (askScore > 0) {
    return {
      intent: 'ask',
      confidence: Math.min(0.98, 0.72 + askScore * 0.08),
      reason: planScore > 0 ? 'matched ask and plan signals; ask takes priority' : 'matched concrete question/action keywords',
      normalizedInput,
      suggestedGoal: normalizedInput,
      suggestedQuestion: normalizedInput,
    };
  }

  if (planScore > 0) {
    return {
      intent: 'plan',
      confidence: Math.min(0.95, 0.68 + planScore * 0.08 + topicScore * 0.03),
      reason: 'matched learning plan keywords',
      normalizedInput,
      suggestedGoal: normalizedInput,
      suggestedQuestion: normalizedInput,
    };
  }

  return {
    intent: 'plan',
    confidence: topicScore > 0 ? 0.72 : 0.55,
    reason: topicScore > 0 ? 'matched known learning topic' : 'short topic-like input defaults to plan',
    normalizedInput,
    suggestedGoal: normalizedInput,
    suggestedQuestion: normalizedInput,
  };
}
