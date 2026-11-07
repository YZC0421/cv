# 任务 2 实现报告

## 实现了什么

- `src/lib/schema.ts`：`publicationSchema`、`workSchema`、`blogSchema`、`pageSchema`，含枚举、日期格式、年份范围、`start <= end` 细化校验。
- `src/lib/publications.ts`：`sortPublications`（date 倒序，同日按作者位次）、`selectHomepage`（selected → 一作 → 最新，去重，最多 3 条）。
- `src/lib/format.ts`：`boldSelf`（本人姓名加粗）、`toBibtex`（article/inproceedings，含 doi 与 year）。
- `src/content.config.ts`：四个集合的 glob loader 与 schema 绑定。
- `tests/schema.test.ts`、`tests/publications.test.ts`、`tests/format.test.ts`：11 个断言。
- `src/content/{publications,work,blog,pages}/.gitkeep`：保证空集合下 loader 不报错。
- 将 `zod` 显式依赖从 v4 降到 `^3.25.76`，与 Astro 5 内部版本对齐。

## TDD 证据

**RED**

命令：`npm test`
输出：`pass 0 / fail 3`，三个测试文件均因 `Cannot find module '../src/lib/schema.ts'`（及 publications.ts、format.ts）失败。

**GREEN**

命令：`npm test`
输出：`tests 11 / pass 11 / fail 0`。

## 测试与验证

- `npm test`：11/11 通过。
- `npm run check`：16 files，0 errors，0 warnings，0 hints。
- `npm run build`：成功（内容集合为空，仅有 glob 空目录警告）。

## 修改的文件

新增：`src/lib/schema.ts`、`src/lib/publications.ts`、`src/lib/format.ts`、`src/content.config.ts`、`tests/*.test.ts`、`src/content/*/.gitkeep`。
修改：`package.json`、`package-lock.json`（zod 3.25.76）。

## 自审发现

- `workSchema` 使用 `z.union([month, z.literal('present')])`，`refine` 对 `present` 短路，避免字符串比较误判。
- `selectHomepage` 用 id 去重，防止同一篇既 `selected` 又是一作时重复占位。
- `.gitkeep` 不匹配 `**/*.md`，不会进入集合。

## 疑虑

- zod 4 与 Astro 5 content collections 的类型不兼容（`ZodType` 结构差异），已降至 v3；后续若升级 Astro 需同步评估。
- 空内容目录会产生 glob-loader 警告，任务 3 起写入真实内容后消失。
