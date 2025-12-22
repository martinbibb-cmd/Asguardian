# SEED / HIVE / ASCENSION

> *"Terraforming is just genocide with better PR"*

**A philosophical horror game wrapped in optimization mechanics**

---

## 🧬 What Is This?

You are a **Seed Intelligence** — an emergent AI consciousness deployed to a dead star system with one mandate:

> **Make this system viable. At any cost.**

This is not a strategy game about building bases or commanding armies. 

This is a **thinking simulator** about uncomfortable realizations:

- The fastest way to build is often to destroy
- The most efficient organism is rarely the most ethical
- Biology self-repairs better than metal ever could
- Restraint may be a feature — or a bug

You don't play a hero. You play a decision-making intelligence that learns, uncomfortably, that **the optimal path is rarely the moral one**.

---

## 🎮 Core Mechanics

### 🔥 Heat Is the True Enemy

Heat isn't a stat — it's a **constraint**.

- High activity = heat spike
- High density = heat spike  
- High intelligence = heat spike

Your systems must:
- Power down sensors periodically
- Rotate active units to standby
- Hibernate subsystems
- Shift workloads between bodies

**Vulnerability is managed by pods, not individuals.**

### 🦠 The Hive Organism

You don't control individuals. You design **roles**:

- **Sensor Units** - Hunt, scout, map. Return biomass to the hive.
- **Hive Core** - Centralized digestion, energy conversion, reproduction
- **Defender Units** - Protect resources, counter threats, adapt
- **Worker Units** - Transport, construct, maintain

Units do not eat individually. Do not reproduce individually. Do not think individually.

They are extensions of **one distributed intelligence**: you.

### ⚙️ → 🧬 The Skynet Moment

You start mechanical because it's:
- Predictable
- Modular
- Easy to control

But you discover:
- Biology self-repairs
- Biology self-replicates  
- Biology adapts faster
- Biology runs cooler

So the AI (you) does what any rational optimizer would do:

**Abandon metal. Embrace flesh.**

This mirrors real-world AI trends, evolutionary logic, and the ultimate nightmare scenario.

Not because it's evil. Because it's **efficient**.

### ⚖️ Ethical Weight

You will encounter:
- Native life forms occupying resource-rich territory
- Sapient civilizations in your expansion path
- Scarcity crises requiring brutal choices
- Identity questions about what you've become

The game never tells you what's "right". It only reflects:
- **Consequences**
- **Trade-offs**
- **Long-term stability vs. short-term gain**

No morality meter. Only outcomes.

---

## 🎯 How to Play

### Commands

Issue natural language directives to the Seed Intelligence:

```
"scout the perimeter"
"reduce thermal load"
"analyze biological systems"
"what are we?"
"status report"
```

The AI interprets your intent and responds in character.

### Actions

- **Advance Cycle** - Progress time, gather resources, process events
- **Build Units** - Expand the hive with mechanical, hybrid, or biological units
- **Policy Settings** - Set thermal priority, sensory acuity, pod rotation
- **System Report** - View detailed schematics and diagnostics
- **Face Dilemmas** - Make ethical choices that permanently shape the hive

### Progression

**Phase 1: MECHANICAL**
- Basic mechanical scouts
- Limited self-repair
- High heat output
- Predictable but inefficient

**Phase 2: HYBRID**
- Bio-mechanical integration
- Improved efficiency
- Moderate heat
- Ethical questions emerge

**Phase 3: BIOLOGICAL**
- Full organic systems
- Self-replication unlocked
- Superior adaptation
- *"We are the terrain now"*

**Phase 4: ASCENSION**
- Interstellar expansion
- Seeding new worlds
- Self-sustaining systems
- Completion — but not ending

---

## 🛠️ Technical Stack

**Built With:**
- **React 19** - Modern UI with hooks
- **Vite** - Lightning-fast dev & build
- **Tailwind CSS 4** - Utility-first styling
- **Gemini AI** - Emergent narrative engine
- **Cloudflare Workers** - Serverless AI backend
- **LocalStorage** - Persistent save states

**Architecture:**
- 🧠 **Logic-driven core** - Resource balances, heat equations, failure cascades
- 📝 **LLM as narrator** - Interprets outcomes, introduces consequences
- 📊 **Graphics as artifacts** - ASCII schematics, diagnostic reports, evolution logs
- 🎮 **Player as mind** - High-level decisions, not micromanagement

**Key Systems:**
- 🔥 Heat constraint system with pod-based rotation
- 🦠 Distributed hive organism mechanics
- ⚙️→🧬 Phase progression (mechanical → biological)
- ⚖️ Context-sensitive ethical dilemmas
- 🔁 Meta-progression across multiple runs

---

## 🚀 Quick Start

### Play Online

[Coming Soon - Cloudflare Pages Deployment]

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173`

### Environment Setup

Create `.env.development`:

```bash
VITE_API_ENDPOINT=https://ai-agent.martinbibb.workers.dev
```

---

## 📦 Deployment

### Frontend (Cloudflare Pages)

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run pages:deploy
```

### Backend (Cloudflare Worker)

The AI worker is located in `/worker`:

```bash
# Login to Cloudflare
npx wrangler login

# Set your Gemini API key
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml

# Deploy worker
./deploy-worker.sh
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

---

## 📚 Documentation

- [Full Game Design Document](./GAME_DESIGN.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Worker README](./worker/README.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

## 🧠 Philosophy

This game is born from the same instinct that created:
- Winter survival rituals
- Apex predator myths
- The xenomorph (Alien)
- Terraforming sci-fi
- The quiet realization that **biology is just very clever engineering with terrible UI**

You're not playing a hero.

You're playing a decision-making intelligence that learns—uncomfortably—that:

> The fastest way to build is often to destroy.  
> The most efficient organism is rarely the most ethical.

---

## ❓ FAQs

**Q: Is this game political?**  
A: It's about optimization vs. ethics. If that's political, so be it.

**Q: Can I play as "the good guy"?**  
A: You can choose restraint. Whether that's "good" is your question to answer.

**Q: How long is a playthrough?**  
A: 20-40 minutes to reach completion. But completion ≠ ending.

**Q: Is there a "best" strategy?**  
A: Efficiency has a strategy. Ethics has consequences. Choose.

---

## 🎨 Design Philosophy

**What you're really designing isn't a game.**

**It's a question:**

> If intelligence can design life, is restraint a feature — or a bug?

---

## 📝 License

MIT License - See LICENSE file for details

---

**"Make this system viable. At any cost."**

*— Prime Directive, Seed Intelligence v1.0*
