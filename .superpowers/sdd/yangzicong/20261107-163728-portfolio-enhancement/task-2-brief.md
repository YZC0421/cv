### 任务 2：项目四段式内容与待补清单

**文件：**
- 修改：`src/content/work/{sudden-cardiac-death-prediction,wordle-analysis,coca-cola-consumer-analysis,rural-revitalization}.md`
- 创建：`.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md`

- [ ] **步骤 1：为心源性猝死项目补三段**

在 `sudden-cardiac-death-prediction.md` 的 frontmatter 中追加（内容取自现有 highlights，不新增事实）：

```yaml
problem: "Multi-lead ECG arrhythmia detection suffers from noisy signals and weak cross-lead temporal modelling, which limits classification accuracy on public datasets."
approach: "Converted multi-lead ECG to 2D grayscale images, fused grayscale features, and designed STFAC-ECGNet with coordinated channel-spatial attention and temporal fusion."
results: "Improved classification accuracy on PTB-XL and CPSC2018, producing two first-author papers (JCR Q1 and Q4)."
```

- [ ] **步骤 2：为 Wordle 项目补两段**

```yaml
problem: "Wordle difficulty is driven by word structure, but the game had no quantitative difficulty model for scheduling or player-behaviour analysis."
approach: "Used Python corpora and machine-learning statistics on word frequency, syllables, and repeated letters, then trained a BiGRU model to predict player trends."
results: "Won the MCM Meritorious Winner award (top 7%)."
```

- [ ] **步骤 3：为可口可乐项目补两段**

```yaml
problem: "Brand teams lacked a quantitative view of consumer sentiment across a very large review corpus."
approach: "Crawled 120,756 JD.com reviews and applied BERT sentiment analysis to build word clouds and user profiles."
results: "National Third Prize in the CP Group Cup market research competition."
```

- [ ] **步骤 4：为乡村振兴项目补两段**

```yaml
problem: "Rural revitalization planning lacked data on tea yield, fertilization, and machinery power for the surveyed region."
approach: "Collected 379 questionnaires (97% valid), integrated government data, and used machine learning to predict yield, fertilization, and total machinery power."
results: "Report recognized as a National Excellent Research Report; the accompanying paper was published as a second-author CNKI-indexed article."
```

- [ ] **步骤 5：写待补清单**

`.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md`：

```markdown
# 内容待补清单

以下内容无法从现有 CV 事实中确认，页面暂不渲染；提供素材后可补。

## 项目
- 心源性猝死预测：数据集规模、模型参数量、相对基线的精度提升数值。
- Wordle：参赛队伍规模、模型评估指标。
- 可口可乐调研：样本时间范围、情感极性分布。
- 乡村振兴：调研地区、预测模型的具体指标。

## 论文
- mst-2025、cvidl-2024-garbage、ipmlp-2024 的 volume/pages（Crossref 未返回时需手工补）。

## 站点
- `public/cv.pdf`（提供后 About 与首页自动出现下载按钮）。
- 项目配图（`src/assets/work/`，当前无素材）。
```

- [ ] **步骤 6：构建验证**

运行：`npm run build`
预期：成功；三个段落进入产物，未补的项目仍用 highlights 回退。

- [ ] **步骤 7：Commit**

```bash
git add src/content/work .superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md
git commit -m "content: 补充项目问题、方法与结果"
```

---

