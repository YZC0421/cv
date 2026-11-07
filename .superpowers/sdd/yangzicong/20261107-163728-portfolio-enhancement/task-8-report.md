# 任务 8 实现报告

## 实现了什么

- `package.json`：7 个依赖改为精确版本（astro 5.18.2、@astrojs/rss 4.0.19、@astrojs/sitemap 3.7.4、zod 3.25.76、@astrojs/check 0.9.12、tsx 4.23.15、typescript 6.0.3、sharp 0.34.5）。
- `.github/workflows/deploy.yml`：增加 `pull_request` 触发；`deploy` job 加 `if: github.event_name != 'pull_request'`，PR 只校验不部署。
- `scripts/verify-build.mjs` 新增 12 条断言：主题/位次筛选与主题徽标、`/work` 主题按钮、首页 Research Areas、`og:image`、`twitter:card`、标签页数量与可见标签一致、CV 链接与文件存在性一致。

## 测试与验证

- `npm test`：42/42。
- `npm run check`：0 errors。
- `npm run build`：20 页。
- `npm run verify`：全部断言 `ok`，`all checks passed`。
- `npm ls --depth=0` 确认 8 个顶层依赖版本与 `package.json` 一致。
- lockfile 变化：+203 / -818，为精确版本触发的重新解析与去重，`npx astro --version` 仍为 5.18.2。

## 自审发现

- `verify` 的标签页断言只统计非草稿、非未来文章的标签，避免标签页数量与隐藏文章不一致。
- CV 断言双向：有文件时首页必须出现 `/cv/cv.pdf`，无文件时必须不出现。
- PR 触发不会进入 deploy job，Pages 环境不会被 PR 修改。

## 疑虑

- PR 流水线没有缓存 Playwright 之类重型依赖，当前只有 npm cache，构建约 1 分钟内。
- `sharp` 在 CI 只作为 devDependency 安装，不调用 `npm run og`，安装脚本被跳过也不影响构建。
