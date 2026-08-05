# Embodied Intelligence in 2026

### A Field Textbook on Robotics and Manipulation Research at Stanford and MIT, and on the Companies Betting the Physical World Is Next

**Compiled August 2026**

---

## How to Read This Book

This is a reference text, not a narrative. It is built to be read in three ways.

**As a map.** Chapters 2 and 3 are directories of the Stanford and MIT robotics landscape — every significant lab, what it believes, what it has built, and where it is weak. Chapters 4 through 6 do the same for companies. If you want to know who works on tactile sensing, or who is betting on simulation, the directories answer that.

**As an argument.** Chapters 8 through 13 are analytical. They take the positions catalogued in the directories and set them against each other: how much robot data actually exists, which of the five collection strategies is winning, whether one policy can control many bodies, whether the humanoid form factor is engineering or theatre, and what the economics look like once you strip out the demo videos.

**As a bibliography.** Almost every claim is linked. Where a claim could not be verified, it is marked. There is a lot of confidently-stated nonsense circulating about this field; the flags are the most useful part of the book.

### Epistemic status and method

Research was conducted in August 2026 across lab websites, arXiv, company engineering blogs, funding announcements, and trade press, then a separate verification pass re-checked thirty of the most load-bearing claims against primary sources. Where the verifier disagreed with the research, the disagreement is recorded in the text rather than smoothed over.

Three standing caveats:

1. **Company-stated numbers are not audited numbers.** "99% success," "100 million actions," "1,000 hours per day" are marketing claims until a third party reproduces them. Only one company in this book — Unitree — has published audited financials.
2. **Valuations move faster than facts.** Several 2026 rounds were reported but not confirmed by the company. These are marked *reported*.
3. **Lab websites rot.** Several MIT and Stanford groups have public pages years out of date while publishing actively, and vice versa. Where publication records and web presence conflict, the publication record was preferred.

### A note on what "robotics" means here

This book covers **manipulation and humanoid/general-purpose embodied AI**. It deliberately includes adjacent fields — tactile sensing, biomechanics, prosthetics, world models, simulation — because the interesting arguments of 2026 happen at those boundaries. It deliberately excludes autonomous vehicles, drones-as-drones, and surgical robotics except where they bear on the general-purpose question.

---

## Table of Contents

**Part I — Orientation**
- Chapter 1: The State of the Field in One Page, a Timeline, and a Glossary

**Part II — The Academic Landscape**
- Chapter 2: Stanford University (16 entries)
- Chapter 3: Massachusetts Institute of Technology (26 entries)

**Part III — Industry**
- Chapter 4: Humanoid Manufacturers (16 entries)
- Chapter 5: Robot Foundation Models and "Brains" (16 entries)
- Chapter 6: Applied Manipulation and Deployed Robotics (12 entries)

**Part IV — Infrastructure**
- Chapter 7: The Robot Data Supply Chain (6 sections)

**Part V — Analysis**
- Chapter 8: The Data Bottleneck
- Chapter 9: The Five Data-Collection Strategies, Compared
- Chapter 10: The Embodiment Question
- Chapter 11: Nine Competing Theses, Taxonomised
- Chapter 12: Economics and Reality Check
- Chapter 13: Open Problems, 2026–2030

**Appendices**
- A: Comparison tables
- B: Fifty papers to read, in order
- C: Verification log — what could not be confirmed
- D: Glossary

---

# Chapter 1 — The State of the Field in One Page

Robotics in 2026 is in the middle of a bet that has not yet paid off and has not yet failed.

The bet is that the recipe that worked for language — a single large model, pretrained on a very large and diverse corpus, then adapted cheaply to specific tasks — will work for physical action. The models are called **VLAs** (vision-language-action models). The corpus is the problem: there is no internet of robot behaviour, and there is no obvious way to make one.

