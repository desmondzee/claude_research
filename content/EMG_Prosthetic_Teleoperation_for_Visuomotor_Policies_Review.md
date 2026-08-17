# Myoelectric and Prosthetic Teleoperation as a Data Source for Visuomotor Robot Policies

### A Systematic Review of Viability, Scalability and Practical Efficacy

**Compiled August 2026** · Evidence cut-off: 5 August 2026

**Shelf title: Myoelectric Teleoperation**

---

## Abstract

Vision-language-action (VLA) models and diffusion-based visuomotor policies are bottlenecked by the cost and narrowness of paired vision–action data. This has motivated a search for cheaper, higher-bandwidth, or higher-information demonstration media. Electromyographic (EMG) and prosthetic teleoperation interfaces are an appealing candidate because, uniquely among human input devices, they carry a direct correlate of muscle activation and therefore of force and limb impedance — signals that motion-capture, VR controllers and leader-follower arms discard by construction.

We conducted a systematic search across arXiv, IEEE Xplore, CoRL/RSS/ICRA/IROS proceedings, PhysioNet, Hugging Face, Zenodo and IEEE DataPort, and assembled a corpus of approximately 120 primary sources. We report four principal findings.

**First, the target dataset class is empty.** No openly released dataset pairs visual observations with robot action logs generated through an EMG-driven or prosthetic teleoperation interface. Two independent 2026 efforts — ForceBand (Amazon FAR/UMD/JHU) and DexEMG (Sharpa/SJTU) — converged on the problem within four months of each other and neither released a corpus. The intersection of the three required properties is currently unoccupied.

**Second, EMG is a poor *pose* channel and this is quantitatively established.** In the only direct head-to-head we located with full metrics (M4Bench, N=50), an eye-tracker-plus-EMG interface was ~26% slower, carried a ~58× higher error rate and ~2.8× the NASA-TLX workload of mouse-and-keyboard or gamepad. Combined with an electromechanical delay floor of ~50 ms, a controller-delay usability ceiling of 100–125 ms, 7.6–20% accuracy loss under 2 cm electrode shift, a 3.8%→18% error increase under limb-position change and ~10–12 percentage points of cross-session degradation, the resulting action logs sit on the wrong side of every demonstration-quality axis identified in the imitation-learning literature.

**Third, EMG is a promising *force* channel, and the correct reframing is EMG-as-annotation rather than EMG-as-interface.** ForceBand (June 2026) uses a $300 8-channel band and a 15-minute calibration to label ordinary egocentric human video with fingertip force, then discards the force sensors. It reports ~1.9× better finger-level contact detection than vision-based force inference and 87% success on pick–squeeze–place with an 11-dimensional action space that includes a commanded grip force spanning 3.2–19.3 N, against 0/10 squeeze success for a binary-gripper baseline. This uses EMG's information advantage without paying its bandwidth penalty.

**Fourth, the appropriate integration point is fine-tuning with action-space extension, not direct end-to-end training.** Modern pretrained policies adapt to new tasks with 50–150 demonstrations and to new embodiments with fewer than 200 examples; LoRA matches full fine-tuning at 1.4% of parameters and one-eighth the compute. Any realistically collectible EMG corpus is orders of magnitude too small for pretraining and comfortably sufficient for post-training — provided the contribution is a *new action dimension* (force, stiffness) rather than more samples of an existing one.

We close with eleven falsifiable experiments, the most important of which — a matched-data-budget comparison of EMG-derived versus covariance-derived endpoint stiffness — has, to our knowledge, never been run.

---

## 1. Introduction and Scope

### 1.1 Motivation

The dominant constraint on generalist manipulation policies is not architecture but data. Ken Goldberg's estimate places the corpora used to train frontier vision-language models at roughly 100,000 human-years of content, against about one year for the largest teleoperated robot dataset [Goldberg, *Science Robotics*, Aug 2025]. Purpose-built robot corpora have grown fast — AgiBot World reports 1,001,552 trajectories totalling 2,976.4 hours from 100+ robots in a 4,000 m² facility [[arXiv:2503.06669](https://arxiv.org/html/2503.06669v2)]; DROID required 50 collectors across 13 institutions over twelve months to produce 350 hours [[droid-dataset.github.io](https://droid-dataset.github.io/)] — but remain small by any comparison to language or vision.

This has produced a proliferation of alternative demonstration media: handheld grippers (UMI), wearable exoskeletons (DexUMI, DEXOP), egocentric video (Ego4D, EgoDex), simulation, and hand-matched gloves (Sunday Robotics). Each trades some combination of cost, throughput, fidelity and action-space alignment.

EMG occupies an unusual position in this space. Every other interface measures *kinematics* — where the hand is, how it moves. EMG measures *activation* — the neural drive that produces force. This is a categorically different signal, and it is the only cheap, wearable channel that observes two quantities the rest of the field cannot: **grip force** and **limb impedance via co-contraction**. Since co-contraction changes stiffness without changing net torque, it is invisible to any pose-based sensor. The question this review addresses is whether that informational advantage survives the practical costs of the medium.

