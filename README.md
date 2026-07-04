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

## 构建验证

```bash
npm run build
```

## 当前页面

- `/`：MVP 首页，包含品牌视觉、学习目标输入、快捷示例和能力摘要。
- `/plan`：方案生成占位页，通过 `goal` query 参数展示用户输入。

## 品牌素材

首页使用 `public/ailines-wallpaper.jpg` 作为 AILINES AI 品牌视觉素材。
