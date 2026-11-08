---
title: "Sudden Cardiac Death Prediction Model"
category: research
summary: "End-to-end ECG research project that produced two first-author papers."
status: complete
period: "2023.03 – 2024.06"
stack: ["PyTorch", "CNN/RNN", "Attention", "PTB-XL"]
links:
  - label: "Scientific Reports"
    url: "https://www.nature.com/articles/s41598-024-71700-z"
goal: "Detect multi-lead ECG arrhythmia more accurately under noisy signals and weak cross-lead temporal modeling."
architecture: "Grayscale conversion of multi-lead ECG, grayscale feature fusion, and STFAC-ECGNet with coordinated channel-spatial attention plus temporal fusion."
role: "Project Lead — proposal, design, implementation, publication, and final acceptance."
results: "Improved classification accuracy on PTB-XL and CPSC2018; two first-author papers (JCR Q1 and Q4)."
todo:
  - "补充数据集规模与基线提升数值（见 gaps.md）"
featured: true
order: 10
zh:
  title: "心源性猝死预测模型"
  summary: "端到端 ECG 研究项目，产出两篇第一作者论文。"
  goal: "在噪声与跨导联时序建模受限的情况下，提升多导联 ECG 心律失常检测精度。"
  architecture: "多导联 ECG 转灰度图、灰度特征融合，以及带协同通道-空间注意力与时间融合的 STFAC-ECGNet。"
  role: "项目负责人 —— 申报、设计、实现、发表与结项。"
  results: "在 PTB-XL 与 CPSC2018 上提升分类精度；产出两篇第一作者论文（JCR Q1、Q4）。"
  todo:
    - "补充数据集规模与相对基线的提升数值"
---

## 背景

Provincial student research project on sudden cardiac death risk modelling from multi-lead ECG.