The question is timely for three reasons. Cross-user generic sEMG decoding became credible in 2025 with a Nature paper reporting >90% held-out-participant accuracy with *no per-user calibration* across 11,236 participants [Kaifosh, Reardon & CTRL-labs at Reality Labs, *Nature* 645(8081):702–711, [DOI](https://www.nature.com/articles/s41586-025-09255-w)]. Force-conditioned imitation learning matured rapidly through 2025–26 with a dozen credible systems. And VLA post-training data requirements fell to the 50–200 demonstration range, bringing them within reach of any lab that can run a 15-minute calibration.

### 1.2 Research questions

- **RQ1 (medium quality).** How do action logs produced through EMG/prosthetic teleoperation compare, on measurable dimensions, to those produced by VR controllers, leader-follower arms, space-mouse and kinesthetic teaching?
- **RQ2 (artifact propagation).** How do EMG-specific artifacts — electromechanical delay, decoder jitter, electrode shift, limb-position dependence, session nonstationarity — propagate into the smoothness, precision and consistency of the resulting robot trajectories?
- **RQ3 (dataset availability).** Do open datasets exist with the required tripartite structure (vision + robot actions + biosignal provenance)?
- **RQ4 (performance impact).** Does training on prosthetic-sourced data deliver measurable gains in task success or sample efficiency, and does EMG capture force modulation, variable stiffness and contact adaptation better than rigid controllers?
- **RQ5 (scalability and integration).** Is collection scalable, and is the resulting distribution better used for direct end-to-end IL training or for fine-tuning a pretrained VLA?

### 1.3 Contributions

1. A dataset audit establishing that the target class is empty, with the three closest near-misses characterised precisely.
2. A propagation analysis mapping EMG artifact magnitudes onto the formal demonstration-quality axes of Belkhale, Cui & Sadigh (2023).
3. A comparative table of teleoperation media with sourced numbers, including the only direct EMG-versus-conventional benchmark we could locate.
4. A three-way disambiguation of the "force helps" literature into force-as-observation, force-as-action and force-as-relabelling, with evidence that the third dominates.
5. A taxonomy of four candidate architectures, three viable and one not, with the reasoning made explicit.
6. Eleven falsifiable experiments, several of which are cheap.

---

## 2. Methodology

### 2.1 Search protocol

Searches were executed across arXiv (full-text and listing), IEEE Xplore abstracts, PMLR/CoRL/RSS proceedings, Nature portfolio journals, Frontiers, MDPI, PhysioNet, Hugging Face Datasets, Zenodo, figshare, IEEE DataPort and Harvard Dataverse, plus laboratory and project pages.

Query families:

- **A (interface):** "EMG teleoperation robot arm", "myoelectric teleoperation manipulator", "sEMG robot hand control", "tele-impedance", "prosthetic teleoperation robot".
- **B (data):** "EMG imitation learning", "myoelectric demonstration robot policy", "muscle activity robot learning", "sEMG behavior cloning", "EMG VLA", "biosignal robot manipulation dataset".
- **C (artifacts):** "electromechanical delay EMG", "controller delay myoelectric", "electrode shift classification accuracy", "limb position effect myoelectric", "cross-session EMG degradation", "donning doffing EMG".
- **D (quality theory):** "data quality imitation learning", "demonstration quality metric", "movement smoothness SPARC", "teleoperation interface comparison policy success".
- **E (integration):** "force conditioned imitation learning", "tactile VLA", "variable impedance learning from demonstration", "LoRA fine-tuning VLA", "shared autonomy latent action".

### 2.2 Inclusion and exclusion

Included: peer-reviewed papers and arXiv preprints reporting either (i) EMG/prosthetic control of a robot manipulator or hand, (ii) quantitative EMG artifact characterisation, (iii) demonstration-quality effects on learned policies, or (iv) force/tactile/impedance conditioning of visuomotor policies. Excluded: EMG gesture recognition with no robot and no force ground truth, unless used to establish decoder-quality bounds; prosthetics work with no learning or robotics component; and non-manipulation robotics.

### 2.3 Evidence grading

Because a substantial fraction of the relevant 2026 literature is unrefereed, we grade sources:

- **[A]** Peer-reviewed with extractable quantitative results.
- **[B]** Peer-reviewed, results directional or partially extractable.
- **[C]** arXiv preprint with extractable results, no venue.
- **[D]** Company blog, press release or marketing page.

Any claim resting solely on **[D]** is flagged inline. We follow the practice, established by the TRI Large Behavior Models evaluation [[arXiv:2507.05331](https://arxiv.org/html/2507.05331v1)], of reporting what could *not* be verified.

### 2.4 Limitations of this review

Several primary sources were inaccessible: the founding tele-impedance paper (Ajoudani, Tsagarakis & Bicchi, *IJRR* 2012) is paywalled and we could not extract its quantitative results; Semantic Scholar's API and several PubMed pages were rate-limited or CAPTCHA-blocked, so a small number of electrode-shift figures are cited second-hand through a 2025 consolidating review and are marked as such. No meta-analysis was attempted; the corpus is too heterogeneous in task, robot and metric to support one, which is itself a finding (§12).

---

## 3. Formal Preliminaries

### 3.1 The visuomotor imitation problem

Let the robot's state be $s_t$, its observation $o_t = (I_t, x_t)$ where $I_t$ is one or more camera images and $x_t$ is proprioception, and its action $a_t \in \mathcal{A}$. A demonstration dataset is

$$\mathcal{D} = \{ \tau^{(i)} \}_{i=1}^N, \qquad \tau^{(i)} = (o_0, a_0, o_1, a_1, \ldots, o_{T_i}, a_{T_i}).$$

Behaviour cloning fits $\pi_\theta(a \mid o)$ by maximum likelihood. The classical result is that the compounding-error penalty of BC is quadratic in horizon: if the learned policy has per-step error $\epsilon$ under the expert's state distribution, its expected cost can degrade as $O(\epsilon T^2)$ relative to the expert, because errors move the policy off the training distribution.

Two architectural families dominate current practice and both address this by predicting *sequences* rather than steps.

**Action chunking (ACT).** Zhao, Kumar, Levine & Finn (RSS 2023) [[arXiv:2304.13705](https://arxiv.org/abs/2304.13705)] predict $a_{t:t+k}$ jointly, reducing the effective horizon by a factor $k$. Their ablation is striking: success rises from **1% at $k=1$ to 44% at $k=100$** on a simulated human-demonstration task. Temporal ensembling averages overlapping chunk predictions with exponential weights $w_i = \exp(-m \cdot i)$, adding a further ~3.3%. Crucially, removing the CVAE latent — the component that absorbs demonstrator stochasticity — costs **33.3% on human data and approximately nothing on scripted data**. This is the cleanest isolation in the literature of the specific damage done by human demonstration noise.

**Diffusion policy.** Chi, Feng, Du, Xu, Cousineau, Burchfiel & Song (RSS 2023) [[arXiv:2303.04137](https://arxiv.org/abs/2303.04137)] model $p(a_{t:t+T_p} \mid o)$ as a conditional denoising process, reporting **+46.9% average improvement across 12 tasks and 4 benchmarks**. Their stated motivation for sequence prediction is directly relevant here: it prevents *"jittery actions that alternate between the two valid trajectories"* when a demonstrator solves a task multiple ways.

Both families converge on the same fix from opposite modelling philosophies. That convergence tells us something about the failure mode they are both patching: **single-step regression is brittle precisely when the demonstrator's action is not a deterministic function of the observed state.** Hold that thought; §4.8 argues that EMG teleoperation manufactures exactly that condition.

### 3.2 Demonstration quality, formally

Belkhale, Cui & Sadigh, *Data Quality in Imitation Learning* (NeurIPS 2023) [[arXiv:2306.02437](https://arxiv.org/abs/2306.02437)] provide the framework this review uses throughout. They identify two axes:

- **Action divergence** — $D_f(\pi_A(\cdot \mid s), \pi_E(\cdot \mid s))$, the divergence between learner and expert action distributions at a state, driven in practice by the entropy of the expert's own actions at similar states.
- **Transition diversity** — the spread of successor states, $\rho(s' \mid s,a) = \mathcal{N}(\mu(s,a), \sigma^2 I)$.

Their Theorem 4.1 bounds the distribution shift:

$$D_{\mathrm{KL}}(\rho_{\pi_A}, \rho_{\pi_E}) \;\le\; \frac{1}{H}\sum_t (H-t)\, \mathbb{E}_{s \sim \rho^t_{\pi_A}}\big[ D_{\mathrm{KL}}(\pi_A(\cdot|s), \pi_E(\cdot|s)) \big].$$

Two consequences matter for us. The $(H-t)$ weighting means **early-episode errors are penalised far more than late ones**. And $H$ appears explicitly, so **slow, hesitant demonstrations are penalised twice** — once through longer horizons and once through whatever inconsistency produced the hesitation.

Their empirical practice is decisive. Diversity arising from *system* noise (environment stochasticity) helps, because it teaches recovery; diversity arising from *policy* noise (an inconsistent operator) hurts. In their controlled injection study on the Square task, at 1,000 episodes the gap is modest (82.0% system noise vs 80.7% policy noise), but **at 50 episodes it widens to 69.7% vs 48.3%**. Operator inconsistency is most corrosive exactly in the low-data regime any EMG study will occupy.

A caution the authors themselves raise: their metrics are incomplete and not monotone. On robomimic Square, the MH-Worse subset has the *lowest* action variance (0.061) and the *worst* success (2%), with the residual attributed to horizon length.

### 3.3 The empirical anchor: robomimic

Mandlekar et al. (CoRL 2021) [[arXiv:2108.03298](https://arxiv.org/abs/2108.03298)] constructed proficient-human (PH: 1 operator, 200 trajectories) and multi-human (MH: 6 operators, 50 each = 300 trajectories, binned "worse"/"okay"/"better") datasets per task. **MH has 50% more data than PH and performs substantially worse** — BC-RNN on Transport drops from **72% (PH) to 42% (MH)**. Offline RL collapses specifically on mixed *human* data: on Can (MH), BC-RNN reaches 100% while BCQ manages 62.7% and CQL 22.0%, despite both performing acceptably on machine-generated data.

The MH-specific architectural finding is equally important: history-dependent models (BC-RNN, HBC) gain **~25% on Square (MH) versus only ~5% on Square (PH)**. Architecture partially substitutes for data quality, and the value of the substitution scales with how bad the data is.

We found no paper contradicting the PH > MH ordering. Belkhale et al. independently reproduce it on the same subsets (Square: PH 58%, Better 36%, Okay 12%, Worse 2%).

### 3.4 Smoothness metrics

Because §4 argues that EMG artifacts manifest as non-smoothness, we need the metrics. Balasubramanian, Melendez-Calderon, Roby-Brami & Burdet (2015), *J. NeuroEngineering and Rehabilitation* 12:112 [[DOI](https://link.springer.com/article/10.1186/s12984-015-0090-9)] is the definitive comparative treatment.

**Spectral Arc Length (SPARC):**

$$\mathrm{SAL} \triangleq -\int_0^{\omega_c} \left[ \left(\tfrac{1}{\omega_c}\right)^2 + \left(\tfrac{d\hat V(\omega)}{d\omega}\right)^2 \right]^{1/2} d\omega, \qquad \hat V(\omega) = \frac{V(\omega)}{V(0)}$$

where $V(\omega)$ is the Fourier magnitude spectrum of the speed profile. Normalising by $V(0)$ makes it amplitude-invariant; the modified SPARC uses an adaptive cutoff $\omega_c \triangleq \min\{\omega_c^{\max}, \min\{\omega \mid \hat V(r) < \bar V \; \forall r > \omega\}\}$ to make it duration-invariant too.

**Log dimensionless jerk (LDLJ):**

$$\mathrm{DLJ} \triangleq -\frac{(t_2-t_1)^5}{v_{\text{peak}}^2}\int_{t_1}^{t_2}\left|\frac{d^2 v(t)}{dt^2}\right|^2 dt, \qquad \mathrm{LDLJ} \triangleq -\ln|\mathrm{DLJ}|.$$

The 2015 paper is explicit that DLJ "lacks sensitivity in the physiological range" and that LDLJ has "poor reliability" under measurement noise — a serious caveat for teleoperation data, where jerk requires double-differentiating noisy pose estimates. **The practical ranking is SPARC > LDLJ > number-of-peaks.**

These are not idle formalisms. Kulkarni, Dhar & Cui (2026), *RINSE* [[arXiv:2604.23000](https://arxiv.org/abs/2604.23000)] **[C]** use spectral arc length directly as a demonstration-filtering criterion, reporting **+16% success on RoboMimic Transport using one-sixth of the data** and **+20% on a real push-block task using half the data**. Critically for this review, **both of their metrics rank kinesthetic teaching above teleoperation**, matching downstream policy performance. Smoothness is not merely correlated with quality; it is usable as a filter.

---

## 4. The Teleoperation Medium: EMG Artifacts and Their Propagation

### 4.1 The physical chain

An EMG teleoperation system is a cascade, and every stage adds delay, distortion, or both:

$$\text{intent} \to \text{motor unit recruitment} \to \text{sEMG} \to \text{windowing} \to \text{decoder} \to \text{mapping} \to \text{robot controller} \to a_t$$

Compare this to a leader-follower arm (GELLO, ALOHA), where the chain is: intent → arm motion → joint encoder → joint target. One measurement, one transform, no learned component, no statistical nonstationarity. **The comparison is not close, and every quantity in the rest of §4 exists only in the EMG chain.**

### 4.2 Latency

The physiological floor is electromechanical delay. Begovic, Zhou, Li, Wang & Zheng (2014), *Frontiers in Physiology* 5:494 [[DOI](https://www.frontiersin.org/articles/10.3389/fphys.2014.00494/full)] **[A]** measured total EMG-to-force EMD in quadriceps at **49.73 ± 6.99 ms**, decomposed as EMG→mechanomyogram 20.5 ± 4.73 ms (41.1%) and MMG→force 28.63 ± 6.31 ms (57.1%). Literature ranges collated therein span 37.8–56.5 ms for voluntary contraction. Electrically stimulated EMD is an order of magnitude lower (2.2–8.5 ms), which confirms that most of the delay is excitation-contraction coupling rather than instrumentation.

The usability ceiling has an exact citation, which is worth stating because it is usually cited second-hand. Farrell & Weir (2007), *IEEE TNSRE* 15(1):111–118 [[DOI](https://ieeexplore.ieee.org/document/4126535/)] **[A]** ran 20 subjects on a Box-and-Block Test with the PHABS testbed across seven delay levels from ~0 to 300 ms and two prehensor speeds, finding an **optimal controller delay of 100 ms for fast prehensors and 125 ms for slower ones, with linear degradation beyond**.

So the budget is: ~50 ms is spent before any engineering choice is made, and the total must stay under ~100–125 ms. Windowing typically consumes 80–250 ms (Yang et al. use 80 ms windows with 40 ms stride; Yang, Shibata, Weber & Erickson use 250 ms). Modern decoders are fast enough not to be the problem — Lin, Zhang & Zhao (2025), *Scientific Reports* [[DOI](https://www.nature.com/articles/s41598-025-16268-y)] **[A]** report a parallel efficient transformer running inference in **~25 ms on a Raspberry Pi 4B**. But the aggregate leaves very little headroom.

**Why this matters for data, not just for usability.** A demonstration recorded through a channel with 100 ms of variable delay contains a systematic temporal misalignment between what the operator saw and what the robot did. In an action-chunked policy predicting $a_{t:t+k}$ from $o_t$, this misalignment is baked into the supervision target. The policy learns to act on stale observations because the data says that is what the expert did.

### 4.3 Electrode shift

Tanaka, Nambu & Wada (2025), *Sensors* 25(13):4119 [[DOI](https://www.mdpi.com/1424-8220/25/13/4119)] **[A]** both measure and consolidate:

| Source | Shift | Degradation |
|---|---|---|
| Tanaka 2025 (own) | 2 cm perpendicular | **−7.6%**; −1.0% with sliding-window normalisation |
| Young, Hargrove & Kuiken | 2 cm | **−15%** (7-class) |
| Gao et al. | 0 to ±2 cm | **−20%** (6-class) |
| Côté-Allard et al. | — | 93.58% → 75.50% (**−18.08%**, 11-class) |
| Ameri et al. | — | 6% → 7% error (**−1%**, CNN, 8-class) |

*(The Young, Gao and Côté-Allard figures are cited second-hand through Tanaka 2025; the primary PubMed records were CAPTCHA-blocked during this review. The Ameri outlier suggests CNN-based decoders are substantially more shift-robust, which is a live research direction.)*

### 4.4 Limb position

Fougner, Scheme, Chan, Englehart & Stavdahl (2011), *IEEE TNSRE* 19(6) **[A]** report that average classification error rises from **3.8% to 18%** — a 4.7× increase — when limb position changes. Mitigations exist and work: training across multiple positions gives 5.7%, and adding accelerometers gives 5.0%.

This is arguably the single most damaging artifact for manipulation data collection, because manipulation *is* limb-position variation. A dataset collected in one arm configuration and evaluated in another is exactly the failure mode.

### 4.5 Cross-session nonstationarity

Rehman et al. (2018), *Sensors* 18(8):2497 [[DOI](https://mdpi.com/1424-8220/18/8/2497/htm)] **[A]** ran 7 subjects over 15 consecutive days × 2 sessions. Within-session accuracy was excellent (CNN 97.60 ± 1.99%, stacked sparse autoencoder 98.12 ± 1.07%, LDA ~86–87%); **between-day error rose to ~11–15%, a drop of roughly 10–12 percentage points** for the deep models. Deep models degraded less than LDA, which is the consistent finding across this literature.

Odeyemi & Zhang (2026) [[arXiv:2607.27568](https://arxiv.org/abs/2607.27568)] **[C]** report cross-session macro-F1 of **0.688** for a montage-agnostic encoder versus **0.540** for per-user LDA, and find that feature-statistic alignment "recovers about what a single labelled calibration repetition would," while batch-norm re-estimation was *actively harmful*.

### 4.6 Donning, doffing and skin impedance

Hwang, Hahne & Müller (2017), *PLOS ONE* [[DOI](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0186318)] **[A]** measured mean electrode shift on re-donning at **1.16 ± 0.34 cm** — i.e. every session re-introduces roughly half the shift magnitude that costs 7.6–20% accuracy in §4.3. They report significant online degradation in completion rate and time after donning/doffing (p<0.05), with path efficiency in an example subject falling **62.16% → 46.29%**.

Their most interesting finding is a dissociation: **arm position hurt offline $R^2$ substantially but online completion rates stayed above 90%**, because closed-loop visual feedback lets the operator compensate. This matters enormously for our question and cuts *against* EMG as a data source specifically. The operator's compensation is invisible in the recorded action log — the log shows a trajectory that reached the goal, not the corrective effort that got it there. **Closed-loop human compensation converts decoder error into action inconsistency rather than task failure**, which is precisely the transformation that damages behaviour cloning while leaving teleoperation success rates looking acceptable.

Sousa, Noites, Vilarinho & Santos (2023), *Sensors* 23(20):8582 [[DOI](https://www.mdpi.com/1424-8220/23/20/8582)] **[A]** measured electrode–skin impedance every 5 minutes over 50 minutes: mean impedance falls from 0.56 kΩ at minute 5 to 0.49 kΩ at minute 10 (−12–13%), stabilising after minute 15 (only 2.9% variation from 15 to 50 minutes). **Operationally: any EMG collection protocol needs a ~15-minute warm-up before calibration**, and data collected in the first fifteen minutes is drawn from a different distribution than the rest.

### 4.7 Decoding: what is achievable

Two regimes must be distinguished.

**Classification (pattern recognition) → discrete modes.** This is what nearly all deployed EMG robot control uses. Yang, Shibata, Weber & Erickson (2025), *npj Robotics* [[DOI](https://www.nature.com/articles/s44182-025-00018-3)] **[A]** achieve offline 99.6% (SD 0.8) and real-time 95.6% mean accuracy on 10 gestures with a 64-electrode HD-EMG array on a Stretch RE2. Wang et al. (2025), *Biomimetics* 10(7):464 **[A]** report >90% online recognition of 12 gestures under fatigue and electrode shift with an 8-channel gForcePro band at 200 Hz.

Note what these systems produce as an *action*: a discrete mode selection, mapped through a finite state machine to axis-wise velocity (Wang et al.: base translational 0.02 m/s, rotational 0.08 rad/s, at 50 Hz). This is not proportional control, and the resulting trajectories are piecewise-constant velocity segments — a highly non-human, non-smooth action distribution.

**Regression → continuous proportional control.** Harder and less accurate. Ameri, Akhaee, Scheme & Englehart (2018), *PLOS ONE* **[A]** report a negative result worth citing: a CNN on raw EMG achieved 91.61 ± 0.39% versus 90.63 ± 0.31% for a well-tuned SVM with hand-engineered features (**p = 0.059, not significant**), and in a Fitts'-law closed-loop test there was **no significant difference on any control metric**. Deep learning did not obviously beat classical methods in the loop.

The state of the art on continuous hand-pose regression comes from Meta's emg2pose benchmark [Salter et al., NeurIPS 2024 D&B, [arXiv:2412.02725](https://arxiv.org/abs/2412.02725)] **[A]** — 193 participants, 370 hours, 80M labelled frames at 60 Hz, 16-channel sEMG at 2 kHz with 26-camera mocap ground truth:

| Condition | vemg2pose | NeuroPose | SensingDynamics |
|---|---|---|---|
| Regression, held-out users | **12.2°** | 13.2° | 15.5° |
| Regression, held-out stages | **15.2°** | 17.2° | 18.8° |
| Regression, held-out users + stages | **15.8°** | 17.5° | 18.7° |
| Tracking, held-out users | **7.7°** | — | — |

**Read the top-left cell carefully: 12.2° mean joint-angle error for a new user.** For comparison, UMI's SLAM tracking achieves 6.1 mm position and 3.5° rotation absolute trajectory error, and GELLO's leader-follower encoders are essentially exact. A 12° joint error propagated through a hand kinematic chain is centimetres of fingertip error — larger than the clearance of most insertion tasks in the manipulation literature.

**The 2025 scaling result.** Kaifosh, Reardon & CTRL-labs at Reality Labs, *Nature* 645(8081):702–711 (23 July 2025) **[A]** is the most important EMG paper of the period. A 16-channel bipolar wristband at 2 kHz (2.46 µVrms noise), with **162 participants for wrist control, 4,900 for discrete gestures, 6,627 for handwriting**. Cross-user, **with no per-user calibration**: >90% held-out-participant classification for handwriting and gesture detection, <13° s⁻¹ wrist-angle velocity error; closed-loop 0.66 target acquisitions/s, 0.88 gesture detections/s, 20.9 words per minute. **Twenty minutes of personalisation cut handwriting character error rate by 16%** relative to the largest generic model.

The contrast with emg2qwerty (2024), where the generic-model character error rate was 55.38% versus 15.38% personalised-from-scratch, shows how much the cross-user gap closed with scale in roughly one year.

**But note the boundary condition: there is no robot in the Nature paper.** It is cursor, gesture and handwriting. The demonstrated capability is *discrete or low-dimensional continuous* control, calibration-free. Extrapolating it to 6-DoF end-effector pose plus a multi-fingered hand is not supported by anything in that paper.

### 4.8 Propagation: mapping artifacts onto the quality axes

We can now state the argument compactly. Model the recorded action as

$$a_t^{\text{rec}} = f_\phi\big( \mathrm{EMG}(t - \delta_t) \big) + \eta_t$$

where $\delta_t$ is a time-varying latency (§4.2), $\phi$ is a decoder whose calibration drifts within and across sessions (§4.5–4.6), and $\eta_t$ is decoder noise with variance that depends on limb configuration (§4.4) and electrode registration (§4.3).

Each term maps onto a known failure mode:

- **Variable $\delta_t$** produces observation–action misalignment. Under the Belkhale decomposition this appears as *action divergence*, since the same observation is paired with actions issued in response to a different, earlier observation.
- **Configuration-dependent $\eta_t$** means action noise is *state-correlated*. This is the worst case: it is neither system noise (which teaches recovery) nor i.i.d. policy noise (which averages out) but a structured error that a sufficiently expressive policy will *learn*.
- **Session-to-session drift in $\phi$** means that a corpus collected over multiple days is a mixed-operator dataset even with a single operator. This is the robomimic MH condition, arrived at by a different route, and robomimic tells us what it costs: BC-RNN Transport 72% → 42%.
- **Discrete-mode decoding** produces piecewise-constant velocity commands with abrupt transitions — the signature of low SPARC and high jerk, which RINSE shows is a usable *negative* quality filter.
- **Closed-loop operator compensation** (§4.6) converts all of the above from task failure into action inconsistency, hiding the damage from teleoperation-level metrics while preserving it in the training data.

The last point deserves emphasis because it is a genuine methodological trap. Every EMG teleoperation paper we surveyed reports task-level metrics — success rate, completion time, questionnaire scores. **None reports SPARC, jerk, action variance, or downstream policy success on the collected data.** The field has no measurement of the thing this review is about.

**Hypothesis H1 (testable, cheap):** for matched tasks and operators, action logs collected via EMG interfaces will show significantly worse SPARC and higher within-state action variance than logs from leader-follower or kinesthetic collection, and BC policies trained on them will underperform by a margin exceeding the teleoperation-level success-rate gap. Nobody has run this.
---

## 5. Comparative Evaluation of Teleoperation Media

### 5.1 The only direct comparison

Yoshida, Dossa, Di Vincenzo, Sujit, Douglas & Arulkumaran (2025), *M4Bench*, *Frontiers in Robotics and AI* [[DOI](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1528754/full)] **[A]** is, as far as our search could establish, the only benchmark that places a biosignal interface head-to-head against conventional input devices on a manipulation task with a full metric suite. N = 50 participants, 7-DoF Franka Panda arms, pick-and-place of coloured blocks into matching bins, three device pairs.

| Metric | Mouse + Keyboard | Gamepad | **Eye tracker + EMG** |
|---|---|---|---|
| Completion time (s) | 105.6 ± 4.2 | 106.9 ± 5.8 | **132.7 ± 22.5*** |
| Command selection time (s) | 0.423 ± 0.443 | 0.596 ± 1.155 | **0.846 ± 1.284*** |
| Error rate | 0.005 ± 0.029 | 0.014 ± 0.041 | **0.292 ± 0.263*** |
| NASA-TLX overall | 14.7 ± 13.5 | 17.4 ± 15.3 | **40.8 ± 20.1*** |

\* corrected *p* < 0.001 versus both conventional interfaces.

The biosignal pair was significantly worse on **every** metric: ~26% slower, ~58× the error rate, ~2.8× the workload. There was no significant difference between mouse/keyboard and gamepad.

Three caveats before this is over-read. The EMG hardware was g.tec forearm and calf electrodes in a *supervisory multi-robot* paradigm, not a continuous manipulation interface. Eye tracking is confounded with EMG in the same condition. And the comparison devices are themselves poor manipulation interfaces — GELLO's user study found mouse-class devices at 63% average success versus 92% for leader-follower. So M4Bench establishes that EMG is worse than *mediocre* baselines, which is a stronger negative result than it first appears.

### 5.2 A more favourable read

Lobo-Prat, Keemink, Stienen, Schouten, Veltink & Koopman (2014), *J. NeuroEngineering and Rehabilitation* 11:68 [[DOI](https://jneuroengrehab.biomedcentral.com/articles/10.1186/1743-0003-11-68)] **[A]** compared EMG, force and joystick interfaces for active arm supports with 8 healthy participants. **EMG was best on tracking error and gain-margin crossover frequency**; force was better on information transmission rate and effort; joystick was indistinguishable from force. Differences emerged beyond **0.9 Hz** (tracking error) and **1.4 Hz** (information transmission).

The bandwidth framing is the useful part. EMG leads the neural-to-mechanical delay — it *precedes* movement — which is why it can win on high-frequency tracking. This is a real advantage and it is why EMG persists in assistive contexts. It does not translate into an advantage for producing accurate 6-DoF pose trajectories.

### 5.3 The conventional interfaces, for calibration

| Interface | Throughput | Success / accuracy | Source |
|---|---|---|---|
| **UMI** (handheld gripper) | **111 demos/hr** (vs 35 SpaceMouse); 48% of bare-hand speed; 149/hr on dynamic tossing where SpaceMouse produced **zero** demos in 15 min | SLAM ATE 6.1 mm / 3.5°; 70% success OOD | Chi et al., RSS 2024 [[arXiv:2402.10329](https://arxiv.org/abs/2402.10329)] **[A]** |
| **GELLO** (leader-follower, ~$300) | Fastest completion times across all 5 tasks | **92% avg** (Hat 92, Mask 92, Banana 100, Towel 92, USB 83) | Wu, Hoque, Mandlekar, Abbeel & Goldberg [[arXiv:2309.13037](https://arxiv.org/abs/2309.13037)] **[B]** |
| **VR controller** (Quest 2, ~$300) | — | **72% avg** (USB 50) | same |
| **3D SpaceMouse** (~$150) | 35 demos/hr | **63% avg** (USB 58) | same / UMI |
| **Kinesthetic teaching** | Fastest demos (17.4–24.0 s vs 26.1–65.3 joystick) but physically demanding | Highest downstream **policy** performance; replay success 88.0/83.0/58.1% | Vanc et al. 2026 [[arXiv:2605.28033](https://arxiv.org/html/2605.28033v1)] **[C]**; Li, Cui & Sadigh 2025 [[arXiv:2503.07017](https://arxiv.org/html/2503.07017v1)] **[C]** |
| **EMG, discrete-gesture** | — | 12 gestures >90% online; 81.8–101.4 s task times (best mapping strategy) | Wang et al. 2025 **[A]** |
| **EMG + eye tracker** | 26% slower | error rate 0.292 | M4Bench **[A]** |

Two observations. First, the ordering **leader-follower > VR > space-mouse** is consistent across studies, and the gap widens with task precision (USB insertion: 83 / 50 / 58). Second, and more important for this review, **kinesthetic teaching produces the best downstream policies despite being the least scalable** — a finding independently reached by Li, Cui & Sadigh (2025) through user study and by RINSE (2026) through smoothness metrics. Li et al. also report that **mixing a small amount of kinesthetic data with additional VR-teleoperation data yields ~20% higher average performance than either alone**, because the two modalities trade off action consistency against state diversity.

That last result is the template for the constructive argument in §10: heterogeneity in *proficiency* hurts (robomimic MH), but heterogeneity in *modality* can help when the modalities contribute orthogonal quality dimensions. The question for EMG is which kind of heterogeneity it introduces.

### 5.4 A structural gap in the comparison literature

Almost no study connects teleoperation-interface throughput to downstream policy success. GELLO and UMI measure collection; ACT and Diffusion Policy measure policies. Only **Li, Cui & Sadigh (2025)** and **RINSE (2026)** close the loop, and neither includes a biosignal condition. **No paper anywhere trains a visuomotor policy on EMG-collected demonstrations and compares it against the same policy trained on conventionally-collected demonstrations of the same task.** This is the central empirical hole in the field this review surveys.

---

## 6. Dataset Audit

### 6.1 The verdict

**No openly released dataset pairs (a) visual observations, (b) robot action logs, and (c) EMG- or prosthesis-driven teleoperation provenance.** The intersection is empty as of August 2026. The landscape decomposes into three non-overlapping silos.

**Silo 1 — EMG corpora.** Large and mature, with hand pose, gesture class or finger force as ground truth. emg2pose: 193 participants, **370 hours**, 25,253 files, 2 kHz, CC-BY-NC-SA-4.0. emg2qwerty: 108 users, **346.4 hours**, 5,262,671 keystrokes, 32 channels. EMG-EPN-612: **612 subjects**. Ninapro DB1–DB10 (DB3, DB7, DB8 and DB10 include amputee participants). Hyser: 256-channel HD-sEMG, 142.8 GB. GRABMyo: 43 subjects across 3 days. Of roughly twenty corpora, **exactly two contain a vision modality** — **MeganePro / Ninapro DB10** (12-channel sEMG at 1926 Hz + eye tracking + 1920×1080 scene video, 45 participants including **15 transradial amputees**) and **putEMG** (24-channel at 5120 Hz + RGB + depth + isometric finger force, 44 subjects). **Zero contain robot action logs.**

**Silo 2 — Robot manipulation corpora.** Enormous, some with force. **RH20T** is the structural template: 110k+ contact-rich sequences, 147 tasks, 7 robot configurations, **6-DoF force/torque at 100 Hz on all configurations**, fingertip tactile at 200 Hz on one, collected via haptic device and pedal. AgiBot World: 1,001,552 trajectories / 2,976.4 hours. DROID: 76k / 350 hours. Open X-Embodiment: 1M+ trajectories, 22 embodiments — note that force/torque is *not* an RLDS standard field and appears only in specific constituent datasets; we could not obtain a defensible fraction and recommend citing no percentage. **Zero contain any biosignal.**

**Silo 3 — Human hand corpora.** GRAB, DexYCB, ARCTIC and ContactPose provide contact *geometry*, not measured force. Only PressureVision++, Feel the Force and the OSMO glove provide instrumented pressure. EgoDex provides 829 hours of egocentric hand pose with no force at all. **Zero contain EMG; zero contain robot actions.**

### 6.2 The near misses, characterised precisely

**ForceBand** — He, Wang, Kuang, Ghosh, Malik, Fermüller, Wu, Mao, Liu, Qi & Aloimonos (Amazon FAR / UMD / JHU), 24 June 2026 [[arXiv:2606.26093](https://arxiv.org/html/2606.26093v1)] **[C]**. The only work that puts sEMG, egocentric vision and robot manipulation in one paper. 10 hours of synchronised egocentric video + 8-channel sEMG + IMU + fingertip forces from 4 subjects at 250 Hz; separately, 15 robot demonstrations per object across 9 objects on a UR-5 with Robotiq gripper. **Fails the target class on two counts:** the sEMG+video corpus is *human* demonstration, not robot teleoperation (sEMG is converted to force labels post hoc via a learned EMG2Force model), and the robot action logs are a separate set without EMG. The project page states the dataset is "Coming Soon"; it was not downloadable at the time of this review.

**DexEMG** — Zhao, Li, Wang & Zhang (Sharpa / SJTU), March 2026 [[arXiv:2603.05861](https://arxiv.org/html/2603.05861v1)] **[C]**. Genuine EMG-driven teleoperation producing real 22-DoF robot action logs on a Sharpa Wave hand, using an emg2pose-style encoder (2× 1-D conv → 2× TDS stages → LSTM) predicting joint velocities, then kinematic retargeting by L2 keypoint optimisation. Grasping success **76.0% trained / 66.0% unseen objects / 56.0% novel environments**; pose MAE 0.09 rad grasping, 0.15 rad in-hand rotation. **Fails the target class because nothing is released, no vision-observation stream is part of the pipeline (retargeting is purely kinematic), and the paper explicitly states it "does not train reinforcement learning policies."** It also states that DexEMG "currently requires individual calibration for new users," and does not report control rate or latency.

**HannesImitation** — Alessi, Vasile, Ceola, Pasquale, Boccardo & Natale (IIT), 2025 [[arXiv:2508.00491](https://arxiv.org/html/2508.00491v1)] **[C]**. The closest thing to *prosthesis-sourced robot training data* that actually exists. The Hannes prosthetic hand (3 DoF) with a palm-embedded RGB camera; **450 demonstrations across 15 YCB objects** collected by teleoperating the prosthesis via keyboard; a reduced-U-Net diffusion policy running at ~35 Hz. Success: table grasp **80.6%**, shelf grasp **68%**, human-to-prosthesis handover **89.3%**, overall **79.3% across 450 trials**, unseen objects **76%**, beating a visual-servoing baseline by 13.8 percentage points. **Fails the target class because the teleoperation is by keyboard, not EMG, and the prosthesis is not mounted on a robot arm** — but it is the existence proof that a prosthetic hand can serve as a data-collection end-effector for a modern visuomotor policy.

**ABB Robotics × PSYONIC**, June 2026 **[D]**. PSYONIC's myoelectric Ability Hand reportedly supplying "movement, contact and grip force" data from real prosthetic use into ABB GoFa dexterity work. **This is a press release with no hours, no demonstration counts, no benchmark and no paper.** Cite only as industry signal. It is nonetheless the clearest indication that the idea has commercial traction.

### 6.3 Why the gap is structural rather than an artifact of search

The two research communities have incompatible ground-truth conventions. The EMG community's target variable is hand pose, gesture class or finger force, collected under constrained laboratory protocols with mocap or force-sensor supervision and no robot. The robot-learning community's teleoperation stack — VR controllers, haptic devices, leader-follower arms, exoskeletons — is chosen specifically because it delivers clean, high-bandwidth pose signals that EMG cannot match.

The exoskeleton line makes this explicit. **DEXOP** (MIT), **DexUMI**, **DexEXO**, **ACE**, **AnyTeleop**, **Open-TeleVision**, **HOMIE** and **TWIST2** all record joint positions via mechanical or optical encoders, and **not one of them records muscle activity** — despite several of them placing hardware directly over the forearm musculature. The omission is deliberate: mechanical sensing is more accurate, needs no calibration, and does not drift.

That two independent groups arrived at the problem in 2026 and *neither shipped a corpus* is itself the strongest evidence that the class is nascent. This is a citable gap, not a search failure.

---

## 7. Performance Impact and Human Intent Capture

### 7.1 Does EMG capture stiffness and force better than rigid controllers? The tele-impedance evidence

The affirmative case rests on the tele-impedance literature, which originates with Ajoudani, Tsagarakis & Bicchi (2012), *IJRR* 31(13):1642–1656 [[DOI](https://journals.sagepub.com/doi/abs/10.1177/0278364912464668)] **[B]**. The idea: send the remote robot both a desired motion trajectory *and* an impedance profile, with an algorithm that decouples force from stiffness so that co-contraction — which changes stiffness without net torque — is separated from net force. Validated on peg-in-hole and ball catching. *(We could not obtain quantitative results; the full text is paywalled and the abstract asserts "significant differences" without figures. Do not cite 2012 numbers.)*

Two mechanisms recur in this lineage. A **co-contraction index** from an antagonist pair (typically biceps/triceps) drives a common-mode stiffness term, while arm posture drives a configuration-dependent stiffness term via the muscle Jacobian [Ajoudani, Fang, Tsagarakis & Bicchi, IROS 2015]. Alternatively a linear stiffness–activation model maps normalised activations to a pseudo-stiffness matrix via subject-specific regression.

The quantitative evidence comes from successors.

**Fani, Ciotti, Catalano, Grioli, Tognetti, Valenza, Ajoudani & Bianchi (2018)**, *IEEE RAM* [[IEEE](https://ieeexplore.ieee.org/document/8283715/)] **[A]**. Pisa/IIT SoftHand plus KUKA LWR IV+, Delsys Trigno at 1 kHz, EDC/FDS for hand stiffness and BB/TB for arm endpoint impedance. Drilling task, 10 subjects.

| Condition | Success |
|---|---|
| **Tele-impedance** | **83.3%** |
| Constant high stiffness | 78.3% |
| Constant low stiffness | 60.0% |

TI vs LS: *p* < 0.005, χ² = 8.04, df = 1. Adding CUFF force feedback raised success across all conditions (*p* < 0.005), significantly for LS but not HS. Questionnaire medians (7-point): "tele-impedance intuitive" 6 (IQR 0); "robot as body extension" 6 (IQR 1).

**Laghi, Ajoudani, Catalano & Bicchi (2020)**, *IJRR* 39(4) [[DOI](https://journals.sagepub.com/doi/10.1177/0278364919891773)] **[A]** — the best quantitative tele-impedance source we located. Two Franka Panda arms, 1 kHz master/slave threads, Myo armbands at 50 Hz and Delsys Trigno at 1 kHz, 10 subjects, round-trip delays of 0 / 500 / 1000 ms.

Maximum interaction force $f_z$ (N) in a contact-recognition task:

| Architecture | 0 ms | 500 ms | 1000 ms |
|---|---|---|---|
| 4-channel bilateral | 8.08 | 16.17 | 24.31 |
| FT2 | 8.02 | 14.86 | 20.36 |
| **TIFT2 (tele-impedance)** | **6.68** | **11.26** | **12.33** |

At one second of delay, tele-impedance **halves peak contact force** (12.33 vs 24.31 N, *p* = 1.69 × 10⁻⁵). Normalised operator EMG effort at 1000 ms: TIFT2 0.57 versus 1.0 for classic bilateral. Peg-in-hole (1 mm clearance) $f_y$ max: TIFT2 4.73 / 5.95 / 7.06 N versus 4C 5.75 / 9.00 / 8.96 N. *Caveat the authors report: TIFT2 scored worse on peg extraction difficulty, attributed to lower compliance during withdrawal.*

**So the affirmative answer to RQ4's second half is: yes, EMG-derived stiffness demonstrably improves contact-rich teleoperation over constant-impedance control, with effect sizes in the 5–23 percentage point range on success and roughly 2× on peak contact force under delay.**

### 7.2 The critical caveat: the comparison is against *constant* impedance, not against inferred impedance

Here the review must be careful, because the tele-impedance literature systematically compares against the wrong baseline.

There is a well-developed alternative that infers stiffness from **demonstration variability**, with no biosignals. Calinon et al. (2010) estimate variable stiffness from the **inverse of the observed position covariance** encapsulated in a GMM — formally $K \propto \Sigma^{-1}$, so that high demonstration variability implies low inferred stiffness. This became the minimal-intervention control principle: *be stiff only where the demonstrations agree* [Zeestraten, Calinon et al., ICRA 2016]. Abu-Dakka & Saveriano (2020), *Frontiers in Robotics and AI* 7:590681 [[link](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)] **[A]** survey both branches and note that EMG methods "require a complex setup and a long calibration procedure" while covariance methods depend on demonstration quality.

**They provide no quantitative head-to-head, and we could not find one anywhere.** This is the single most consequential gap identified by this review. The entire case for EMG in robot learning rests on it supplying stiffness information, and nobody has tested whether that information is already recoverable, for free, from the variance of conventionally-collected demonstrations.

A hybrid exists — Li, Wu, Liu, Teng, Chen, Calinon, Caldwell, Chen [[arXiv:2502.13707](https://arxiv.org/html/2502.13707v1)] **[C]** combine EMG-derived limb impedance with a six-direction perturbation calibration (0.02 m, 0.5 s) and a geometric endpoint-stiffness construction, reporting average Z-axis force reduced from 3.80 N to 2.74 N and 7.63 N to 3.29 N versus a constant-impedance baseline. But again the baseline is constant impedance.

**Hypothesis H2 (the decisive experiment):** on a matched task with matched demonstration counts, compare (i) EMG-derived stiffness, (ii) covariance-derived stiffness from the same demonstrations, and (iii) a learned stiffness policy from vision. Prediction: (ii) captures most of (i)'s benefit at zero hardware cost, and (iii) may exceed both.

Preliminary support for the (iii) branch already exists. **Stiffness Copilot** — Wang, Xu, Preechayasomboon, Abbatematteo, Memar, Colonnese & Chan (Meta Reality Labs / UW-Madison / Purdue), 2026 [[arXiv:2603.14068](https://arxiv.org/html/2603.14068v1)] **[C]** — predicts a 3×3 direction-dependent stiffness matrix (eigenvalues 300–3000 N/m) **from wrist-camera RGB**, with the operator supplying pose only. Across 18 participants:

| Task | Metric | Low stiffness | **Copilot** | High stiffness |
|---|---|---|---|---|
| Vase wiping | max force (N) | 60.58 ± 29.23 | **59.28 ± 27.04** | 117.46 ± 42.87 |
| | success | 0.76 ± 0.36 | **0.87 ± 0.17** | 0.24 ± 0.28 |
| Peg-in-hole | max force (N) | 49.00 ± 34.25 | **33.41 ± 11.67** | 80.60 ± 54.44 |
| | success | 0.67 ± 0.40 | **0.81 ± 0.31** | 0.70 ± 0.30 |

NASA-TLX 38.73 versus 49.33 (low) and 52.43 (high), all *p* < .05. **This achieves tele-impedance's objective without any biosignal.** It is the strongest single piece of evidence against the EMG-as-stiffness-source thesis, and it appeared in 2026 from a lab that also builds sEMG wristbands.

### 7.3 The reframing that works: EMG as annotation, not as interface

ForceBand's contribution is conceptual before it is empirical, and it is the most important idea in this review.

The pipeline: an 8-channel bipolar sEMG band (~$300, OpenBCI Cyton / ADS-1299) with anatomically guided placement — seven channels over finger-controlling forearm muscles, one over wrist flexors. A **15-minute per-user calibration** collects paired sEMG and ground-truth fingertip forces. **The fingertip force sensors are then removed.** A pretrained EMG2Force model thereafter labels ordinary egocentric human video demonstrations with force traces. Those force-augmented human demonstrations train a flow-matching transformer policy whose action is

$$a_t = [\,p \in \mathbb{R}^3;\; r_{6\mathrm{D}} \in \mathbb{R}^6;\; g \in \mathbb{R};\; f \in \mathbb{R}\,] \in \mathbb{R}^{11}$$

— end-effector position, 6-D rotation, gripper aperture, **and desired grip force**, with a PD controller tracking the predicted force by modulating aperture.

Results: sEMG roughly **halves** hand-level force-regression error versus vision baselines; finger-level contact detection PR-AUC of **0.763 (ring) and 0.590 (pinky) versus 0.398 and 0.314** for a vision-based baseline, roughly 1.9× on each and over 6× above random. An electrode-placement ablation under a matched 30-minute protocol found muscle-aware 8-channel placement at MAE 0.77 N / RMSE 1.33 N versus evenly-spaced 8-channel at 0.94 N / 1.77 N — an **18% MAE reduction from anatomy-aware placement alone**. On pick–squeeze–place across 9 objects (43–650 g, grasp widths 1–72 mm), overall success was **87%**, with squeeze success 6–10/10 versus **0/10 for a binary-gripper baseline on every object** and 0–4/10 for a continuous-gripper baseline. Predicted grip forces spanned **3.2 N to 19.3 N**, object-specific.

Why this works when EMG-as-interface does not: **the human demonstrates with their own hand at full human bandwidth.** There is no decoder in the control loop, so latency (§4.2) is irrelevant — the labels are computed offline. Electrode shift and session drift degrade label quality rather than trajectory quality, and label noise is far more benign for a learned policy than state-correlated action noise. The 15-minute calibration is amortised over hours of subsequent collection. And the artifact that kills EMG teleoperation — closed-loop compensation hiding decoder error in the action log (§4.6) — does not arise, because there is no loop.

**This reframing converts EMG from a bandwidth-limited actuator into a cheap sensor for an otherwise unobservable label.** It is, as far as our search can establish, novel as of mid-2026 and has exactly one paper behind it.

### 7.4 Does force conditioning help downstream? Yes, on contact-rich tasks, with large effects

The relevant question then becomes whether a force channel earns its place in the action or observation space at all. The 2024–26 evidence is strong but must be disaggregated.

| System | Force signal | Entry point | Result |
|---|---|---|---|
| **DexForce** (Chen, Yu, Choi, Cutkosky, Bohg; RA-L) [[arXiv:2501.10356](https://arxiv.org/html/2501.10356)] **[A]** | Fingertip forces during kinesthetic demos | **Action relabelling**: $x_f = x_o + k_f \cdot f$, tracked by Cartesian impedance control | **76% avg across 6 tasks (57–90%) vs "near-zero"** for the same policies on non-relabelled actions. 5–10 demos/task |
| **ForceMimic / HybridIL** (SJTU) [[arXiv:2410.07554](https://arxiv.org/html/2410.07554v3)] **[A]** | 6-axis F/T on a handheld rig | Diffusion policy predicts 20-step force–position trajectories; switches to hybrid control at ≥6 N | Peel length >10 cm: **85% vs 55%** (+54.5% rel.); mean interaction force **~9 N vs ~20 N**; collection ~5 min vs >13 min for force-feedback teleop |
| **FoAR** (SJTU, RA-L) [[arXiv:2411.15753](https://arxiv.org/html/2411.15753v1)] **[A]** | Wrist F/T at 100 Hz | **Future-contact predictor gates** multimodal fusion | Wiping **0.875** vs RISE 0.500, DP 0.400, **RISE+force-token 0.575, RISE+force-concat 0.475**. 50 demos/task. Force at 2 Hz or 10 Hz worse than 100 Hz |
| **ManipForce / FMT** (GIST) [[arXiv:2509.19047](https://arxiv.org/html/2509.19047v1)] **[C]** | Wrist F/T at 200+ Hz vs 30 Hz RGB | Frequency + modality embeddings, bidirectional cross-attention | **83% avg vs 22% RGB-only** across 6 tasks (box flipping 90 vs 5; open lid 100 vs 20). ~100 demos/task |
| **Tactile-VLA** (Tsinghua/UESTC/SJTU) [[arXiv:2507.09160](https://arxiv.org/pdf/2507.09160)] **[C]** | Tactile tokens + hybrid position–force control $P = P_{\text{target}} + K\Delta F$ | **Model outputs force targets** | USB insertion **35% vs π₀-base 5%**; charger **90% vs 40%**; fragile-object OOD **90% vs 0%**. Zero-shot language-to-force: "softly" 4.68 N vs "hard" 9.13 N (π₀-base showed **no differentiation**: 6.61 vs 5.69) |
| **ForceVLA** (NeurIPS 2025) [[arXiv:2505.22159](https://arxiv.org/html/2505.22159v1)] **[A]** | 6-axis F/T | Force-aware MoE fusing during action decoding, on π₀ | **+23.2% over π₀ baselines**; 80% on plug insertion |
| **ForceVLA2** (Shanghai AI Lab et al.) [[arXiv:2603.15169](https://arxiv.org/html/2603.15169)] **[C]** | Force as prompt into the VLM expert | Cross-scale MoE, closed-loop hybrid force–position | **66.0% avg vs π₀ 18.0%, π₀.₅ 31.0%, ForceVLA 35.0%** across 5 tasks |
| **Adaptive Compliance Policy** (Stanford + TRI) [[arXiv:2410.09309](https://arxiv.org/html/2410.09309v1)] **[C]** | F/T + kinesthetic teaching at low stiffness | Policy predicts **a stiffness value and a virtual target pose** | ">50% improvement over SOTA visuomotor methods" on item flipping and vase wiping |

The FoAR ablation is the most informative single row in this table. Naively concatenating force into the observation of a strong baseline yields 0.475–0.575 on wiping versus 0.500 for the same baseline without force — **essentially zero benefit**. Gating force on a learned contact predictor yields 0.875. **Force in the observation is only useful if the policy knows when to trust it.**

### 7.5 The null and deflationary results

A responsible review must weight these equally.

**TaCo** — Zorin et al. (2026) [[arXiv:2605.21976](https://arxiv.org/html/2605.21976v1)] **[C]** benchmarked six tactile sensors across four modalities at two institutions on a Franka Panda, training ACT policies on **identical data** with and without tactile. Pick-and-place results: FSR 0.50 → 0.50 (no change); **Daimon 0.95 → 0.80 — tactile actively hurt**; FlexiTac 0.75 → 0.85; eGain 0.50 → 0.75; contact microphone 0.65 → 0.90; eFlesh 0.85 → 0.90. Plug insertion was uniformly positive but low (0.1 → 0.3, 0.2 → 0.7, 0.3 → 0.7). **The benefit of tactile is sensor-dependent and task-dependent, and can be negative.**

**FELT** — Li et al. (USC/Columbia), July 2026 [[arXiv:2607.20683](https://arxiv.org/html/2607.20683v1)] **[C]** found that *hallucinated* tactile signals generated from RGB recover most of the benefit of real tactile: tube insertion 40% (vision-only) / 55% (real tactile) / 50% (generated); cup nesting 25 / 35 / **45**; triangle peg 50 / 70 / **90**. In two of four tasks the generated signal matched or beat the real sensor. **If a vision model can predict the tactile signal, that signal was partly redundant with vision.**

**Gano, George & Barati Farimani** (CMU) [[arXiv:2406.15639](https://arxiv.org/html/2406.15639v4)] **[C]** performed contrastive visuo-tactile pretraining, then **disabled the tactile sensor at inference**, improving USB cable plugging "by up to 65%" with vision-only inference. The value was bankable into the visual encoder; the fragile sensor could be discarded.

The positive counterweight, under matched data: Funk, Chen, Schneider, Chalvatzaki, Calandra & Peters [[arXiv:2504.13618](https://arxiv.org/html/2504.13618v1)] **[C]** used **identical 20 expert demonstrations** across conditions on robotic match lighting and found visuotactile policies improved "by over 40%" over vision-only. And Ablett et al. [[arXiv:2311.01248](https://arxiv.org/html/2311.01248v5)] **[C]** decomposed the contributions across four door-opening tasks: **force matching +62.5%, visuotactile mode switching +30.3%, visuotactile data as policy input +42.5%**.

### 7.6 The three-way confound

That last decomposition exposes a systematic problem with how this literature is read. "Force helps" conflates three distinct interventions:

1. **Force as observation** — concatenate or tokenise $f_t$ into $o_t$. FoAR's ablation shows this alone is worth roughly nothing.
2. **Force as action** — the policy outputs a force or stiffness target executed by a hybrid or impedance controller. Tactile-VLA, ForceMimic, Adaptive Compliance Policy, ForceBand.
3. **Force as relabelling** — the *demonstration data itself* is rewritten so that recorded actions encode the force the demonstrator applied. DexForce, Ablett's "force matching."

The evidence suggests **(3) dominates and (1) is nearly worthless**. DexForce moves from near-zero to 76%; Ablett's force matching (+62.5%) beats tactile-as-input (+42.5%) on the same tasks. This has a direct implication for our question. If the value of a force channel is realised through relabelling the action space, then what a prosthetic or EMG interface needs to supply is **an accurate force estimate at demonstration time** — which is exactly what ForceBand does — and not a control channel.

One further confound deserves flagging. Feng, Zheng, Wang et al. [[arXiv:2602.23408](https://arxiv.org/html/2602.23408v1)] **[C]**, with 500+ trained models and 13,000+ real rollouts, found that **delta actions beat absolute actions 82.9% vs 71.9% averaged**, and chunk-wise delta beats step-wise by ~10 points. Effects of that magnitude can swamp the force contribution. Any force-conditioning ablation that does not control for action parameterisation is confounded, and most do not report it.

---

## 8. Scalability

### 8.1 The arithmetic

Consider a realistic protocol for EMG-teleoperated demonstration collection, using the numbers established in §4:

- **15 minutes** electrode–skin impedance stabilisation before calibration is meaningful (Sousa et al. 2023).
- **15–30 minutes** decoder calibration (ForceBand: 15 min; DexEMG requires per-user calibration; the Nature 2025 personalisation protocol: 20 min).
- **Several minutes** donning, per the HD-EMG in-home study, with a **median of two recalibrations per day**.
- Session length bounded by fatigue. Vogel, Bayer & van der Smagt (2013) observed increased false grasp triggers in the second trial with SMA patients; the Wang et al. (2025) armband study explicitly tested "under fatigue."
- Re-donning introduces **1.16 ± 0.34 cm** of electrode shift, costing 7.6–20% decoder accuracy unless re-calibrated.

Against a leader-follower rig, where setup is switching on two arms, and against UMI, which is deployable in a new environment in about two minutes and yields 111 demonstrations per hour.

**Even under generous assumptions, EMG teleoperation carries an overhead of roughly 30–45 minutes per session before the first useful demonstration, plus intra-session recalibration, plus a fatigue-bounded session length.** For a target corpus of the size that matters — DROID's 350 hours, AgiBot's 2,976 — this is disqualifying. The overhead does not amortise, because it recurs per session and per user, and multi-day collection re-introduces the cross-session distribution shift of §4.5 which converts a single-operator corpus into a robomimic-MH-like mixture.

### 8.2 The lever that changes the arithmetic

Calibration-free cross-user decoding is the only development that could alter this conclusion, and it arrived in 2025. The Nature paper's zero-shot performance across thousands of held-out participants removes per-user calibration from the critical path for *discrete gesture and low-dimensional continuous* control.

Two caveats bound its relevance. It is not robotics — no manipulator, no 6-DoF pose, no contact. And DexEMG, the closest robotics analogue, explicitly reports that it still requires per-user calibration, which suggests the generic-decoder result has not yet transferred to dexterous hand pose at the fidelity retargeting needs.

**Hypothesis H3:** a generic, calibration-free EMG2Force model — the ForceBand pipeline trained at Nature-paper scale — would eliminate the 15-minute calibration and make EMG-as-annotation a genuinely scalable augmentation of egocentric video collection. This is a straightforward, well-motivated engineering programme and nobody has announced it.

### 8.3 Comparative cost model

| Medium | Setup per session | Throughput | Action-space gap | Force/stiffness observable | Scalability verdict |
|---|---|---|---|---|---|
| Leader-follower (GELLO/ALOHA) | ~minutes | Moderate | None | No (unless instrumented) | High |
| VR controller | ~minutes | Moderate | Retargeting | No | High |
| SpaceMouse | ~minutes | 35/hr | Small | No | Moderate |
| Kinesthetic | ~minutes | Fast per demo, physically limited | None | Yes, via joint torque | Low (fatigue) |
| Handheld (UMI) | ~2 min | **111/hr** | **Eliminated by construction** | No | **Very high** |
| Exoskeleton (DEXOP/DexUMI) | ~minutes | > teleop per unit time | **Eliminated** | Yes (tactile) | High |
| Egocentric video | ~none | Unbounded | Severe | No | **Highest** |
| **EMG teleoperation** | **30–45 min + recal.** | Low; fatigue-bounded | Severe (12.2° pose error) | **Yes** | **Low** |
| **EMG as annotation** | **15 min, amortised** | Inherits video throughput | **N/A — labels, not actions** | **Yes** | **High** |

The last two rows are the argument of this review in one place.

---

## 9. Direct Training versus Fine-Tuning

### 9.1 What direct end-to-end IL requires

ACT with ALOHA: **50 demonstrations per task** (100 for the hardest), roughly 10–20 minutes of collection, yielding 80–90% success on six real bimanual tasks. Diffusion Policy: +46.9% average over prior methods across 12 tasks. robomimic PH: 200 trajectories per task for 84–100% on the easier tasks and 71.3% on Transport with BC-RNN.

So direct training is *feasible* at the 50–200 demonstration scale — which an EMG protocol could produce in a few sessions. The question is whether it *should* be, and §3–§5 answer no: at 50 episodes, the Belkhale policy-noise penalty is at its most severe (69.7% vs 48.3%), robomimic shows mixed-quality data underperforming smaller proficient sets, and every EMG artifact in §4 manufactures policy noise.

### 9.2 What fine-tuning requires

| Model | Adaptation budget | Compute | Source |
|---|---|---|---|
| **OpenVLA** | "small datasets with **10–150 demonstrations**" | Full FT: 8×A100 for 5–15 h. **LoRA: 10–15 h on one A100 — 8× reduction, 1.4% of parameters**, 68.2% vs 69.7% full FT | Kim et al., CoRL 2024 [[arXiv:2406.09246](https://arxiv.org/html/2406.09246v3)] **[A]** |
| **π₀** | Post-training **5 h** (simple tasks) to **100+ h** (laundry, mobile manipulation) | — | [[arXiv:2410.24164](https://arxiv.org/html/2410.24164v4)] **[C]** |
| **π₀.₅** | ~400 h across ~100 homes; scaling curve 3→104 locations; **97.6% of phase-1 data is not mobile-manipulator household data** | — | [[arXiv:2504.16054](https://arxiv.org/pdf/2504.16054)] **[C]** |
| **Gemini Robotics On-Device** | "**as few as 50 to 100 demonstrations**" for new tasks | — | DeepMind blog **[D]** |
| **On-Device 2** | "**fewer than 200 examples**" for a **new embodiment**; SO101 6.7% → 53.3%, Dexmate 24.4% → 75.6% | "a few hours of training" | Model card, 30 Jul 2026 **[D]** |
| **GR00T N1** | 100 demos/task in sim benchmarks; on real GR-1, **10% of teleop data reaches 42.6%** vs Diffusion Policy 46.4% on 100% | — | [[arXiv:2503.14734](https://arxiv.org/html/2503.14734v1)] **[B]** |
| **SmolVLA** (450M) | <30k episodes total pretraining; SO-100 real tasks **78.3% with community pretraining vs 51.7% without** | Single GPU; CPU deployment | [[arXiv:2506.01844](https://arxiv.org/html/2506.01844v1)] **[C]** |
| **TRI LBM** | "**less than 30%** of the data needed for training from scratch"; on one real task **15%** sufficed | ~1,700 h pretraining | [[arXiv:2507.05331](https://arxiv.org/html/2507.05331v1)] **[A]** |

Note carefully: **LoRA changes the compute story by 8× but there is no published evidence that it changes the *data* requirement.** It matches full fine-tuning at the same demonstration count; it does not reduce that count.

### 9.3 The verdict, and the reason

**Fine-tuning, and specifically fine-tuning with action-space extension.**

The argument is not primarily about dataset size, though size settles it: no realistic EMG protocol produces anything near the ≥1,000-hour scale that pretraining requires, while 50–200 demonstrations is comfortably within one or two sessions.

The argument is about **what the data contributes at the margin**. Adding EMG-teleoperated trajectories to a corpus as *more samples of the same action space* is a losing proposition — the samples are noisier, slower and more inconsistent than what a leader-follower rig produces, and §3.2–§3.3 tell us that mixing them in degrades rather than improves. This is the robomimic MH condition and it costs 30 points on Transport.

Adding them as a **new action dimension** is a different proposition entirely. ForceBand's $a_t \in \mathbb{R}^{11}$ contains a force channel that *no other data source in the corpus provides*. Tactile-VLA and ForceVLA2 demonstrate what happens when a π₀-class model gains a force output: 5% → 35% on USB insertion, 18.0% → 66.0% average across five contact tasks. The marginal value of the data is high precisely because it is not substitutable.

This also resolves an apparent contradiction with §5.3's finding that modality mixing helps (+20% for kinesthetic plus VR). Modality heterogeneity helps when the modalities contribute **orthogonal quality dimensions**. EMG-as-pose contributes a strictly worse version of a dimension already covered — pure downside. EMG-as-force contributes a dimension nothing else covers — pure upside, modulo label noise.

### 9.4 Curation is not optional

Whatever the integration path, the curation literature makes a strong claim: on mixed-quality human data, *removing* demonstrations improves policies.

- **CUPID** (Agia, Sinha et al., CoRL 2025) [[arXiv:2506.19121](https://arxiv.org/abs/2506.19121)] **[A]**: influence functions estimating each demonstration's causal effect on closed-loop return. "Training with **less than 33%** of curated data can yield state-of-the-art diffusion policies on RoboMimic." Hardware: Figure-8 ~60% → ~85%, TuckBox ~40% → ~80%, Bookshelf ~45% → ~70%, with 50–66% of demos removed. **Also: intrinsic quality heuristics actively degraded performance on two of three tasks** — a caution that smoothness-based filtering is not universally safe.
- **DemInf** (Hejna et al., RSS 2025) [[arXiv:2502.08623](https://arxiv.org/abs/2502.08623)] **[A]**: score trajectories by contribution to $I(S;A) = H(A) - H(A|S)$, which simultaneously rewards diversity and penalises conditional action entropy. 5–10% improvement on RoboMimic at a 50% filter.
- **Demo-SCORE** (Chen, Lessing, Liu & Finn, RSS 2025) [[arXiv:2503.03707](https://arxiv.org/abs/2503.03707)] **[A]**: **15–35 absolute points** higher success across five real ALOHA tasks by filtering with a rollout-trained classifier.
- **RINSE** (2026) **[C]**: +16% on Transport with one-sixth of the data via spectral arc length.
- **Re-Mix** (Hejna et al. 2024) [[arXiv:2408.14037](https://arxiv.org/html/2408.14037v1)] **[C]**: group DRO over dataset mixtures — **38%** over uniform weighting, competitive using only 25% of the original data.

For EMG-sourced data specifically, this suggests a mandatory pipeline stage: **filter by SPARC or by influence before mixing into any training set**, and report what fraction survived. Given §4's artifact catalogue, the surviving fraction is itself a useful measurement of medium quality — and it would be the first quantitative comparison of EMG-collected data against conventionally-collected data on the axis that matters.
---

## 10. Synthesis: Four Architectures, Three Viable

### 10.1 Architecture A — EMG as force annotation for human-video demonstrations

**Viable now. Highest expected value.**

The human demonstrates with their own hand at full biological bandwidth; a wearable band supplies a force label the camera cannot see; the label enters the learned policy as an extra action dimension executed by a force-tracking controller.

**Why it works.** Latency is irrelevant because there is no control loop (§4.2 nullified). Electrode shift and session drift degrade *label* quality, and label noise is far more benign than state-correlated action noise (§4.8 nullified). The 15-minute calibration amortises across hours of collection (§8.1 nullified). And the contribution — a force channel — is exactly the intervention the force-conditioning literature identifies as most valuable, namely relabelling the action space (§7.6).

**Evidence:** ForceBand, 87% pick–squeeze–place, 0/10 for binary-gripper baselines, forces spanning 3.2–19.3 N. One paper, unrefereed, four subjects, ten hours.

**Open risks.** Scaling to a generic decoder is unproven for force (as opposed to gesture and pose). The 18% MAE gain from anatomy-aware electrode placement implies sensitivity to donning that a consumer band may not survive. And FELT's result — that hallucinated tactile from RGB recovers most of real tactile's benefit — raises the possibility that a sufficiently large vision model learns to predict grip force anyway, making the band redundant. That is a genuine threat to the whole architecture and should be tested directly.

### 10.2 Architecture B — EMG as a stiffness channel for compliant manipulation

**Viable, narrow, and with an unexamined baseline.**

The tele-impedance evidence is real: 83.3% versus 60.0% success on drilling; peak contact force halved under one second of delay; operator EMG effort reduced to 0.57 of bilateral control. Co-contraction is genuinely unobservable to pose sensors, so the information is real.

**The problem is the baseline.** Every result compares against *constant* impedance. The covariance-based alternative ($K \propto \Sigma^{-1}$, Calinon 2010; minimal-intervention control) extracts a stiffness profile from demonstration variability at zero hardware cost, and no head-to-head exists. Worse for this architecture, Stiffness Copilot achieves tele-impedance's objective from **wrist-camera RGB alone**, with better NASA-TLX than either constant-stiffness condition, and it comes out of a lab that also builds sEMG wristbands — which is a signal about where they think the value is.

**Verdict:** worth pursuing only *after* H2 (§7.2) is run. If covariance-derived or vision-derived stiffness recovers most of the benefit, this architecture has no reason to exist.

### 10.3 Architecture C — EMG as a latent-action interface for assistive robots

**Viable, but it is a different objective.**

Here the goal is not to produce training data; it is to give a person with impaired motor function control of a robot. The relevant results are excellent.

Yang, Hodgson, Sun, Erickson & Weber (CMU) [[arXiv:2602.02773](https://arxiv.org/html/2602.02773)] **[C]** deployed 128 electrodes per arm in a spandex sleeve on a Hello Robot Stretch 3 with two users with cervical spinal cord injury. Gesture classification 90.9 ± 5.3% (left, 5 gestures) and 98.0 ± 2.0% (right, 3 gestures); online false positives 0.1–0.5%. **Multi-room energy-drink task: 738 s pure teleoperation → 517 ± 62 s with auto-alignment and room mode, a 30.0% time reduction.** Learning trend −33 s/day teleoperation versus −55 s/day with autonomy; teleoperation variability 2.3× higher.

The theoretical case is stronger still. Losey, Jeon, Li, Srinivasan, Mandlekar, Garg, Bohg & Sadigh, *Autonomous Robots* 2021 [[PDF](https://collab.me.vt.edu/pdfs/losey_auro2021.pdf)] **[A]** frame the problem exactly right: "users are challenged by an inherent mismatch between low-dimensional interfaces and high-dimensional robots." Their learned latent action space, trained on **at most twenty minutes of kinesthetic demonstrations**, achieved 88% success (44/50) against a HARMONIC High Assist baseline, with faster completion (*t*(158)=2.95, *p*<.05), reduced joystick input magnitude (*t*(158)=2.49, *p*<.05) and shorter trajectories (*t*(158)=9.39, *p*<.001). Jeon, Losey & Sadigh (RSS 2020) showed latent actions and shared autonomy are complementary rather than substitutes in a 2×2 design.

The BCI literature confirms the principle at even lower input bandwidth. Downey et al. (2016), *J. NeuroEng. Rehabil.* [[link](https://jneuroengrehab.biomedcentral.com/articles/10.1186/s12984-016-0134-9)] **[A]**: ARAT success **78% shared versus 22% BMI-only** (*p*<0.001) for one participant with tetraplegia, **46% versus 0%** for another; path length 2.44 m versus 5.00 m. Lee, Lee, Mishra et al. (2025), *Nature Machine Intelligence* [[link](https://www.nature.com/articles/s42256-025-01090-y)] **[A]** report a **3.9× higher target hit rate** with an AI copilot, and a participant with spinal cord injury completing a pick-and-place task they "could not do without" it.

And in prosthetics, the George lab's *Nature Communications* 2025 result [[link](https://www.nature.com/articles/s41467-025-65965-9)] **[A]** is the best-quantified cognitive benefit of autonomy anywhere in this literature: fragile-object transfer **89 ± 10% versus 59 ± 23%** (*p*<0.01); holding time for amputees **51.56 ± 45.0 s versus 7.81 ± 12.33 s** (*p*<0.01, a 6.6× improvement); and **detection-response task latency 0.62 ± 0.38 s versus 0.74 ± 0.41 s, *p*<0.001 — a 24% reduction in cognitive load.**

**The gap:** nobody has combined a low-bandwidth biosignal with a *learned latent action space* on top of a *pretrained VLA*. Losey and Sadigh built latent actions from 20 minutes of kinesthetic data on a single robot. Yang and Weber put HD-EMG on a mobile manipulator with discrete gesture modes. No one has put an EMG decoder on π₀'s or GR00T's latent space. Given that On-Device 2 adapts to new embodiments with fewer than 200 examples, and that a foundation policy supplies exactly the low-dimensional, semantically meaningful action abstraction that a noisy biosignal needs, this looks like the most under-explored opportunity in the entire survey.

### 10.4 Architecture D — EMG as the primary pose channel for scaled data collection

**Not viable, and the evidence is unambiguous.**

Best-case cross-user hand-pose decoding is 12.2° mean joint error (emg2pose held-out users), against 3.5° rotational error for UMI's SLAM and effectively zero for leader-follower encoders. Add a ~50 ms physiological delay against a 100–125 ms total budget; 7.6–20% accuracy loss per 2 cm of electrode shift with 1.16 cm re-introduced at every donning; a 3.8% → 18% error increase under limb-position change, in a domain that *is* limb-position change; 10–12 points of cross-session degradation converting a single-operator corpus into a mixed-operator one; and 30–45 minutes of per-session overhead against UMI's two minutes and 111 demonstrations per hour.

The M4Bench numbers are the empirical confirmation: 26% slower, 58× the error rate, 2.8× the workload, against baselines that are themselves substantially worse than a leader-follower rig.

And the theory says the resulting data is worse than its task-level metrics suggest, because closed-loop operator compensation (Hwang et al. 2017) converts decoder error into action inconsistency rather than task failure — hiding the damage from teleoperation metrics while preserving it in exactly the quantity that behaviour cloning is sensitive to.

The exoskeleton community has already voted. DEXOP, DexUMI, DexEXO, ACE, AnyTeleop, Open-TeleVision, HOMIE and TWIST2 place hardware directly over the forearm and **none of them records EMG**, because mechanical encoding is more accurate, needs no calibration and does not drift. That unanimity across eight independent systems is the most economical summary of this section.

---

## 11. Research Agenda

Ordered by expected value per unit of effort. Several are cheap.

**H1 — The missing measurement (cheap, high value).** Collect matched demonstrations of the same task from the same operators via (a) leader-follower, (b) EMG-teleoperation, (c) kinesthetic teaching. Report SPARC, LDLJ, Belkhale action variance and state similarity for each. Then train identical ACT and diffusion policies on each and report success. *Prediction:* the EMG policy gap will exceed the teleoperation-level success gap, because operator compensation masks decoder error at the task level. **Nobody has ever trained a visuomotor policy on EMG-collected demonstrations and compared it to a conventional control.**

**H2 — The decisive stiffness experiment (cheap, decisive).** Compare EMG-derived stiffness, covariance-derived stiffness ($K \propto \Sigma^{-1}$) from the *same* demonstrations, and vision-derived stiffness (Stiffness Copilot-style) on identical contact-rich tasks with identical data budgets. *Prediction:* covariance recovers most of EMG's benefit at zero hardware cost. If so, Architecture B is dead. If not, it is the field's most important result of 2027.

**H3 — Generic EMG2Force at scale.** Train the ForceBand pipeline at Nature-2025 scale (thousands of participants) and test zero-shot force regression on held-out users. *Prediction:* achievable, since force regression is a lower-dimensional target than 22-DoF hand pose. This would remove the last per-user calibration from Architecture A.

**H4 — The redundancy test for Architecture A.** Apply the FELT protocol to grip force: train a model to predict fingertip force from RGB alone, and compare a policy conditioned on predicted force against one conditioned on EMG-derived force under matched data. *Prediction:* vision recovers a substantial fraction. This is the strongest threat to Architecture A and should be run before large-scale collection begins.

**H5 — Biosignal-driven latent actions on a foundation policy.** Take π₀-class or GR00T-class latent action representations and drive them with an sEMG decoder for an assistive manipulator. Compare against discrete gesture mode-switching (Yang et al.) and against learned latent actions from kinesthetic data (Losey et al.). *Prediction:* the combination outperforms both, because the foundation model supplies precisely the low-dimensional abstraction the noisy channel needs. **Nobody has done this.**

**H6 — Release the corpus.** Either ForceBand's promised release or an equivalent should ship: synchronised vision, robot action logs, and biosignal provenance, with failures included and licence stated. Absent this, every claim in §7 remains single-source.

**H7 — Report smoothness in EMG teleoperation papers.** Every EMG-teleoperation paper we surveyed reports task success, completion time and NASA-TLX; **none reports SPARC, jerk or action variance.** Adding three lines of analysis to existing datasets would immediately populate the comparison this review could not make.

**H8 — Control for action parameterisation.** Given that delta versus absolute actions is worth 11 points on average and chunk-wise versus step-wise another 10, any force- or biosignal-conditioning ablation that does not fix and report the action parameterisation is confounded. This should become a reporting norm.

**H9 — Amputee-inclusive evaluation.** Ninapro DB3, DB7, DB8 and DB10 include amputee participants; the HD-EMG mobile-manipulation study included two users with SCI; the George lab study included four transradial amputees. Most EMG-robotics work uses able-bodied participants exclusively — including, explicitly, the *npj Robotics* HD-EMG study. Since the strongest use case for this technology is assistive, this is both an ethical and a validity problem.

**H10 — Cross-session protocol standardisation.** Adopt a mandatory 15-minute impedance stabilisation period, report donning shift, report per-session decoder accuracy, and treat multi-day collection as multi-operator data for analysis purposes. Without this, any EMG corpus is a mixed-quality dataset by construction and should be curated accordingly.

**H11 — Failure data.** Almost no manipulation dataset contains labelled failures; RoboMIND's 5,000 are a conspicuous exception. EMG interfaces fail in characteristic, diagnosable ways (misclassification, false triggers, drift), which makes them an unusually good source of *labelled* failure modes for training reward models and uncertainty estimators. This is a genuinely novel argument for collecting EMG data that has nothing to do with its use as a control channel.

---

## 12. Threats to Validity

**Single-source dependence.** Architecture A's entire empirical case rests on one unrefereed preprint with four subjects and ten hours of data. Every quantitative claim about EMG-as-annotation should be read as provisional until replicated.

**Preprint density.** A substantial fraction of the 2026 literature cited here — ForceBand, DexEMG, ForceVLA2, ManipForce, TaCo, FELT, RINSE, Stiffness Copilot, the HD-EMG in-home study — is unrefereed. Self-reported baseline comparisons in this genre are systematically optimistic.

**Inaccessible primaries.** We could not obtain the 2012 tele-impedance paper's numbers, several electrode-shift primaries (cited second-hand through Tanaka 2025), Hahne et al.'s per-method regression $R^2$ values, or the Zhuang et al. *Nature Machine Intelligence* participant counts. The optimal-window-length result of Smith, Hargrove, Lock & Kuiken (2011) is commonly quoted as 150–250 ms; **we could not verify it and do not cite the number.**

**Heterogeneity precludes meta-analysis.** The corpus spans different robots, tasks, metrics, participant populations and policy architectures. No pooled effect size is defensible. This is itself a finding: the field has no shared protocol, which is why §11's cheap experiments have not been run.

**Corrections to widely-repeated claims.** Three premises we tested did not survive. **Manus Robotics does not use electromyography** — its wearable uses optics-based muscle activity sensing, and we found no evidence for a product named "Hemyo." The **March 2026 MIT wristband** that controls a robotic hand is **ultrasound, not EMG** (Lu, Chen, Li et al., tracking 22 DoF across 8 volunteers) — genuinely relevant as a *non-EMG* biosignal alternative but frequently miscited. And **Faye Wu and Asada's supernumerary-finger work is glove-based**, using a ShapeHand fibre-optic data glove with PLS regression (first two principal components capturing ~82% variance, >80% of predictions within ±10°); the actual EMG supernumerary-finger work is Hussain, Spagnoletti, Salvietti & Prattichizzo (2016), *Frontiers in Neurorobotics* 10:18, from Siena.

**Publication bias toward positive results.** TaCo and FELT are unusual in reporting null or deflationary findings. Their existence suggests the positive-result literature (§7.4) is somewhat inflated, and readers should weight the FoAR ablation — where naive force concatenation delivered essentially nothing — accordingly.

---

## 13. Conclusions

**RQ1 (medium quality).** EMG-sourced action logs are measurably inferior to those from every conventional interface on every dimension the imitation-learning literature identifies as mattering. The single direct comparison found 26% slower completion, a 58× error rate, and 2.8× workload, against baselines that themselves underperform leader-follower rigs by roughly 30 points.

**RQ2 (artifact propagation).** The propagation chain is well characterised and every link is damaging: ~50 ms of irreducible electromechanical delay against a 100–125 ms budget; 7.6–20% accuracy loss per 2 cm of electrode shift with 1.16 cm re-introduced at each donning; a 4.7× error increase under limb-position change; 10–12 points of cross-session degradation. The most under-appreciated mechanism is that closed-loop operator compensation converts decoder error into *action inconsistency* rather than task failure, which hides the damage from teleoperation metrics while preserving it exactly where behaviour cloning is most sensitive.

**RQ3 (dataset availability).** The target class is empty. Two 2026 efforts converged on it and neither released a corpus. The closest released artifacts are MeganePro/Ninapro DB10 (EMG + scene video + gaze, 15 amputees, no robot) and RH20T (vision + actions + 6-DoF force, no biosignal).

**RQ4 (performance impact).** No study has trained a visuomotor policy on EMG-collected demonstrations and compared it against a conventional control. What *is* established: EMG-derived stiffness improves contact-rich teleoperation over constant impedance by 5–23 points and halves peak contact force under delay; EMG-derived *force labels* on human video enable an 11-dimensional action space that reaches 87% on pick–squeeze–place where binary-gripper baselines score zero. But the stiffness comparison has never been run against the free alternatives — demonstration covariance or vision — and a 2026 result achieves the same objective from wrist-camera RGB alone.

**RQ5 (scalability and integration).** Collection through EMG teleoperation is not scalable: 30–45 minutes of per-session overhead, fatigue-bounded sessions, and multi-day drift that converts single-operator corpora into mixed-quality ones. EMG as *annotation* inherits egocentric video's throughput and is scalable. The integration point is fine-tuning, not pretraining — modern policies adapt with 50–200 examples — and specifically fine-tuning that **extends the action space** rather than adding samples to an existing one.

### The one-paragraph version

EMG's information advantage is real and unique: it is the only cheap wearable channel that observes grip force and co-contraction, and co-contraction is invisible to every pose sensor by construction. Its bandwidth disadvantage is equally real and is not closing at the rate that would matter — 12.2° cross-user hand-pose error is two orders of magnitude worse than a leader-follower encoder. The productive move, therefore, is to use EMG where its information advantage applies and its bandwidth disadvantage does not: **out of the control loop, as an offline annotator of force on demonstrations collected by faster means, feeding a force-extended action space in a pretrained policy's post-training set.** Exactly one paper does this, it is four months old and unrefereed, and the two cheapest experiments that would validate or kill the idea — a matched-budget comparison against covariance-derived stiffness, and a FELT-style test of whether vision predicts grip force anyway — have not been run.

---

## Appendix A — Evidence Summary Table

| Claim | Value | Source | Grade |
|---|---|---|---|
| Electromechanical delay (voluntary) | 49.73 ± 6.99 ms | Begovic et al. 2014, *Front. Physiol.* | A |
| Optimal myoelectric controller delay | 100 ms (fast) / 125 ms (slow) | Farrell & Weir 2007, *IEEE TNSRE* | A |
| Electrode shift, 2 cm | −7.6% to −20% | Tanaka et al. 2025, *Sensors* (consolidating) | A/B |
| Re-donning shift magnitude | 1.16 ± 0.34 cm | Hwang et al. 2017, *PLOS ONE* | A |
| Limb-position effect | 3.8% → 18% error | Fougner et al. 2011, *IEEE TNSRE* | A |
| Cross-session degradation | ~10–12 pp | Rehman et al. 2018, *Sensors* | A |
| Skin impedance stabilisation | ~15 min | Sousa et al. 2023, *Sensors* | A |
| Cross-user hand-pose error (best) | 12.2° | emg2pose, NeurIPS 2024 | A |
| Generic sEMG, no calibration | >90% held-out-user; 11,236 participants | Kaifosh et al. 2025, *Nature* 645 | A |
| EMG vs conventional interfaces | 26% slower, 58× error, 2.8× TLX | M4Bench 2025, *Front. Robot. AI* | A |
| Tele-impedance vs constant stiffness | 83.3% vs 78.3% / 60.0% | Fani et al. 2018, *IEEE RAM* | A |
| Tele-impedance under 1 s delay | 12.33 N vs 24.31 N peak force | Laghi et al. 2020, *IJRR* | A |
| Vision-derived stiffness (no EMG) | 0.87 vs 0.76 / 0.24 success; TLX 38.7 vs 49.3 / 52.4 | Stiffness Copilot 2026 | C |
| EMG force annotation → policy | 87% pick–squeeze–place; 0/10 baseline squeeze | ForceBand 2026 | C |
| Force relabelling of actions | near-zero → 76% | DexForce, RA-L | A |
| Force as raw observation | 0.475–0.575 vs 0.500 baseline (≈ nil) | FoAR, RA-L | A |
| Gated force fusion | 0.875 vs 0.500 | FoAR, RA-L | A |
| Tactile can hurt | 0.95 → 0.80 (Daimon, pick-and-place) | TaCo 2026 | C |
| Hallucinated tactile ≈ real | 45% vs 35% (cup nesting) | FELT 2026 | C |
| VLA new-task adaptation | 10–150 demos | OpenVLA, CoRL 2024 | A |
| LoRA vs full fine-tune | 68.2% vs 69.7%; 1.4% params; 8× compute | OpenVLA, CoRL 2024 | A |
| VLA new-embodiment adaptation | <200 examples | Gemini Robotics On-Device 2 | D |
| Curation with influence functions | SOTA at <33% of data | CUPID, CoRL 2025 | A |
| Curation with smoothness (SPARC) | +16% at 1/6 data | RINSE 2026 | C |
| Mixed-operator penalty | 72% → 42% (Transport) | robomimic, CoRL 2021 | A |
| Policy noise at low data | 69.7% vs 48.3% (50 eps) | Belkhale et al., NeurIPS 2023 | A |
| Prosthesis as data-collection hand | 79.3% over 450 trials | HannesImitation 2025 | C |
| Shared autonomy, HD-EMG, in home | 738 s → 517 ± 62 s (−30.0%) | Yang et al. 2026 | C |
| Shared autonomy cognitive load | 0.62 s vs 0.74 s DRT (−24%) | George lab, *Nat. Commun.* 2025 | A |

## Appendix B — What Could Not Be Verified

- Quantitative results from Ajoudani, Tsagarakis & Bicchi (2012), *IJRR* — paywalled; **do not cite 2012 numbers**.
- Smith, Hargrove, Lock & Kuiken (2011) optimal window length — commonly quoted as 150–250 ms, **unverified**.
- Young et al., Gao et al. and Côté-Allard et al. electrode-shift figures — cited second-hand via Tanaka 2025.
- Hahne et al. (2014) per-method regression $R^2$ values.
- Zhuang et al. (2019), *Nat. Mach. Intell.* — participant counts and success percentages paywalled.
- ForceBand dataset — announced, not released; subject count (4) from limitations section.
- DexEMG — no data release, no control rate, no latency reported.
- Open X-Embodiment force/torque fraction — **no defensible number exists; do not cite a percentage**.
- ABB × PSYONIC collaboration — press release only, no hours, demos or benchmark.
- Gemini Robotics On-Device 2 "<200 examples" — model card only, no technical report.
- "Manus Robotics Hemyo" — **no evidence this product exists**; Manus uses optics-based, not electromyographic, sensing.

## Appendix C — Reading Path

**If you read five things:** ForceBand [[2606.26093](https://arxiv.org/html/2606.26093v1)] for the reframing; Belkhale, Cui & Sadigh [[2306.02437](https://arxiv.org/abs/2306.02437)] for the quality formalism; Farrell & Weir 2007 for the latency ceiling; the Kaifosh *Nature* 2025 paper for what generic sEMG decoding can now do; and FoAR [[2411.15753](https://arxiv.org/html/2411.15753v1)] for the ablation showing force-as-observation is worth nothing without gating.

**If you read ten:** add robomimic [[2108.03298](https://arxiv.org/abs/2108.03298)], Laghi et al. 2020 *IJRR* for tele-impedance numbers, Stiffness Copilot [[2603.14068](https://arxiv.org/html/2603.14068v1)] for the vision-based alternative, TaCo [[2605.21976](https://arxiv.org/html/2605.21976v1)] for the null results, and CUPID [[2506.19121](https://arxiv.org/abs/2506.19121)] for curation.

**If you are building something:** start from ForceBand's pipeline, run H4 first to check that vision does not already predict grip force, then H2 before committing to any stiffness channel.
