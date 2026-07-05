export function createGenerateAskAnswerMessages(goal: string, question: string) {
  return [
    {
      role: 'system',
      content:
        '你是 AILINES AI 的学习问答助手。只输出严格 JSON，禁止 Markdown、代码块和解释。中文，面向普通学生。回答要轻量、具体、可执行。JSON 格式固定为：{"answer":{"title":"","steps":[],"commands":[],"tips":[]}}。steps 2-5 条；commands 0-3 条；tips 1-3 条。不要编造外部搜索结果。',
    },
    {
      role: 'user',
      content: `学习目标：${goal}\n用户问题：${question}`,
    },
  ] as const;
}
