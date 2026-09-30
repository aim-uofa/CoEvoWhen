<div align="center">

<picture>
  <source media="(max-width: 600px)" srcset="assets/images/readme/banner-mobile.svg">
  <img src="assets/images/repository-banner.svg" width="100%" alt="CoEvoWhen: Policy-Tool Coevolution for Ultra-Long Video Temporal Grounding">
</picture>

**Yiduo Jia** · **Muzhi Zhu** · **Jinchuan Shi** · **Hao Zhong** · **Yuling Xi** · **Ke Liu** · **Hao Chen**<sup>†</sup>

🎓 **Zhejiang University, State Key Lab of CAD & CG**  
<sup>†</sup> Corresponding author

<!-- Add the arXiv URL to the Paper link when available. -->
<a aria-disabled="true" title="arXiv link to be added"><img src="assets/images/readme/paper.svg" alt="Paper: Arxiv Link" height="28"></a>
<a href="https://aim-uofa.github.io/CoEvoWhen/"><img src="assets/images/readme/project-page.svg" alt="Project: Page" height="28"></a>

<br>

[Abstract](#abstract) · [Method](#framework) · [Results](#results) · [Ablations & Analysis](#analysis) · [Case Study](#case-study) · [Citation](#citation)

</div>

<a name="abstract"></a>

## 📖 Abstract

Ultra-long video temporal grounding requires balancing long-range evidence search with fine-grained event understanding under a limited visual budget, yet existing agentic methods still rely largely on predefined policies and tool capabilities. Motivated by this, we propose a <strong>novel policy–tool coevolution framework</strong> that jointly evolves high-level policies and executable media tools from the agentic reasoning trajectories of a VLM, forming a reusable skill without updating model parameters.

During evolution, an external skill updater distills transferable task experience in long-video temporal grounding, accordingly refining the orchestration of <strong>long-range image-based and fine-grained video-based observations</strong>. Alongside these policy updates, the updater employs its coding capabilities to upgrade existing tools or create new ones, adapting the tools to long-video evidence acquisition.

Equipped with the evolved skill, the VLM <strong>autonomously orchestrates tools</strong> under the guidance of the evolved policy, coordinating image and video observations for agentic inference without relying on a separate, stronger planning model.

Extensive experiments spanning five benchmarks and three VLMs show that policy–tool coevolution consistently <strong>improves temporal grounding accuracy</strong> in ultra-long videos while <strong>reducing visual token cost</strong> at inference, and that the evolved skill yields substantial performance gains on general long-video QA without additional task-specific evolution, demonstrating the effectiveness and generalizability of our framework for long-video understanding.

<a name="highlights"></a>

## ✨ Highlights

- <img src="assets/images/readme/coevolution-icon.svg" width="20" height="20" align="absmiddle" alt=""> **Policy–Tool Coevolution.** We jointly evolve high-level policies and executable media tools from a VLM's execution trajectories, distilling ultra-long video grounding experience into a reusable external skill without updating model parameters.
- 🎞️ **Coordinated Image–Video Observation.** We evolve the orchestration of complementary image-based and video-based observations, enabling the VLM to acquire evidence autonomously without manually predefined coordination strategies or a stronger external planner.
- 📈 **Accuracy Gains and Cost Reduction.** Experiments spanning five benchmarks and three VLMs show that policy–tool coevolution consistently improves temporal grounding accuracy in ultra-long videos while reducing visual token cost at inference. The evolved skill also yields substantial performance gains on general long-video QA without additional task-specific evolution.

<a name="framework"></a>

## 🚀 CoEvoWhen Framework

A policy–tool coevolution framework that distills task experience into a reusable external skill for ultra-long video temporal grounding.

### Policy–Tool Coevolution

<div align="center">
  <a href="https://aim-uofa.github.io/CoEvoWhen/#method-evolution">
    <img src="assets/images/figures/framework.webp" width="100%" alt="Policy–tool coevolution: execution trajectories and task feedback jointly refine high-level policies and executable media tools.">
  </a>
</div>

A frozen VLM executes ultra-long video temporal grounding tasks with an external skill comprising high-level policies and executable media tools. Across evolution rounds, an external skill updater distills transferable experience from execution trajectories and task feedback, refining policies for task planning and observation orchestration while synthesizing code to modify existing media tools or create new ones.

### Policy-Guided Agentic Inference

<div align="center">
  <a href="https://aim-uofa.github.io/CoEvoWhen/#method-inference">
    <img src="assets/images/figures/inference.webp" width="100%" alt="Policy-guided agentic inference coordinates image-based search and refinement with selective video verification.">
  </a>
</div>

Image-based observations can provide compact coverage of extended temporal ranges and facilitate comparisons across distant candidate regions, whereas video-based observations preserve local temporal continuity for reasoning about motion, event order, and temporal boundaries.

At inference, the VLM autonomously orchestrates media tools under the guidance of the evolved policy, using accumulated evidence to decide on subsequent observations without relying on a separate, stronger planning model.

<a name="results"></a>

## 📊 Quantitative Results

### Ultra-Long Video Temporal Grounding

Coevolution improves grounding accuracy while simultaneously reducing visual token cost. The results below compare the base and evolved skills on Qwen3.5-27B, with relative gains and cost reductions measured against the base skill.

| Benchmark        | Metric  | Base Skill | Evolved Skill |            Relative Gain |           Cost Reduction |
| :--------------- | :------ | ---------: | ------------: | -----------------------: | -----------------------: |
| VUE-LVTR         | IoU AUC |     0.4107 |    **0.5137** | <strong>↑ 25.1%</strong> | <strong>↓ 30.0%</strong> |
| ExtremeWhenBench | mIoU    |     0.1507 |    **0.2636** | <strong>↑ 74.9%</strong> | <strong>↓ 11.4%</strong> |
| CoMET-Bench      | mIoU    |     0.1355 |    **0.1635** | <strong>↑ 20.7%</strong> | <strong>↓ 18.9%</strong> |

### Cross-VLM Generalization and Cross-Task Transfer

Consistent gains are also observed when skills are evolved separately on different VLMs. Directly applying the evolved skill to general long-video QA also improves performance without additional task-specific evolution.

**Generalization across VLMs on temporal grounding.** **Bold**: results with the evolved skill. Evolution Gain reports absolute changes, with ↑ indicating relative improvements.

<table>
<thead>
<tr><th rowspan="2">VLM</th><th rowspan="2">Method</th><th colspan="3">VUE-LVTR</th><th colspan="2">ExtremeWhenBench</th><th colspan="2">CoMET-Bench</th></tr>
<tr><th>Precision<br>AUC ↑</th><th>Recall<br>AUC ↑</th><th>IoU<br>AUC ↑</th><th>mIoU ↑</th><th>Recall@0.5 ↑</th><th>mIoU ↑</th><th>Rejection-F1 ↑</th></tr>
</thead>
<tbody>
<tr><th rowspan="3" valign="middle">Qwen3.5-9B</th><td>+ Base Skill</td><td align="center">0.3240</td><td align="center">0.3425</td><td align="center">0.2405</td><td align="center">0.0626</td><td align="center">0.0576</td><td align="center">0.0672</td><td align="center">67.51</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>0.4287</strong></td><td align="center"><strong>0.4707</strong></td><td align="center"><strong>0.3244</strong></td><td align="center"><strong>0.1247</strong></td><td align="center"><strong>0.1170</strong></td><td align="center"><strong>0.0852</strong></td><td align="center"><strong>68.80</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+0.1047</strong><br>↑ 32.3%</td><td align="center"><strong>+0.1282</strong><br>↑ 37.4%</td><td align="center"><strong>+0.0839</strong><br>↑ 34.9%</td><td align="center"><strong>+0.0621</strong><br>↑ 99.2%</td><td align="center"><strong>+0.0594</strong><br>↑ 103.1%</td><td align="center"><strong>+0.0180</strong><br>↑ 26.8%</td><td align="center"><strong>+1.29</strong><br>↑ 1.9%</td></tr>
<tr><th rowspan="3" valign="middle">Qwen3.5-27B</th><td>+ Base Skill</td><td align="center">0.4706</td><td align="center">0.4789</td><td align="center">0.4107</td><td align="center">0.1507</td><td align="center">0.1478</td><td align="center">0.1355</td><td align="center">66.13</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>0.5918</strong></td><td align="center"><strong>0.5773</strong></td><td align="center"><strong>0.5137</strong></td><td align="center"><strong>0.2636</strong></td><td align="center"><strong>0.2785</strong></td><td align="center"><strong>0.1635</strong></td><td align="center"><strong>77.06</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+0.1212</strong><br>↑ 25.8%</td><td align="center"><strong>+0.0984</strong><br>↑ 20.5%</td><td align="center"><strong>+0.1030</strong><br>↑ 25.1%</td><td align="center"><strong>+0.1129</strong><br>↑ 74.9%</td><td align="center"><strong>+0.1307</strong><br>↑ 88.4%</td><td align="center"><strong>+0.0280</strong><br>↑ 20.7%</td><td align="center"><strong>+10.93</strong><br>↑ 16.5%</td></tr>
<tr><th rowspan="3" valign="middle">Qwen3.6-27B</th><td>+ Base Skill</td><td align="center">0.5098</td><td align="center">0.5465</td><td align="center">0.4506</td><td align="center">0.1691</td><td align="center">0.1694</td><td align="center">0.1312</td><td align="center">68.53</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>0.5519</strong></td><td align="center"><strong>0.5727</strong></td><td align="center"><strong>0.4985</strong></td><td align="center"><strong>0.2109</strong></td><td align="center"><strong>0.2129</strong></td><td align="center"><strong>0.1477</strong></td><td align="center"><strong>72.37</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+0.0421</strong><br>↑ 8.3%</td><td align="center"><strong>+0.0262</strong><br>↑ 4.8%</td><td align="center"><strong>+0.0479</strong><br>↑ 10.6%</td><td align="center"><strong>+0.0418</strong><br>↑ 24.7%</td><td align="center"><strong>+0.0435</strong><br>↑ 25.7%</td><td align="center"><strong>+0.0165</strong><br>↑ 12.6%</td><td align="center"><strong>+3.84</strong><br>↑ 5.6%</td></tr>
</tbody>
</table>

**Direct transfer to long-video QA.** Overall accuracy is reported in percent. Evolution Gain reports improvements in percentage points, with ↑ indicating relative improvements.

<table>
<thead>
<tr><th rowspan="2">VLM</th><th rowspan="2">Method</th><th>LVBench</th><th>LSDBench</th></tr>
<tr><th>Overall Acc. (%) ↑</th><th>Overall Acc. (%) ↑</th></tr>
</thead>
<tbody>
<tr><th rowspan="3" valign="middle">Qwen3.5-9B</th><td>+ Base Skill</td><td align="center">40.09</td><td align="center">49.08</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>45.84</strong></td><td align="center"><strong>53.68</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+5.75</strong><br>↑ 14.3%</td><td align="center"><strong>+4.60</strong><br>↑ 9.4%</td></tr>
<tr><th rowspan="3" valign="middle">Qwen3.5-27B</th><td>+ Base Skill</td><td align="center">45.45</td><td align="center">61.27</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>54.10</strong></td><td align="center"><strong>69.25</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+8.65</strong><br>↑ 19.0%</td><td align="center"><strong>+7.98</strong><br>↑ 13.0%</td></tr>
<tr><th rowspan="3" valign="middle">Qwen3.6-27B</th><td>+ Base Skill</td><td align="center">48.55</td><td align="center">61.12</td></tr>
<tr><td><strong>+ Evolved Skill</strong></td><td align="center"><strong>54.36</strong></td><td align="center"><strong>65.64</strong></td></tr>
<tr><td><strong>Evolution Gain</strong></td><td align="center"><strong>+5.81</strong><br>↑ 12.0%</td><td align="center"><strong>+4.52</strong><br>↑ 7.4%</td></tr>
</tbody>
</table>

<a name="analysis"></a>

## 💡 Ablations & Analysis

### Ablation on Policy–Tool Coevolution

**Joint evolution achieves the best accuracy–cost combination.** Policy-only and tool-only variants both improve grounding accuracy over the base skill, confirming policies and tools as effective evolution targets.

<div align="center">
  <a href="assets/images/figures/policy-tool-ablation.webp">
    <img src="assets/images/figures/policy-tool-ablation.webp" width="620" alt="Policy–tool coevolution achieves IoU AUC of 0.5137 with 141.89k visual tokens per query on the VUE-LVTR held-out set.">
  </a>
</div>

On the VUE-LVTR held-out set with Qwen3.5-27B, joint evolution achieves the following relative improvements over the policy-only and tool-only variants:

| Comparison      |      IoU AUC Improvement |   Visual Token Reduction |
| :-------------- | -----------------------: | -----------------------: |
| vs. Policy-only |  <strong>↑ 5.0%</strong> | <strong>↓ 40.6%</strong> |
| vs. Tool-only   | <strong>↑ 16.7%</strong> | <strong>↓ 25.5%</strong> |

### Ablation on Image–Video Coordination

Both single-modality variants improve grounding performance through evolution. The evolved image+video skill outperforms both single-modality skills across all grounding metrics while using fewer visual tokens, underscoring the benefits of strategically coordinating their complementary strengths.

Evolved skills on the VUE-LVTR held-out set with Qwen3.5-27B:

| Observation Mode |  IoU AUC ↑ | Visual Tokens (k/query) ↓ |
| :--------------- | ---------: | ------------------------: |
| Image only       |     0.4374 |                    194.60 |
| Video only       |     0.4772 |                    221.98 |
| Image + video    | **0.5137** |                **141.89** |

### Analysis of Skill Evolution

<div align="center">
  <a href="assets/images/figures/evolution-dynamics.webp">
    <img src="assets/images/figures/evolution-dynamics.webp" width="38%" alt="Online performance–cost dynamics during skill evolution.">
  </a>
  &nbsp;
  <a href="assets/images/figures/skill-evolution.webp">
    <img src="assets/images/figures/skill-evolution.webp" width="58%" alt="Execution feedback drives coordinated updates to high-level policies and executable media tools.">
  </a>
</div>

As evolution proceeds, the skill achieves higher grounding accuracy with lower visual token cost more consistently. Candidate omissions, boundary errors, and dynamic ambiguities exposed in trajectories drive coordinated adjustments to observation capabilities and their orchestration.

<a name="case-study"></a>

## 🎬 Case Study

We analyze the execution trajectories of the base and evolved skills on two ExtremeWhenBench queries to illustrate how policy–tool coevolution changes evidence acquisition for action and scene localization in ultra-long videos.

|                        |                                                           Candidate Localization and Motion Verification                                                           |                                                                       Long-Range Search and Boundary Refinement                                                                       |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                        | <a href="https://aim-uofa.github.io/CoEvoWhen/#case-motion"><img src="assets/images/readme/motion-preview.svg" width="320" alt="Scooping fries with a metal skimmer"></a> | <a href="https://aim-uofa.github.io/CoEvoWhen/#case-scene"><img src="assets/images/readme/scene-preview.svg" width="320" alt="A couple walking along a tree-lined path in golden light"></a> |
| Video duration         |                                                                            50.6 minutes                                                                            |                                                                                     100.1 minutes                                                                                     |
| Temporal grounding IoU |                                                                          0.00 → **1.00**                                                                           |                                                                                    0.00 → **1.00**                                                                                    |
| Visual token cost      |                                                                        198.68k → **96.81k**                                                                        |                                                                                 237.60k → **128.82k**                                                                                 |
| Cost reduction         |                                                                     <strong>↓ 51.27%</strong>                                                                      |                                                                               <strong>↓ 45.78%</strong>                                                                               |
| Recorded trajectories  |                                            [View the trajectories →](https://aim-uofa.github.io/CoEvoWhen/#case-motion)                                            |                                                      [View the trajectories →](https://aim-uofa.github.io/CoEvoWhen/#case-scene)                                                      |

The first case illustrates how better candidate localization allows video observation to focus on verifying query-specific motion, reducing repeated inspection of an incorrect region. The second highlights the importance of discovering a brief target during global search before investing in local boundary refinement.

<a name="citation"></a>

## 📜 Citation

If you find CoEvoWhen useful for your research, please cite:

<!-- Insert the official arXiv BibTeX entry after release, matching the project page. -->

```bibtex

```
