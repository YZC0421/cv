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
---

## 背景

Provincial student research project on sudden cardiac death risk modelling from multi-lead ECG.
