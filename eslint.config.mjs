import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Electron 主进程是纯 Node CJS 代码，不适用 React/浏览器规则
    files: ['desktop/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Next 16 / eslint-plugin-react-hooks v6 新增的 compiler 规则：存量组件大量使用
    // useEffect 内同步 setState 的动画/初始化写法（早于该规则存在）。
    // 降级为 warn，避免为了过 lint 而对 10+ 个组件做无关重构；
    // 新代码仍应遵循 React 官方建议，避免在 effect 中同步 setState。
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'release/**',
    'next-env.d.ts',
    '*.log',
    'tsconfig.tsbuildinfo',
  ]),
]);
