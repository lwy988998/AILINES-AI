# AILINES AI

AILINES AI 是面向普通用户与学生的 AI 学习规划助手。用户输入学习目标后，产品会生成学习路线、课程结构、开源资源与项目实战路径。

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS

## 本地启动

```bash
npm install
npm run dev
```

默认访问：<http://localhost:3000>

> 国内网络下 `npm install` 若因 Electron binary 从 GitHub 下载失败（`fetch failed`），项目已内置
> `.npmrc` 的 `electron_mirror=https://registry.npmmirror.com/-/binary/electron/`，
> 重新执行 `npm install`（或 `node node_modules/electron/install.js`）即可从镜像补齐二进制。
> 也可手动设置环境变量 `ELECTRON_MIRROR` 指向任意可用镜像。

## 桌面开发

桌面壳默认打开本地 Next 服务：<http://localhost:3000>。

```bash
npm run dev
npm run desktop
```

如需连接其他部署地址，可以设置 `AILINES_DESKTOP_URL`。

## 质量检查

```bash
npm run lint   # ESLint 9 flat config（eslint .）
npm test       # 零依赖冒烟测试（node:test + Node 原生 TS type-stripping）
npm run build
```

## AI 配置

课程生成使用 OpenAI-compatible Chat Completions 接口：

```bash
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your-api-key
AI_MODEL=deepseek-chat
```

可选 fallback provider：

```bash
AI_BASE_URL_FALLBACK=
AI_API_KEY_FALLBACK=
AI_MODEL_FALLBACK=
AI_PROVIDER_FALLBACK=
AI_BASE_URL_SECONDARY=
AI_API_KEY_SECONDARY=
AI_MODEL_SECONDARY=
AI_PROVIDER_SECONDARY=
```

当主 provider 网络不可达、超时、限流或 5xx 时，会尝试 fallback；鉴权错误需要先修正密钥或权限。

## 构建验证

```bash
npm run build
```

## AI 输出容错

- `lib/ai/parseAIJson.ts` 对模型输出做容错解析：剥离 Markdown 代码块、提取 JSON 对象、
  修复尾逗号/全角引号/行注释/控制字符，并支持截断内容的“最长可解析前缀”修复。
- `lib/ai/generatePlan.ts` 遇到 JSON 解析失败不会直接拒绝，而是带着“只输出严格 JSON”的
  提示重试，再失败则进入修复轮（repair pass）；仍失败才报 `COURSE_QUALITY_REJECTED`。

## 当前页面

- `/`：MVP 首页，包含品牌视觉、学习目标输入、快捷示例和能力摘要。
- `/plan`：方案生成占位页，通过 `goal` query 参数展示用户输入。

## 品牌素材

首页使用 `public/ailines-wallpaper.jpg` 作为 AILINES AI 品牌视觉素材。
