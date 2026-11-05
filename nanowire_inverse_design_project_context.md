# AI-Driven Inverse Design of Nanowire Networks

## 1. Project Overview

### Project title

**AI-Driven Inverse Design and Optimization of Nanowire Networks for Transparent and Flexible Conducting Electrodes**

### Core idea

The project should NOT be a simple supervised-learning problem of:

> generate data → train ML model → predict conductivity.

Instead, the goal is to build an **AI-driven inverse-design system**.

Given desired engineering requirements such as:

- low sheet resistance,
- high optical transmittance,
- adequate mechanical/strain tolerance,

the system should autonomously search the nanowire design space and identify promising nanowire-network configurations.

The overall idea is:

```text
Desired material properties
        ↓
AI optimization
        ↓
Candidate nanowire design
        ↓
Physics-based nanowire simulation
        ↓
Electrical / optical / mechanical properties
        ↓
Update AI model
        ↺
```

The important advanced component is the closed-loop optimization. The AI decides which nanowire design should be evaluated next rather than simply predicting the output of a fixed dataset.

---

# 2. Connection to the Course

The project is based primarily on the lecture material on **Electrical Percolation in Nanowire Networks**.

The relevant concepts from the lectures are:

1. Electrical percolation
2. Percolation threshold
3. Connectivity of nanowire networks
4. Nanowire density
5. Nanowire aspect ratio
6. Nanowire orientation/alignment
7. Junction resistance
8. Sheet resistance / conductivity
9. Optical transparency
10. Trade-off between conductivity and transparency
11. Effect of mechanical strain on network connectivity
12. Optimization of nanowire-network properties

The lectures explain that a nanowire network becomes electrically conducting when a connected path spans the material. The critical concentration at which this happens is the **percolation threshold**.

The lectures also emphasize that conductivity depends not only on the amount of nanowire material but on the geometry and connectivity of the network.

The lecture material gives the following qualitative relationships:

| Parameter | Electrical effect | Optical effect |
|---|---|---|
| Nanowire density ↑ | Resistance ↓ | Transparency ↓ |
| Diameter ↑ | Resistance ↓ | Transparency ↓ |
| Length ↑ | Percolation ↑ | Small effect |
| Junction resistance ↑ | Resistance ↑ | No effect |
| Curvature ↑ | Resistance ↑ | No effect |

The lectures explicitly state that high conductivity and high transparency generally cannot both be maximized simultaneously, making optimization necessary.

The project uses this physical trade-off as the engineering objective.

---

# 3. Required Theory

## 3.1 Nanowire network

A nanowire network consists of conducting nanowires distributed over an otherwise insulating region.

A conducting path must exist between the electrodes for macroscopic electrical conduction.

The network can be represented as a graph:

- nodes = nanowire junctions/intersections
- edges = conductive wire segments

Therefore:

```text
Nanowire geometry
       ↓
Network topology
       ↓
Electrical connectivity
       ↓
Electrical resistance
```

---

## 3.2 Percolation

At low nanowire density, the wires are mostly disconnected.

Above a critical concentration, a spanning conducting cluster forms.

This critical concentration is the percolation threshold:

p_c

Conceptually:

```text
p < p_c
    ↓
No spanning cluster
    ↓
Very poor/no macroscopic conduction

p ≥ p_c
    ↓
Spanning cluster
    ↓
Electrical conduction
```

The important project insight is:

> Conductivity is strongly related to network connectivity and topology, not simply the quantity of nanowire material.

---

## 3.3 Aspect ratio

The nanowire aspect ratio is approximately:

AR = length / diameter

Long, thin nanowires have high aspect ratios.

Higher aspect ratio generally makes it easier to form a connected network, reducing the required percolation concentration.

Therefore aspect ratio is an important design variable.

---

## 3.4 Orientation and alignment

Nanowires can be randomly oriented or preferentially aligned.

An orientation/order parameter can be used to describe the degree of alignment.

Conceptually:

S = 0 → random orientation

S = 1 → perfect alignment

Alignment can improve conductivity in one direction while potentially reducing connectivity in another direction.

Therefore orientation is another important design variable.

---

## 3.5 Electrical resistance

The nanowire network can be treated as a resistor network.

Each wire segment has resistance and junctions can have additional junction resistance.

For a node i, Kirchhoff's current law can be written as:

sum_j (V_i - V_j) / R_ij = 0

After solving the network voltages, the total current through the system can be calculated.

Then:

R_network = V / I

For a thin conducting film, the relevant metric can be expressed as sheet resistance:

R_s

Lower sheet resistance means better electrical conduction.

---

## 3.6 Optical transparency

A transparent electrode must allow most incident light to pass through.

Increasing nanowire density generally improves electrical conductivity but reduces optical transparency.

