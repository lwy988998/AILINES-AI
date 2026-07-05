export type MockAnswer = {
  title?: string;
  steps: string[];
  command?: string;
  note?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answer?: MockAnswer;
};

export const exampleQuestions = [
  'Python 怎么安装？',
  'VS Code 怎么配置 Python 环境？',
  'pip 安装失败怎么办？',
  'GitHub 怎么注册？',
];

export function getMockAnswer(question: string): MockAnswer {
  const normalizedQuestion = question.toLowerCase();

  if (question.includes('安装') || normalizedQuestion.includes('python')) {
    return {
      title: 'Python 安装步骤',
      steps: ['访问 Python 官网下载安装包', '安装时勾选 Add Python to PATH', '打开终端检查版本'],
      command: 'python --version',
    };
  }

  if (normalizedQuestion.includes('vs code') || normalizedQuestion.includes('vscode')) {
    return {
      title: 'VS Code 配置 Python 环境',
      steps: ['安装 VS Code', '安装 Python 插件', '选择解释器', '新建 `.py` 文件运行'],
      command: 'print("Hello AILINES AI")',
    };
  }

  if (normalizedQuestion.includes('pip')) {
    return {
      title: 'pip 安装失败排查',
      steps: ['检查 Python 是否安装成功', '检查 pip 版本', '尝试升级 pip'],
      command: 'python -m pip install --upgrade pip',
    };
  }

  if (normalizedQuestion.includes('github') || question.includes('注册')) {
    return {
      title: 'GitHub 注册步骤',
      steps: ['打开 github.com', '使用邮箱注册账号', '验证邮箱', '创建或收藏学习资源仓库'],
    };
  }

  return {
    steps: [],
    note: '这是一个静态演示回答。真实 AI 问答将在后续任务中接入。你可以先尝试描述具体报错、操作系统和当前学习目标。',
  };
}
