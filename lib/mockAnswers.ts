export type AskAnswer = {
  title?: string;
  steps: string[];
  commands: string[];
  tips: string[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answer?: AskAnswer;
  pending?: boolean;
  error?: string;
};

export const exampleQuestions = [
  'Python 怎么安装？',
  'VS Code 怎么配置 Python 环境？',
  'pip 安装失败怎么办？',
  'GitHub 怎么注册？',
];

export function getMockAnswer(question: string): AskAnswer {
  const normalizedQuestion = question.toLowerCase();

  if (question.includes('安装') || normalizedQuestion.includes('python')) {
    return {
      title: 'Python 安装步骤',
      steps: ['访问 Python 官网下载安装包', '安装时勾选 Add Python to PATH', '打开终端检查版本'],
      commands: ['python --version'],
      tips: ['如果命令无法识别，通常是 PATH 没配置成功。'],
    };
  }

  if (normalizedQuestion.includes('vs code') || normalizedQuestion.includes('vscode')) {
    return {
      title: 'VS Code 配置 Python 环境',
      steps: ['安装 VS Code', '安装 Python 插件', '选择解释器', '新建 `.py` 文件运行'],
      commands: ['print("Hello AILINES AI")'],
      tips: ['先确认 VS Code 右下角选择的是正确 Python 解释器。'],
    };
  }

  if (normalizedQuestion.includes('pip')) {
    return {
      title: 'pip 安装失败排查',
      steps: ['检查 Python 是否安装成功', '检查 pip 版本', '尝试升级 pip'],
      commands: ['python -m pip install --upgrade pip'],
      tips: ['如果网络较慢，可以稍后换网络重试。'],
    };
  }

  if (normalizedQuestion.includes('github') || question.includes('注册')) {
    return {
      title: 'GitHub 注册步骤',
      steps: ['打开 github.com', '使用邮箱注册账号', '验证邮箱', '创建或收藏学习资源仓库'],
      commands: [],
      tips: ['注册后建议开启两步验证，保护账号安全。'],
    };
  }

  return {
    steps: [],
    commands: [],
    tips: ['本次回答未完成。你可以补充具体问题、操作环境和当前学习目标后再试。'],
  };
}