Thus:

```text
More nanowires
    ↓
More electrical connections
    ↓
Lower resistance

BUT

More nanowires
    ↓
More optical blockage
    ↓
Lower transparency
```

This trade-off is the main reason an optimization framework is useful.

---

## 3.7 Mechanical strain

The lecture also discusses how stretching changes nanowire-network geometry.

As strain increases:

- wire orientations change,
- some wire segments disconnect,
- the conducting backbone becomes weaker,
- resistance increases.

Therefore strain tolerance can optionally be included as a third optimization objective.

This allows the project to target flexible electronics and strain-sensing applications.

---

# 4. Project Aim

## Primary aim

Build an AI-driven inverse-design framework that identifies nanowire-network configurations satisfying specified electrical, optical and optionally mechanical requirements.

For example:

```text
Target:
Sheet resistance < 20 Ω/square
Transparency > 90%
Strain tolerance > 5%
```

The system should search over:

- nanowire density
- nanowire length
- nanowire diameter
- aspect ratio
- orientation/alignment
- junction resistance
- optional strain-related parameters

and find promising configurations.

---

# 5. Why This Is an Inverse-Design Problem

Normal ML:

```text
Nanowire design
      ↓
ML model
      ↓
Predicted properties
```

Our project:

```text
Desired properties
      ↓
Optimization / AI
      ↓
Nanowire design
      ↓
Physics simulation
      ↓
Actual properties
      ↓
Optimization update
```

The direction of the problem is reversed.

We are not asking:

> "What properties does this nanowire network have?"

We are asking:

> "What nanowire network should we design to obtain these properties?"

---

# 6. Main System Architecture

```text
                     USER REQUIREMENTS
                            │
                            ▼
                 Design/Constraint Definition
                            │
                            ▼
                 Initial Design Candidates
                            │
                            ▼
              Nanowire Physics Simulator
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         Conductivity   Transparency   Strain
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    Initial Dataset
                            │
                            ▼
                    Surrogate Model
                            │
                            ▼
                Bayesian Optimization
                            │
                            ▼
                 Next Candidate Design
                            │
                            ▼
              Nanowire Physics Simulator
                            │
                            ▼
                  New Physical Result
                            │
                            ▼
                    Update Surrogate
                            │
                            └───────────────↺

                 FINAL OPTIMIZED DESIGN
```

---

# 7. Physics Simulation

The physics simulator is a major part of the project.

It should generate a 2D nanowire network according to a specified parameter vector.

Example:

```text
design = [
    density,
    wire_length,
    wire_diameter,
    orientation,
    junction_resistance
]
```

The simulator should:

1. Create the nanowires.
2. Detect intersections/junctions.
3. Build the network graph.
4. Determine whether a spanning cluster exists.
5. Construct the electrical resistor network.
6. Solve for electrical resistance.
7. Estimate sheet resistance/conductivity.
8. Estimate optical transparency using an appropriate model.
9. Optionally deform the network under strain and estimate strain-dependent resistance.

The simulator becomes the expensive "ground truth" evaluator.

---

# 8. Graph Representation

The nanowire network should be represented as a graph.

```text
G = (V, E)
```

where:

- V = nodes/junctions
- E = conductive wire segments

Possible graph features:

- number of nodes
- number of edges
- node degree
- average degree
- connected components
- largest connected component
- shortest electrode-to-electrode path
- network density
- fraction of active edges
- orientation statistics

These can be used for analysis and potentially as features for the surrogate model.

---

# 9. Initial Dataset

The project does not require a conventional external Kaggle dataset.

The dataset can be generated from the physics simulator.

Each row corresponds to one nanowire-network design.

Example:

| density | length | diameter | aspect_ratio | alignment | junction_R | sheet_R | transparency |
|---|---|---|---|---|---|---|---|
| 0.15 | 10 | 0.2 | 50 | 0.1 | 100 | ... | ... |
| 0.20 | 15 | 0.2 | 75 | 0.3 | 100 | ... | ... |
| 0.25 | 15 | 0.2 | 75 | 0.7 | 100 | ... | ... |

The initial dataset should be deliberately small compared with a conventional supervised-learning dataset.

For example:

- 50–200 initial simulations

Then Bayesian optimization should select subsequent simulations.

This allows us to demonstrate that the AI can find good designs using relatively few expensive physics evaluations.

---

# 10. Surrogate Model

The physics simulator may be expensive.

Instead of running the simulator for every possible design, train a surrogate model that approximates:

f(design) → properties

Possible outputs:

- sheet resistance
- conductivity
- transparency
- strain tolerance

A strong initial choice is a **Gaussian Process (GP)** because it provides both:

1. predicted mean
2. prediction uncertainty

For a candidate design x:

GP(x) → μ(x), σ(x)