Everything else follows from that. The academic labs have split into those trying to manufacture the corpus (Stanford's IRIS and REAL, MIT's Improbable AI, Toyota Research Institute), those arguing the corpus is the wrong idea and structure should replace scale (MIT's LIS group, the RAI Institute, most of the control-theory establishment), and those building the sensors and mechanisms everyone else will eventually need (GelSight, BDML, CHARM, the Movement Lab). The companies have split into those selling bodies (Figure, Unitree, Agility, UBTech), those selling brains (Physical Intelligence, Skild, Generalist, Google DeepMind), those selling the picks and shovels (NVIDIA, Hugging Face, the data-labelling industry), and those quietly selling actual working robots into actual warehouses (Dexterity, Ambi, Path, Chef, RightHand).

**Four numbers frame the whole field.**

- **~3,000 hours.** The size of the largest purpose-built real-robot manipulation dataset in existence, [AgiBot World](https://arxiv.org/html/2503.06669v2) — 1,001,552 trajectories, 2,976.4 hours, collected by 100+ robots in a purpose-built 4,000 m² facility.
- **~100,000 years.** Ken Goldberg's estimate, in [*Science Robotics*, August 2025](https://docs.google.com/document/d/e/2PACX-1vTc9dKld9Qol0v01n4ilJk3T9a-D4f1I26V1DbWNZKjPbgYRTOYY4xxNrc7yFqcJFMVQ0phJyDQflwT/pub), of the human-equivalent time represented by the text and image corpora used to train frontier VLMs. The ratio between these first two numbers is the entire problem.
- **1,250 hours.** The runtime of the most-cited real humanoid deployment in the West — [Figure 02 at BMW Spartanburg](https://www.figure.ai/news/production-at-bmw) — over eleven months, loading 90,000+ parts at one station. That is roughly seven months of one human's working time.
- **73.6%.** The share of Unitree's humanoid revenue that came from **research and education** buyers in the first nine months of 2025, per its [IPO prospectus](https://www.therobotreport.com/unitree-ipo-shows-a-real-hardware-business-the-humanoid-case-is-still-early/). The only company with audited humanoid revenue is mostly selling to people who study robots, not people who use them.

Hold those four numbers in mind and most of the rest of this book is commentary.

## 1.1 A compressed timeline, 2022–2026

| Date | Event | Why it mattered |
|---|---|---|
| Dec 2022 | Google RT-1 | First serious "transformer for robot actions" at scale |
| Mar 2023 | RSS: Diffusion Policy (Chi, Song, Tedrake et al.) | Generative modelling of action sequences becomes the default architecture |
| Jul 2023 | RT-2 | A VLM fine-tuned to emit actions — the VLA template |
| Jul 2023 | ALOHA (Zhao, Finn) | A <$20k bimanual teleop rig; democratises data collection |
| Oct 2023 | [Open X-Embodiment](https://robotics-transformer-x.github.io/) | 21 institutions pool 1M+ trajectories, 22 embodiments; positive cross-embodiment transfer demonstrated |
| Jan 2024 | Mobile ALOHA | Adds a mobile base; the viral moment for low-cost imitation |
| Feb 2024 | UMI (Chi, Song et al.) | Handheld gripper decouples data collection from robot ownership |
| Aug 2024 | Amazon hires Covariant's founders | The first "reverse acquihire" in robot foundation models |
| Oct 2024 | Physical Intelligence π0 | The first credible "one policy, many robots" commercial model |
| Nov 2024 | Stanford Robotics Center opens | Academic robotics gets a shared physical plant |
| Mar 2025 | NVIDIA Isaac GR00T N1 | An open humanoid foundation model; NVIDIA positions as the platform |
| Mar 2025 | Gemini Robotics | DeepMind folds robotics into its frontier model line |
| Apr 2025 | π0.5 | Open-world generalisation to unseen homes; diminishing returns above ~100 homes |
| Jul 2025 | TRI's [Large Behavior Models paper](https://arxiv.org/html/2507.05331v1) | The field's first rigorous, blind, statistically-controlled evaluation — and a sobering one |
| Aug 2025 | Goldberg's "100,000 Year Data Gap" | The scaling-skeptic case gets its canonical citation |
| Sep 2025 | Figure Series C, $39B | Peak valuation for a pre-revenue humanoid company |
| Sep 2025 | Brooks: "Why Today's Humanoids Won't Learn Dexterity" | The tactile-first critique gets its canonical citation |
| Nov 2025 | π*0.6 + RECAP; Generalist GEN-0 | RL-from-experience, and the first published embodied scaling-law claim |
| Jan 2026 | Skild AI, $1.4B at $14B+ | The "omni-bodied" thesis gets funded at scale |
| Feb 2026 | Intrinsic absorbed into Google | Alphabet consolidates physical AI |
| Mar 2026 | Unitree STAR Market IPO filing | First audited humanoid P&L |
| Apr 2026 | π0.7; Generalist GEN-1 | Compositional generalisation claims; 500k hours of *human wearable* pretraining with zero robot data |
| Jun 2026 | Agility SPAC ($2.5B); Neura Series C (up to $1.4B); Sanctuary pivots hardware-agnostic | Late-cycle financing signals |
| Jul 2026 | Walden Robotics launches (Tedrake, $1.1B); Gemini Robotics 2; [FCC adds mobile robots >2kg to the Covered List](https://spectrum.ieee.org/fcc-covered-list-mobile-robots) | Geopolitics arrives |

## 1.2 The stack, from silicon to task

Understanding any lab or company in this book means locating it on this stack. Almost nobody spans more than three layers well.

1. **Actuators and transmissions** — 40–60% of humanoid bill-of-materials cost per McKinsey. Quasi-direct-drive, harmonic reducers, tendon drives. *Sangbae Kim's lab, Steve Collins' lab, LG Axium, Hyundai Mobis, Unitree.*
2. **Hands and end effectors** — parallel jaws, suction, multi-fingered, tendon-driven. *1X (25-DOF), Apptronik SharpaWave (22-DOF), Sanctuary hydraulics, RightHand hybrids.*
3. **Sensing** — cameras, depth, proprioception, and the missing modality, touch. *GelSight/Adelson, Kennedy's DenseTact, Meta Digit 360, Amazon Vulcan.*
4. **Low-level control** — whole-body control, MPC, operational-space formulation, balance at 1 kHz. *Khatib, Boston Dynamics, Biomimetic Robotics, Figure's S0.*
5. **Policy** — the learned visuomotor layer. Diffusion policies, flow matching, action chunking. *Tedrake/TRI, Song, Finn, Physical Intelligence.*
6. **Reasoning and task planning** — VLMs, embodied reasoning, TAMP. *Gemini Robotics ER, Figure's S2, MIT LIS, Jiajun Wu.*
7. **Data and evaluation** — collection interfaces, datasets, simulators, benchmarks. *Everyone claims this layer; almost nobody has solved it.*

## 1.3 Glossary of terms used throughout

- **VLA** — Vision-Language-Action model. A network mapping images plus a language instruction to robot actions.
- **Action chunking** — predicting a short sequence of future actions rather than one step, which reduces compounding error. Introduced at scale by ACT (ALOHA).
- **Diffusion policy** — modelling the action distribution with a denoising diffusion or flow-matching process; now the default for multimodal manipulation behaviour.
- **Cross-embodiment** — training one model on data from multiple different robot bodies.
- **Embodiment gap** — the mismatch between the body that generated data (a human, another robot) and the body executing it.
- **Sim-to-real gap** — the divergence between simulated and real physics, worst for contact, friction, and deformables.
- **Teleoperation** — a human directly driving the robot, usually the source of demonstration data.
- **Perioperation** — Improbable AI's term for collecting data with a passive exoskeleton mechanically coupled to the robot's hand, so a human's demonstration is already in the robot's action space.
- **Data flywheel** — the claim that deployed robots generate the data that improves the next model, which improves deployment.
- **BOM** — bill of materials; the hardware cost of a robot.
- **RaaS** — robots-as-a-service; renting the robot per month rather than selling it.
- **MTBF** — mean time between failures. The number almost nobody in humanoid robotics reports.
- **Whole-body control / loco-manipulation** — coordinating locomotion and manipulation as one problem rather than two.
---

# Chapter 2 — Stanford University

## 2.0 How Stanford robotics is organised

There is no "Stanford Robotics Department." Robotics is federated across the [Stanford AI Lab](https://ai.stanford.edu/) (directed by Carlos Guestrin since 2025, succeeding Christopher Manning), the CS department, Mechanical Engineering, Aeronautics & Astronautics, EE, and Bioengineering. The [Stanford CS robotics roster](https://www.cs.stanford.edu/people/faculty-research-focus/robotics) lists thirteen faculty; the hardware and controls groups sit outside CS entirely.

The integrating layer, since November 2024, is the [Stanford Robotics Center](https://src.stanford.edu/), directed by Oussama Khatib, occupying a converted basement of the Packard Electrical Engineering Building. Stanford News reported [more than 30 faculty across nine departments](https://news.stanford.edu/stories/2024/11/new-center-unites-stanfords-robotics-expertise-under-one-roof) at opening; later Center materials cite 45 faculty across ~18 labs, with an executive committee of Cutkosky, Okamura, Pavone, Sadigh and Wu. *(Verification note: the Center's own site does not currently state an opening date or name a director; the November 2024 date and Khatib's directorship come from Stanford News and Stanford HAI announcements.)*

Stanford's distinctive contribution to the 2023–2026 period is not a single model. It is **hardware and interfaces that made data collection cheap enough for everyone else**: ALOHA, Mobile ALOHA, UMI, DexUMI, TidyBot++, ToddlerBot, TWIST2. Every one of these was built by graduate students on small budgets and then copied globally. The counterpart weakness is equally clear: the people who built them now largely work at Physical Intelligence, Sunday Robotics, and Google DeepMind.

---

## 2.1 Stanford Vision and Learning Lab (SVL) — Fei-Fei Li & Jiajun Wu

[SVL](https://svl.stanford.edu/) is co-directed by **Fei-Fei Li** (also co-director of Stanford HAI, and since 2024 CEO of World Labs, which has drawn much of her attention toward "spatial intelligence") and **Jiajun Wu**, with Ruohan Zhang as a research lead. The thesis is that embodied intelligence should be measured against *what people actually want robots to do* — so build the benchmark and the data engine first, and let the models follow.

The flagship is [BEHAVIOR-1K](https://behavior.stanford.edu/): 1,000 household activities derived from surveys of what people want automated, across 50 interactive scenes and 10,000+ objects, running on **OmniGibson**, an Isaac Sim-based simulator that models fluids, cloth, heat and transparency. Around it: the [BEHAVIOR Robot Suite](https://behavior-robot-suite.github.io/) (CoRL 2025), which introduced the **JoyLo** whole-body teleoperation interface on a Galaxea R1 wheeled bimanual robot; [ReKep](https://arxiv.org/abs/2409.01652) (CoRL 2024), which has a VLM generate relational keypoint constraints that a solver then optimises; and the [2026 BEHAVIOR Challenge](https://behavior.stanford.edu/challenge/index.html) — 100 full-length household tasks, ~20,000 teleoperated demonstrations totalling 1,950 hours, with π0.5 and GR00T N1.7 as baselines and an October 2026 deadline.

**Data stance:** sim-first, teleop-heavy. Scale demonstrations inside a high-fidelity simulator, then transfer.

**Why promising:** it is the only effort anywhere attacking multi-minute, multi-room, state-change household tasks with a shared scoreboard and partial-credit scoring (BDDL goal predicates). Nearly every other benchmark measures single-shot tabletop skills.

**Skeptic's view:** OmniGibson success may simply not predict real-world success; 1,950 hours of *simulated* teleoperation is small next to industry real-robot fleets; and fluids, cloth and contact are precisely the physics simulators get most wrong.

---

## 2.2 IPRL — Interactive Perception and Robot Learning (Jeannette Bohg)

[IPRL](https://iprl.stanford.edu/) argues that manipulation competence comes from *interactive* perception: the robot must act in order to perceive, and force and contact signals are first-class citizens rather than an afterthought to vision.

Recent work is unusually varied in data source. **Masquerade** (ICRA 2026) learns from in-the-wild human video by *editing the video* so the human's arms look like robot arms, closing the visual embodiment gap at the pixel level. **HoMeR** (ICRA 2026, with Sadigh) does in-the-wild mobile manipulation via hybrid imitation plus whole-body control. **DexForce** (2025) extracts force-informed actions from kinesthetic demonstrations. *Crossing the Human–Robot Embodiment Gap with Sim-to-Real RL Using One Human Demonstration* (CoRL 2025, with Karen Liu) does what the title says. **SimToolReal** (RSS 2026) targets zero-shot dexterous tool use. And **TidyBot++** gave the community a widely-copied low-cost holonomic mobile manipulator.

**Data stance:** the most pluralist lab at Stanford. Human video, kinesthetic teaching, teleoperation and sim-to-real RL are treated as substitutable sources, with *data editing* used to bridge between them cheaply.

**Why promising:** human video is the only genuinely abundant manipulation data, and Bohg's group has the most credible recipes for actually using it.

**Skeptic's view:** video-editing and retargeting tricks discard exactly the contact forces this lab argues are essential. Each paper's pipeline is bespoke; there is no single scaling law on offer.

---

## 2.3 ILIAD — Intelligent and Interactive Autonomous Systems (Dorsa Sadigh)

[ILIAD](https://iliad.stanford.edu/) treats robots as agents inside a loop with humans — so learn from preferences, corrections, language and interaction, and treat **data curation as a first-class algorithmic problem** rather than a data-engineering chore. Sadigh has a long-running affiliation with Google DeepMind's robotics effort and was on partial leave through 2025–2027.

She was a principal driver of [Open X-Embodiment / RT-X](https://arxiv.org/abs/2310.08864), the 22-embodiment consortium dataset that remains the field's canonical cross-embodiment corpus. Her group's more distinctive line is about *which* data to collect and keep: **RoboCrowd** (ICRA 2025) and **RoboCade** (ICRA 2026) crowdsource and gamify teleoperation so non-experts will produce demonstrations; *Robot Data Curation with Mutual Information Estimators* (RSS 2025) argues explicitly that more data is not automatically better; *A Taxonomy for Evaluating Generalist Robot Manipulation Policies* (RA-L 2026) attacks the evaluation problem; **Robot-Powered Data Flywheels** (2026, with Bohg) closes the loop.

**Data stance:** real teleoperation at scale, but *curated* — the interesting question is which demonstrations earn their place.

**Why promising:** cross-embodiment pooling is the closest robotics has come to an ImageNet moment, and curation is the obvious next lever once raw collection saturates.

**Skeptic's view:** Open X-Embodiment is a heterogeneous union of many small datasets, and RT-X's gains were modest and largely in-distribution. Crowdsourced teleoperation may buy quantity at the cost of the precision that contact-rich tasks require.

---

## 2.4 IRIS — Chelsea Finn

**A common error worth correcting:** IRIS ("Intelligence through Robotic Interaction at Scale") is [Chelsea Finn's](https://ai.stanford.edu/~cbfinn/) group. REAL (Robotics and Embodied AI Lab) is Shuran Song's. They are frequently conflated.

Finn's position is that generalist robot policies come from scaling imitation learning on cheap, open hardware — and she has done more than anyone to make that hardware exist. [ALOHA](https://tonyzhaozh.github.io/aloha/) (RSS 2023) introduced both a sub-$20k bimanual teleoperation rig and **ACT** (Action Chunking with Transformers); [Mobile ALOHA](https://mobile-aloha.github.io/) (2024) added a wheeled base at ~$32k and became the field's default low-cost platform. Her group co-produced **OpenVLA** and **Octo**, two of the most-used open VLAs, and **DROID**, the standardised in-the-wild manipulation dataset. [RoboReward](https://arxiv.org/abs/2601.00675) (January 2026, with Levine and Pertsch) builds general-purpose VLM reward models plus a benchmark, attacking the problem of how you score a robot's behaviour without a human watching.

Finn co-founded Physical Intelligence in 2024, which is where much of this agenda now runs at scale.

**Data stance:** real-world first; minimise the cost per hour of collection rather than substituting simulation.

**Why promising:** the ALOHA lineage demonstrably transfers — the recipes work in other people's labs, which is rare.

**Skeptic's view:** the frontier has migrated to startups. The academic lab increasingly does hardware and benchmarks whose payoff is captured elsewhere, and imitation-only policies remain brittle outside their demonstration distribution.

---

## 2.5 REAL — Robotics and Embodied AI Lab (Shuran Song)

[Shuran Song](https://shurans.github.io/) came to Stanford EE from Columbia (2023; Stanford's own profile confirms the move but not the year). Her thesis: manipulation intelligence comes from **scalable, cheap, embodiment-agnostic data collection** plus expressive generative policies. Build the interface, not just the algorithm.

The defining artifact is the [Universal Manipulation Interface (UMI)](https://arxiv.org/abs/2402.10329) (RSS 2024): a 3D-printable handheld parallel-jaw gripper with a wrist-mounted GoPro that lets anyone collect in-the-wild demonstrations without owning a robot, calibration-free, deployable in a new environment in about two minutes. The family has since grown: **UMI on Legs** (CoRL 2024), **DexUMI** (CoRL 2025, Best Paper Finalist) extending the interface to multi-fingered hands via a wearable exoskeleton with robot-hand video inpainting, [UMI-on-Air](https://umi-on-air.github.io/) (ICRA 2026) for aerial embodiments, and **UMI-Underwater**. Alongside: **ToddlerBot** (CoRL 2025), a ~$6k open-source 3D-printed humanoid; **Adaptive Compliance Policy** (ICRA 2025); **DexMachina** (ICML 2026). Diffusion Policy itself (Chi, Song, Tedrake et al., RSS 2023) originated in her Columbia group and is arguably the single most influential architecture in modern manipulation.

**Data stance:** relentlessly low-cost and open. Consumer cameras, printed parts, everything on [GitHub](https://github.com/real-stanford).

**Why promising:** UMI decoupled data collection from robot ownership, which is the field's biggest structural bottleneck, and it has been replicated worldwide.

**Skeptic's view:** UMI data has no force or proprioceptive channel and suffers camera-pose drift; "in-the-wild" collection still requires disciplined operators; and the scaling laws for this data class remain unproven.

---

## 2.6 The Movement Lab — C. Karen Liu

[The Movement Lab](https://tml.stanford.edu/) holds that physics-based character animation and humanoid robotics are the same problem, and that simulation of contact-rich human movement is the bridge between them. In a [March 2026 Stanford interview](https://news.stanford.edu/stories/2026/03/research-matters-karen-liu) Liu framed the goal as a pretrained humanoid foundation model roughly as capable as a ten-year-old, and defended academia's distinct role: "Industry tends to quickly converge on a recipe that works, and then scale up as fast as possible."

The lab's most consequential recent output is **TWIST** (CoRL 2025) and **TWIST2** (ICRA 2026), a teleoperated whole-body humanoid imitation system that became a portable, mocap-free data-collection rig — VR headset plus a $250 two-degree-of-freedom robot neck, claiming 100 demonstrations in fifteen minutes. Around it: *Hand-Eye Autonomous Delivery* (CoRL 2025) fusing humanoid navigation, locomotion and reaching; *Learning to Ball* (SIGGRAPH Asia 2025) composing long-horizon basketball policies; *Human-Object Interaction from Human-Level Instructions* (ICCV 2025); *PGC: Physics-Based Gaussian Cloth* (CVPR 2025); and *Learning Humanoid Navigation from Human Data* (RA-L 2026, with Monroe Kennedy).

**Data stance:** human motion capture and video, retargeted onto humanoids, trained in simulation, augmented with whole-body teleoperation.

**Why promising:** nobody has better priors on the physics of human contact, and whole-body humanoid data collection is the field's newest bottleneck.

**Skeptic's view:** retargeting human motion onto a humanoid with different mass distribution and actuator bandwidth is lossy in ways nobody has quantified, and graphics-quality motion is not the same thing as reliable task completion.

---

## 2.7 Jiajun Wu's group — neuro-symbolic and physical scene understanding

[Jiajun Wu](https://jiajunwu.com/) runs the strongest intellectual counterargument to pure VLA scaling at Stanford. His position: intelligence requires the *right level of abstraction* — programs, symbols, object intrinsics — not end-to-end pixels.

The programmatic statement is [Building Intelligent Agents with Neuro-Symbolic Concepts](https://www.jiajunwu.com/papers/nsconcept_cacm.pdf) (with Jiayuan Mao and Josh Tenenbaum, CACM 2026). Around it: **The Scene Language** (CVPR 2025), representing scenes as programs plus words plus embeddings; *What Makes a Maze Look Like a Maze?* (ICLR 2025); **FluidNexus** and *Birth and Death of a Rose* (CVPR 2025) on 4D and fluid physical modelling; **DexSkin** (CoRL 2025), a conformable robot skin for contact-rich manipulation; **TWIST** (with Karen Liu); and a *Science Robotics* 2025 review of learning-based dynamics models for manipulation.

**Data stance:** mostly simulation and vision; robot work via collaboration.

**Why promising:** compositional, program-based representations are interpretable and editable in ways monolithic policies are not, and if VLA scaling stalls this is the most developed alternative.

**Skeptic's view:** neuro-symbolic approaches have repeatedly lost to scale, and much of the output is graphics-adjacent — it is not always clear how it reaches a robot's control loop.

---

## 2.8 Autonomous Systems Lab — Marco Pavone

[ASL](https://stanfordasl.github.io/) argues that autonomy is only useful if it is *provably* safe, and pairs learned components with reachability analysis, conformal prediction and runtime monitoring. Pavone is simultaneously Senior Director of AI Research at NVIDIA, which shapes the lab's output toward autonomous vehicles and simulation.

The manipulation-relevant work is about auditing learned policies rather than building them: **CUPID: Curating Data your Robot Loves with Influence Functions** (CoRL 2025) identifies which training demonstrations actually help; **RoboMonkey** (CoRL 2025) scales test-time sampling and verification for VLAs; *Real-Time Out-of-Distribution Failure Prevention via Multi-Modal Reasoning* (CoRL 2025) detects when a policy has left its competence; *Unpacking Failure Modes of Generative Policies* does the diagnostic work. With Cutkosky's lab, ASL co-authored **ReachBot** — *Locomotion as manipulation with ReachBot*, [Science Robotics 2024](https://www.science.org/doi/10.1126/scirobotics.adi9762).

**Data stance:** simulation and formal analysis over collection. Data is something to be audited, not merely accumulated.

**Why promising:** as VLAs enter cars and spacecraft, runtime out-of-distribution detection and test-time verification become the binding constraint. This is the strongest group anywhere on that.

**Skeptic's view:** conformal and reachability guarantees rest on exchangeability and model assumptions that real deployments violate. The safety layer risks becoming a conservative wrapper that caps capability rather than a genuine correctness proof.

---

## 2.9 Multi-Robot Systems Lab — Mac Schwager

[MSL](https://msl.stanford.edu/) bets that if you give robots a differentiable, photorealistic, uncertainty-aware map — specifically 3D Gaussian Splatting — then mapping, planning, simulation and semantics collapse into one representation.

**Splat-Nav** (IEEE T-RO 2025) does safe real-time navigation directly inside a Gaussian Splatting map; a companion paper adds a control barrier function for online splat maps (ICRA 2025, with Kennedy). [HAMMER](https://arxiv.org/abs/2501.14147) extends this to heterogeneous multi-robot semantic splatting. **GRaD-Nav** and **GRaD-Nav++** (2025) fly drones through Gaussian radiance fields with differentiable dynamics. **VISTA** (RA-L 2026) does open-vocabulary task-relevant exploration; **SINGER** (ICRA 2026) runs an onboard generalist vision-language navigation policy; **Phys2Real** (ICRA 2026, with Jiajun Wu) fuses VLM priors with online system identification; and *π, But Make It Fly* (2026) transfers VLA models to aerial manipulation.

**Data stance:** build the map online from the robot's own sensors, then simulate inside the reconstruction rather than in a hand-authored scene.

**Why promising:** real-to-sim-to-real via splatting is one of the few genuinely new capabilities of the last two years, and it applies directly to the evaluation problem.

**Skeptic's view:** Gaussian Splatting is a *view-synthesis* representation, not a geometric or physical one. Free-space and collision guarantees derived from it inherit every reconstruction artifact, and it degrades badly under motion blur, dynamic scenes and sparse coverage.

---

## 2.10 CHARM Lab — Allison Okamura

The [Collaborative Haptics and Robotics in Medicine lab](https://charm.stanford.edu/) works on the claim that touch is underexploited in both directions: robots need it to act safely in contact with people, and people need it to teleoperate robots well.

Research spans haptics for teleoperation and VR; wearable haptic interfaces using skin stretch and vibrotactile feedback; steerable needles for percutaneous intervention; human motor performance in robot-assisted surgery; rehabilitation robotics; and **soft growing "vine" robots** that move by tip eversion rather than locomotion. Recent output includes [a hermetic transparent vine robot for pipe inspection](https://arxiv.org/html/2510.27010v1) deployed in a live wastewater pipe (RoboSoft 2026), self-fastening anchors for auto-wearable robots, a miniaturised pneumatic actuator array for deep-pressure tactile stimulation (Haptics Symposium 2026), and **phloSAR**, a portable pneumatic supply that untethers soft robots.

**Data stance:** human-subjects psychophysics and controlled user studies. The measured quantity is human perception and performance, not policy success rate.

**Why promising:** teleoperation is how almost all robot manipulation data is currently collected, so improvements to the human interface improve everyone else's dataset. Vine robots are also genuinely cheap — polyethylene tubing — and reach places no rigid robot can.

**Skeptic's view:** the field's flagship claim, that force feedback reliably improves surgical outcomes, has been contested for two decades, and wearable haptic devices have repeatedly failed to leave the lab.

---

## 2.11 Biomimetics and Dexterous Manipulation Lab — Mark Cutkosky

[BDML](https://bdml.stanford.edu/) copies the *mechanism*, not the appearance: controlled dry adhesion, tuned compliance and passive dynamics let simple hardware achieve what complex control cannot.

The most consequential line is gecko-inspired dry adhesives — *Gentle Grasping With Gecko-Inspired Adhesives in Extreme Environments* (IEEE Transactions on Field Robotics 2025) and a gecko-adhesive lasso for de-tumbling orbital debris (iSpaRo 2025), building on the Astrobee gripper flown on the ISS. **ReachBot**, the extending-boom limbed robot for Martian lava tubes, appeared in [Science Robotics 2024](https://www.science.org/doi/10.1126/scirobotics.adi9762) under the framing "locomotion as manipulation." Other lines: long-reach robotic manipulation for lunar assembly (iSpaRo 2025 best paper), tactile-informed action primitives for clutter (ICRA 2024, with Bohg), multi-modal jumping/flying/perching robots, and MRI-compatible force-sensing surgical tools.

**Data stance:** essentially none. This is a mechanism-design and physical-modelling lab; learning enters only through collaborations.

**Why promising:** adhesion and long-reach manipulation solve space and extreme-environment problems that no amount of data solves, and space robotics is a real, funded market.

**Skeptic's view:** gecko adhesives have been "two years from deployment" since roughly 2008, and performance collapses on dusty, rough or regolith-covered surfaces — precisely the lunar and Martian case.

---

## 2.12 Stanford Robotics Lab — Oussama Khatib

[Khatib's lab](https://khatib.stanford.edu/) is the intellectual origin of much of what humanoid companies run underneath their learned policies. The **operational space formulation** — unified task and posture control with contact and force at the centre — dates to his early Stanford work and remains the standard substrate for whole-body control.

The flagship system is [**OceanOneK**](https://khatib.stanford.edu/ocean-one-k.html), a bimanual underwater humanoid with stereo vision, underactuated four-fingered hands and bilateral haptic feedback, rated to 1,000 m. Its 2022 Mediterranean campaign reached the submarine *Le Protée* at 124 m, a Roman wreck near Aléria at 334 m, the *Francesco Crispi* at 507 m, and a record 852 m seafloor touch — the deepest a humanoid has reached. Other lines: multi-contact force control, torque-transformer control of position-controlled arms, and the [**SAI 2.0 / OpenSai**](https://github.com/manips-sai-org/OpenSai) open-source simulation and control stack now being pushed through the Robotics Center.

**Data stance:** model-based and essentially anti-data. Dynamics and control theory, with the human supplying intent via haptic teleoperation.

**Why promising:** haptic telepresence for deep-sea archaeology is a genuinely deployed capability, and operational-space control is load-bearing infrastructure for the entire humanoid industry.

**Skeptic's view:** the lab's peer-reviewed output has thinned markedly since about 2022, and OceanOneK is teleoperated — impressive engineering that sidesteps the autonomy question the rest of the field is fighting over.

---

## 2.13 ARM Lab — Monroe Kennedy III

The [Assistive Robotics and Manipulation Lab](https://arm.stanford.edu/) argues that a robot working alongside or on behalf of a person needs three things: high-resolution touch, an explicit model of the human partner, and interfaces usable by non-experts.

Its signature hardware is the **DenseTact** optical tactile sensor family, extended by **TensorTouch** (IEEE T-RO, April 2026), which calibrates tactile sensors to recover full high-resolution stress tensors, and **DOT-Sim** (ICRA 2026, with Rika Antonova and Leo Guibas), a differentiable optical tactile simulator for real-to-sim calibration. Around it: **Next Best Sense** (ICRA 2025) guiding 3D Gaussian Splatting with touch; **Splat-MOVER** (CoRL 2024); **DexFruit** (RA-L 2025) for gentle fruit handling; **ProACT** (IEEE TNSRE 2025), an AR testbed for intelligent prosthetic arms; *Towards Accessible Robot Control* (2026) comparing kinesthetic and mixed-reality teleoperation; and *Sparse Autoencoders Reveal Interpretable and Steerable Features in VLA Models* (2026, with Schwager) — an early attempt to apply LLM interpretability tooling to robot policies.

**Data stance:** real-robot multimodal data with a tight sim-calibration loop. Build the sensor, then make the simulator match it.

**Why promising:** touch is the most obvious missing modality in current VLAs, and Kennedy is one of very few people building both the sensor and its differentiable simulator.

**Skeptic's view:** optical tactile sensors remain fragile, low-bandwidth and hard to manufacture consistently, and nobody has yet shown that adding touch produces a step change in generalist policy performance rather than a task-specific gain.

---

## 2.14 Biomechatronics and Neuromuscular Biomechanics — Steve Collins and Scott Delp

Two Stanford labs supply the human-side physics that humanoid robotics increasingly borrows.

**[Steve Collins' Biomechatronics Lab](https://biomechatronics.stanford.edu/)** holds that you cannot design assistive devices analytically because you cannot model the human — so optimise the human–robot system empirically, per person, in the loop. The methodological capstone is *On human-in-the-loop optimization of human–robot interaction* (Slade et al., **Nature** 633:779–788, 2024). The most robotics-transferable artifact is *Elastic energy-recycling actuators for efficient robots* (Krimsky & Collins, **Science Robotics** 2024) — because energy, not policy, is the binding constraint on legged robots. Also: a twisted-string ankle exoskeleton for running (2025), and improved CMA-ES for noisy robot optimisation (2026).

**[Scott Delp's Neuromuscular Biomechanics Lab](https://nmbl.stanford.edu/)** maintains **OpenSim**, the field-standard open musculoskeletal simulation stack, and through the Mobilize Center produces large mobility datasets. Recent: the **AddBiomechanics** dataset of physics-consistent human motion; markerless motion capture enhancement (*IEEE TBME* 2025); and **GaitDynamics**, a generative foundation model for walking and running (*Nature Biomedical Engineering* 2026).

**Why they matter here:** OpenSim skeletons are the reference for musculoskeletal RL and for retargeting human motion onto humanoids, and AddBiomechanics/GaitDynamics supply physically consistent human motion priors — exactly what whole-body humanoid controllers need.

**Skeptic's view:** neither lab targets robots. Muscle-level models are far too slow and over-parameterised for real-time humanoid control, and human-in-the-loop optimisation takes hours per subject, which has kept exoskeletons commercially marginal for a decade.

---

## 2.15 Soft robotics and mechanisms — Zhao Lab and SHAPE Lab

**[Renee Zhao's lab](https://zhaolab.stanford.edu/)** builds magnetically actuated origami millirobots. The headline result is the **milli-spinner thrombectomy** device ([*Nature* 642:336–342, June 2025](https://www.nature.com/articles/s41586-025-09049-0)) — a spinning millirobot that compacts a blood clot rather than grabbing it, reported at substantially higher recanalisation rates than aspiration. Follow-ons include a magnetic milli-spinner for robotic endovascular surgery (*Advanced Materials* 2026), RodOri elastic-rod origami (*Science Advances* 2026), and an amphibious electromagnetic soft robot (2025).

**[Sean Follmer's SHAPE Lab](https://shape.stanford.edu/)** works on shape-changing interfaces, haptics and accessibility — the human-interface end of the same problem CHARM attacks.

**Why they matter here:** they are the clearest reminder that "robotics" is not coextensive with "robot learning." A device that dissolves a clot at scale will save more lives than any household manipulation policy of this decade.

**Skeptic's view:** these are materials and mechanism results with essentially no learning content. They scale poorly into the VLA-dominated agenda, and clinical translation is years away.

---

## 2.16 Stanford's industry gravity: HAI, the Digital Economy Lab, and the spin-out pipeline

**Stanford HAI** runs the field's most useful policy and measurement layer: a [robotics topic hub](https://hai.stanford.edu/topics/robotics), the annual [AI Index](https://hai.stanford.edu/ai-index/2026-ai-index-report) with a robotics chapter, and work like **QuantiPhy** (January 2026), a benchmark showing frontier models fail at basic physical estimates of size, speed and distance — a real embodied-foundation-model contribution.

**Erik Brynjolfsson's [Digital Economy Lab](https://digitaleconomy.stanford.edu/research/)** supplies the only causal numbers on physical automation coming out of Stanford. [Minimum Wages and Rise of the Robots](https://digitaleconomy.stanford.edu/publication/minimum-wages-and-rise-of-the-robots/) (February 2026) uses plant-level robot import data and Census records from 1992–2021 with state-border discontinuities, finding a 10% minimum-wage increase raises robot adoption roughly 8% relative to the mean. The caveat is important: this is about *industrial arms*, not general-purpose manipulators.

**The spin-out pipeline** is the dominant fact about Stanford robotics in 2026. Physical Intelligence (Finn, with Hausman and Levine). Sunday Robotics (Tony Zhao of ALOHA, with Cheng Chi of UMI and Diffusion Policy). World Labs (Fei-Fei Li). Deep ties into Google DeepMind (Sadigh, Open X-Embodiment, Gen2Act, RT-Affordance) and NVIDIA (Pavone; Cosmos Policy at ICLR 2026). Industry affiliates at the Robotics Center include Google, Autodesk, Intuitive Surgical and Foxconn.

**Skeptic's view:** the ties are now tight enough that Stanford increasingly validates industry agendas rather than setting independent ones, and there has been no marquee robot-learning faculty hire since Song in 2023. The best student hardware becomes a startup within eighteen months, and the open version stops being maintained.

---

## 2.17 Deep dive: what Stanford actually contributed, 2023–2026

Strip out the press releases and Stanford's contribution to this period is unusually legible. It is **three interfaces and one benchmark**.

**ALOHA** proved that a bimanual teleoperation rig costing less than a used car, paired with action chunking, could learn contact-rich bimanual tasks from fifty demonstrations. Before ALOHA, credible manipulation research required a six-figure hardware budget. After it, a dozen labs and half a dozen startups were running the same recipe within a year. Mobile ALOHA extended this to whole-body mobile manipulation and produced the field's first genuinely viral robot video.

**UMI** went further by removing the robot from the data-collection loop entirely. A 3D-printed handheld gripper and a GoPro produce demonstrations at [111 per hour versus 35 for SpaceMouse teleoperation](https://umi-gripper.github.io/) — about 48% of bare-hand speed — that transfer zero-shot to UR5e and Franka arms. DexUMI extended the same logic to multi-fingered hands with a wearable exoskeleton and video inpainting to close the visual gap. The conceptual move is important and underrated: rather than making robots easier to drive, make human demonstrations *already be* in the robot's action space.

**TWIST2** applied the same trick to whole-body humanoid data — mocap-free, VR-based, a $250 robot neck, a claimed hundred demonstrations in fifteen minutes. If humanoids matter, whole-body data collection is the next bottleneck and this is the cheapest known answer.

**BEHAVIOR** is the benchmark. Its bet is that the field's evaluation crisis (Chapter 13) is best solved by making the tasks long, realistic and partially creditable, in a simulator good enough to model cloth and fluids. Whether simulation rankings predict real rankings remains open — but BEHAVIOR is the only effort seriously trying to find out at household scale.

What Stanford did *not* produce in this period is a frontier model. π0 came out of Physical Intelligence, Gemini Robotics out of DeepMind, GR00T out of NVIDIA. The university's comparative advantage turned out to be the layer beneath the models — the hardware, the interfaces, the benchmarks, and the people. Whether that is a healthy division of labour or a slow hollowing-out is the argument running through the rest of this book.
---

# Chapter 3 — Massachusetts Institute of Technology

## 3.0 How MIT robotics is organised

MIT's robotics is spread across CSAIL, Mechanical Engineering, AeroAstro, the Media Lab, LIDS and BCS, with no single centre. The nearest thing to an umbrella is a loose federation of three structures: the [CSAIL Embodied Intelligence Community of Research](https://www.csail.mit.edu/research/embodied-intelligence-community-research), which notably publishes neither a faculty lead list nor a budget; the [Embodied Intelligence Seminar Series](https://calendar.csail.mit.edu/seminar_series/12750); and the [MIT Quest / Siegel Family Embodied Intelligence mission](https://sqi.mit.edu/research/missions/embodied-intelligence), whose named leads are an unusual robotics-plus-cognitive-neuroscience pairing: Leslie Kaelbling, Tomás Lozano-Pérez, Nicholas Roy, Joshua Tenenbaum, Nancy Kanwisher and James DiCarlo. The public-facing event is the annual [CSAIL Embodied Intelligence Summit](https://cap.csail.mit.edu/members/events/mit-csail-embodied-intelligence-summit), whose second edition in October 2025 was held in Palo Alto and hosted by a venture firm — which tells you where the money and agenda sit.

Two structural facts dominate MIT robotics in 2026, and a textbook should state both plainly.

**First, MIT is the intellectual home of the anti-scaling position.** At the [ICRA 2025 data-versus-models debate](https://www.therobotreport.com/mit-roboticists-debate-the-future-of-robotics-data-and-computing/), Leslie Kaelbling argued that "data can show us patterns, but models give us understanding," while Daniela Rus took the data-first side. That debate is not a curiosity; it is the field's central disagreement, and MIT hosts both poles of it more sharply than anywhere else.

**Second, MIT has been losing robotics people to industry faster than it replaces them.** Alberto Rodriguez left for Boston Dynamics and MCube is closing. Sangbae Kim is on leave. Russ Tedrake is simultaneously an MIT professor, TRI's robotics head, and now CEO of Walden Robotics. Julie Shah runs a department. The [2025–26 Schwarzman College of Computing faculty cohort](https://computing.mit.edu/faculty/new-incoming-faculty/new-faculty-2025-2026/) contains no robotics or embodied-AI hires at all. The most consequential recent appointment, Kaiming He (2024), is a vision researcher who also works part-time at Google DeepMind.

---

## 3.1 Robot Locomotion Group — Russ Tedrake

[Tedrake's group](https://locomotion.csail.mit.edu/) is the only lab in this book running a serious formal-methods programme and an industrial-scale behaviour-cloning programme simultaneously. He is Toyota Professor at MIT, [SVP for Large Behavior Models at TRI](https://www.tri.global/about-us/dr-russ-tedrake), and since July 2026 CEO of **Walden Robotics**, a TRI spinout that launched at a [$1.1B valuation with $300M raised](https://spectrum.ieee.org/humanoid-robots-walden-robotics-toyota), co-led by Toyota and Deviation Capital, building wheeled-base humanoids.

Two research lines. The **learning** line runs from [Diffusion Policy](https://journals.sagepub.com/doi/full/10.1177/02783649241273668) (RSS 2023; IJRR 2025) through the Large Behavior Models programme to the [Boston Dynamics × TRI Atlas demonstration](https://www.tri.global/news/ai-powered-robot-boston-dynamics-and-toyota-research-institute-takes-key-step-towards-general) (August 2025), plus careful empirical work on [sim-and-real co-training of diffusion policies](https://arxiv.org/abs/2503.22634). The **rigour** line is Graphs of Convex Sets: *Shortest Paths in Graphs of Convex Sets* (SIAM J. Optimization 2024) and non-Euclidean motion planning with geodesically convex sets (IJRR 2025), plus the [Drake](https://drake.mit.edu/) toolbox and the *Underactuated Robotics* course as public infrastructure.

**Data stance:** unapologetically teleoperation-first — large human demonstration fleets, with simulation as a supplement.

**Why promising:** Tedrake's group publishes negative and ambiguous results, which almost nobody else in this field does.

**Skeptic's view:** the LBM results depend on TRI's teleoperation fleet and are effectively unreproducible in academia; and the elegant convex-optimisation work still demonstrates mostly on planning benchmarks rather than contact-rich autonomy in the wild.

---

## 3.2 Improbable AI Lab — Pulkit Agrawal

[Agrawal's lab](https://people.csail.mit.edu/pulkitag/) holds that dexterity is a **force** problem, not a position problem, and that the route there is massive simulation plus automatic environment and reward shaping — with better hands and wrists to make the physics learnable at all. The framing is summarised in a [December 2025 CSAIL spotlight on force-centric manipulation](https://cap.csail.mit.edu/engage/spotlights/pulkit-agrawal-0).

Recent work attacks both ends of the stack. [DexWrist](https://arxiv.org/abs/2507.01008) (2025) is a compliant wrist for constrained and dynamic manipulation. [DEXOP](https://arxiv.org/abs/2509.04441) (2025, with Ted Adelson) is a *passive* hand exoskeleton that mechanically couples a human's fingers to a robot hand's kinematics while capturing full-hand tactile data — "perioperation," and one of the most important data-collection ideas of the last two years. Alongside: *Bridging the Sim-to-Real Gap for Athletic Loco-Manipulation* (RSS 2025), *Robot Learning with Super-Linear Scaling* (RSS 2025), **DexHub and DART** (ICRA 2025), *Vegetable Peeling* (ICRA 2025, with TRI), and the position paper *Automatic Environment Shaping is the Next Frontier in RL* (ICML 2024 oral).

*(Correction worth flagging: DrEureka is a UPenn/NVIDIA paper, not an Improbable AI product. The MIT analogue is the automatic-environment-shaping and reward-selection line.)*

**Why promising:** it attacks sensors, mechanisms *and* algorithms rather than only policy architectures — and DEXOP may be the cheapest route to a tactile-rich manipulation corpus.

**Skeptic's view:** results remain largely per-task RL with heavy shaping; "super-linear scaling" rests on curated task suites; and no Improbable AI policy yet runs unattended in an uninstrumented home.

---

## 3.3 Learning and Intelligent Systems — Leslie Pack Kaelbling & Tomás Lozano-Pérez

[LIS](https://lis.csail.mit.edu/) is the field's most articulate anti-scaling group. Its thesis: general-purpose robots need *abstraction* — hierarchical, hybrid discrete-continuous task and motion planning (TAMP), with learning supplying the samplers, predicates and skill parameters rather than the whole policy.

The 2025–26 work is a genuinely new development in an old programme, because VLMs turn out to solve TAMP's historic bottleneck — where do the symbols come from? *From Pixels to Predicates: Learning Symbolic World Models via Pretrained VLMs* (RA-L 2026) and *Open-World TAMP via VLM-Generated Constraints* (RA-L 2026) have a foundation model invent the predicates and constraints that a planner then reasons over. Around them: **TiPToP**, a modular open-vocabulary planning system (2026); *Differentiable GPU-Parallelized TAMP* (RSS 2025); *Streaming Flow Policy* (CoRL 2025, with Nicholas Roy); *Practice Makes Perfect: Planning to Learn Skill Parameter Policies* (RSS 2024, with the Boston Dynamics AI Institute); and *Trust the PRoC3S* (CoRL 2024).

**Data stance:** explicitly anti-scaling; heavy use of simulation; evidence is more often simulated than physical.

**Why promising:** VLM-generated predicates are a real answer to the symbol-grounding problem that stalled TAMP for thirty years, and TAMP remains the only framework with principled guarantees on long-horizon tasks.

**Skeptic's view:** demonstrations stay close to tabletop and blocks-world domains; invented predicates inherit VLM hallucination; and the group's real-robot footage is thin relative to its paper output. It is also worth noting that Gemini Robotics' "think before acting" is arguably TAMP re-implemented in natural language — which either vindicates the programme or makes it redundant.

---

## 3.4 Distributed Robotics Lab — Daniela Rus

[Rus](https://www.csail.mit.edu/person/daniela-rus), CSAIL's director, holds that intelligence should be distributed across body and controller — soft and modular morphology plus compact continuous-time networks, rather than large monolithic policies.

The standout recent result is [*Controlling diverse robots by inferring Jacobian fields with deep networks*](https://news.mit.edu/2025/vision-based-system-teaches-machines-understand-their-bodies-0724) (**Nature**, June 2025, with Vincent Sitzmann and Sizhe Lester Li): robots learn to control themselves from monocular video alone, with no kinematic model. In January 2026 came a neural blueprint for soft-robot control using "structural" and "plastic" synapses (*Science Advances*, with NUS), holding above 92% shape accuracy under 50% actuator failure. Also: **RoboGrocery** (RoboSoft 2024), tactile soft grippers packing groceries; AI-designed underwater gliders (ICRA 2025, with Matusik); and GPU convex-set computation (2025, with Tedrake). The liquid-network line spun out as Liquid AI.

**Data stance:** pro-data — she argued the data-first position at the ICRA 2025 debate.

**Why promising:** the only MIT lab systematically pairing novel morphology with novel network classes; Neural Jacobian Fields is a genuinely surprising result about how little structure a controller needs.

**Skeptic's view:** enormous breadth and demo-shaped results. Neural Jacobian Fields still needs multi-camera retraining per robot and has no force sensing; liquid networks' efficiency claims remain contested outside small control benchmarks.

---

## 3.5 MCube Lab — Alberto Rodriguez (closing)

**Status: effectively defunct.** The [MCube site](https://mcube.mit.edu/) states that Rodriguez "has stepped down from MIT and transitioned full time to a new adventure at Boston Dynamics. The MCube lab will close in the near future." He is now Director, Robot Behavior – Atlas.

The legacy thesis: manipulation is fundamentally about **contact mechanics**. MCube produced the canonical planar-pushing datasets, the *extrinsic dexterity* framework (using walls, gravity and the environment as extra fingers), tactile-informed regrasping, GelSlim tactile fingers (with Adelson), and the MIT-Princeton [Amazon Robotics Challenge](http://mcube.mit.edu/research/arc.html) picking system. Much of the current contact-rich learning literature still benchmarks against MCube's empirical mechanics.

**Why it still matters:** the contact-rich agenda did not die, it migrated. Rodriguez now leads behaviour for Atlas — the same platform running Tedrake's TRI Large Behavior Models — so MCube's intellectual lineage sits inside the highest-profile humanoid programme in the US.

**Skeptic's view:** this is the clearest case study in MIT robotics' talent drain. A decade of rigorous contact mechanics no longer has an academic home, and the successor work is behind corporate walls where reproducibility is impossible.

---

## 3.6 GelSight / Perceptual Science Group — Edward Adelson

[Adelson](https://bcs.mit.edu/directory/edward-h-adelson) solved touch as a *vision* problem: image an elastomer gel from the inside with a camera and you recover micron-scale geometry, shear and force from commodity parts. GelSight is the most widely adopted tactile sensing technology in robotics, and essentially every optical tactile sensor since is a descendant.

Recent work: [*Object Recognition and Force Estimation with the GelSight Baby Fin Ray*](https://arxiv.org/abs/2509.14510) (2025), classifying in-shell nuts by touch while digging through clutter; [DEXOP](https://arxiv.org/abs/2509.04441) (2025, with Agrawal), the tactile-instrumented hand exoskeleton; building on the platform papers GelSight Svelte (2023) and GelSight Fin Ray (2022). GelSight Inc. commercialises the metrology side, and Meta's Digit 360 is a direct descendant.

**Data stance:** hardware-first. Build a sensor good enough that modest datasets suffice; no interest in scaling teleoperation for its own sake.

**Why promising:** DEXOP suggests the field's real bottleneck may be *data collection ergonomics*, and tactile-rich human demonstration is the most plausible answer anyone has offered.

**Skeptic's view:** GelSight's problems are unchanged since 2017 — gel wear, recalibration, camera bulk, latency — and the research centre of gravity has moved to spinouts, Wenzhen Yuan's group, and Meta. It also remains unproven that touch beats good vision plus mechanical compliance for most manipulation tasks.

---

## 3.7 Biomimetic Robotics Lab — Sangbae Kim (dormant)

**Status: on leave.** MIT MechE lists Kim as a professor "(On Leave)"; trade press widely reports him as Robotics Architect at Meta working on its humanoid programme, though this is not confirmed by any MIT primary source. The lab is not actively led.

The thesis: biology gives you *mechanism*, not algorithms. High-bandwidth, backdrivable proprioceptive actuators — the "MIT actuator" — make dynamic legged behaviour a control problem rather than a sensing problem. The lab produced Mini Cheetah (first quadruped backflip), Cheetah 3, and the MIT Humanoid. Recent [publications](https://biomimetics.mit.edu/publications) include **CusADi** (GPU parallelisation of symbolic expressions for optimal control, RA-L 2024), **FLD: Fourier Latent Dynamics** (2024), integrating model-based footstep planning with model-free RL (IROS 2024), and **URDF+** extending URDF to kinematic loops (Humanoids 2024). No 2025–26 publications appear on the lab site — possibly a stale page rather than a true gap.

**Data stance:** the most model-based group here — whole-body MPC first, RL as a bolt-on. Kim has been publicly sceptical of end-to-end learning for legged systems.

**Why promising:** the actuator design philosophy is now industry standard, and Kim's move to Meta is a strong signal about where humanoid hardware credibility sits.

**Skeptic's view:** Unitree and other Chinese manufacturers have commoditised quasi-direct-drive actuation, eroding the original moat, and the lab has no active successor.

---

## 3.8 Interactive Robotics Group — Julie Shah

[Shah](https://aeroastro.mit.edu/people/julie-shah/) — head of AeroAstro since 2024 — works on robots as *teammates*: mutual prediction, shared mental models, calibrated trust and legible explanation, rather than raw dexterity.

The single most relevant recent paper for the VLA era is *Inference-Time Policy Steering Through Human Interactions* (ICRA 2025, with NVIDIA), which lets a human nudge a diffusion policy at inference time — exactly the interface layer that generative manipulation policies currently lack. Around it: **REALM**, real-time estimates of assistance for learned models (RA-L 2025); a *Versatile Demonstration Interface* (IROS 2025); *Questioning the Robot: Using Human Non-verbal Cues to Estimate the Need for Explanations* (HRI 2025); *Learning Contextually-Adaptive Rewards via Calibrated Features* (HRI 2026, with Andreea Bobu); *Adaptive Language-Guided Abstraction from Contrastive Explanations* (CoRL 2024). Historically the group deployed on BMW assembly lines and in hospital labour-and-delivery scheduling.

**Data stance:** human-in-the-loop demonstration and correction, deliberately low-N, treating human factors evidence as first-class data.

**Skeptic's view:** the [group's public site](https://interactive.mit.edu/) has not been updated since roughly 2023, department-head duties consume bandwidth, and HRI's small-sample user studies replicate unevenly. The group is a consumer rather than a producer of the foundation-model wave.

---

## 3.9 Computational Design and Fabrication Group — Wojciech Matusik

[CDFG](https://cdfg.mit.edu/) argues that morphology should not be fixed: co-optimise structure and controller using differentiable simulation, then actually fabricate the result.

Recent work: AI-enhanced automatic design of efficient underwater gliders (ICRA 2025, with Rus); *Learning Object Properties Using Robot Proprioception via Differentiable Robot-Object Interaction* (ICRA 2025); **Adaptive Walker**, an intent- and terrain-aware walker with high-resolution tactile and IMU sensing (ICRA 2025); a modular self-reconfigurable continuum robot for loco-manipulation (RA-L 2025); electronic-free particle robots communicating through architected tentacles (*Advanced Intelligent Systems* 2025); the **WiReSens Toolkit** for accessible wireless tactile sensing (TEI 2026); and **ASAP** assembly-sequence planning (ICRA 2024).

**Why promising:** machine-knitted, cheap, distributed tactile sensing is one of very few plausible routes to whole-body touch at scale — which is the modality Chapter 13 identifies as most conspicuously missing.

**Skeptic's view:** co-design results overwhelmingly stay in simulation or in single bespoke prototypes, and SIGGRAPH-inflected contributions rarely appear on manipulation benchmarks.

---

## 3.10 SPARK Lab — Luca Carlone

[SPARK](https://lucacarlone.mit.edu/) argues perception needs *certificates* — algorithms with provable global optimality or verifiable failure detection — plus hierarchical, task-aware representations that go beyond metric SLAM.

The code ships and is widely used, which distinguishes this lab: [Hydra](https://github.com/MIT-SPARK/Hydra) builds real-time 3D scene graphs; [Clio](https://arxiv.org/abs/2404.13696) makes them task-driven and open-set; [Khronos](https://arxiv.org/html/2402.13817v2) (RSS 2024) does spatio-temporal metric-semantic SLAM in dynamic environments; [VGGT-SLAM](https://arxiv.org/abs/2505.12549) (NeurIPS 2025) does dense RGB SLAM on the SL(4) manifold; **BUFFER-X** (ICCV 2025 Highlight) does zero-shot point-cloud registration; Kimera-Multi supplies multi-robot SLAM datasets. Carlone is currently on sabbatical as an Amazon Scholar.

**Why promising:** 3D scene graphs are a credible interface between geometry and LLM planners — arguably the missing representation between "the robot sees pixels" and "the robot reasons about rooms."

**Skeptic's view:** certifiability results mostly cover convex relaxations of narrow subproblems, not the learned front-ends now doing the heavy lifting. The guarantee sits on the wrong side of the pipeline.

---

## 3.11 Robust Robotics Group — Nicholas Roy

[Roy's group](https://www.csail.mit.edu/research/robust-robotics-group) works on autonomy under uncertainty with no prior map, combining decision-theoretic planning, statistical inference and AI.

The distinctive 2026 contribution is a genuine third way on foundation models: *Belief Consistency Between Foundation-Model Evidence and Geometric Perception in Persistent Robotic Maps* (2026) treats VLM outputs as **evidence to be reconciled with geometry**, not as ground truth. Around it: *Belief Roadmaps with Uncertain Landmark Evanescence* (ICRA 2025); **Anomalies-by-Synthesis**, diffusion-based anomaly detection for off-road navigation (ICRA 2025); **PIETRA**, physics-informed evidential learning for out-of-distribution terrain (RA-L 2025); **FORGE**, force-guided exploration for contact-rich manipulation under uncertainty (RA-L 2025); language-grounded hierarchical planning with multi-robot 3D scene graphs (2025); and POMDP learning theory beyond full-rank actions (2026).

**Why promising:** as VLA policies proliferate, someone must formalise when to trust them, and this group has the POMDP machinery.

**Skeptic's view:** the portfolio is diffuse and much output lands in RA-L and preprints rather than agenda-setting venues.

---

## 3.12 Marine Robotics Group — John Leonard

[Leonard's group](https://marinerobotics.mit.edu/) works on durable *long-term* mapping: consistent spatial representations across months and changing environments, with underwater as the hardest case.

Recent work: *ReefMapGS*, closing the loop between multimodal SLAM and Gaussian splatting for large-scale underwater reconstruction (2026); *SeaSplat*, 3D Gaussian splatting for underwater scenes (ICRA 2025); *NeuSE*, SE(3)-equivariant embeddings for long-term object-based SLAM (*IJRR* 2026); *3DGS-CD*, splatting-based change detection for object rearrangement (RA-L 2025); opti-acoustic semantic SLAM with unknown objects (IROS 2024); semantic enhancement for object SLAM using multimodal LLM agents (IROS 2025).

**Why promising:** underwater reconstruction has real scientific demand (reef monitoring) and no plausible internet-scale data shortcut — a useful counterexample to the "everything is a data problem" consensus.

**Skeptic's view:** the group's centre of gravity has drifted toward whatever is fashionable in 3D vision; the distinctive marine contribution can look like generic SLAM plus salt water.

---

## 3.13 Aerospace Controls Lab — Jonathan How

[ACL](https://acl.mit.edu/) works on decision-making under uncertainty for vehicle teams: distributed planning, robust and safe control, and learned policies with formal guarantees.

Recent: *GRAND-SLAM*, globally consistent large-scale multi-agent Gaussian SLAM (2025); *LunarLoc*, global localisation for lunar surface operations (2026); *SANDO* and *MIGHTY* for safe trajectory planning in dynamic unknown environments (2026); *PIETRA* (with Roy); aerobatic manoeuvres in insect-scale flapping-wing robots via deep-learned robust tube MPC (2025); *CLIPPER*, robust data association without an initial guess (2024); *GUARDIAN*, safety filtering for perception models under adversarial attack (2026).

**Why promising:** DoD- and NASA-relevant, verification-oriented, and strong on multi-robot SLAM through the ARL DCIST alliance.

**Skeptic's view:** enormous publication volume with incremental acronym churn, and safety guarantees typically assume perception models the same papers elsewhere admit are the weak link.

---

## 3.14 d'Arbeloff Laboratory — Harry Asada

[Asada's lab](https://darbelofflab.mit.edu/) builds robots that are *worn, braced against, or fused with* the human body — supernumerary hardware that adds degrees of freedom to a person — plus contact-rich factory automation.

Recent: [**E-BAR**](https://meche.mit.edu/news-media/eldercare-robot-helps-people-sit-and-stand-and-catches-them-if-they-fall) (ICRA 2025), a mobile eldercare robot with inflatable airbags that supports sit-to-stand and physically catches falls; [**Loop Closure Grasping**](https://www.science.org/doi/10.1126/sciadv.ady9581) (*Science Advances* 2025), topological grasp transformations for strong-yet-gentle grips; soft growing structures for patient transfer (IROS 2025); Koopman dynamic modelling of rigid bodies with contact (IROS 2024); [supernumerary robotic limbs](https://darbelofflab.mit.edu/robotics-research/supernumerary-robotic-limbs-srl) including a spacesuit variant.

**Why promising:** eldercare and aircraft assembly are real markets with hard physical constraints that foundation models do not address, and Loop Closure Grasping is a genuinely novel mechanism idea.

**Skeptic's view:** a long history of striking demos with thin longitudinal human-subject validation; supernumerary limbs have been "nearly deployable" for a decade.

---

## 3.15 Media Lab Personal Robots Group — Cynthia Breazeal

[Breazeal](https://www.media.mit.edu/people/cynthiab/publications/) founded social robotics as a field; she is now also MIT's Dean for Digital Learning, and her personal recent output is dominated by K-12 AI literacy rather than robots. The group remains active, with research scientists carrying much of the robotics.

The standout result is [*Social robots as conversational catalysts: enhancing long-term human-human interaction at home*](https://www.science.org/doi/10.1126/scirobotics.adk3307) (*Science Robotics*, March 2025, front cover) — a robot that improves interaction *between people* rather than with itself. Also: [Social Robots as Social Proxies](https://arxiv.org/abs/2502.00221) (2025), a 40-home two-week deployment on empathy; the EMPATHICSTORIES++ dataset; Doodlebot; Tega for early literacy; an HRI 2024 best paper on adaptive robot roles.

**Why promising:** genuinely long-horizon, in-home studies — rare, hard, and exactly the data the rest of the field lacks.

**Skeptic's view:** the commercial base collapsed with Jibo, effect sizes in wellbeing studies are modest, and LLM chat now delivers much of the perceived value without a robot.

---

## 3.16 Center for Bits and Atoms — Neil Gershenfeld

[CBA](https://cba.mit.edu/) proposes replacing continuous fabrication with *digital materials*: reversible, error-correcting assembly of discrete voxels by simple robots that crawl on the structure they build.

The 2026 result is [*Comparative evaluation of robotically assembled discrete lattice systems for sustainable construction*](https://news.mit.edu/2026/robotically-assembled-building-blocks-makes-construction-more-efficient-and-sustainable-0428) (*Automation in Construction*, April 2026), introducing **MILAbots** (Modular Inchworm Lattice Assemblers) and octet-lattice voxels in steel and wood, with a one-storey demonstrator, modelling of up to 20 robots in parallel, and up to 82% embodied-carbon reduction versus 3D concrete printing. Earlier: [self-reconfigurable robots for collaborative discrete lattice assembly](https://cba.mit.edu/docs/papers/24.05.ICRA.pdf) (ICRA 2024).

**Why promising:** decouples robot complexity from structure size, and builds disassembly and reuse in architecturally, which matters for construction carbon.

**Skeptic's view:** three decades of self-replication rhetoric with no structural-engineering certification, no cost parity, and lab-scale demonstrations. The 2026 paper's assembly rates at scale are *modelled*, not measured.

---

## 3.17 K. Lisa Yang Center for Bionics — Hugh Herr

[Herr](https://www.media.mit.edu/groups/biomechatronics/overview/) argues the limitation in prosthetics is not the actuator but the *interface*: surgically reconstruct the residual limb to restore proprioception, then let the person's own nervous system control the machine.

The landmark result is [*Tissue-integrated bionic knee restores versatile legged movement after amputation*](https://www.media.mit.edu/publications/tissue-integrated-bionic-knee-restores-versatile-legged-movement-after-amputation/) (Shu et al., **Science** 389:eadv3223, July 2025), combining osseointegration, permanently implanted hardware and neuromuscular signals from surgically modified tissue — building on the agonist-antagonist myoneural interface (AMI) procedure and the 2024 *Nature Medicine* fully neural-controlled bionic leg.

**Embodiment relevance:** this is the strongest evidence anywhere that embodiment is a *bidirectional* problem — the body must be redesigned for the machine, not only the machine for the body.

**Skeptic's view:** AMI requires elective surgical modification, cohorts are single-digit, and cost puts it decades away from most amputees. The rhetoric outruns the clinical evidence.

---

## 3.18 GEAR Center — Amos Winter

[GEAR](https://www.gear.mit.edu/) derives device requirements from first-principles biomechanics so that *passive, low-cost, mass-manufacturable* prostheses match the gait quality of expensive powered ones.

The core method is the **Lower Leg Trajectory Error (LLTE)** metric, mapping mechanical design directly to biomechanical outcome, extended in 2025 to a Hip Trajectory Error framework for above-knee amputation (*Journal of Mechanical Design*). Products include a single-part injection-moulded prosthetic foot manufactured in India with month-long clinical trials, and a low-cost passive knee. Partners include BMVSS/Jaipur Foot and Northwestern's Prosthetics-Orthotics Center.

*(Correction: Faye Wu is not at GEAR. She is an Asada PhD, now co-founder/CTO of [Manus Robotics](https://www.manus-robotics.com/), building multimodal muscle-activity sensing for assistive-device control.)*

**Why promising:** rigorous design theory tied to a distribution channel already serving millions.

**Skeptic's view:** essentially no manipulation and no autonomy — optimised mechanism design, belonging more to an assistive-devices chapter than a robotics one.

---

## 3.19 Kaiming He — the vision substrate

[He](https://people.csail.mit.edu/kaiming/) joined MIT EECS in 2024 and has been a part-time Distinguished Scientist at Google DeepMind since 2025. He is not a roboticist; he builds the representation-learning substrate embodied systems consume (ResNet, Mask R-CNN, MoCo, MAE).

His one genuinely embodied paper is important: [**Heterogeneous Pre-trained Transformers (HPT)**](https://arxiv.org/abs/2409.20537) (Wang, Chen, Zhao, He; NeurIPS 2024), which pre-trains a shared policy "trunk" across robot embodiments with embodiment-specific "stems" for heterogeneous proprioception and vision, and task-specific "heads." Over 50 datasets and 200k+ trajectories it beat baselines by more than 20% on unseen tasks. It is the cleanest MIT statement of the "robot data is heterogeneous, pre-train the trunk" thesis. His generative work — *Mean Flows for One-step Generative Modeling* (NeurIPS 2025 Oral), *Is Noise Conditioning Necessary for Denoising Generative Models?* (ICML 2025) — attacks diffusion-policy inference latency directly.

**Skeptic's view:** treating robotics as a downstream application of vision has repeatedly under-delivered on contact and dynamics, and the DeepMind affiliation means his highest-impact work may not land at MIT.

---

## 3.20 Phillip Isola's group

[Isola](https://www.eecs.mit.edu/people/phillip-isola/) argues that intelligence is representation, and that models trained on different modalities converge toward a shared statistical model of reality — [The Platonic Representation Hypothesis](https://dl.acm.org/doi/10.5555/3692070.3692897) (ICML 2024). For robotics the corollary is: if generative models already encode the visual world, use them to *manufacture* the data robots need.

[**LucidSim**](https://arxiv.org/abs/2411.00083) (CoRL 2024, with Alan Yu, Ge Yang and John Leonard) is the existence proof: a Unitree Go1 learned vision-based parkour entirely from generative-model-rendered scenes, with [zero real training images](https://news.mit.edu/2024/can-robots-learn-machine-dreams-1119). **LucidXR** (CoRL 2025) extends this to dexterous manipulation from human demonstrations captured in XR.

**Data stance:** the purest "generative simulation" position at MIT — synthesise photorealistic variation to close the *appearance* half of the sim-to-real gap, while physics stays in a conventional simulator.

**Skeptic's view:** generated images fix textures, not contact dynamics, friction or deformables — precisely where manipulation breaks. And the Platonic hypothesis is a position paper with contested evidence.

---

## 3.21 Antonio Torralba's group and MIT-IBM Watson AI Lab

[Torralba](https://www.eecs.mit.edu/people/antonio-torralba/), Faculty Head of AI+Decision Making, works on multimodal representation, interpretability and simulated worlds as substrate for embodied learning. Recent: *Separating Knowledge and Perception with Procedural Data* (ICML 2025); *Adaptive Length Image Tokenization via Recurrent Allocation* (ICLR 2025); *Eval3D* and *SketchAgent* (CVPR 2025); *A Multimodal Automated Interpretability Agent* (ICML 2024); the *Foundations of Computer Vision* textbook (2024). Earlier embodied infrastructure includes the ThreeDWorld simulation platform.

**Honest framing:** this is adjacency, not embodiment. No substantial first-party robot-hardware papers were found for 2025–26, and robotics influence flows indirectly — through alumni (Yunzhu Li, Chuang Gan), simulators, and interpretability tools that robot-learning groups adopt. Its inclusion is justified as infrastructure and lineage, not as a robotics lab.

---

## 3.22 Jeehwan Kim — neuromorphic hardware (robotics relevance: weak)

[Kim's lab](https://jeehwanlab.mit.edu/) works on analogue neuromorphic hardware — dense artificial-synapse arrays, 2D-material and remote epitaxy, 3D heterogeneous integration — so inference can run at the edge with far lower energy. Named work: tens of thousands of artificial brain synapses on a single chip (2020); a "LEGO-like" stackable AI chip (2022); 3D integration of AI hardware with direct analogue input from sensor arrays under the [MIT AI Hardware Program](https://www.aihardware.mit.edu/).

**Explicit flag: do not present this as a robotics group.** No robotics-specific project, robot platform, or robotics publication was found for 2024–26. The honest framing is a materials and device group whose sensor-adjacent analogue compute is a *plausible future substrate* for low-power embodied inference, with no robot currently in the loop. If analogue in-memory compute matures, on-robot perception power budgets change qualitatively; neuromorphic hardware has also repeatedly failed to displace GPUs.

---

## 3.23 Toyota Research Institute — the MIT-industry axis

TRI's robotics division is led by Russ Tedrake under a joint appointment. The flagship result is [*A careful examination of large behavior models for multitask dexterous manipulation*](https://arxiv.org/html/2507.05331v1) (Barreiros, Beaulieu, Tedrake et al., *Science Robotics* 11(113), April 2026) — a 94-author paper using blind evaluators, 1,800 real-world trials and 50 rollouts per task-policy pair, which found that diffusion-based multitask pretraining genuinely improves robustness and few-shot acquisition, requiring "less than 30% of the data needed for training from scratch," but with **smooth, gradual gains and no discontinuity at current scales**.

Precursors: TRI's 2023 diffusion-policy work and the [Boston Dynamics–TRI Atlas partnership](https://bostondynamics.com/news/boston-dynamics-toyota-research-institute-announce-partnership-to-advance-robotics-research/) (October 2024). Recent joint MIT-TRI work includes [SceneSmith](https://news.mit.edu/2026/ai-agents-create-virtual-playgrounds-to-help-robots-get-crucial-training-data-0713) (ICML 2026 spotlight), agentic generation of simulation-ready indoor scenes.

**Why it matters:** this is the most statistically careful evaluation in a field of cherry-picked videos, and its conclusions are deliberately unflattering to its own programme.

**Skeptic's view:** the paper's own finding — real but modest, data-hungry gains — is a long way from the general-purpose claims made around it. The MIT/TRI/Walden boundary is now blurred enough to complicate attribution entirely.

---

## 3.24 MIT spinouts: an attribution audit

**Verified MIT lineage.** **Walden Robotics** (Cambridge, 2026) — Tedrake as CEO, TRI spinout, $300M at $1.1B, wheeled-base humanoids trained by large behaviour models, already running in a Toyota plant. **Liquid AI** (Hasani, Lechner, Amini, Rus) — a direct CSAIL spinout from liquid neural networks, though now focused on efficient LLMs rather than robots. **Manus Robotics** (Asada, Faye Wu). **RightHand Robotics** — partial lineage; co-founder Lael Odhner did his degrees with Asada and came out of the 2009 DARPA ARM programme, though other co-founders are Harvard. Historic: **Boston Dynamics** (Marc Raibert, MIT Leg Lab) and **iRobot** (Brooks, Angle, Greiner). The [RAI Institute](https://rai-inst.com/) (Raibert, Cambridge) has absorbed considerable local talent.

**Corrections to flag.** **Realtime Robotics** is a **Duke** spinout, not MIT. **Ambi Robotics** is a **UC Berkeley** (Ken Goldberg) spinout. Do not attribute either to MIT.

**Skeptic's view:** a $1.1B valuation six months from founding and pre-product is the clearest single sign of a humanoid funding bubble, and a sitting MIT professor as startup CEO raises the conflict questions that dogged the last two robotics cycles.

---

## 3.25 The hiring picture

There was no significant MIT robot-learning faculty hire in 2025–26 and no new MIT robotics centre. The [2025–26 Schwarzman College of Computing cohort](https://computing.mit.edu/faculty/new-incoming-faculty/new-faculty-2025-2026/) — eleven people including Omar Khattab (NLP/IR) and Mitchell Gordon (HCI+ML) — contains no robotics or embodied-AI appointments. The [2024–25 School of Engineering cohort](https://news.mit.edu/2025/school-engineering-welcomes-eight-new-faculty-1017) yielded one adjacent hire, Raphael Zufferey (MechE), on bio-inspired aerial-aquatic locomotion.

The substantive institutional change is instead the [MIT Initiative for New Manufacturing](https://news.mit.edu/2025/mit-announces-initiative-for-new-manufacturing-0527) (May 2025), Institute-wide with an AI-and-automation framing.

**Skeptic's reading:** MIT is losing the robot-learning hiring race. The field's rising stars went to Stanford, Berkeley, CMU and Columbia, while MIT's marginal robotics capacity flowed *out* to TRI, Walden, Boston Dynamics, Meta and RAI. A textbook should say so.

---

## 3.26 Deep dive: MIT's real contribution is the objection

Stanford's contribution to 2023–2026 was interfaces. MIT's was **the objection** — and the field is better for it.

Four objections, each with a serious lab behind it.

**The evaluation objection (Tedrake/TRI).** Before the [Large Behavior Models paper](https://arxiv.org/html/2507.05331v1), the modal robot-learning result was a video and a success rate from an unspecified number of trials scored by the authors. TRI's methodology — blind evaluators, 1,800 trials, 50 rollouts per task-policy pair, 27% re-scored for quality control, with a measured 2.31% inter-grader discrepancy — established that much prior reporting was too noisy to support its own claims. It is difficult to overstate how much this should change how the field reads its own literature.

**The abstraction objection (Kaelbling/Lozano-Pérez).** Long-horizon manipulation is a hybrid discrete-continuous search problem, and end-to-end policies do not have the structure to solve it. The 2026 twist is that this group is now *using* foundation models to supply the symbols rather than fighting them — a much stronger position than the pure-symbolic one it replaced.

**The tactile objection (Adelson, Agrawal, and Rodney Brooks from outside).** Brooks' [September 2025 essay](https://rodneybrooks.com/why-todays-humanoids-wont-learn-dexterity/) puts it most sharply: "Collecting just visual data is not collecting the **right data**," because human dexterity runs on roughly 17,000 hand mechanoreceptors, and "we as a species have not developed technologies to capture touch, to store touch, to transmit touch over distances and time." DEXOP is the constructive answer — a passive exoskeleton that captures full-hand tactile data *in the robot's own action space* — and it is arguably MIT's most important 2025 artifact.

**The mechanism objection (Kim, Cutkosky from Stanford, Herr, Asada).** Some problems are solved by better bodies, not better policies. Proprioceptive actuators made dynamic legged locomotion tractable. Loop closure grasping makes a grip strong and gentle at once. Osseointegration plus AMI restores proprioception that no controller could synthesise. This objection is unfashionable and probably correct at the margin.

The tension worth noticing is that all four objections are, in 2026, being *absorbed* rather than defeated. Gemini Robotics thinks before acting (abstraction). Figure and Apptronik ship fingertip tactile sensing (touch). Everyone now reports more trials (evaluation). Every humanoid company is a hardware company (mechanism). Whether that absorption vindicates the objectors or dissolves them into the scaling programme is the open question of the next three years.
---

# Chapter 4 — Humanoid Manufacturers

## 4.0 How to read this chapter

Every company here builds bodies. They differ on four axes, and the axes matter more than the specs.

1. **Do they build the brain too?** Figure, Tesla, 1X and XPeng say yes. Apptronik, Boston Dynamics and Unitree effectively say no, or not alone.
2. **Where does data come from?** Factory deployment logs (Figure, UBTech, Agility), customer homes with human teleoperators (1X), simulation (Galbot, Boston Dynamics), retargeted human motion (Figure's S0, Tesla), or nowhere in particular because they sell hardware (Unitree).
3. **Is the humanoid form load-bearing?** Figure, Tesla and XPeng argue yes on first principles. Agility, Galbot, Dexterity and Walden argue wheels are better engineering and legs are a tax.
4. **What is actually deployed?** This is the axis that separates the chapter into two halves, and almost nobody's marketing tells you which half they are in.

---

## 4.1 Figure AI

Founded 2022 by **Brett Adcock** (Vettery, Archer Aviation), seeded with $100M of his own money. Figure closed [over $1B at a **$39B post-money valuation** on 16 September 2025](https://www.figure.ai/news/series-c), led by Parkway Venture Capital with Brookfield, NVIDIA, Macquarie, Intel Capital, LG Technology Ventures, Salesforce, T-Mobile Ventures and Qualcomm Ventures.

**Thesis:** vertical integration wins. One company owns the hardware (Figure 03), the manufacturing (BotQ), and a single end-to-end neural policy (**Helix**), because the data advantage only compounds if you control the body. Helix is explicitly hierarchical: **S2** for semantic reasoning at 7–9 Hz, **S1** for visuomotor control at 200 Hz, and **S0** for whole-body balance at 1 kHz — the last trained on 1,000+ hours of retargeted human motion and replacing, per Figure, [109,504 lines of hand-engineered C++](https://www.figure.ai/news/helix-02).

**Data:** the [BMW Spartanburg deployment](https://www.figure.ai/news/production-at-bmw) — eleven months, 1,250+ hours of runtime, 90,000+ parts, contributing to 30,000+ vehicles at 84-second cycle time and 5 mm tolerance. Plus **Project Go-Big** with Brookfield to harvest home video across a 100,000-unit residential portfolio, plus egocentric human video and teleoperation.

**Embodiment:** maximally pro-humanoid and pro-own-hardware. Figure's [master plan](https://www.figure.ai/master-plan) argues the choice is between "millions of different types of robots serving unique tasks or one humanoid robot with a general interface."

**Skeptic:** $39B on no disclosed product revenue. The BMW deployment is one repetitive part-loading station — 1,250 hours is roughly seven months of one human's working time. Home tidying demos remain curated single clips.

---

## 4.2 1X Technologies

Norwegian-American, led by co-founder **Bernt Øivind Børnich**; backed since 2023 by the OpenAI Startup Fund, Tiger Global, EQT Ventures and Samsung NEXT. Reported in September 2025 to be raising up to $1B at $10B+ — *not confirmed closed*.

**Thesis:** the home is the only environment with enough long-tail messiness to force general intelligence, and the only way to get home data is to put robots in homes now. **NEO** is $20,000 outright or $499/month.

**Data:** explicitly teleoperation-first, and unusually honest about it. Customers summon remote "experts" to teach NEO tasks, feeding the **Redwood** model, which trains on teleoperated *and* autonomous episodes including failures. 1X also runs a [world model](https://www.1x.tech/discover/1x-world-model) programme framed primarily as an **evaluation** substrate — its stated "holy grail" question is "can you predict how well a robot performs before you test it in the real world?"

**Embodiment:** the distinctive bet is *soft* embodiment — tendon drives, a knit covering, 66 lb mass, [25-DOF tendon-driven hands](https://www.1x.tech/discover/neos-hands). Safety by compliance rather than by control. Børnich also frames the humanoid as the *data-compatible* body: making NEO as close to human as possible is what lets it [learn from internet-scale video](https://techcrunch.com/2026/01/13/neo-humanoid-maker-1x-releases-world-model-to-help-bots-learn-what-they-see/).

**Skeptic:** shipping a teleoperated robot into homes ships a privacy problem at scale — 1X's own FAQ has to address whether an expert can "connect and enter my NEO at any time." The unit economics of paying operators against $499/month invert only if autonomy actually arrives.

---

## 4.3 Tesla Optimus

Internal Tesla programme, no external funding.

**Thesis:** manufacturing is the bottleneck, not intelligence. Tesla believes FSD's vision-only, video-pretrained stack transfers to a biped, and that only a company with automotive-scale supply chain can reach a sub-$20,000 bill of materials.

**Data:** end-to-end video imitation from human demonstrations, in-house teleoperation capture via motion-capture suits and VR rigs, and factory task logs.

**Embodiment:** maximally committed to both the humanoid form and full vertical integration, down to actuators and lead screws.

**Reality check:** on the Q4 2025 earnings call ([28 January 2026](https://electrek.co/guides/tesla-optimus/)) Musk acknowledged that **no Optimus robots were doing useful work in Tesla factories** — against a prior target of ~10,000 units with 1,000 in productive work. In April 2026 he said Fremont production would start "late July or August," initially "quite slow," describing Optimus as the most difficult product to scale in Tesla's history because "virtually none of the components have a mature supply chain." Reporting through 2026 indicates the Model S/X line at Fremont was dismantled to install Optimus production, with 20,000–30,000 units targeted for the year, all internal.

**Skeptic:** three consecutive years of missed timelines, early demos containing teleoperated segments that were not initially labelled as such, and zero external units. Optimus is the demo-ware pole of this chapter.

---

## 4.4 Agility Robotics

Spun out of Oregon State's Dynamic Robotics Lab in 2015 by **Jonathan Hurst**, Damion Shelton and Mikhail Jones — the deepest bipedal-locomotion lineage of any humanoid firm (ATRIAS, Cassie). CEO **Peggy Johnson** (ex-Microsoft, Magic Leap). In [June 2026 it announced a SPAC merger with Churchill Capital Corp XI](https://www.agilityrobotics.com/content/agility-robotics-to-go-public-through-merger-with-churchill-capital-corp-xi) at a $2.5B pre-money equity value, ~$620M gross proceeds, ticker "AGLT."

**Thesis:** narrow, boring, measurable. Win logistics tote-handling first with a robot engineered for uptime, not for viral video.

**Data:** real deployment logs above all — filings cite **65,000+ hours of real-world operation** and 100,000+ totes moved at GXO.

**Embodiment:** pragmatically anti-purist. Digit has ostrich-like reverse-knee legs and, for most of its life, no hands and no head. Form follows the warehouse task.

**Deployed:** the strongest real-deployment record in the West — GXO (the industry's first humanoid RaaS contract), Schaeffler, Toyota Motor Manufacturing Canada (three units scaling to ten), Mercado Libre.

**Skeptic:** filings show opex rising from $71M (2024) to ~$111M (2025) with roughly $100M burn and undisclosed revenue. The headline ">$300M committed orders" is milestone-contingent and leans on one unnamed 1,000-robot customer. A SPAC is not usually the exit of a company with pricing power. Former Chief Product Officer Melonee Wise gave the sector's sharpest internal critique: ["I don't think anyone has found an application for humanoids that would require several thousand robots per facility"](https://spectrum.ieee.org/humanoid-robot-scaling), and "currently AI is not robust enough to meet the requirements of the market."

---

## 4.5 Apptronik

Austin-based, spun out of UT Austin's Human Centered Robotics Lab (NASA Valkyrie lineage), co-founded 2016 by **Jeff Cardenas** and **Luis Sentis**. A $415M Series A (February 2025) plus a [$520M extension in February 2026](https://www.therobotreport.com/apptronik-brings-in-another-520m-to-ramp-up-apollo-production/) brings the Series A to **over $935M** and total capital raised to nearly $1B, with B Capital, Google, Mercedes-Benz, PEAK6, AT&T Ventures, John Deere and the Qatar Investment Authority. *(A $5B valuation was reported by CNBC; Apptronik itself has confirmed only that the extension priced at 3× the Series A.)*

**Thesis:** best-in-class actuators plus somebody else's best-in-class brain. Apptronik's heritage is force-controlled actuator design; it partners with Google DeepMind and runs Gemini Robotics rather than building a frontier VLA alone. Its **SharpaWave** 22-DOF hand is among the most dexterous shipping today.

**Data:** teleoperation in dedicated robot training facilities, plus deployment logs from Mercedes-Benz, GXO and Jabil (which also manufactures Apollo).

**Embodiment:** humanoid-committed and hardware-first, but deliberately *brain*-agnostic — the exact inverse of Figure's posture.

**Skeptic:** nearly $1B raised on pilots, and outsourcing the policy layer means the moat is actuators — a component Korean and Chinese suppliers are commoditising quickly.

---

## 4.6 Boston Dynamics

Founded 1992 as an MIT spin-off by **Marc Raibert**; owned by **Hyundai Motor Group** since 2021. Retired hydraulic Atlas in April 2024 and revealed the all-electric successor the next day. Partnered with **Toyota Research Institute** since October 2024 to pair its control stack with TRI's Large Behavior Models.

**Thesis:** athletic whole-body control is the hard-won asset, and learned behaviour models should ride *on top of* a model-predictive controller rather than replace it. Boston Dynamics argues real work [requires "a broadening of what we mean by physical intelligence"](https://bostondynamics.com/blog/training-a-humanoid-robot-for-hard-work/) — shoulders, forearms and hips, not just fingertips.

**Data:** custom VR teleoperation with stereoscopic feed, haptics and foot tracking, feeding a **450M-parameter diffusion-transformer flow-matching policy** running at 30 Hz on 48-action chunks. Critically, BD and TRI train **one policy jointly across Atlas (50 DoF) and a 29-DoF manipulation test stand** — one of the strongest public demonstrations that intelligence pools across embodiments. Sim-to-real is unusually easy for them: only two actuator types and a symmetric design mean [the gap is "very small."](https://bostondynamics.com/blog/training-a-humanoid-robot-for-hard-work/)

**Deployed:** a production Atlas debuted at CES 2026; Hyundai plans deployment at its Georgia Metaplant from 2028. Everything else is demo.

**Skeptic:** two decades of the best robot videos in the world and still no humanoid revenue. A 2028 first deployment means Atlas ships after Chinese rivals have shipped tens of thousands.

---

## 4.7 Sanctuary AI — the company that changed its mind

Vancouver, founded 2018 by **Geordie Rose** (D-Wave, Kindred) with Suzanne Gildert, Olivia Norton and Ajay Agrawal. Roughly $140M+ raised. Gildert departed in 2024; **Daniel Friedmann** is now CEO.

**Original thesis:** the most maximalist in this book — human-like general intelligence via a hydraulic, tactile-rich hand and pilot teleoperation, on the argument that dexterity, not locomotion, is the bottleneck.

**The pivot:** on [17 June 2026](https://www.sanctuary.ai/news/sanctuary-ai-expands-physical-ai-strategy-to-industrial-robotics) Sanctuary announced it would deploy its Physical AI on *existing third-party commercial platforms* rather than wait for humanoid hardware to commercialise — an explicitly hardware-agnostic stance, with humanoids reframed as a later target. It came with a hard number: 99.5%+ success on wire plugging at 2.54-second cycle times, benchmarked against a Tier 1 automotive supplier's production line.

**Why this entry matters more than its size suggests:** Sanctuary is the first well-funded humanoid company to publicly abandon the form factor as a near-term strategy. Read charitably, it is evidence that the intelligence layer is separable from the body. Read skeptically, it is a capitulation dressed as strategy — a company that raised on human-like general intelligence now selling contact-rich skills for industrial arms, in a crowded market, without hardware differentiation.

---

## 4.8 Unitree Robotics

Hangzhou, founded 2016 by **Wang Xingxing**. The outlier: **profitable, and audited.** Its STAR Market IPO process through 2026 produced the field's first real humanoid P&L — [~$248M 2025 revenue, 59.8% gross margin, 3,701 humanoids produced and 3,551 sold in the first nine months of 2025](https://www.therobotreport.com/unitree-ipo-shows-a-real-hardware-business-the-humanoid-case-is-still-early/), raising roughly $610–620M. *(Reporting differs on whether the listing itself landed in March or July 2026; the financials are consistent across sources.)*

**Thesis:** price, not intelligence. Ship cheap, capable hardware to researchers, integrators and entertainment buyers, let the world write the software, and ride the component cost curve. Average selling price fell from **$85,000 in 2023 to $25,000 in 2025** — a 71% decline in two years, driven by in-house actuators.

**Data:** essentially outsourced. Unitree sells the platform; its sim-to-real RL locomotion work is excellent but there is no proprietary data flywheel.

**Embodiment:** hardware-first and form-agnostic in practice — quadrupeds, wheeled bases and bipeds all ship.

**The number that defines the sector:** Unitree's demand mix is **73.6% research and education, 17.4% demonstrations and displays, 9.01% industrial.** The only company with audited humanoid revenue is overwhelmingly selling to people who study robots and people who put on shows.

**Skeptic:** a hardware margin business dressed as an AI story. If value accrues to the policy layer, Unitree is the Foxconn of this cycle.

---

## 4.9 UBTech Robotics

Shenzhen, founded 2012 by **Zhou Jian**; listed on the HKEX (9880.HK) since December 2023 — the first pure-play humanoid public company, and loss-making its entire public life.

**Thesis:** industrial humanoids win by cost curve and supply-chain localisation, not frontier models. UBTech targets 90% domestic component sourcing and sub-$20,000 unit cost by 2027–2030, running factories in Shenzhen and Liuzhou.

**Data:** factory deployment logs from BYD, FAW-Volkswagen, Geely and Foxconn lines — and, distinctively, UBTech *sells data infrastructure*, including a ¥159M contract for a "Humanoid Robot Data Collection Center" in Zigong. Walker S2's autonomous hot-swap battery exists precisely to keep robots — and data collection — running continuously.

**Deployed:** the most credible order book in the sector. [Walker S2 entered mass production and delivery in November 2025 with orders exceeding ¥800M](https://www.prnewswire.com/news-releases/ubtech-humanoid-robot-walker-s2-begins-mass-production-and-delivery-with-orders-exceeding-800-million-yuan-302616924.html), later cumulative Walker orders above ¥1.1B. Roughly 500 units delivered in 2025, with targets of 5,000 in 2026 and 10,000 in 2027.

**Skeptic:** a large share of orders come from state-linked or strategic buyers — a ¥264M border-security contract, a government data centre — which is subsidised demand, not product-market fit.

---

## 4.10 Galbot

Beijing, founded May 2023 out of Peking University's embodied-AI group. Raised [over $300M at a $3B valuation in December 2025](https://www.therobotreport.com/galbot-brings-in-300m-to-scale-mobile-manipulator-deployments/), bringing total funding to roughly $800M, with CATL among strategic backers.

**Thesis:** **simulation first.** Galbot's signature claim is pre-training on large-scale *synthetic* action datasets and post-training on real data — an explicit bet that compute buys you past the teleoperation bottleneck.

**Embodiment:** deliberately *semi*-humanoid. G1 is a wheeled base with a human-like torso and dual arms. Galbot rejects bipedalism as an unnecessary cost and reliability tax while claiming cross-embodiment transfer of navigation and manipulation.

**Deployed:** the strongest commercial reality of any Chinese startup here — **Galbot Store autonomous retail in 30+ Chinese cities**, warehouses running 24/7 for over a year, hospital pharmacy pilots, and partnerships with CATL, Bosch, Toyota and Hyundai.

**Skeptic:** an autonomous convenience store is a vending machine with an arm. The sim-to-real thesis is unproven outside pick-and-place, and dropping legs forfeits exactly the stairs-and-clutter environments that justify humanoids in the first place.

---

## 4.11 AgiBot / Zhiyuan Robotics

Shanghai, founded February 2023 by **Deng Taihua** (ex-Huawei) and **Peng Zhihui** ("Zhihui Jun"), a Huawei "Genius Youth" hire with a large engineering following. Backed by Tencent, JD.com, Sequoia China, Hillhouse, SAIC Capital, BYD and CATL. In July 2025 it agreed to take a controlling stake in Shanghai-listed Swancor for ~¥2.1B as a listing route. *(A 2026 Hong Kong IPO process is widely reported in trade press but could not be confirmed against a primary source.)*

**Thesis:** data is the product. [AgiBot World](https://huggingface.co/datasets/agibot-world/AgiBotWorldBeta) is the largest purpose-built real-robot manipulation corpus in existence — **1,001,552 trajectories, 2,976.4 hours**, collected by 100+ robots in a 4,000 m² facility, with the GO-1 policy reporting a ~30% average gain over Open-X pretraining. This is a deliberate attempt to become the ImageNet of embodied AI and set the standard others train on.

**Embodiment:** aggressively multi-embodiment — humanoid (Yuanzheng), wheeled (Jingling), and the dual-mode Lingxi X2-N — with one foundation model intended to span them.

**Deployed:** 5,100+ humanoids shipped in 2025; revenue reported growing from ¥300K in year one to over ¥1B in 2025.

**Skeptic:** revenue growth that steep in a market this immature usually means selling robots to integrators, other robot companies and state-backed demonstration projects. A reverse merger into a wind-turbine composites firm is a financing manoeuvre, not validation.

---

## 4.12 Fourier Intelligence

Shanghai, founded 2015 by **Gu Jie** — uniquely, out of *rehabilitation* robotics, with products in 2,000+ clinical institutions across 40+ countries. Raised a Series E of roughly ¥800M (~$110M) in early 2025; SoftBank is a prior backer.

**Thesis:** the humanoid's first real market is **care**, not the factory. Fourier calls GR-3 a "Care-bot" and targets hospitals, community centres and eldercare — B2B, explicitly not consumer.

**Data:** clinical and rehabilitation deployment history is the differentiator, supplemented by an open-source play — the **Fourier N1** platform and a developer framework released to crowdsource skills.

**Embodiment:** builds its own full-size humanoids (GR-1 2023, GR-2 2024, [GR-3](https://www.prnewswire.com/news-releases/fourier-makes-ces-debut-with-gr-3-a-next-generation-care-focused-humanoid-robot-302654565.html) August 2025 — 165 cm, 55 DoF), arguing the humanoid form is necessary specifically because care is an interpersonal, physically intimate task.

**Skeptic:** "warm tech companionship" is the softest claim in the sector and the hardest to price. Eldercare is the most regulated, most liability-exposed, lowest-margin environment imaginable, and a three-hour battery does not survive a care shift.

---

## 4.13 Neura Robotics

Metzingen, Germany; founded 2019 by **David Reger**. In [June 2026 it announced a Series C of up to $1.4B](https://neura-robotics.com/company/news/) — the largest robotics round in European history — backed by Tether, Qualcomm, Amazon, NVIDIA, Bosch, Schaeffler, the European Investment Bank, imec.xpand and others.

**Thesis:** "cognitive robotics" — sensor-rich, inherently safe robots that work *without cages* are the precondition for humanoids, and Europe must own its physical-AI stack rather than rent it.

**Data:** the most distinctive strategy in this chapter. **NEURA Gyms** are large-scale physical training environments where fleets learn by doing, feeding the **Neuraverse**, an app-store-like ecosystem where skills learned by one robot propagate to all. Reger's framing is that intelligence is a network good, not a per-robot asset.

**Embodiment:** builds its own hardware (MAiRA cobot, MiPA service robot, 4NE-1 humanoid), but the Neuraverse is explicitly cross-embodiment — Neura wants to be the Android of physical AI.

**Skeptic:** 4NE-1 has been shown publicly since 2023 with no disclosed commercial deployment. "Orderbook and strategic pipeline exceeding $1B" is a deliberately soft composite metric, and Tether as anchor investor in a hardware company invites questions about capital quality.

---

## 4.14 Kepler, Astribot and the Chinese long tail

**Kepler Robotics** (Shanghai, 2023) builds the Forerunner **K2 "Bumblebee"**: 178 cm, up to 52 DoF, 11–12 DoF hands with 96 fingertip tactile contact points, 15 kg single-hand load, 2.33 kWh battery. It began SAIC-GM plant testing in April 2025 and claims mass production with "thousands of preorders" at a reported $20K–$30K. *Funding is undisclosed; the preorder count is company-stated and unaudited.*

**Astribot** (Stardust Intelligence, Shenzhen), backed by Ant Group, builds the **S1** — 1.7 m, 7-DoF arms — and markets on speed and manipulation dexterity rather than locomotion. *Funding figures unverified.*

**The shared thesis:** China's entrants bet on the **component supply chain**, not frontier models. Domestic harmonic reducers, actuators and rare-earth magnets let them undercut Western bills of materials several-fold, and cheap hardware in volume generates the data.

**Skeptic:** near-identical spec sheets across a dozen firms, heavy reliance on industrial policy and demonstration-project demand, and "mass production" announcements that consistently outrun independently verified deliveries.

---

## 4.15 Walden Robotics — the wheeled-humanoid turn

Cambridge, MA. Emerged from stealth [15 July 2026](https://spectrum.ieee.org/humanoid-robots-walden-robotics-toyota) with **$300M at a $1.1B valuation**, co-led by Toyota and Deviation Capital, with Nvidia and Boeing reported as participants. CEO: **Russ Tedrake**, simultaneously MIT professor and TRI's robotics head. Spun out of TRI, building **wheeled-base humanoids** trained by large behaviour models, and already running in a Toyota North American plant.

**Why this entry is disproportionately important:** Tedrake is the most credentialed legged-robotics academic in the United States, and he founded a company that does not build legs. His stated reasoning is the sharpest anti-humanoid argument in this book:

> "I thought about legs for 20 years; that's the class I teach at MIT. There are many reasons to build a robot with legs. But the question is, what's the addressable market?... Factories already have autonomous mobile [wheeled] robots. They already have safety cases built around AMRs. You can piggyback on that."

The market is voting with him at the margin. 2026's largest robotics rounds include **Ai² Robotics** ($735M at $3B) and **Holiday Robotics' FRIDAY** ($105M) — both wheeled humanoids.

**Skeptic:** a $1.1B valuation six months from founding, pre-product, with a sitting MIT professor as CEO. Even if the engineering argument is right, the price is a bubble artifact.

---

## 4.16 The new entrants: Meta, XPeng, and the Korean component play

**Meta** established a robotics product group inside Reality Labs, later folded into Superintelligence Labs, after a [February 2025 internal memo](https://www.reuters.com/technology/artificial-intelligence/meta-plans-investments-into-ai-driven-humanoid-robots-memo-shows-2025-02-14/) positioning robotics as its next AR-scale bet. It hired **Marc Whitten** (ex-Cruise CEO) as VP of robotics, and MIT's **Sangbae Kim** reportedly leads humanoid hardware. In [May 2026 it acquired Assured Robot Intelligence](https://techcrunch.com/2026/05/01/meta-buys-robotics-startup-to-bolster-its-humanoid-ai-ambitions/), bringing in **Lerrel Pinto** (NYU) — who now leads robotics at Meta Superintelligence Labs — and Xiaolong Wang (UCSD). The stated plan is dual-track: build consumer humanoid hardware *and* license AI, sensors and software to other manufacturers, with reported talks involving Unitree and Figure. Its research substrate is genuinely strong: FAIR's Digit 360 and Sparsh tactile stack, the PARTNR benchmark, Habitat, V-JEPA 2 world models, and Project Aria — the largest egocentric-video collection apparatus in existence. *Nothing has shipped; no launch date is disclosed. Meta has cycled through robotics strategies since 2019.*

**XPeng** unveiled next-generation **IRON** in November 2025, reportedly with 82 DoF, 22-DoF 1:1-scale hands, solid-state battery, three Turing chips, and a **VLA 2.0** model that skips the language token entirely — vision straight to action — shared across cars, robots and flying vehicles, with mass production targeted for end-2026. *(Flag: XPeng's own robotics pages were unreachable during verification and these specifications could not be independently confirmed. Treat the numbers as company-stated.)* If accurate, the cross-domain VLA is the strongest industrial claim that intelligence transfers across bodies.

**Korea** is selling shovels. **LG** launched its **Axium** actuator brand; **Samsung Electro-Mechanics** and Samsung Electronics are entering actuators and dexterous hands; **Hyundai Mobis** actuators ship inside production Atlas. With actuators at 40–70% of humanoid cost depending on whose estimate you use, this may be the better trade — and it quietly concedes that nobody knows which humanoid wins.

---

# Chapter 5 — Robot Foundation Models and "Brains"

## 5.0 The category

These companies sell intelligence rather than bodies, or sell both but lead with intelligence. The category barely existed in 2023, absorbed several billion dollars in 2025–26, and has produced exactly one company with meaningful disclosed revenue (Dyna, and even that is contested). It is also the category with the highest rate of acquisition-before-product in modern technology: two of the highest-profile 2025–26 startups were absorbed by hyperscalers within twelve months of founding.

---

## 5.1 Physical Intelligence (π)

Founded 2024 in San Francisco by **Sergey Levine**, **Karol Hausman**, **Chelsea Finn**, **Brian Ichter**, **Quan Vuong** and **Lachy Groom** — the Google Brain / Stanford / Berkeley lineage. Funding: ~$400M seed (November 2024) at $2.4B, then [$600M at a $5.6B post-money in November 2025](https://www.therobotreport.com/physical-intelligence-raises-600m-advance-robot-foundation-models/) led by Alphabet's CapitalG. *(A ~$1B round at $11B+ led by Founders Fund was reported in March 2026 but is not confirmed by any primary source. Treat $5.6B as the last verified valuation.)*

**Thesis:** "ChatGPT for robots" — one generalist policy, hardware-agnostic, sold as an intelligence layer rather than a robot.

**Model line, with dates all verified against [pi.website](https://www.pi.website/blog):**
- **π0** (31 October 2024) — a VLA using flow matching on a PaliGemma backbone; [open-sourced as openpi](https://github.com/Physical-Intelligence/openpi) in February 2025.
- **FAST** (January 2025) — action tokenisation that made autoregressive VLAs practical.
- **π0.5** (22 April 2025) — open-world generalisation to unseen homes, with ablations showing returns flattening around [~100 training homes](https://www.pi.website/blog/pi05) and that "data from other robots... is important across all evaluation conditions."
- **π\*0.6 + RECAP** (17 November 2025) — RL from experience and expert corrections via advantage-conditioned policies; 2× throughput and at least 2× fewer failures on espresso-making, laundry and box assembly.
- **π0.7** (16 April 2026) — steerability via language, metadata and world-model-generated visual subgoals; claims "the first signs of compositional generalization," including folding laundry on a bimanual UR5e with *no* laundry data for that robot.

Also notable: [online RL on real robots](https://www.pi.website/research/rlt) (March 2026) giving up to 3× speedups on contact-rich insertion from ~15 minutes of real robot data per phase, with "half of the trials from the final RL policy faster than any teleoperated demonstration"; and [Multi-Scale Embodied Memory](https://www.pi.website/research/memory) (March 2026), reaching tasks requiring up to 15 minutes of memory.

**Data:** pooled teleoperation across eight-plus platforms, human video, and autonomous on-robot experience. Weights are unusually open; the training corpus is not.

**Skeptic:** as of early 2026 the company reportedly had ~80 staff and **no announced commercialisation timeline**. Levine's own [Sporks of AGI](https://sergeylevine.substack.com/p/sporks-of-agi) essay is the field's best argument against the surrogate-data strategies its competitors use — which is intellectually admirable and commercially expensive.

---

## 5.2 Skild AI

Founded 2023 in Pittsburgh by CMU roboticists **Deepak Pathak** (CEO) and **Abhinav Gupta** (President). Funding: $300M Series A (July 2024), then [**$1.4B at over $14B valuation in January 2026**](https://www.skild.ai/blogs) led by SoftBank, with NVentures, Bezos Expeditions, Samsung, LG, Schneider Electric and Salesforce Ventures.

**Thesis:** the [**omni-bodied**](https://www.skild.ai/blogs/omni-bodied) model — a single set of weights that controls quadrupeds, humanoids, arms and mobile manipulators **without being told what body it inhabits**, and that degrades gracefully under damage. The mechanism is morphological diversity as regulariser: train across ~100,000 simulated robot bodies and the model "cannot memorize the solution for one body, it must find a strategy that works across all of them." Skild reports zero-shot recovery from limb loss and jammed wheels.

**Data:** explicitly rejects teleoperation scaling. Its position paper is blunt: ["Teleoperation happens in real-time. Even if we mobilized a global workforce to 'drive' robots 24/7, the time required to reach the trillions of tokens equivalent to an LLM is mathematically unfeasible"](https://www.skild.ai/blogs/learning-by-watching) — and it is "trapped in sterile labs." The substitute is internet human video plus ~1,000 simulated years of physics.

**Embodiment:** aggressively hardware-agnostic. Skild sells brains; partners supply bodies for security, inspection, delivery, warehouses, data centres and construction.

**Skeptic:** ~$30M reported 2025 revenue (company-stated, unaudited) against a $14B valuation is roughly a 450× multiple. The omni-bodied claims rest on internal demos; no peer-reviewed cross-embodiment benchmark comparable to π or GR00T has been published.

---

## 5.3 Generalist AI

Founded 2024 by **Pete Florence** (ex-Google DeepMind; RT-2 and Dense Object Nets lineage) with co-founders from the same group. Reported at **$400M at a ~$2B valuation** in early 2026, with Fei-Fei Li among backers.

**Thesis:** scaling laws exist for embodied intelligence, and the corpus should be **human**, not robot.

- [**GEN-0**](https://generalistai.com/blog/nov-04-2025-GEN-0) (4 November 2025) was released explicitly as a scaling-law demonstration, trained on over **270,000 hours** of real manipulation data, with the claim that "harmonic reasoning" lets a model think and act simultaneously rather than alternating planner and controller.
- [**GEN-1**](https://generalistai.com/blog/apr-02-2026-GEN-1) (2 April 2026) is the more radical claim: pretraining on **over half a million hours of human wearable-device data containing no robot data at all**, then adapting to new embodiments and tasks on first contact. Generalist reports a jump from 64% to 99% success, roughly 3× faster execution, with 10× less task-specific data.

**Embodiment:** maximally agnostic by construction — if the pretraining corpus has no robots in it, there is no body to be locked to.

**Skeptic:** "99% success" is self-reported on an undisclosed internal task suite. Wearable pretraining claims to sidestep the action-space and force-domain gap that has historically broken human-video transfer, and no third party has reproduced the scaling curve. If the claim holds, it is the most important result in the field; that is precisely why it needs independent replication.

---

## 5.4 Dyna Robotics

Founded 2024 by **Lindon Gao** (previously Caper AI, sold to Instacart), York Yang, and **Jason Ma** (ex-Google DeepMind, Eureka/DrEureka lineage). [$120M Series A at over $600M valuation in September 2025](https://www.therobotreport.com/dyna-robotics-closes-120m-funding-round-to-scale-robotics-foundation-model/), led by RoboStrategy with CRV, First Round, NVentures, the Amazon Industrial Innovation Fund, Samsung Next, LG Technology Ventures and Salesforce Ventures.

**Thesis:** deliberately anti-moonshot. Build a single-weight generalist model that is **commercially useful today**, monetise it as robots-as-a-service in laundries, hotels, restaurants and gyms, and let deployment revenue fund the path to physical AGI. **DYNA-1** claimed 99% success over 24 hours of unattended operation on tasks like napkin folding.

**Data:** a deployment flywheel — fleets running 16+ hours a day generate the data that trains the next model.

**Skeptic:** reliability numbers come from narrow, repetitive, fixture-heavy tasks. This is closer to a very good task policy than a foundation model, and the "generalist" claim is the least tested in the cohort.

---

## 5.5 Google DeepMind Robotics

The deepest lineage in the field: RT-1 (2022) → RT-2 (2023) → [Open X-Embodiment](https://robotics-transformer-x.github.io/) (2023) → ALOHA Unleashed and AutoRT (2024) → Gemini Robotics (March 2025).

[**Gemini Robotics 1.5 / ER 1.5**](https://deepmind.google/discover/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/) (September 2025) split the stack into an embodied-reasoning orchestrator and a VLA that "thinks before acting" and narrates its reasoning. The headline capability was **motion transfer**: skills trained only on ALOHA 2 worked zero-shot on Apptronik's Apollo and a bi-arm Franka.

[**Gemini Robotics 2**](https://www.therobotreport.com/google-deepmind-says-gemini-robotics-2-enables-full-body-control/) (late July 2026) added whole-body intelligence — "feet to fingertips," locomotion plus dexterous hands — in three variants: GR2 (VLA), GR ER 2 (reasoning and multi-robot teamwork), and **GR On-Device 2**, which adapts to a new morphology **typically with fewer than 200 examples**, even for bodies with "drastically different shapes, sensors, and degrees of freedom."

**Thesis:** robotics is a Gemini capability, not a separate stack.

**Embodiment:** hardware-agnostic by design and partnered rather than integrated — Apptronik, Boston Dynamics, Franka, Dexmate, SO-101.

**Skeptic:** Google has shipped VLAs since RT-1 without a commercial robot product. Access remains gated to trusted testers, and cross-embodiment transfer is demonstrated on a handful of curated platforms with broadly similar bi-arm kinematics. The "fewer than 200 examples" figure is itself the admission that transfer is a warm start, not a free lunch.

---

## 5.6 NVIDIA

Not a robot-brain startup but the substrate everyone builds on, and the company with the most obvious conflict of interest in this book — its incentive is to sell compute, not to win on policy quality.

The stack: **Isaac GR00T** humanoid VLAs (N1 in March 2025, billed as the first open humanoid foundation model; [N1.5 in June 2025](https://research.nvidia.com/labs/gear/gr00t-n1_5/); N1.6 with Cosmos Reason at CES 2026; [**N1.7** entering early access in April 2026, pretrained on 20K hours of "EgoScale" human video](https://github.com/NVIDIA/Isaac-GR00T)). **Cosmos** world foundation models (Reason, Transfer, Predict) for synthetic data and policy evaluation. **Newton**, an open-source GPU physics engine co-developed with Google DeepMind and Disney Research and governed by the Linux Foundation, now selectable inside **Isaac Lab 3.0** alongside PhysX, Warp and MuJoCo. **Jetson Thor** for on-robot inference.

Jensen Huang's framing is that "every industrial company will become a robotics company," and NVIDIA intends to be [the Android of generalist robotics](https://techcrunch.com/2026/01/05/nvidia-wants-to-be-the-android-of-generalist-robotics/).

*(Verification note: a "GR00T N2" was reported as previewed for end-2026; no N2 exists in the public repository as of August 2026.)*

**Skeptic:** GR00T checkpoints are widely downloaded and rarely the model actually deployed by serious labs. "Open" GR00T ships alongside a commercial licence. And Newton's governance move is smart precisely because it makes NVIDIA's physics the default without NVIDIA owning it outright.

---

## 5.7 Covariant — the cautionary tale

Founded 2017 as Embodied Intelligence by **Pieter Abbeel**, **Peter Chen**, **Rocky Duan** and **Tianhao Zhang** — the Berkeley RL lineage that arguably invented the robot-foundation-model pitch. Raised ~$222M. Released **RFM-1** in March 2024, a multimodal "any-to-any" model trained on years of warehouse picking data.

In [August 2024 Amazon hired the three co-founders and roughly a quarter of the staff](https://www.aboutamazon.com/news/company-news/amazon-covariant-ai-robots) and took a non-exclusive licence to the models — a "reverse acquihire" structured to avoid antitrust review. The rump company still operates; no significant model has shipped since.

**Why it belongs in a textbook:** Covariant had the best real-deployment data flywheel of its era — millions of real grasps from live customer sites, not teleoperated demos — the earliest correct thesis, and top researchers. It still ended as a licensing deal, because bin-picking generality did not translate into pricing power against integrators. Every company in this chapter should be read against that outcome.

---

## 5.8 Amazon Robotics and Frontier AI & Robotics

Amazon operates the largest robot fleet on earth. In [July 2025 it announced its millionth industrial mobile robot](https://www.aboutamazon.com/news/operations/amazon-million-robots-ai-foundation-model) alongside **DeepFleet**, a generative foundation model coordinating fleet traffic that cut travel time roughly 10%. [**Vulcan**](https://www.aboutamazon.com/news/operations/amazon-vulcan-robot-pick-stow-touch) (May 2025) is its first robot with a sense of touch — force-feedback end-of-arm tooling trained on real contact data, handling ~75% of stowed item types. **Blue Jay** (multi-arm sortation) and **Project Eluna** (agentic operations AI) followed in October 2025.

Amazon has also bought aggressively: **Rivr** (March 2026, wheeled-legged delivery), **Fauna Robotics** (March 2026, consumer humanoids, co-founded by Lerrel Pinto), and the 2024 Covariant team.

**Skeptic:** [Blue Jay was cancelled in February 2026 after six months](https://www.therobotreport.com/tag/amazon-robotics/), and Amazon cut robotics jobs in March 2026. If the best-capitalised operator on earth, with the most deployment data on earth, struggles to convert foundation-model research into durable warehouse deployments, that is evidence about the category, not about Amazon.

---

## 5.9 Meta — the platform bet

Covered as a hardware entrant in §4.16; the model side deserves separate treatment because Meta's assets are unusual.

Meta owns the largest egocentric human-video apparatus in existence (**Project Aria**, Ego4D, Ego-Exo4D), the best open tactile stack (**Digit 360**, 8M+ taxels at 1 mN sensitivity; **Sparsh**, a general-purpose tactile encoder trained on 460k tactile images; **Digit Plexus**), a strong simulation platform (Habitat), a human-robot collaboration benchmark (**PARTNR**), and a world-model line (**V-JEPA 2**) whose headline result is directly relevant: 1M+ hours of video pretraining plus **only 62 hours of robot data** yields [65–80% zero-shot pick-and-place on unseen objects](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/).

**Thesis:** be the software platform — an "Android for humanoids" — rather than the body maker, though Meta is hedging by doing both.

**Skeptic:** the egocentric-data advantage is worthless without action labels. Glasses see hands; they do not see torques. Meta has cycled through robotics strategies repeatedly since 2019 with nothing shipped.

---

## 5.10 World Labs

Founded 2024 by **Fei-Fei Li** with Justin Johnson, Christoph Lassner and Ben Mildenhall (the NeRF lineage). $230M at launch, then [$1B reported raised in February 2026](https://www.reuters.com/technology/artificial-intelligence/ai-pioneer-fei-fei-lis-world-labs-raises-1-billion-funding-2026-02-18/).

**Thesis:** set out in Li's *From Words to Worlds* manifesto (November 2025) — language is not enough; **spatial intelligence**, meaning persistent, 3D-consistent, generative world models, is AI's next frontier and the missing substrate for embodied agents.

**Releases:** **RTFM** real-time frame model (October 2025), **Marble** multimodal world model (November 2025), the **World API** (January 2026), *3D as code* (March 2026), streaming 3D Gaussian splatting (April 2026), and — the explicit robotics bridge — **"Building Worlds That Train Robots"** (July 2026), a real-to-sim-to-real engine for policy training.

**Embodiment:** World Labs builds no robot and no policy. It sells the world.

**Skeptic:** visually gorgeous 3D worlds are not physically accurate ones. Real-to-sim-to-real still inherits the contact-dynamics gap that defeats photorealistic renderers, and most near-term revenue will likely come from games and media.

---

## 5.11 Sunday Robotics

Emerged from stealth 19 November 2025, founded by **Tony Zhao** (Stanford; ALOHA and ACT, later Physical Intelligence) and **Cheng Chi** (Diffusion Policy, UMI). Reported ~$35M from Benchmark and Conviction at launch, and a reported $165M raise in March 2026. *Both figures unconfirmed by primary sources.*

**Thesis:** the bottleneck is not architecture but **data provenance**. Teleoperation is a "scaling deadlock," so exploit "8 billion humans" instead. The mechanism is a **Skill Capture glove** whose geometry and sensing are matched to the robot's hand, plus **Skill Transform** software that strips embodiment-specific detail at roughly 90% fidelity.

Their headline model [**ACT-1** was trained on *zero robot data*](https://www.sunday.ai/journal/no-robot-data) yet completes a table-to-dishwasher sequence of 68 interactions across 21 objects, generalises zero-shot to unseen homes, folds socks and pulls espresso. **Memo** is the home robot; an ACT-2 preview appeared in July 2026.

**Embodiment:** deliberately *vertically* integrated — the glove only works because they control the hand.

**Skeptic:** hand-matched gloves make the model as embodiment-locked as any teleoperation dataset, which contradicts the field's cross-embodiment thesis. And "a robot in every home" is the graveyard slogan of consumer robotics.

---

## 5.12 Field AI

Founded 2023 by **Ali Agha** (ex-NASA JPL, led the DARPA SubT-winning CoSTAR team). Reported roughly $405M raised across 2025 rounds at a ~$2B valuation from Bezos Expeditions, Prosperity7, Temasek and Intel Capital. *Figures unverified.*

**Thesis:** the generalist-manipulation crowd is solving the wrong problem. Field AI targets **unstructured, GPS-denied, safety-critical environments** — construction, mines, substations, offshore — where failure is expensive and connectivity is absent. Its [Field Foundation Models](https://www.fieldai.com/) are "risk-aware," built around a **Belief World Model** that maintains explicit uncertainty and predicts what it does *not* know, running fully on-edge.

**Embodiment:** firmly hardware-agnostic; the **EDGE** "universal brain" deploys across quadrupeds, wheeled platforms and humanoids.

**Skeptic:** FFMs are largely navigation-and-inspection autonomy rebranded in foundation-model vocabulary. There is little published evidence of the dexterous manipulation or language-conditioned generalisation that defines the category, and almost no peer-reviewed benchmarking.

---

## 5.13 RAI Institute (Marc Raibert)

Founded 2022 as the Boston Dynamics AI Institute, renamed 2024, funded by Hyundai. Structurally the counterweight to the VLA consensus: a research institute with no obligation to ship.

Its stated pillars combine learning with "principled approaches" — model-based control and optimisation fused with learning rather than end-to-end imitation. Recent work: **AthenaZero** (April 2026), a bimanual robot that juggles barehanded from onboard vision; the **ReLIC** loco-manipulation framework (2025); whole-body manipulation on Spot combining RL with sampling-based optimisation (2025); an ultra-mobility wheeled platform; and a run of [2026 posts on scaling simulation and robot data collection](https://rai-inst.com/resources/blog/).

**Thesis:** athletic, dynamic, contact-rich intelligence will not fall out of scaling teleoperation demonstrations.

**Skeptic:** Raibert's approach has produced the world's most agile robots and almost no generalisation. AthenaZero juggles but cannot be told to make coffee — which is precisely the bet the VLA labs are making.

---

## 5.14 Genesis AI

Founded December 2024 by CMU's **Zhou Xian** and ex-Mistral **Théophile Gervet**; [launched with a $105M seed](https://techcrunch.com/2025/07/01/genesis-ai-launches-with-105m-seed-funding-from-eclipse-khosla-to-build-ai-models-for-robots/) co-led by Eclipse and Khosla in July 2025.

**Thesis:** the purest sim-first bet in the field. A proprietary, very fast physics engine — spun out of an 18-university collaboration — makes synthetic data cheaper than teleoperation. The open-source [Genesis engine](https://github.com/Genesis-Embodied-AI/Genesis) unifies rigid, FEM, MPM, PBD/SPH and IPC solvers.

**Skeptic:** the original December 2024 speed claims drew community scepticism and the current documentation no longer foregrounds FPS numbers. Competing directly with NVIDIA's Isaac stack on physics is a difficult place to stand.

---

## 5.15 Open source: LeRobot, Open X-Embodiment, K-Scale

**[LeRobot](https://github.com/huggingface/lerobot)** (Hugging Face) is now the de facto open stack, with 26k+ GitHub stars. [v0.5.0](https://huggingface.co/blog/lerobot-release-v050) (March 2026) and [v0.6.0](https://huggingface.co/blog/lerobot-release-v060) (July 2026) added world-model policies, a model zoo spanning GR00T N1.7, MolmoAct2, EO-1 and EVO1, reward models, six benchmarks under a unified `lerobot-eval` CLI, FSDP multi-GPU training and DAgger-style human-in-the-loop rollouts. It unifies SO-100/SO-101, Koch, LeKiwi, ALOHA and Unitree G1 hardware with ACT, Diffusion Policy, π0, SmolVLA and GR00T. Hardware: **Reachy Mini** at $299/$449, a 3D-printed LeRobot Humanoid, and the **Grabette** open manipulation-data recorder. NVIDIA partnered to embed Isaac/GR00T directly.

**[Open X-Embodiment](https://robotics-transformer-x.github.io/)** (October 2023) remains the canonical cross-embodiment corpus — 1M+ episodes, 22 embodiments, 527 skills, from 60 datasets across 34 labs — and has seen no comparable successor release from the Western academic community.

**K-Scale Labs** (YC W24) builds open-source humanoids. *(A widely-circulated claim that K-Scale shut down in late 2025 could not be substantiated; its GitHub organisation shows repository activity into mid-2026. Treat reports of its closure as unverified.)*

**Skeptic:** open weights without open *data* is hollow. No lab has released anything approaching π's or GEN-1's training corpus, so LeRobot democratises inference, not capability.

---

## 5.16 The absorption pattern

Worth stating as its own entry, because it is the category's defining structural fact.

- **Covariant** → Amazon reverse-acquihire, August 2024.
- **Fauna Robotics** (founded January 2026, Sprout humanoid) → [acquired by Amazon 19 March 2026](https://www.therobotreport.com/tag/amazon/), roughly two months after emerging.
- **Assured Robot Intelligence** (Lerrel Pinto) → acquired by Meta, May 2026.
- **Vayu Robotics** → Serve Robotics, September 2025.
- **Diligent Robotics** → Serve Robotics, January 2026.
- **Intrinsic** → moved out of Alphabet's Other Bets [into Google itself, February 2026](https://www.therobotreport.com/tag/intrinsic/).
- **Kind Humanoid** → 1X, December 2024.

The pattern says something uncomfortable: in a field where the binding constraint is data and compute, and where neither is available to a startup at hyperscaler scale, the realistic exit for a robot-brain company may be an acquihire rather than an independent business. Physical Intelligence, Skild and Generalist are all betting that they are the exceptions.
---

# Chapter 6 — Applied Manipulation and Deployed Robotics

## 6.0 Why this chapter matters more than its funding suggests

The companies in Chapters 4 and 5 have raised, collectively, well over $20B. The companies in this chapter have raised a fraction of that and are the only ones with unambiguous evidence that robots are doing paid work at scale. If the data flywheel thesis is correct — that deployment generates the data that generates the intelligence — then this is where the flywheel is actually spinning.

Read each entry for one thing: **what is the data loop, and is it a manipulation loop or a logistics loop?** The difference decides whether these companies are quietly accumulating the corpus everyone else is trying to buy, or merely accumulating telemetry.

---

## 6.1 Dexterity AI

**Thesis:** physical AI must be earned in production, not in simulation. Build task-specific superhuman manipulation for freight, then generalise upward from deployment logs.

**Deployed:** DexR multi-arm parcel handling and **Mech**, a dual-armed mobile manipulator for truck and trailer loading, [launched March 2025](https://www.therobotreport.com/dexterity-launches-mech-dual-armed-mobile-manipulator-for-truck-unloading/) and manufactured with Sanmina. Customers include FedEx (autonomous trailer loading), a Fortune 100 retailer, and Sagawa Express.

**Data:** the clearest deployment-to-model flywheel in the sector. In [March 2026 Dexterity announced **Foresight**](https://www.dexterity.ai/blog), a "physics-consistent world model" the company states was trained on **experience from over 100 million autonomous actions in production**. It runs a 4D box-packing agent deciding in under 400 ms, spanning six applications, four robot types and five hand types.

**Embodiment:** anthropomorphic but not humanoid — Dexterity markets Mech as an "industrial superhumanoid": arms and torso where useful, wheels not legs.

**Funding:** [$95M in March 2025 at a $1.65B valuation](https://www.therobotreport.com/dexterity-picks-up-95m-funding-container-unloading-robots/), after a $140M Series B.

**Skeptic:** freight loading is a narrow, high-cycle-time niche. 100 million "actions" are heavily correlated box picks, and Foresight's generality is a marketing claim not yet independently benchmarked.

---

## 6.2 Ambi Robotics

**Thesis:** a Berkeley spin-out from Ken Goldberg's group, betting that simulation pretraining plus continuous fleet data beats hand-engineering for parcel induction and sortation.

**Deployed:** AmbiSort parcel sorters, [AmbiStack](https://www.ambirobotics.com/ambistack) mixed-case palletising (January 2025), AmbiVision (March 2026), and an AI Skill Suite on AmbiOS. Anchor customer Pitney Bowes since 2021, plus OSM Worldwide; a 2026 integration with Pickle Robot links truck unloading to palletising.

**Data:** **PRIME-1**, a warehouse foundation model announced January 2025, trained on years of real production picks. Goldberg's own [*Science Robotics* piece](https://docs.google.com/document/d/e/2PACX-1vTc9dKld9Qol0v01n4ilJk3T9a-D4f1I26V1DbWNZKjPbgYRTOYY4xxNrc7yFqcJFMVQ0phJyDQflwT/pub) cites Ambi as having accumulated **22 years of real robot data in four years** while sorting 100M+ packages — the single best existence proof for the deployment-flywheel thesis, and notably it comes from the field's loudest data-scarcity skeptic.

**Embodiment:** aggressively non-humanoid — gantries and fixed arms with suction, optimised for throughput per square foot.

**Skeptic:** parcel sortation is commoditising, and Ambi is smaller than Dexterity or Nimble. *No verified 2025–2026 funding round was found; treat later funding claims as unverified.*

---

## 6.3 Path Robotics

**Thesis:** welding is the highest-value labour shortage in heavy industry, and it is fundamentally a *perception* problem, not a motion-planning problem.

**Deployed:** AW-2 autonomous welding cells and **Rove**, a mobile welding system, sold into fabrication shops, defence and shipbuilding — including a deal with [America's largest military shipbuilder](https://www.ohiotechnews.com/path-robotics-deal-americas-largest-military-shipbuilder/).

**Data:** unusually rich. Path scans each part in situ, generates the weld path, and closes the loop on the resulting bead — laser scans, seam geometry and inspection outcomes on parts that are never identical, which is precisely the regime where teach-pendant programming fails. In 2025 it launched [**Obsidian**](https://www.path-robotics.com/blog/2025-year-in-review), a foundational AI model for welding.

**Funding:** [$100M Series D (October 2024)](https://www.einpresswire.com/article/751632392/path-robotics-secures-100m-of-venture-capital-funding-ai-enabled-robotic-welding-company-closes-series-d-funding); the company reported surpassing $100M in bookings in 2025.

**Skeptic:** welding data transfers poorly outside welding. The moat is vertical, not a step toward general manipulation, and defence certification cycles are slow.

---

## 6.4 Chef Robotics

**Thesis:** the loudest counterargument to simulation-first robotics. Food is deformable, organic and variable, so the only path is real production data at volume — and the way to get it is to charge customers for it.

**Deployed:** ChefOS-driven ingredient-portioning arms in high-mix food production, sold as RaaS, in more than a dozen facilities across the US, Canada and Europe since Amy's Kitchen in 2022.

**Data:** Chef reached [**100 million meal servings in April 2026**](https://www.therobotreport.com/chef-robotics-completes-100-million-product-servings-milestone/) — 1M in April 2023, 10M in January 2024, 50M in May 2025. CEO Rajat Bhageria's public argument is that RaaS deliberately trades margin for a data flywheel: start with high-volume, lower-complexity tasks, then climb.

**Funding:** [$43.1M Series A (April 2025)](https://www.therobotreport.com/chef-robotics-brings-in-43m-to-deploy-more-food-assembly-robots/) led by Avataar Ventures.

**Skeptic:** 100 million servings is 100 million scoops of a handful of ingredient classes — impressive throughput, questionable diversity. The claim that it exceeds all other food robotics data combined is Chef's own and unaudited.

---

## 6.5 Nimble Robotics

**Thesis:** sell the whole fulfilment centre, not a picking arm. Vertical integration lets you collect data across storage, retrieval, pick, pack and sort rather than one station. Nimble was also the archetypal *teleoperation-as-training-signal* company: remote human pilots handled exceptions, and each intervention was a labelled demonstration.

**Deployed:** a full autonomous fulfilment system plus a Cloud Logistics Platform; CEO Simon Kalouche claims it [replaces "over a dozen individual pieces of equipment"](https://www.therobotreport.com/nimble-picks-up-106m-scale-general-purpose-fulfillment-robot/) and removes as much as 70% of cost.

**Funding:** [$106M Series C at a $1B valuation](https://nimble.ai/news/nimble-closes-106-million-series-c-funding-round-at-1b-valuation-scales-fully-autonomous-fulfillment-with-fedex), co-led by FedEx alongside a commercial agreement.

**Skeptic:** the honest metric for a human-in-the-loop company is the intervention rate, and Nimble does not publish it. Owning the whole stack means capital intensity and slow deployments.

---

## 6.6 Collaborative Robotics (Cobot)

**Thesis:** Brad Porter (ex-Amazon Robotics VP) argues the humanoid form is a distraction. Solve the *dispatch* problem — knowing what work exists — and a wheeled manipulator captures most of the value.

**Deployed:** Proxie, a mobile cart-mover; [Proxie Gen 2 (June 2026)](https://www.therobotreport.com/cobots-proxie-gen-2-robot-adds-autotasking-mobile-manipulation/) tows 1,500 lb carts, lifts 220 lb, uses 40% fewer parts, and adds an optional dual-arm configuration. Customers include Mayo Clinic and Maersk; deployments start at $5,000/month.

**Data:** the standout claim is **autotasking** — multimodal models build a live map and infer when material needs moving without WMS integration. At Maersk, roughly **95% of cart movements happened without human task assignment**. Twenty-eight Gen 1 units logged nearly 13,000 operating hours feeding fleet learning.

**Funding:** $30M Series A (2023), $100M Series B (April 2024). *Later rounds unverified.*

**Skeptic:** 28 units and 13,000 hours is a pilot, not a fleet, and the manipulators remain research-grade.

---

## 6.7 Diligent Robotics

**Thesis:** hospitals are the best-instrumented, most labour-starved indoor environment in the developed world, and a socially-aware mobile manipulator can accumulate operational hours there faster than anywhere else.

**Deployed:** Moxi, a one-armed mobile robot doing pharmacy, lab and supply deliveries. Moxi 2.0 (October 2025) was "built for AI." Partnership with Swisslog Healthcare; expansion into senior living.

**Data:** [1 million picks by February 2025](https://www.therobotreport.com/tag/diligent-robotics/) and 300,000 pharmacy deliveries by July 2025 — mostly navigation, elevator and door interaction, and constrained grasps, deep in human-populated corridors.

**Embodiment:** deliberately one arm and a head — social legibility over dexterity.

**Outcome:** in [January 2026 Serve Robotics agreed to acquire Diligent](https://www.serverobotics.com/press). Ten years in, unit economics were never proven publicly.

---

## 6.8 RightHand Robotics

**Thesis:** the oldest pure-play piece-picking bet — a "model-free" grasping stack (hybrid suction and finger gripper plus learned grasp proposal) should pick millions of unseen SKUs without per-item modelling.

**Deployed:** [RightPick](https://www.righthandrobotics.com/) cells for e-commerce, pharmaceutical, apparel and grocery fulfilment, integrated with AutoStore, AS/RS, AMRs and sorter induction, at cycle times as fast as ~3 seconds per pick. European customers include apo.com Group and Apotea.

**Data:** every pick produces a grasp-attempt-and-outcome record across an enormous SKU tail — arguably the cleanest large-scale grasp dataset in commercial robotics. RightHand publishes almost nothing about how it uses this for model training, which is a real transparency gap.

**Funding:** roughly $100M+ historically; in [March 2025 Rockwell Automation took a strategic investment](https://www.therobotreport.com/tag/righthand-robotics/) and became a distribution partner — a partial-exit signal.

**Skeptic:** the category has been "about to break out" since 2018, and RightHand has been overtaken in narrative by newer entrants.

---

## 6.9 Intrinsic (Google)

**Thesis:** the bottleneck in industrial robotics is not hardware or even policy quality but *programming cost*. A hardware-agnostic software layer that lets non-experts specify tasks unlocks the installed base.

**Deployed:** Flowstate, a visual robot-application platform; an "Intelligence Cell" (June 2026) aimed at eliminating manual robot coding. Intrinsic owns Open Source Robotics Corp (ROS/Gazebo stewardship), partners with NVIDIA on Isaac Manipulator, and announced a Foxconn collaboration in November 2025.

**Data:** breadth over depth — telemetry and task specifications across many customers' heterogeneous cells, rather than one deep vertical stream.

**The decisive fact:** in [February 2026 Intrinsic left Alphabet's Other Bets and joined Google](https://www.therobotreport.com/tag/intrinsic/), with Wendy Tan White reporting to Hiroshi Lockheimer and the team working closely with DeepMind on Gemini integration. Read charitably that is consolidation of Alphabet's physical AI. Read skeptically it is absorption after five years and several strategy resets without disclosed commercial traction.

---

## 6.10 The warehouse incumbents: Symbotic and Mytra

**Thesis:** most warehouse value comes from case- and pallet-level movement in structured storage, where reliability and throughput beat learned dexterity. Buy or build the mechanism; treat AI as an optimiser rather than a policy.

**Symbotic** acquired [Walmart's Advanced Systems and Robotics unit for $200M in January 2025](https://www.therobotreport.com/tag/symbotic/) with a commitment to build Walmart's Accelerated Pickup and Delivery centres, hired **James Kuffner** (ex-TRI CEO, Google robotics co-founder) as CTO the same month — a clear signal it intends to buy into learned manipulation — and acquired autonomous forklift maker Fox Robotics in February 2026.

**[Mytra](https://www.mytra.ai/)** offers 3D cellular storage: bots moving inside a lattice, 3,000 lb lift via a "Helix" mechanism, claimed 99.999% uptime, eleven cameras per bot, 150 presentations per hour, slotless inventory.

**The key contrast with §6.1–6.8:** both generate colossal telemetry, but it is *logistics* data — throughput, congestion, uptime — not contact-rich manipulation data. Telemetry is not a manipulation corpus.

**Skeptic:** Symbotic has restated financials and remains customer-concentrated in Walmart; Mytra's uptime and throughput figures are vendor-supplied.

---

## 6.11 Manufacturing: Bright Machines and Machina Labs

**Bright Machines** sells "software-defined manufacturing" — robot cells composed into microfactories — and has repositioned around [AI infrastructure assembly](https://www.brightmachines.com/newsroom/), building servers and racks for the AI buildout itself, with a Microsoft Azure partnership. Roughly $400M raised since 2018.

**Machina Labs** applies two robot arms as an incremental sheet-forming pair, replacing hard tooling: [$124M raised in February 2026](https://www.therobotreport.com/tag/machina-labs/), a July 2026 Lockheed Martin deal to qualify robotically formed parts for the JASSM missile, and a September 2025 Toyota partnership.

**Why Machina's data loop is interesting:** each formed part yields a springback and deviation measurement against CAD, so the model learns *material response* — a physical-property dataset no simulator currently reproduces well. This is a genuinely different data class from every other entry in this chapter.

**Skeptic:** both are capital-heavy; defence qualification cycles are long, and "software-defined manufacturing" has repeatedly failed to generalise beyond the launch customer's product family.

---

## 6.12 Serve Robotics — a natural experiment in whether scale alone buys data

**Why it belongs here:** sidewalk delivery is the only embodied category where a startup has put thousands of units into uncontrolled outdoor environments. It is the cleanest test of whether *deployment scale alone* produces a data advantage.

**Deployed:** by December 2025 Serve had [2,000+ robots deployed](https://www.therobotreport.com/tag/serve-robotics/) via Uber Eats across Los Angeles, Miami, Dallas and Atlanta — a twentyfold fleet expansion during 2025.

**The tell:** Serve has been acquisitive precisely because fleet scale did *not* buy it the capability it wanted. It bought **Vayu Robotics** (September 2025) to combine "Serve's autonomy stack and dataset with Vayu's AI foundation models," bought **Voysys**' video-streaming assets (August 2025) because teleoperation bandwidth is the hidden cost of remote supervision, and then bought **Diligent Robotics** (January 2026) to move from navigation into manipulation indoors.

**The lesson:** 2,000 robots and millions of miles of sidewalk produced navigation and pedestrian-interaction data that transfers poorly to manipulation. Scale is necessary but not sufficient; *the right kind of scale* is what matters.

---

# Chapter 7 — The Robot Data Supply Chain

## 7.1 Teleoperation vendors and human data farms

The data-labelling industry has repositioned wholesale around "Physical AI," but only some of it genuinely touches robots.

**Verified robot-data operators.** [**Scale AI**](https://scale.com/robotics) runs a Physical AI Data Engine claiming **1,000+ hours of demonstration data uploaded daily**, across three collection modalities: teleoperated bimanual manipulators, *Scale Harness* (an egocentric wearable rig for collection without a robot), and operation of customer hardware — across data factories, residential homes and industrial sites. [**Objectways**](https://www.objectways.com/) explicitly lists teleoperation demonstrations, egocentric capture, robot trajectories and RGBD collection, with 2,200+ specialists across eight US and India sites. [**Encord**](https://encord.com/) markets itself as "the multimodal data layer for Physical AI," supporting LiDAR and sensor-fusion annotation plus teleoperation facilities; customers include Woven by Toyota and Zipline. [**Micro1**](https://micro1.ai/) lists a robotics line for high-fidelity real-world robotics data.

**Do not assume.** **Mercor** — valued at $10B in October 2025 — is an expert marketplace for *knowledge* work; no evidence of robot data collection was found. Turing's robotics claims could not be verified.

**Skeptic's view:** teleoperation hours are the new token count — easy to sell, hard to audit for diversity, and structurally success-biased, because operators do not deliberately produce failures and vendors are not paid for them. Chapter 8 explains why that bias matters more than the raw number.

---

## 7.2 Egocentric and wearable human data

The bet: humans wearing sensors are the cheapest hands in the world, and about a billion times more numerous than robots.

[**Ego4D**](https://ego4d-data.org/) (February 2022) set the template — **3,670 hours of video from 923 participants across 74 locations in 9 countries**, a 13-university consortium with Meta AI, and benchmarks for hand-object interaction and action forecasting.

[**Ego-Exo4D**](https://ego-exo4d-data.org/) (December 2023) added the critical third-person view: **1,286.3 hours, 5,035 takes, 740 participants, 13 cities, 123 sites**, with Aria glasses time-synchronised to four or five stationary GoPros, plus seven-microphone audio, IMU, eye gaze, 6-DoF localisation and point clouds. Cooking alone is 564 hours.

[**Project Aria**](https://www.projectaria.com/) now serves 200+ partner institutions. **Aria Gen 2** adds four SLAM cameras, two eye-tracking cameras, PPG heart-rate sensing, a contact microphone, GNSS, on-device hand and eye tracking, and **6–8 hours of battery** versus 1–2 for Gen 1.

[**EgoDex**](https://arxiv.org/abs/2505.11709) (Apple, ICLR 2026) contributes **829 hours** of Apple Vision Pro egocentric video with 3D finger tracking over 194 tasks — the most robot-usable egocentric corpus because the hand pose is already estimated.

**Skeptic's view:** egocentric video gives you hands and intent but no forces, no torques, and no action labels. The inverse-dynamics step is where the information is lost, and it is not a solved problem. Meta's own V-JEPA 2 result — 1M+ hours of video plus 62 hours of robot data — is the honest framing: video is a *prior*, and you still need robot data to ground it.

---

## 7.3 Low-cost open data-collection hardware

The most consequential cost curve in robotics, and the layer where academia is unambiguously ahead of industry.

| System | Origin | What it is | Key number |
|---|---|---|---|
| [**UMI**](https://umi-gripper.github.io/) | Stanford/Columbia/TRI, RSS 2024 | Handheld parallel-jaw gripper + wrist GoPro | **111 demos/hour** vs 35 for SpaceMouse teleop; ~48% of bare-hand speed; two-minute setup in a new environment |
| [**DexUMI**](https://dex-umi.github.io/) | Stanford/Columbia/CMU/NVIDIA, CoRL 2025 | Wearable exoskeleton for multi-fingered hands + robot-hand video inpainting | **86% average success** on XHand and Inspire Hand |
| [**DEXOP**](https://dex-op.github.io/) | MIT Improbable AI + Adelson, 2025 | *Passive* exoskeleton mechanically coupling human to robot fingers, with full-hand tactile capture | Higher task performance *per unit collection time* than teleoperation |
| [**ALOHA / Mobile ALOHA**](https://mobile-aloha.github.io/) | Stanford, 2023–24 | Bimanual leader-follower teleop rig, then with a mobile base | Up to **90% success from 50 demos/task** when co-trained with static data |
| [**TWIST2**](https://arxiv.org/abs/2511.02832) | Stanford Movement Lab, Nov 2025 | Mocap-free whole-body humanoid capture: VR headset + $250 2-DoF robot neck | ~**100 demos in 15 minutes** |
| [**LeRobot**](https://github.com/huggingface/lerobot) + SO-100/SO-101 | Hugging Face | Open software stack + sub-$500 arms | Reachy Mini at **$299/$449** |

The intellectual move that unifies UMI, DexUMI and DEXOP is worth stating plainly, because it is the most important idea in robot data collection since teleoperation itself: **rather than making the robot easier for a human to drive, make the human's natural demonstration already be in the robot's action space.** DEXOP is the purest version — a mechanical linkage means the human's finger motion *is* the robot's finger motion, and the tactile sensors are on the same surfaces, so no retargeting or inverse-dynamics estimation is needed at all.

---

## 7.4 The large open datasets

| Dataset | Date | Scale | Notes |
|---|---|---|---|
| [Open X-Embodiment](https://robotics-transformer-x.github.io/) | Oct 2023 | 1M+ trajectories, 22 embodiments, 527 skills, 160,266 tasks, 60 datasets, 34 labs | The canonical cross-embodiment pool; RT-1-X and RT-2-X trained on it |
| [DROID](https://droid-dataset.github.io/) | 2024 | 76,000 trajectories, **350 hours**, 564 scenes, 86 tasks, 50 collectors, 13 institutions, 12 months | Standardised Franka + ZED rig; the diversity benchmark |
| [BridgeData V2](https://rail-berkeley.github.io/bridgedata/) | CoRL 2023 | 60,096 trajectories (50,365 teleoperated, 9,731 scripted), 24 environments, 13 skills | WidowX 250; the low-cost precedent |
| [AgiBot World Colosseo](https://arxiv.org/abs/2503.06669) | Mar 2025 | **1,001,552 trajectories, 2,976.4 hours**, 217 tasks, 100+ robots, 4,000 m² facility | Largest purpose-built real-robot corpus; GO-1 reports ~30% gain over Open-X pretraining |
| [RoboMIND](https://arxiv.org/abs/2412.13877) | RSS 2025 | 107k trajectories, 479 tasks, 96 object classes, four embodiments, **plus 5,000 labelled failures** | The failure labels are rare and valuable |
| [Galaxea Open-World](https://opengalaxea.github.io/GalaxeaVLA/) | 2025 | 11 real residential, retail and office sites | Mobile dual-arm, genuinely in-the-wild |
| [EgoDex](https://arxiv.org/abs/2505.11709) | ICLR 2026 | **829 hours** human egocentric with 3D finger tracking, 194 tasks | Human, not robot — see §7.2 |

Two observations. First, the Chinese entries now dominate on raw scale, and AgiBot World specifically is the largest purpose-built corpus in existence. Second, **almost nobody publishes failures.** RoboMIND's 5,000 labelled failures are an outlier, and the absence of failure data is arguably the field's most under-discussed dataset problem — you cannot learn a good reward model, or a good uncertainty estimate, from a corpus of successes.

---

## 7.5 Simulation stacks

**[Isaac Sim](https://developer.nvidia.com/isaac/sim)** is now Apache-2.0 open source on Omniverse, with **Isaac Lab** as the GPU-accelerated learning framework and **Isaac Lab Arena** for scalable in-sim policy evaluation. The consolidating development is **Newton**: an open-source GPU physics engine co-developed with Google DeepMind and Disney Research, **governed by the Linux Foundation**, now selectable in Isaac Lab alongside PhysX, Warp and MuJoCo. That is the first credible attempt at a shared physics substrate for the whole field, and its governance structure is deliberately neutral.

**[MuJoCo Playground](https://github.com/google-deepmind/mujoco_playground)** wraps MJX/JAX and MuJoCo-Warp with locomotion, dexterous and vision-based environments framed explicitly around sim-to-real.

**[ManiSkill3](https://github.com/haosulab/ManiSkill)** (RSS 2025, SAPIEN-based) claims 30,000+ FPS RGBD-plus-segmentation collection on a single RTX 4090 with heterogeneous parallel scenes.

**[Genesis](https://github.com/Genesis-Embodied-AI/Genesis)** unifies rigid, FEM, MPM, PBD/SPH and IPC solvers. Its original speed claims drew community scepticism and current documentation no longer foregrounds them.

**[Drake](https://drake.mit.edu/)** (TRI/MIT) remains the rigorous outlier — optimisation-first, hydroelastic contact, favoured where correctness matters more than throughput.

**[OmniGibson / BEHAVIOR-1K](https://behavior.stanford.edu/)** provides 1,000 household activities, 50 interactive scenes and 10,000+ objects with fluids, heat, cloth and transparency.

**Synthetic-data generators.** [GR00T-Dreams / DreamGen](https://github.com/NVIDIA/GR00T-dreams) fine-tunes Cosmos-Predict, generates robot video from one image plus a language instruction, then extracts actions with an inverse-dynamics model into LeRobot format. [NVIDIA Cosmos](https://www.nvidia.com/en-us/ai/cosmos/) is the world-foundation-model line for this. World Labs' real-to-sim-to-real engine (§5.10) and MSL's Gaussian-splatting reconstructions (§2.9) attack the same problem from the reconstruction side.

**The unresolved question:** simulation solves *appearance* diversity and *kinematic* diversity well and *contact dynamics* badly. Every honest practitioner in this book agrees on that; they disagree only on whether contact matters enough to be disqualifying.

---

## 7.6 Evaluation and benchmarking

Robot evaluation is the field's least-solved problem, and unusually, everyone knows it.

The structural difficulty: real-robot evaluation is unreproducible — different labs, lighting, object instances, reset procedures and human judgement — while simulation benchmarks saturate and correlate imperfectly with hardware.

**[LIBERO](https://libero-project.github.io/main.html)** (Spatial/Object/Goal/Long/100 suites) has become the default VLA leaderboard and is widely regarded as near-saturated. *(Note: "LIBERO is solved" is community lore, not a documented result from the project itself.)*

**[SIMPLER](https://simpler-env.github.io/)** (2024, UCSD/Stanford/Berkeley/DeepMind) attacks the correlation question head-on: green-screening and texture matching close the visual gap, system identification closes the control gap, and it introduces **Mean Maximum Rank Violation (MMRV)** to measure whether simulation *ranks* policies the way real hardware does — a much more useful target than absolute success rate.

**[RoboArena](https://arxiv.org/abs/2506.18123)** (Levine et al., 2025) abandons standardisation entirely in favour of crowd-sourced, double-blind *pairwise* comparisons on distributed DROID platforms — 7 institutions, 600+ real-robot pairwise trials, 7 generalist policies — arguing this ranks policies more accurately than centralised evaluation ever could.

**[BEHAVIOR Challenge 2026](https://behavior.stanford.edu/challenge/index.html)** pushes the opposite direction: 100 full-length household tasks in 7 scenes, 20,000 teleoperated demos totalling 1,950 hours, scored by BDDL partial credit, with π0.5 and GR00T N1.7 as baselines and an October 2026 deadline.

**[TRI's lbm_eval](https://github.com/ToyotaResearchInstitute/lbm_eval)** is the methodology, not the benchmark: blind evaluators, sufficient rollouts per pair, and quality control on the graders themselves.

**What does not exist:** no benchmark measures **data-efficiency per dollar of collection**. That is the number that would actually adjudicate the arguments in Chapter 9, and its absence is why those arguments remain unresolved.
---

# Chapter 8 — The Data Bottleneck

## 8.1 Why robot data is not like internet text

The central asymmetry is that text and images are **exhaust**. Humans produce them anyway, for their own reasons, and the internet stores them for free. Robot data is not exhaust: every trajectory must be deliberately produced by a specific human operating a specific machine in a specific room, and it is worthless without synchronised action labels.

Ken Goldberg put a number on the gap in [*Science Robotics*, 27 August 2025](https://docs.google.com/document/d/e/2PACX-1vTc9dKld9Qol0v01n4ilJk3T9a-D4f1I26V1DbWNZKjPbgYRTOYY4xxNrc7yFqcJFMVQ0phJyDQflwT/pub):

> "The amount of internet-scale data (texts and images) used to train contemporary large vision language models is on the order of 100,000 years — it would take a human that long to read or view it."

The largest teleoperated robot dataset, he notes, is roughly *one year* of data. Extrapolating current collection rates, he concludes that a general-purpose robot trained on a ChatGPT-sized corpus of robot data "will be available in... 100,000 years." He then prices the alternatives and finds each wanting: YouTube holds roughly 35,000 years of video, but extracting precise 3D motion from 2D footage is unsolved; and simulation still fails on contact-rich manipulation, where submillimetre geometric inaccuracies destroy contact predictions.

The inventory bears him out. Against 100,000 years:

- Open X-Embodiment: 1M+ trajectories pooled from 34 labs.
- DROID: **350 hours**, 50 collectors, 13 institutions, twelve months of work.
- AgiBot World: **2,976.4 hours** — the largest purpose-built corpus in existence, requiring 100+ robots in a dedicated 4,000 m² facility.

Three thousand hours is a rounding error against a hundred thousand years. This single ratio explains almost every strategic decision described in Chapters 4 through 7.

## 8.2 Do scaling laws hold?

Partially, and with an important twist that reframes the whole problem.

Lin et al., ["Data Scaling Laws in Imitation Learning for Robotic Manipulation"](https://arxiv.org/abs/2410.18647) (2024), collected 40,000+ demonstrations and ran 15,000+ real rollouts to answer the question empirically. Their finding: generalisation follows a **power law in the number of environments and objects**, not in raw demonstration count. Beyond a threshold of demonstrations *per environment*, additional demos in that environment add almost nothing. Their headline: four collectors working a single afternoon — across many environments and objects — produced roughly 90% success on novel objects in unseen environments.

Physical Intelligence's [π0.5 ablations](https://www.pi.website/blog/pi05) report the same shape, with returns flattening around **~100 training homes**.

This is the twist that matters: **the bottleneck is diversity, not volume.** A million trajectories of one robot doing one task in one room is worth less than ten thousand trajectories spread across a thousand rooms. It reframes the collection problem from "how do we get more hours" to "how do we get more *situations*," which is why in-the-wild interfaces like UMI and human-video pretraining are strategically important out of proportion to their raw hour counts.

## 8.3 The most rigorous negative control

TRI's ["A Careful Examination of Large Behavior Models for Multitask Dexterous Manipulation"](https://arxiv.org/html/2507.05331v1) is the field's methodological high-water mark, and its conclusions are deliberately unflattering to its own programme.

Training on ~1,700 hours, with **blind evaluators, 1,800 real-world trials, 50 rollouts per task-policy pair**, and 27% of rollouts re-scored for quality control (which revealed a 2.31% success-rate discrepancy between graders), TRI found that pretraining genuinely helps: finetuned large behaviour models need "less than 30% of the data needed for training from scratch" in simulation, and on one real task 15% of the data sufficed.

But the gains are **smooth and gradual, with no discontinuity at current scales.** There is no emergent phase transition in sight. Whatever is coming, it is not arriving as a sudden capability jump at 10,000 hours.

That paper is as much an indictment of the field's evaluation hygiene as it is a scaling result. Before it, the modal published result was a video and a success rate from an unspecified number of author-scored trials. After it, that is no longer defensible.

## 8.4 The failure-data problem

Almost every dataset in Chapter 7 is a corpus of successes. Teleoperators do not deliberately produce failures; vendors are not paid for them; and papers do not report them. RoboMIND's 5,000 labelled failures are a conspicuous outlier.

This matters for three reasons. You cannot train a good **reward model** without negative examples — which is why Finn's [RoboReward](https://arxiv.org/abs/2601.00675) had to build its own benchmark. You cannot train a good **uncertainty estimate**, which is what Pavone's OOD-detection work and Roy's belief-consistency work both need. And you cannot train **recovery behaviour**, which is precisely what separates a 90% policy from a 99.9% one.

The companies with the best failure data are the deployed ones — Ambi, Dexterity, RightHand, Chef — because a production line records what went wrong whether you want it to or not. That is an underrated argument for the deployment-flywheel thesis.

---

# Chapter 9 — The Five Data-Collection Strategies, Compared

## 9.1 Real-robot teleoperation fleets

**The gold standard, and the slowest.** Perfectly matched action space, correct sensor statistics, real contact dynamics — and one human, one robot, one hour, in real time. DROID needed 50 collectors and twelve months for 350 hours; AgiBot needed 100 robots and a purpose-built building for ~3,000 hours.

Skild AI states the objection most bluntly: ["Teleoperation happens in real-time. Even if we mobilized a global workforce to 'drive' robots 24/7, the time required to reach the trillions of tokens equivalent to an LLM is mathematically unfeasible"](https://www.skild.ai/blogs/learning-by-watching) — and the data it produces is "trapped in sterile labs."

**Who bets on it:** TRI, AgiBot, Figure (roughly 500 hours for Helix), 1X, Physical Intelligence, UBTech, Scale AI's data factories.

## 9.2 Simulation and sim-to-real RL

**Effectively free per hour and massively parallel.** Figure's [Helix 02](https://www.figure.ai/news/helix-02) trained across 200,000+ parallel environments; Skild claims roughly **1,000 simulated years across 100,000 robot bodies**.

It works spectacularly for **locomotion and whole-body control**. Boston Dynamics reports the [sim-to-real gap is "very small"](https://bostondynamics.com/blog/training-a-humanoid-robot-for-hard-work/) for Atlas, thanks to only two actuator types and a symmetric design. It works poorly for **contact-rich manipulation**, for the reason Goldberg identifies: submillimetre inaccuracies destroy contact predictions, and friction, deformables and compliance are all poorly modelled.

[DrEureka](https://eureka-research.github.io/dr-eureka/) (RSS 2024, UPenn/NVIDIA) automates the design of randomisation parameters using LLMs, which removes much of the hand-tuning that made domain randomisation an art.

**Who bets on it:** NVIDIA, Boston Dynamics, Skild, Galbot, Genesis AI, most locomotion groups.

## 9.3 Human egocentric video and wearables

**Cheapest per hour by orders of magnitude, and unbounded in diversity.** Ego4D (3,670 h), Ego-Exo4D (1,286 h), EgoDex (829 h), and corpora in the tens of thousands of hours.

The problem is fidelity: no forces, no torques, no robot-executable actions, and a visual and morphological gap. But the leverage is real. Meta's [V-JEPA 2](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/) shows 1M+ hours of video pretraining plus only **62 hours** of robot data yielding 65–80% zero-shot pick-and-place on unseen objects. Generalist's GEN-1 makes the strongest claim: **half a million hours of human wearable data with zero robot data in pretraining**.

**Who bets on it:** Meta, Skild, Tesla, 1X, Generalist AI, NVIDIA (GR00T N1.7's 20K EgoScale hours).

## 9.4 Handheld and exoskeleton interfaces in robot-compatible action space

**The clever middle, and in this book's judgement the most underrated of the five.** The idea is to make the human's demonstration *already be* in the robot's action space, eliminating retargeting.

- [**UMI**](https://umi-gripper.github.io/) records **111 demos/hour** versus 35 for SpaceMouse teleoperation — 3× faster, about 48% of bare-hand speed — with zero-shot transfer across UR5e and Franka.
- [**DexUMI**](https://dex-umi.github.io/) extends this to multi-fingered hands with a wearable exoskeleton plus robot-hand video inpainting to close the visual gap, at 86% average success.
- [**DEXOP**](https://dex-op.github.io/) is the purest version: a *passive* exoskeleton mechanically coupling human fingers to robot fingers, giving true contact proprioception plus full-hand tactile capture, with significantly higher task performance per unit collection time than teleoperation.
- **Sunday Robotics' Skill Capture glove** is the commercial version, with the hand geometry matched to the robot's.

X Square Robot claims a UMI-style pipeline reaches [all-robot-dataset performance at roughly 20× lower cost](https://spectrum.ieee.org/x-square-robot-embodied-ai-stack), with an 85% data-validity rate after physical replay validation.

**The catch:** the interface is hand-shaped, so it is embodiment-locked in a different way. Sunday's glove works because Sunday controls the hand.

## 9.5 Deployment flywheels and real-robot RL

**Goldberg's preferred path, and the one with the best empirical support.** Ambi Robotics accumulated **22 years of real robot data in four years** while sorting 100M+ packages. Dexterity's Foresight was trained on 100M+ autonomous production actions. Chef Robotics has 100M meal servings. 1X's Redwood trains on autonomous episodes including failures.

Real-robot RL is now practical at small scale. Physical Intelligence's [online RL work](https://www.pi.website/research/rlt) (March 2026) reports up to **3× speedups** on contact-rich insertion from about fifteen minutes of real robot data per phase — roughly two hours wall-clock — with "half of the trials from the final RL policy... faster than any teleoperated demonstration." Berkeley's [HIL-SERL](https://hil-serl.github.io/) does human-in-the-loop RL on motherboard assembly and timing-belt insertion.

**The catch:** deployment data is narrow by construction. Serve Robotics' 2,000-robot fleet produced navigation data that did not transfer to manipulation, which is why it had to buy Diligent.

## 9.6 Comparison table

| Strategy | Cost/hour | Throughput | Fidelity | Action-space gap | Diversity | Principal backers |
|---|---|---|---|---|---|---|
| Real teleop fleets | Highest | 1× realtime | Perfect | None | Low (labs) | TRI, Figure, 1X, PI, AgiBot |
| Simulation / sim2real | Near zero | Massively parallel | Good kinematics, poor contact | None (same robot) | High (synthetic) | NVIDIA, Skild, BD, Galbot, Genesis |
| Human egocentric video | Lowest | Unbounded | No forces, no actions | Severe | Highest | Meta, Generalist, Tesla, Skild |
| Handheld / exoskeleton | Low | ~3× teleop | Good; DEXOP adds tactile | **Eliminated by construction** | High (in the wild) | Song, Agrawal, Sunday, X Square |
| Deployment flywheel | Negative (revenue) | Fleet-scale, 24/7 | Perfect, includes failures | None | Narrow by task | Ambi, Dexterity, Chef, Dyna, RightHand |

*(No reliable public dollar-per-hour figures exist for any of these; vendors do not publish them. The throughput ratios above are sourced, the cost column is ordinal.)*

## 9.7 The strongest argument against everything except (a) and (e)

Sergey Levine's essay ["Sporks of AGI"](https://sergeylevine.substack.com/p/sporks-of-agi) is the sharpest statement of the case for real robot data, and it is worth understanding precisely because Levine's own company would benefit commercially from the cheaper alternatives being true.

His argument is about **intersections**. Any surrogate domain — simulation, human video, an exoskeleton — overlaps with the real robot domain but does not coincide with it. A model trained on the surrogate fits both the shared structure *and* the discrepancies. And crucially: "as more powerful models fit the patterns in the data more tightly, they'll increasingly fit to the *discrepancies*." Scaling a surrogate-trained model makes the problem worse, not better.

Applied to human video specifically: a model trained on human data "will try to predict how a human will approach this problem, rather than predicting an effective strategy for a robot."

His conclusion: "real data is indispensable." Whether that is a law of nature or a temporary engineering fact is, arguably, the single most important open question in the field.

---

# Chapter 10 — The Embodiment Question

## 10.1 Can one policy control many bodies? The case for

**Open X-Embodiment** is the founding positive result: RT-1-X beat original per-dataset methods by 50% in small-data domains, and RT-2-X showed roughly 3× improvement on emergent skills. That is transfer, not mere co-existence.

**[Octo](https://arxiv.org/abs/2405.12213)** (800k OXE trajectories, 9 platforms) and **[CrossFormer](https://crossformer-model.github.io/)** (30 embodiments, 900k trajectories, including quadcopters and quadrupeds) showed a single transformer matching state-of-the-art across six action spaces *without any action-space alignment*.

**[HPT](https://arxiv.org/abs/2409.20537)** (Wang, Chen, Zhao, He; NeurIPS 2024) formalised the architecture — embodiment-specific "stems," a shared "trunk," task-specific "heads" — over 50 datasets and 200k+ trajectories, beating baselines by more than 20% on unseen tasks.

**Physical Intelligence** trains π0 across eight distinct robots; [π0.5 ablations](https://www.pi.website/blog/pi05) find "data from other robots... is important across all evaluation conditions"; [π0.7](https://www.pi.website/blog/pi07) transferred laundry folding to a bimanual UR5e with *zero* task-specific data for that platform, matching expert teleoperator zero-shot rates.

**Google DeepMind's motion transfer** is the most striking single demonstration: [Gemini Robotics 1.5](https://deepmind.google/discover/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/) moved ALOHA-2-only tasks onto Apptronik's Apollo and a bi-arm Franka without specialisation, and [Gemini Robotics 2](https://www.therobotreport.com/google-deepmind-says-gemini-robotics-2-enables-full-body-control/) adapts to new embodiments "typically with less than 200 examples," even for bodies with "drastically different shapes, sensors, and degrees of freedom."

**Boston Dynamics and TRI** train one policy jointly across Atlas (50 DoF) and a 29-DoF manipulation test stand — a production-grade version of the same claim.

**Skild's omni-bodied thesis** makes morphological diversity the *mechanism* rather than the obstacle: train across 100,000 bodies and the model "cannot memorize the solution for one body, it must find a strategy that works across all of them," with reported zero-shot recovery from limb loss and jammed wheels.

## 10.2 The case against

The honest reading of the literature is that most published cross-embodiment results are **positive-transfer-or-neutral by construction**. CrossFormer's own design motivation is that forced observation and action-space alignment "sometimes hinders performance on complex navigation and third-person single-arm manipulation tasks" — that is, naive alignment causes interference, and the architecture is designed to route around it.

Three specific objections:

1. **What transfers is semantics and coarse kinematics, not dynamics.** Torque limits, backlash, compliance, gear ratios, thermal behaviour — none of this is shared. Every cross-embodiment result to date operates in a regime where the policy outputs end-effector poses or joint targets that a *separate*, embodiment-specific controller executes. The controller is doing the embodiment-specific work.
2. **Levine's intersection argument** (§9.7) applies with full force to human-to-robot transfer.
3. **"Fewer than 200 examples" is itself the admission.** Transfer is a warm start, not a free lunch. The interesting question is not whether transfer is positive — it clearly is — but whether the constant factor shrinks toward zero with scale, and nobody has published evidence that it does.

*A genuine gap in the literature: no controlled, large-scale study of* negative *transfer in cross-embodiment training could be located. The case against is assembled from design motivations and theory, not from a direct ablation paper. Someone should run that experiment.*

## 10.3 The humanoid form factor: the believers

The clearest statement is [Figure's master plan](https://www.figure.ai/master-plan):

> "We could have either millions of different types of robots serving unique tasks or one humanoid robot with a general interface, serving millions of tasks."

Figure sizes the opportunity as "over 10 million unsafe or undesirable jobs in the U.S. alone," in a market where manual labour is roughly 50% of global GDP.

1X's **Bernt Børnich** adds the data argument, which is subtler and better: the humanoid is the *data-compatible* body. ["After years of developing our world model and making Neo's design as close to human as possible, Neo can now learn from internet-scale video and apply that knowledge directly to the physical world."](https://techcrunch.com/2026/01/13/neo-humanoid-maker-1x-releases-world-model-to-help-bots-learn-what-they-see/) On this view, anthropomorphism is not sentimentality — it is the thing that makes the world's largest video corpus usable as training data.

**Elon Musk** remains the loudest believer, though his 2026 statements are notably deflationary: "No, Optimus production will be extremely slow at first, as everything is new... This is not like making a car."

**XPeng's** "extreme anthropomorphism" position is the strongest industrial version, paired with a cross-domain VLA shared between cars, robots and aircraft.

## 10.4 The humanoid form factor: the skeptics

Three lines of attack, each from someone with standing.

**Rodney Brooks** attacks the *sensor channel*. In ["Why Today's Humanoids Won't Learn Dexterity"](https://rodneybrooks.com/why-todays-humanoids-wont-learn-dexterity/) (September 2025): "Collecting just visual data is not collecting the **right data**," because human dexterity runs on roughly 17,000 mechanoreceptors per hand, and "we as a species have not developed technologies to capture touch, to store touch, to transmit touch over distances and time." He also notes that a falling humanoid's kinetic energy scales cubically with size — a safety argument, not just a capability one.

**Ken Goldberg** attacks the *data premise* (Chapter 8): there is no path from current collection rates to a ChatGPT-scale robot corpus, so betting the form factor on a corpus that will not exist is a category error.

**Russ Tedrake** attacks the *business case*, and does so having spent twenty years building legged robots:

> "I thought about legs for 20 years; that's the class I teach at MIT. There are many reasons to build a robot with legs. But the question is, what's the addressable market?... Factories already have autonomous mobile [wheeled] robots. They already have safety cases built around AMRs. You can piggyback on that."

That last clause is the underrated part. The barrier to a legged robot in a factory is not locomotion competence; it is that nobody has written the safety case, and someone already wrote one for wheels.

**Melonee Wise**, then Agility's Chief Product Officer, adds the demand-side version: ["I don't think anyone has found an application for humanoids that would require several thousand robots per facility."](https://spectrum.ieee.org/humanoid-robot-scaling)

## 10.5 How the market is actually voting

At the margin, toward wheels. Walden Robotics launched at $1.1B building **wheeled-base** humanoids. **Ai² Robotics** raised $735M at $3B and **Holiday Robotics** $105M — both wheeled. **Galbot** deliberately dropped legs. **Dexterity** calls Mech an "industrial superhumanoid" with wheels. **Sanctuary** abandoned the form factor as a near-term strategy entirely.

Meanwhile the pure bipeds — Figure, Tesla, 1X, Apptronik, Boston Dynamics — hold the highest valuations and have the least deployed. That is not a refutation; it is a bet with a longer horizon. But the divergence is the most informative single pattern in the 2026 market.

**The synthesis this book would offer:** the humanoid debate conflates two separable claims. *Claim A:* human-like **hands and arms** are necessary, because the world's tools, handles, containers and fasteners are designed for them. *Claim B:* human-like **legs** are necessary, because the world has stairs. Claim A is well supported and almost uncontested — every serious manipulation company builds anthropomorphic end effectors. Claim B is contested, expensive, and the source of nearly every reliability and safety problem in Chapter 12. Most of the 2026 evidence supports A and undercuts B, which is exactly what a wheeled humanoid is.

---

# Chapter 11 — Nine Competing Theses, Taxonomised

## 11.1 End-to-end VLA scaling

**Claim:** one network from pixels and language to actions; scale data and diversity, and structure emerges.
**Adherents:** Physical Intelligence, Google DeepMind, the Octo/OpenVLA community, Generalist AI.
**Best evidence:** [π0.7](https://www.pi.website/blog/pi07) showing "the first signs of compositional generalization," including folding laundry on a robot with no laundry-folding data; Open X-Embodiment positive transfer; the [imitation scaling laws paper](https://arxiv.org/abs/2410.18647).
**Best critique:** Brooks' "end-to-end is a myth" argument — every great scaling success had an engineered front end. And π0.7's gains came substantially from *prompt structure engineering* (textual descriptions, subgoal images, speed and quality metadata), which is hand-designed inductive bias wearing a scaling costume.

## 11.2 Hierarchical VLA (System 1 / System 2)

**Claim:** semantics and control need different clock rates, so split them.
**Adherents:** Figure, NVIDIA, Google DeepMind, most humanoid companies in practice.
**Best evidence:** [Helix](https://www.figure.ai/news/helix) — a 7B VLM at 7–9 Hz over an 80M policy at 200 Hz, "because VLM backbones are general, but not fast, and robot visuomotor policies are fast but not general." [Helix 02](https://www.figure.ai/news/helix-02) added S0, a 10M network at 1 kHz replacing 109,504 lines of hand-written C++, producing a four-minute, 61-action autonomous dishwasher sequence. GR00T N1 uses the same split.
**Best critique:** the interface between layers is a hand-designed bottleneck, latent handoffs are hard to debug, and the split may be a temporary artifact of inference cost rather than a principle. If edge inference gets 100× cheaper, the argument for it largely evaporates.

## 11.3 World-model / video-prediction-first

**Claim:** learn a predictive simulator from video, then plan, evaluate or generate data inside it.
**Adherents:** Meta (V-JEPA 2), Google DeepMind (Genie 3), 1X World Model Lab, World Labs, X Square Robot, NVIDIA Cosmos.
**Best evidence:** V-JEPA 2's 62-hours-of-robot-data result; Genie 3 at 720p/24fps with minute-scale consistency, explicitly pitched at training agents; and — the most practically interesting framing — 1X's reframing of the world model as an **evaluation** substrate: ["if you train a robot to perform 1000 unique tasks, it is very hard to know whether a new model has made the robot better at all 1000."](https://www.1x.tech/discover/1x-world-model)
**Best critique:** Levine's ["Language Models in Plato's Cave"](https://sergeylevine.substack.com/p/language-models-in-platos-cave) — video models had strictly more information than LLMs and still lost at reasoning. Predicting pixels is not the same as predicting the consequences of *your own* actions.

## 11.4 Classical model-based control with learned components

**Claim:** keep MPC and whole-body control; learn only the parts that resist modelling.
**Adherents:** Boston Dynamics, Khatib, Sangbae Kim, RAI Institute, Goldberg's "Good Old Fashioned Engineering."
**Best evidence:** [Atlas](https://bostondynamics.com/blog/training-a-humanoid-robot-for-hard-work/) combining RL, reference trajectories and proprioceptive feedback, with a fridge-carrying policy generalising from 50–70 lb training loads to 100+ lb. Goldberg's framing: "modularity, metrics, and step-by-step algorithms based on geometry and physics that can be fully understood and often guaranteed to perform reliably."
**Best critique:** it does not obviously extend to open-world semantics, and Figure's deletion of 109,504 lines of C++ is a datapoint on the other side.

## 11.5 TAMP and neuro-symbolic

**Claim:** long-horizon manipulation is a hybrid discrete-continuous search problem that no monolithic policy has the structure to solve.
**Adherents:** Kaelbling, Lozano-Pérez, Garrett, Tom Silver, Jiajun Wu.
**Best evidence:** the 2026 turn in which VLMs supply the predicates — *From Pixels to Predicates* and *Open-World TAMP via VLM-Generated Constraints* — solving the symbol-grounding problem that stalled the programme for thirty years.
**Best critique:** demonstrations remain close to tabletop domains, invented predicates inherit VLM hallucination, and Gemini Robotics' "thinking before acting" is arguably TAMP re-implemented in natural language by a competitor with a thousand times the compute.

## 11.6 Tactile-first / force-centric

**Claim:** vision cannot supply the signal dexterity needs; touch is not an add-on.
**Adherents:** Brooks (as critic), Adelson, Pulkit Agrawal, Monroe Kennedy, Meta FAIR, Amazon (Vulcan), Figure (partially).
**Best evidence:** Meta's Digit 360 (8M+ taxels, 1 mN sensitivity) and Sparsh (460k tactile images) as the first general-purpose tactile encoder; DEXOP capturing full-hand tactile *at collection time*; Amazon's Vulcan handling ~75% of stowed item types via force feedback; Figure 03's fingertip sensors detecting 3 grams.
**Best critique:** no touch corpus exists at any meaningful scale, there is no standard representation or interchange format, sensors remain fragile, and nobody has yet demonstrated that a tactile-conditioned policy beats a vision-only one *on the same task with the same data budget*.

## 11.7 Morphology-first

**Claim:** better hands, wrists and actuators unlock more than better models.
**Adherents:** 1X (25-DOF tendon hands), Apptronik (22-DOF SharpaWave), Sangbae Kim, Cutkosky, Asada, Herr, Boston Dynamics.
**Best evidence:** proprioceptive actuators made dynamic legged locomotion tractable; Asada's loop-closure grasping makes a grip strong and gentle simultaneously; Herr's AMI restores proprioception no controller could synthesise.
**Best critique:** Tedrake's, and it is devastating in its simplicity — "the real question is just durability... I have not seen a more dexterous hand that could have done the work our hand has done." Degrees of freedom without data are inert, and complex hands are reliably the least reliable subsystem.

## 11.8 Teleoperation-as-product

**Claim:** ship now with humans in the loop; supervision cost falls as autonomy improves.
**Adherents:** 1X ("Scheduled Expert Mode"), Nimble, Plus One Robotics, most warehouse exception-handling.
**Best evidence:** Plus One's CTO Shaun Edwards notes ["one person can supervise 50 or more robots at once"](https://www.therobotreport.com/humanoids-wont-scale-on-factory-floors-until-costs-drop/); and every intervention is a labelled demonstration, so the supervision cost buys training data.
**Best critique:** the privacy problem is unsolved for homes — 1X's own FAQ has to answer whether an operator can enter your NEO at will — and the margins invert only if autonomy actually arrives on schedule, which is the assumption under test.

## 11.9 Simulation-first

**Claim:** generate the data you cannot collect.
**Adherents:** NVIDIA, Skild, Galbot, Genesis AI, Boston Dynamics (for locomotion), Isola (for appearance).
**Best evidence:** Skild's 100,000-body universe; Helix 02's zero-shot sim-to-real stair traversal; LucidSim's zero-real-image parkour transfer; DrEureka's automated randomisation.
**Best critique:** Goldberg on contact, and Levine on discrepancy-fitting. Simulation solves appearance and kinematics; it does not solve friction, deformation or compliance, and those are what manipulation is made of.

## 11.10 A note on how to read a disagreement

A useful diagnostic when reading any claim in this field: ask **which of the nine theses the speaker's revenue depends on.** NVIDIA benefits if simulation-first is true. Meta benefits if egocentric video is sufficient. Figure benefits if vertical integration is necessary. Unitree benefits if the brain is a commodity. Tedrake benefits if wheels are enough.

This is not an accusation of bad faith — everyone in this book is intellectually serious, and several of them argue against their own commercial interest (Levine on real data, Tedrake on legs, Goldberg on data scarcity while running a company that benefits from scarcity being solvable). But the correlation between thesis and business model is high enough that it should be the second thing you check, after the evidence.

---

# Chapter 12 — Economics and Reality Check

## 12.1 What is actually deployed

Very little, but no longer zero.

**Figure** is the clearest Western datapoint: [Figure 02 at BMW Spartanburg](https://www.figure.ai/news/production-at-bmw), an eleven-month deployment, 1,250+ hours of runtime on 10-hour weekday shifts, 90,000+ parts loaded, contributing to 30,000+ vehicles, at 84-second cycle time and 5 mm tolerance. Note what that *is*: one repetitive part-loading station, and 1,250 hours is about seven months of one human's working time.

**Agility** has moved from three to ten Digits at Toyota Motor Manufacturing Canada, plus GXO, Schaeffler and Mercado Libre, with 65,000+ cumulative operating hours.

**UBTech** has the largest disclosed order book — Walker S2 orders exceeding ¥800M, roughly 500 units delivered in 2025.

**Galbot** runs autonomous stores in 30+ Chinese cities and warehouses 24/7.

**In applied manipulation** the numbers are much larger: Chef's 100M meal servings, Dexterity's 100M autonomous production actions, Ambi's 100M+ packages, Diligent's 1M picks, RightHand's cells at 3-second cycle times.

**Tesla** is the demo-ware pole: Musk acknowledged on the [Q4 2025 call (28 January 2026)](https://electrek.co/guides/tesla-optimus/) that no Optimus robots were doing useful work in Tesla factories.

## 12.2 The one audited P&L

Unitree's STAR Market listing gave the field its first real humanoid financials: **~$248M 2025 revenue, 59.8% gross margin, 3,701 humanoids produced and 3,551 sold in the first nine months of 2025**, raising roughly $610M.

Two numbers from that filing matter more than the revenue.

**The cost curve:** average selling price fell from **$85,000 in 2023 to $25,000 in 2025** — a 71% decline in two years, driven by vertically integrated actuators. Actuators are 40–60% of humanoid bill-of-materials cost by McKinsey's estimate. This is the strongest evidence in the book that the hardware problem is genuinely being solved.

**The demand mix:** **73.6% research and education, 17.4% demonstrations and displays, 9.01% industrial.** The market that exists today is overwhelmingly labs and spectacle. The market everyone is valued on does not yet exist.

## 12.3 Forecasts, handled carefully

Goldman Sachs, in [work led by Jacqueline Du](https://www.goldmansachs.com/insights/articles/the-global-market-for-robots-could-reach-38-billion-by-2035), raised its 2035 humanoid TAM from $6B to **$38B** and shipments 4× to **1.4M units**, with unit costs falling from $50k–$250k to $30k–$150k — a 40% decline versus an expected 15–20%. **Important caveat: that report is dated February 2024, not 2026.** It is widely cited as if current; it is not.

*Morgan Stanley and Bank of America humanoid forecasts are frequently quoted in trade press but could not be verified against primary sources during this book's verification pass. Do not cite specific MS or BofA numbers without independent checking.*

For calibration against reality: IEEE Spectrum's Evan Ackerman notes industry projections of [18,000 humanoid units in 2025 against "a small handful of robots in carefully controlled pilot projects."](https://spectrum.ieee.org/humanoid-robot-scaling) And the IFR puts the **entire industrial robot installation market** at $16.7B — smaller than several humanoid startups' combined paper valuations.

## 12.4 China, and the July 2026 rupture

China controls roughly 80–90% of global humanoid shipments, more than half of industrial robot installations, and over 90% of rare-earth magnet refining.

On [28 July 2026 the FCC added mobile robots over 2 kg to its Covered List](https://spectrum.ieee.org/fcc-covered-list-mobile-robots), barring new foreign-made humanoids, quadrupeds and unmanned ground vehicles from US import (existing certifications unaffected). Evan Beard of Standard Bots called it "one of the strongest technology-security actions in modern U.S. history." Georg Stieler of STM offered the counterpoint: "restrictions can reduce security exposure, but they do not by themselves create a competitive domestic ecosystem."

The practical effect on research is significant and underappreciated: a very large fraction of academic robot-learning work runs on Unitree hardware, and 73.6% of Unitree's humanoid revenue is research and education. A US import restriction on the field's default research platform is a research-capacity story as much as a security one.

## 12.5 Reliability, and the number nobody reports

Industrial customers expect **99.99% uptime**. Digit runs roughly 90 minutes on 9-minute recharges. The best-documented long-horizon autonomy in the field is a [four-minute, 61-action sequence](https://www.figure.ai/news/helix-02) and Gemini Robotics 2 tasks "lasting several minutes and involving hundreds of decisions."

**Almost nobody in humanoid robotics reports MTBF.** Figure's BMW disclosure ("minimal hardware failures" over 1,250 hours) is a rare exception, and it is qualitative. The gap between "minutes without a reset" and "eight hours without an intervention" is the single most consequential unreported number in the field, and until companies publish it, deployment claims cannot be evaluated.

Plus One's Shaun Edwards frames the commercial version: ["the conversation has moved from 'Can they do the work?' to 'Can we justify the cost?'"](https://www.therobotreport.com/humanoids-wont-scale-on-factory-floors-until-costs-drop/) — with humanoids at roughly 1,000 picks/hour in controlled demonstrations against specialised parcel robots at 1,300–3,000.

## 12.6 Safety standards are not ready

[**ISO 10218-1:2025**](https://www.iso.org/standard/73933.html) (Edition 3, published February 2025) is the industrial robot safety standard, and it explicitly **excludes** service robots accessible to the public and consumer products.

[**ISO/TS 15066:2016**](https://www.iso.org/standard/62996.html) — the power-and-force-limiting specification underpinning collaborative operation — remains a 2016 *technical specification*, confirmed in 2022 and flagged for revision.

Neither was written for a 1.7 m bipedal machine that becomes a falling mass when you cut power. Boston Dynamics' Matt Powers describes the industry approach: "We're going to start with relatively low-risk deployments, and then expand as we build confidence in our safety systems." The IFR now lists [safety and security](https://ifr.org/ifr-press-releases/news/top-5-global-robotics-trends-2026) among its top five 2026 trends, citing the need for "clear liability frameworks."

Home deployment — 1X's NEO — will force this issue first, and it will be forced by an incident rather than by a committee.

## 12.7 Is it a bubble?

The evidence for: Figure at $39B pre-revenue. Skild at $14B on roughly $30M of company-stated revenue (a ~450× multiple). Walden at $1.1B six months from founding, pre-product. Travis Kalanick's ATOMS at $1.7B. Agility exiting via **SPAC** — historically a reliable late-cycle signal. Two of the highest-profile 2025–26 startups acquired within twelve months of founding.

The evidence against: the cost curve is real and steep (Unitree's 71% ASP decline in two years). Deployment hours are genuinely accumulating (Agility's 65,000, Figure's 1,250, Dexterity's 100M actions). Model capability is genuinely improving on measured benchmarks, even if smoothly rather than discontinuously. And the labour-shortage demand is structurally real in logistics, food production, welding and eldercare.

**This book's reading:** the *technology* is not a bubble; the *valuations* substantially are. The gap will close by valuations compressing toward the applied-manipulation companies in Chapter 6, which are already doing paid work, rather than by the humanoid companies growing into their prices on the current timeline. Watch for the first humanoid company to publish MTBF and revenue per robot — whoever does that first is either very confident or very desperate, and either way it will reprice the sector.

---

# Chapter 13 — Open Problems, 2026–2030

## 13.1 Dexterity beyond parallel grippers

The hardware has arrived — 1X's 25-DOF tendon-driven hands, Apptronik's 22-DOF SharpaWave tying knots and sealing ziplock bags under Gemini Robotics 2, Kepler's 96 fingertip tactile contact points. The **data** has not. There is no multi-fingered corpus at Open X-Embodiment scale.

**Watch:** whether DexUMI- and DEXOP-class devices produce one; and whether Tedrake's durability objection holds — "I have not seen a more dexterous hand that could have done the work our hand has done."

## 13.2 Long-horizon reliability

State of the art in 2026 is a four-minute, 61-action autonomous sequence. Industrial requirements are eight-hour shifts at 99.99% uptime. This is the field's largest single gap, and the one least addressed by better models — it is a systems, hardware and error-recovery problem.

**Watch:** MTBF disclosure; intervention rates in teleoperation-backed deployments; and whether Physical Intelligence's [Multi-Scale Embodied Memory](https://www.pi.website/research/memory) (up to 15 minutes of task memory) extends toward hours.

## 13.3 Tactile integration

Brooks' challenge stands: there is no ImageNet of touch, no standard encoding, no transmission format. Sparsh (460k tactile images) is the first general-purpose tactile encoder; Digit 360 the first high-fidelity finger; DenseTact/TensorTouch the first attempt at full stress-tensor recovery; DOT-Sim the first differentiable optical tactile simulator.

**Watch:** a cross-sensor tactile foundation model; and — the decisive experiment nobody has run cleanly — whether tactile-conditioned policies beat vision-only policies on the same tasks with the same data budget.

## 13.4 On-robot compute and latency

The System 1 / System 2 hierarchy exists largely because of silicon budgets. 1X's Redwood runs at ~5 Hz on an embedded GPU. Helix splits 7B / 80M / 10M across 7–9 Hz / 200 Hz / 1 kHz. Figure 03 added 10 Gbps mmWave offload — which is to say, it gave up and moved compute off the robot.

**Watch:** Jetson Thor-class silicon; one-step generative models (Kaiming He's Mean Flows line) that collapse diffusion inference; and whether the hierarchical split survives a 100× improvement in edge inference.

## 13.5 Evaluation

The field's most under-appreciated crisis, and the one where progress would compound fastest. TRI's methodology paper showed that much prior reporting was too noisy to support its own claims. 1X poses the target directly: "can you predict how well a robot performs before you test it in the real world?"

**Watch:** adoption of [lbm_eval](https://github.com/ToyotaResearchInstitute/lbm_eval); whether RoboArena-style distributed pairwise evaluation becomes standard; whether SIMPLER-style rank-correlation metrics displace raw success rates; and whether learned world models become accepted as evaluation substrates.

## 13.6 Safety certification

No standard covers a legged robot that becomes a falling mass on power loss. ISO 10218-1:2025 excludes consumer and public-access service robots; ISO/TS 15066 is a decade old. Home deployment will force the question.

**Watch:** the first ISO working group specifically for mobile bipedal machines; liability frameworks; and, realistically, the first serious injury and its regulatory aftermath.

## 13.7 Whole-body loco-manipulation

2026's clearest technical trend. Helix 02 learned 1 kHz balance from 1,000+ hours of retargeted human motion. Gemini Robotics 2 controls "feet to fingertips." Boston Dynamics argues real work [requires "a broadening of what we mean by physical intelligence"](https://bostondynamics.com/blog/training-a-humanoid-robot-for-hard-work/) — using shoulders, forearms and hips, not just fingertips. Stanford's TWIST2 and Karen Liu's group supply the academic data-collection answer.

**Watch:** whether whole-body data collection scales, and whether wheeled bases make the whole problem moot.

## 13.8 Memory and continual learning

Physical Intelligence's Multi-Scale Embodied Memory pairs a short-horizon video encoder with language-based long-term memory, reaching tasks requiring up to fifteen minutes of memory while explicitly fighting causal confusion. Combined with on-robot RL (3× speedups from ~15 minutes of real data), this is the most credible route to Goldberg's flywheel: **robots that improve from their own deployment rather than from a data-collection factory.**

If that works, the entire data bottleneck of Chapter 8 dissolves, because the fleet becomes the collection apparatus. If it does not, the field is back to buying hours.

## 13.9 The three questions that will decide the decade

1. **Does human data substitute for robot data?** Generalist's GEN-1 says yes at 500,000 hours with zero robot data. Levine says structurally no. This is empirically resolvable, and someone should resolve it publicly.
2. **Does the transfer constant shrink?** Gemini Robotics 2 needs fewer than 200 examples for a new body. Does that go to zero with scale, or asymptote at 200? Nobody has published the curve.
3. **Does anyone reach 99.99%?** Every commercial claim in Chapters 4 through 6 depends on crossing from demo reliability to industrial reliability. No published result is close, and no published result even reports the metric.

Answer those three and the rest of this book is bookkeeping.
---

# Appendix A — Comparison Tables

## A.1 Academic labs at a glance

| Lab | Institution | PI | Core bet | Data stance |
|---|---|---|---|---|
| SVL / BEHAVIOR | Stanford | Fei-Fei Li, Jiajun Wu | Benchmark-first household AI | Sim-first, teleop-heavy |
| IPRL | Stanford | Jeannette Bohg | Interactive perception; force is primary | Pluralist; edits data across sources |
| ILIAD | Stanford | Dorsa Sadigh | Humans in the loop; curation | Real teleop, curated |
| IRIS | Stanford | Chelsea Finn | Cheap hardware + imitation scaling | Real-world first |
| REAL | Stanford | Shuran Song | Embodiment-agnostic collection interfaces | In-the-wild, open hardware |
| Movement Lab | Stanford | C. Karen Liu | Humanoids = physics-based characters | Human mocap → retarget → sim |
| ASL | Stanford | Marco Pavone | Provable safety around learned parts | Audit data, don't just collect it |
| MSL | Stanford | Mac Schwager | Gaussian splatting as universal map | Build the map from the robot's own sensors |
| CHARM | Stanford | Allison Okamura | Touch in both directions | Human-subjects psychophysics |
| BDML | Stanford | Mark Cutkosky | Mechanism over algorithm | None (mechanism lab) |
| Stanford Robotics Lab | Stanford | Oussama Khatib | Operational-space control; telepresence | Model-based, anti-data |
| ARM Lab | Stanford | Monroe Kennedy III | Tactile + collaboration | Real multimodal + sim calibration |
| Robot Locomotion | MIT | Russ Tedrake | Rigour + behaviour cloning at fleet scale | Teleop-first |
| Improbable AI | MIT | Pulkit Agrawal | Dexterity is a force problem | Sim + perioperation |
| LIS | MIT | Kaelbling, Lozano-Pérez | Abstraction beats scale | Explicitly anti-scaling |
| Distributed Robotics | MIT | Daniela Rus | Morphology + compact networks | Pro-data |
| GelSight | MIT | Ted Adelson | Touch as vision | Hardware-first |
| Biomimetic Robotics | MIT | Sangbae Kim (leave) | Proprioceptive actuators | Model-based |
| Interactive Robotics | MIT | Julie Shah | Robots as teammates | Low-N human-in-the-loop |
| SPARK | MIT | Luca Carlone | Certifiable perception, scene graphs | Hybrid |
| Robust Robotics | MIT | Nicholas Roy | Autonomy under uncertainty | Foundation models as evidence, not truth |
| CDFG | MIT | Wojciech Matusik | Co-design body and controller | Differentiable sim + fabrication |
| d'Arbeloff | MIT | Harry Asada | Wearable and supernumerary robots | Model-based |
| Biomechatronics | MIT | Hugh Herr | Redesign the body for the machine | Clinical, n-of-few |

## A.2 Companies by thesis

| Thesis | Companies |
|---|---|
| Vertically integrated humanoid | Figure, Tesla, 1X, XPeng, Apptronik (hardware side) |
| Hardware-agnostic brain | Physical Intelligence, Skild, Generalist, Google DeepMind, Field AI, Sanctuary (post-pivot) |
| Wheeled/semi-humanoid pragmatism | Walden, Galbot, Dexterity, Cobot, Agility, Ai² Robotics |
| Cheap hardware, outsourced intelligence | Unitree, Fourier (partly), Kepler, Astribot |
| Deployment flywheel | Dexterity, Ambi, Chef, Dyna, RightHand, Path, Amazon |
| Simulation-first | NVIDIA, Skild, Galbot, Genesis AI |
| Human-data-first | Generalist, Sunday, Meta, Skild |
| Platform / picks and shovels | NVIDIA, Hugging Face, Scale AI, Encord, LG/Samsung/Hyundai Mobis (actuators) |

## A.3 The data collection cost/fidelity frontier

| | Cheap | Expensive |
|---|---|---|
| **Low fidelity** | Internet video, Ego4D | — |
| **Medium fidelity** | Simulation, Aria/EgoDex wearables | Motion capture studios |
| **High fidelity** | **UMI / DexUMI / DEXOP / Skill Capture** | Teleoperation fleets, AgiBot data factory |

The bottom-left cell is where the interesting engineering is. Everything in Chapter 9 is an attempt to move data from the top-left or bottom-right into the bottom-left.

---

# Appendix B — Fifty Sources, in Reading Order

**Start here (the arguments)**
1. Ken Goldberg, [Closing the 100,000 Year "Data Gap" in Robotics](https://docs.google.com/document/d/e/2PACX-1vTc9dKld9Qol0v01n4ilJk3T9a-D4f1I26V1DbWNZKjPbgYRTOYY4xxNrc7yFqcJFMVQ0phJyDQflwT/pub), *Science Robotics*, Aug 2025
2. Rodney Brooks, [Why Today's Humanoids Won't Learn Dexterity](https://rodneybrooks.com/why-todays-humanoids-wont-learn-dexterity/), Sep 2025
3. Sergey Levine, [Sporks of AGI](https://sergeylevine.substack.com/p/sporks-of-agi)
4. Sergey Levine, [Language Models in Plato's Cave](https://sergeylevine.substack.com/p/language-models-in-platos-cave)
5. TRI et al., [A Careful Examination of Large Behavior Models](https://arxiv.org/html/2507.05331v1)
6. Lin et al., [Data Scaling Laws in Imitation Learning](https://arxiv.org/abs/2410.18647)
7. Figure, [Master Plan](https://www.figure.ai/master-plan)
8. IEEE Spectrum, [Walden Robotics / Tedrake interview](https://spectrum.ieee.org/humanoid-robots-walden-robotics-toyota)
9. IEEE Spectrum, [Humanoid robot scaling](https://spectrum.ieee.org/humanoid-robot-scaling)
10. The Robot Report, [Unitree IPO analysis](https://www.therobotreport.com/unitree-ipo-shows-a-real-hardware-business-the-humanoid-case-is-still-early/)

**Architectures and models**
11. Chi, Song, Tedrake et al., [Diffusion Policy](https://journals.sagepub.com/doi/full/10.1177/02783649241273668)
12. Zhao, Finn et al., ALOHA / ACT
13. [Open X-Embodiment / RT-X](https://arxiv.org/abs/2310.08864)
14. [Octo](https://arxiv.org/abs/2405.12213)
15. OpenVLA
16. [CrossFormer](https://crossformer-model.github.io/)
17. Wang, Chen, Zhao, He, [Heterogeneous Pre-trained Transformers](https://arxiv.org/abs/2409.20537)
18. Physical Intelligence, [π0](https://www.pi.website/blog/pi0)
19. Physical Intelligence, [π0.5](https://www.pi.website/blog/pi05)
20. Physical Intelligence, [π*0.6 / RECAP](https://www.pi.website/blog/pistar06)
21. Physical Intelligence, [π0.7](https://www.pi.website/blog/pi07)
22. Google DeepMind, [Gemini Robotics 1.5](https://deepmind.google/discover/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/)
23. Google DeepMind, [Gemini Robotics 2](https://deepmind.google/models/gemini-robotics/)
24. NVIDIA, [Isaac GR00T N1](https://arxiv.org/abs/2503.14734)
25. Figure, [Helix](https://www.figure.ai/news/helix) and [Helix 02](https://www.figure.ai/news/helix-02)
26. Generalist AI, [GEN-0](https://generalistai.com/blog/nov-04-2025-GEN-0) and [GEN-1](https://generalistai.com/blog/apr-02-2026-GEN-1)
27. Skild AI, [Omni-bodied](https://www.skild.ai/blogs/omni-bodied)
28. Meta, [V-JEPA 2](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/)

**Data collection**
29. Chi et al., [UMI](https://umi-gripper.github.io/)
30. [DexUMI](https://dex-umi.github.io/)
31. Fang & Agrawal, [DEXOP](https://arxiv.org/abs/2509.04441)
32. [Mobile ALOHA](https://mobile-aloha.github.io/)
33. [TWIST2](https://arxiv.org/abs/2511.02832)
34. [DROID](https://droid-dataset.github.io/)
35. [AgiBot World Colosseo](https://arxiv.org/abs/2503.06669)
36. [RoboMIND](https://arxiv.org/abs/2412.13877)
37. [Ego-Exo4D](https://ego-exo4d-data.org/)
38. [EgoDex](https://arxiv.org/abs/2505.11709)
39. Sunday Robotics, [No Robot Data](https://www.sunday.ai/journal/no-robot-data)

**Evaluation, simulation, safety**
40. [SIMPLER](https://simpler-env.github.io/)
41. [RoboArena](https://arxiv.org/abs/2506.18123)
42. [BEHAVIOR Challenge 2026](https://behavior.stanford.edu/challenge/index.html)
43. [lbm_eval](https://github.com/ToyotaResearchInstitute/lbm_eval)
44. [Isaac Lab / Newton](https://developer.nvidia.com/isaac/lab)
45. [MuJoCo Playground](https://github.com/google-deepmind/mujoco_playground)
46. [Drake](https://drake.mit.edu/)
47. [ISO 10218-1:2025](https://www.iso.org/standard/73933.html)
48. [ISO/TS 15066:2016](https://www.iso.org/standard/62996.html)

**Structure and abstraction**
49. Garrett et al., [Integrated Task and Motion Planning survey](https://arxiv.org/abs/2010.01083)
50. Mao, Wu, Tenenbaum, [Building Intelligent Agents with Neuro-Symbolic Concepts](https://www.jiajunwu.com/papers/nsconcept_cacm.pdf)

---

# Appendix C — Verification Log

A separate fact-checking pass re-examined thirty load-bearing claims. The following are the ones that did **not** cleanly verify, and how this book handled them.

| Claim | Status | Treatment here |
|---|---|---|
| Physical Intelligence at ~$11B (2026) | **Unconfirmed.** Last verified valuation is $5.6B (Nov 2025, CapitalG). | Book states $5.6B as verified; $11B marked as reported. |
| K-Scale Labs shut down late 2025 | **Refuted.** GitHub activity continues into mid-2026. | Book states the closure claim is unverified. |
| Goldman Sachs $38B / 1.4M units by 2035 | **Verified figure, but from a February 2024 report.** | Book flags the date explicitly. |
| Morgan Stanley / BofA humanoid forecasts | **Unverifiable.** | Book declines to cite specific numbers. |
| Unitree IPO month | **Partly.** Financials consistent; sources differ on March vs July 2026 listing. | Book cites financials, hedges the date. |
| Sangbae Kim at Meta | **Partly.** MIT confirms "on leave"; Meta role is trade-press reported only. | Book says "reportedly." |
| XPeng IRON specs (82 DoF, VLA 2.0, end-2026 production) | **Unverifiable.** XPeng pages unreachable. | Book marks all figures as company-stated. |
| AgiBot 2026 Hong Kong IPO | **Unverifiable.** Dataset figures verified. | Book flags the IPO claim. |
| NVIDIA GR00T N2 | **Partly.** N1.7 in early access April 2026; no N2 in public repo. | Book states N1.7 as current, N2 as previewed. |
| Stanford Robotics Center opening date and director | **Unverifiable from the Center's own site**; confirmed by Stanford News and HAI announcements. | Book cites Stanford News with a note. |
| Shuran Song's Stanford start year | **Partly.** Move from Columbia confirmed; year not stated on Stanford profile. | Book gives 2023 with a hedge. |
| Covariant current status | **Unverifiable.** | Book notes the rump company operates with no significant releases. |
| Sunday Robotics funding ($35M, $165M) | **Unconfirmed.** | Book marks as reported. |
| Field AI funding (~$405M, ~$2B) | **Unconfirmed.** | Book marks as unverified. |
| Ambi Robotics 2025–26 funding | **No verified round found.** | Book states last verified round is 2022. |
| Cobot Series C | **Unverified.** | Book states Series B as last verified. |
| Kepler / Astribot funding | **Undisclosed.** | Book states undisclosed. |
| Negative cross-embodiment transfer study | **Not found.** | Book explicitly flags this as a gap in the literature. |
| Per-hour dollar costs for data collection | **Not published by anyone.** | Book uses ordinal rankings only. |

**Claims that verified cleanly and can be relied on:** Walden Robotics (Tedrake CEO, July 2026, $300M at $1.1B); Figure Series C ($1B+ at $39B, Sept 2025, Parkway-led); Skild ($1.4B at $14B+, Jan 2026, SoftBank-led); Generalist GEN-0/GEN-1 hours and dates; Agility SPAC ($2.5B, June 2026, Churchill XI); Sanctuary pivot (17 June 2026); Gemini Robotics 2 (<200 examples, whole-body); Amazon/Fauna and Meta/ARI acquisitions with Lerrel Pinto in both; Intrinsic into Google (Feb 2026); Serve/Diligent (Jan 2026); FCC Covered List addition (28 July 2026); Goldberg's *Science Robotics* piece; Brooks' essay; BEHAVIOR Challenge 2026 specifics; Tesla Optimus statements (Jan and Apr 2026); Neura Series C (June 2026); Apptronik >$935M (Feb 2026); Galbot $300M+ at $3B; Dexterity Foresight (Mar 2026); MCube closure; AgiBot World dataset scale.

---

# Appendix D — Twenty Questions to Ask Anyone Selling You Robotics

1. What is your MTBF, and over how many hours?
2. What is your human intervention rate in deployment, and is it trending down?
3. How many hours of data do you have, and across how many *environments*?
4. What fraction of your data is failures?
5. Is your success rate measured by the authors or by blind evaluators?
6. How many rollouts per task-policy pair?
7. Does your policy output joint torques, or poses that a hand-written controller executes?
8. If you claim cross-embodiment transfer, how different were the embodiments *kinematically*?
9. What is your revenue per deployed robot per year?
10. Who is your largest customer, and what share of revenue are they?
11. Are your orders binding, or milestone-contingent?
12. Is your demand from operators, or from labs, integrators and demonstration projects?
13. What is your actuator supply chain, and where is it?
14. Which of the nine theses in Chapter 11 does your business model require to be true?
15. What would falsify your thesis?
16. If simulation is central, what is your contact model, and how was it validated?
17. If human video is central, how do you recover actions and forces?
18. If teleoperation is central, what is your cost per demonstration hour?
19. What safety standard do you certify against, and does it cover your form factor?
20. What is the smallest task you cannot do, and why?

---

# Closing Note

The honest summary of August 2026 is this. Robot hardware is getting cheap fast and demonstrably so — a 71% two-year decline in humanoid ASP is not a marketing claim, it is a filed financial statement. Robot *intelligence* is improving smoothly, measurably, and without any sign of the discontinuity the valuations assume. The binding constraint remains data, and the field has produced five genuinely different answers to it, of which the least-discussed — putting the human's demonstration directly into the robot's action space — may be the most important.

The three institutions that will look best in retrospect are probably not the ones with the highest valuations. They are the ones that built the measurement apparatus: TRI for insisting on blind evaluation, Stanford for building interfaces cheap enough that everyone could participate, and the applied companies in Chapter 6 that have been quietly accumulating real contact data while everyone else argued about form factors.

The three questions in §13.9 remain open. Anyone who tells you they are closed is selling something.
