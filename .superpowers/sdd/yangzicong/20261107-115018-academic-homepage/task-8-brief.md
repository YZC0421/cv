### 任务 8：About 双语、打印与旧链接

**文件：**
- 创建：`src/content/pages/about.en.md`、`src/content/pages/about.zh.md`、`src/pages/about.astro`、`src/pages/about/zh.astro`、`public/CV.html`
- 修改：`src/styles/global.css`

- [ ] **步骤 1：写 `about.en.md`**

```markdown
---
title: "About"
updated: "2026-11-07"
---

## Education

**B.E. in Software Engineering**, Zhuhai College of Science and Technology (formerly Jilin
University Zhuhai College), 2021.09 – 2025.07. GPA 3.64/4.0, top 1% of the major.

## Research

My work focuses on medical signal processing and industrial visual inspection. I designed
STFAC-ECGNet, a multiscale spatio-temporal fusion network for multi-lead ECG arrhythmia
detection, published in *Scientific Reports* (JCR Q1, first author). I also work on
diffusion-model-based defect detection and lightweight detection networks for cable surface
inspection.

## Skills

Python, C++, Java, PyTorch, OpenCV, Ultralytics YOLO, ONNX/TensorRT, PyQt5, SQLAlchemy,
RAG, Git, Linux.

## Awards

National Scholarship; Top 10 Student; First-Class Scholarship (three consecutive years);
MCM Meritorious Winner (top 7%); National Third Prize, CP Group Cup Market Analysis
Competition; National Excellent Research Report.

## Intellectual Property

Two patents (agricultural product component detection device; transport oxygenated crab box
structure) and five software copyrights in cross-border e-commerce and agricultural trade
systems.

## Contact

[402641915@qq.com](mailto:402641915@qq.com) ·
[Google Scholar](https://scholar.google.com/citations?user=0Ynn-awAAAAJ) ·
[ORCID](https://orcid.org/0009-0001-0948-3606) ·
[GitHub](https://github.com/YZC0421)
```

- [ ] **步骤 2：写 `about.zh.md`**

```markdown
---
title: "关于"
updated: "2026-11-07"
---

## 教育经历

**软件工程 本科**，珠海科技学院（原吉林大学珠海学院），2021.09 – 2025.07。
GPA 3.64/4.0，专业前 1%。

## 研究方向

主要关注医学信号处理与工业视觉检测。设计 STFAC-ECGNet 多尺度时空融合网络，用于多导联
心电心律失常检测，成果发表于 *Scientific Reports*（JCR Q1，第一作者）。另参与基于扩散
模型的缺陷检测与线缆表面轻量化检测网络研究。

## 技能

Python、C++、Java、PyTorch、OpenCV、Ultralytics YOLO、ONNX/TensorRT、PyQt5、
SQLAlchemy、RAG、Git、Linux。

## 荣誉

国家奖学金、十佳大学生、连续三年一等奖学金、美国大学生数学建模竞赛 M 奖（国际前 7%）、
正大杯市场调研大赛全国三等奖、中国共青团国家级优秀调研报告。

## 知识产权

发明专利两项（农业产品成分检测装置、运输充氧蟹盒结构），软件著作权五项，覆盖跨境电商
与农产品国际贸易系统。

## 联系方式

[402641915@qq.com](mailto:402641915@qq.com) ·
[Google Scholar](https://scholar.google.com/citations?user=0Ynn-awAAAAJ) ·
[ORCID](https://orcid.org/0009-0001-0948-3606) ·
[GitHub](https://github.com/YZC0421)
```

- [ ] **步骤 3：追加打印样式**

```css
.about-actions { display: flex; gap: 16px; margin: 20px 0 32px; font-size: 0.88rem; }
@media print {
  .site-header, .site-footer, .skip, .about-actions { display: none !important; }
  body { background: #fff; color: #000; font-size: 11pt; }
  .container { max-width: none; padding: 0; }
  a { color: #000; text-decoration: none; }
  h2 { break-after: avoid; }
  .print-block, li { break-inside: avoid; }
  @page { size: A4; margin: 16mm; }
}
```

- [ ] **步骤 4：写 `/about` 与 `/about/zh`**

`src/pages/about.astro`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getEntry, render } from 'astro:content';

const entry = await getEntry('pages', 'about.en');
if (!entry) throw new Error('about.en.md is missing');
const { Content } = await render(entry);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="About · Zicong Yang" description="Education, research, skills, and contact.">
  <Fragment slot="head">
    <link rel="alternate" hreflang="zh-CN" href={new URL(`${base}about/zh/`, Astro.site)} />
  </Fragment>
  <div class="container measure" style="padding-top:40px">
    <div class="about-actions">
      <button type="button" onclick="window.print()">Download CV (PDF)</button>
      <a href={`${base}about/zh`} hreflang="zh-CN">中文</a>
    </div>
    <div class="prose"><Content /></div>
  </div>
</BaseLayout>
```

`src/pages/about/zh.astro`：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEntry, render } from 'astro:content';

const entry = await getEntry('pages', 'about.zh');
if (!entry) throw new Error('about.zh.md is missing');
const { Content } = await render(entry);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="关于 · 杨梓聪" description="教育经历、研究方向、技能与联系方式。" lang="zh-CN">
  <Fragment slot="head">
    <link rel="alternate" hreflang="en" href={new URL(`${base}about/`, Astro.site)} />
  </Fragment>
  <div class="container measure" style="padding-top:40px">
    <div class="about-actions">
      <button type="button" onclick="window.print()">下载 CV (PDF)</button>
      <a href={`${base}about`} hreflang="en">English</a>
    </div>
    <div class="prose"><Content /></div>
  </div>
</BaseLayout>
```

- [ ] **步骤 5：写 `public/CV.html` 重定向**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=./about" />
    <link rel="canonical" href="./about" />
    <title>CV · Zicong Yang</title>
  </head>
  <body>
    <p>This page has moved to <a href="./about">/about</a>.</p>
  </body>
</html>
```

- [ ] **步骤 6：构建并验证双语与重定向产物**

运行：
```bash
npm run build
ls dist/about/index.html dist/about/zh/index.html dist/CV.html
grep -c '下载 CV' dist/about/zh/index.html
```
预期：三个文件均存在，中文页出现 `下载 CV`。

- [ ] **步骤 7：预览检查打印**

运行：`npm run dev`，打开 `/cv/about`。
预期：页面上方有 `Download CV (PDF)` 与 `中文`；点击 `中文` 进入 `/cv/about/zh`；浏览器打印预览为 A4、无导航与页脚、条目未断裂。`Ctrl+C` 停止。

- [ ] **步骤 8：Commit**

```bash
git add src/content/pages src/pages/about.astro src/pages/about public/CV.html src/styles/global.css
git commit -m "feat: 增加中英 About 页与打印样式"
```

---