where:

- μ(x) = predicted performance
- σ(x) = uncertainty

The uncertainty is important because Bayesian optimization uses it to decide where to sample next.

---

# 11. Bayesian Optimization

This is the main AI/optimization component.

Instead of randomly generating designs, Bayesian optimization uses the surrogate model to intelligently choose the next design.

The loop is:

```text
1. Run physics simulation on initial designs
2. Train Gaussian Process
3. Evaluate candidate designs using GP
4. Calculate acquisition function
5. Select best candidate
6. Run expensive physics simulation
7. Add result to dataset
8. Retrain/update GP
9. Repeat
```

An acquisition function balances:

### Exploitation

Try designs predicted to be very good.

### Exploration

Try uncertain regions where the model does not know much.

This is the key difference between ordinary supervised learning and the proposed project.

---

# 12. Multi-Objective Optimization

The project should ideally not optimize only one property.

We want to balance:

- low sheet resistance
- high transparency
- high strain tolerance

A constrained formulation could be:

Minimize:

R_s

subject to:

T ≥ 0.90

and:

strain_tolerance ≥ 0.05

Alternatively, use multi-objective optimization and obtain a Pareto front.

Example:

```text
Transparency
    ↑
    |       •
    |     •
    |   •
    | •
    +----------------→
             Conductivity
```

The Pareto front shows designs where improving one objective would worsen another.

---

# 13. Technology Stack

## Programming

Python 3.x

## Scientific computing

- NumPy
- SciPy
- Pandas

## Graph/network simulation

- NetworkX

Optional:
- Shapely for geometric line-intersection operations

## Machine learning

- scikit-learn for baseline models
- GPyTorch for Gaussian Processes

## Bayesian optimization

- BoTorch

## Visualization

- Matplotlib
- Plotly

Optional dashboard:

- Streamlit

## Development

- Jupyter Notebook for experimentation
- VS Code
- Git/GitHub

---

# 14. Suggested Repository Structure

```text
nanowire-inverse-design/
│
├── data/
│   ├── initial_dataset.csv
│   └── optimization_history.csv
│
├── src/
│   ├── nanowire_generator.py
│   ├── geometry.py
│   ├── graph_model.py
│   ├── electrical_solver.py
│   ├── optical_model.py
│   ├── strain_model.py
│   ├── simulator.py
│   ├── surrogate.py
│   ├── bayesian_optimizer.py
│   └── objectives.py
│
├── notebooks/
│   ├── 01_network_generation.ipynb
│   ├── 02_percolation_analysis.ipynb
│   ├── 03_electrical_simulation.ipynb
│   ├── 04_surrogate_model.ipynb
│   └── 05_bayesian_optimization.ipynb
│
├── results/
│   ├── figures/
│   ├── optimized_designs.csv
│   └── optimization_history.csv
│
├── app/
│   └── app.py
│
├── requirements.txt
├── README.md
└── report.md
```

---

# 15. Complete Development Workflow

## Phase 1 — Literature/course understanding

Understand:

- percolation
- nanowire geometry
- connectivity
- sheet resistance
- transparency
- alignment
- strain effects

Do not begin with ML.

---

## Phase 2 — Nanowire geometry engine

Implement:

- random nanowire generation
- configurable density
- configurable length
- configurable diameter
- configurable orientation

Visualize generated networks.

---

## Phase 3 — Percolation analysis

Determine:

- connected components
- spanning cluster
- percolation threshold
- network connectivity

Test whether increasing density/aspect ratio produces the expected physical behavior.

---

## Phase 4 — Electrical model

Construct a resistor network.

Solve:

sum_j (V_i - V_j)/R_ij = 0

Calculate:

- total current
- network resistance
- sheet resistance

Validate against expected qualitative percolation behavior.

---

## Phase 5 — Optical model

Introduce an approximate relationship between nanowire coverage/density and optical transmittance.

The model does not initially need to reproduce detailed electromagnetic optics.

The first goal is to capture the course-level trade-off:

```text
density ↑ → electrical resistance ↓
density ↑ → transparency ↓
```

Clearly document assumptions.

---

## Phase 6 — Initial dataset

Run a limited number of physics simulations.

For example:

```text
100–200 initial designs
```

Store:

```text
design parameters
+
network properties
+
electrical properties
+
optical properties
+
optional strain properties
```

---

## Phase 7 — Surrogate model

Train a Gaussian Process.

Input:

```text
nanowire design parameters
```

Output:

```text
predicted sheet resistance
predicted transparency
```

Evaluate:

- prediction error
- uncertainty calibration
- performance on held-out designs

A Random Forest/XGBoost model can be used as a baseline, but it is not the main contribution.

---

## Phase 8 — Bayesian optimization

Implement the closed loop:

```text
Surrogate
   ↓
Acquisition function
   ↓
Best candidate
   ↓
Physics simulator
   ↓
New observation
   ↓
Update surrogate
```

Run for a fixed simulation budget.

For example:

```text
Initial simulations = 100
Optimization iterations = 100
Total physics evaluations = 200
```

---

# 16. Important Experiment

A particularly important experiment should compare:

### Random Search

Generate 200 random designs.

versus

### Bayesian Optimization

Start with 100 designs and intelligently choose 100 more.

Compare:

- best sheet resistance achieved
- best transparency subject to resistance constraint
- number of simulations needed to reach a target
- Pareto front quality

The expected research question becomes:

> **Can Bayesian optimization discover high-performing nanowire designs using fewer expensive physics simulations than random search?**

This is a much stronger AIML research question than simply reporting prediction accuracy.

---

# 17. Final Demonstration

The final system could allow the user to enter:

```text
Maximum sheet resistance:
20 Ω/square

Minimum transparency:
90%

Minimum strain tolerance:
5%
```

Then click:

```text
OPTIMIZE
```

The system runs the AI optimization loop and returns:

```text
OPTIMAL / BEST DESIGN FOUND

Density:              ...
Wire length:           ...
Wire diameter:         ...
Aspect ratio:          ...
Alignment:             ...
Junction resistance:   ...

Predicted:
Sheet resistance:      ... Ω/square
Transparency:          ... %
Strain tolerance:      ... %
```

It should also display the actual simulated network.

---

# 18. Main Deliverables

## Technical deliverables

1. Nanowire network generator
2. Graph/percolation analysis module
3. Electrical resistor-network solver
4. Optical-property model
5. Optional strain model
6. Initial simulation dataset
7. Gaussian Process surrogate
8. Bayesian optimization engine
9. Random-search baseline
10. Optimized nanowire configurations

## Visualization

- nanowire network plots
- percolation plots
- conductivity vs density
- transparency vs density
- conductivity vs alignment
- surrogate prediction vs actual
- uncertainty plots
- Bayesian optimization convergence
- Pareto front
- final optimized networks

## Software

- Reproducible Python repository
- requirements.txt
- README
- optional Streamlit interface

## Academic deliverables

- project report
- methodology diagram
- mathematical formulation
- experimental comparison
- limitations and future work
- final presentation/demo

---

# 19. What Makes This Project Advanced?

The project should emphasize these four components:

### 1. Physics-based simulation

The model isn't trained on arbitrary data. The data comes from a nanowire/percolation model derived from the course concepts.

### 2. Surrogate modeling

AI approximates an expensive physical simulator.

### 3. Bayesian optimization

AI decides which physical simulation to run next.

### 4. Inverse design

The final goal is not prediction.

The final goal is:

```text
Desired properties
       ↓
AI
       ↓
Physical design
```

Therefore the central project statement is:

> **Develop an AI-driven inverse-design framework that combines nanowire percolation physics, surrogate modeling and Bayesian optimization to discover nanowire-network configurations satisfying electrical, optical and mechanical requirements with a limited number of expensive physics simulations.**

---

# 20. Important Design Principle

Do NOT make the project unnecessarily complicated from day one.

Build it in layers:

```text
Level 1
Nanowire generation
        ↓
Percolation

Level 2
Percolation
        ↓
Electrical resistance

Level 3
Electrical + optical trade-off
        ↓
Optimization

Level 4
Surrogate model
        ↓
Bayesian optimization

Level 5
Multi-objective inverse design
        ↓
Final system
```

The final goal is Level 5, but each previous level should be independently testable.

---

# 21. Questions the Team Should Investigate

The project should ultimately answer questions such as:

1. How does nanowire density affect the percolation threshold?
2. How does aspect ratio affect network connectivity?
3. How does alignment affect directional conductivity?
4. How does junction resistance affect sheet resistance?
5. What is the conductivity-transparency trade-off?
6. Can a surrogate model accurately approximate the physics simulator?
7. Can Bayesian optimization find better designs than random search using the same simulation budget?
8. How quickly does Bayesian optimization converge?
9. Can multi-objective optimization identify a useful Pareto front?
10. Which nanowire parameters have the greatest influence on the final design?

---

# 22. Final Concept

The project can be summarized in one equation:

```text
                     PHYSICS
                       ↓
Design z ───────→  F(z) = properties
   ↑                    │
   │                    ↓
   └──── AI optimizer ←─┘
```

where:

```text
z = nanowire design parameters

F(z) = physics simulator

AI optimizer = surrogate model + Bayesian optimization
```

The AI repeatedly proposes designs, the physics model evaluates them, and the results are fed back into the AI.

That closed-loop **physics → AI → design → physics** cycle is the core of the project.
