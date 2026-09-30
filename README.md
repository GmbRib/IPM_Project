# Interação Pessoa-Máquina: Grupo 03

Website for the **Interação Pessoa-Máquina (IPM)** course at NOVA FCT, 2026/27. It collects our group's work on **Pack&Sun**, a mobile app that helps people pack for a trip: a personalised checklist, the weather at the destination and a travel agenda in one place.

**Team:** Dinis Santos (72815), Guilherme Ribeiro (75539), Joana Neves (75205), Rodrigo Loução (73984)
**Lab class:** P1 · **Professor:** Teresa Romão

---

## 📄 Where are the reports?

All PDFs are in **[`public/reports/`](public/reports/)**:

| File | What it is |
|---|---|
| [`G_03_stage1.pdf`](public/reports/G_03_stage1.pdf) | Stage 1: problem, target users, project goal, competitors |
| [`G_03_stage2.pdf`](public/reports/G_03_stage2.pdf) | Stage 2: problem, users, tasks, scenarios, interviews |
| [`assignment1-75539.pdf`](public/reports/assignment1-75539.pdf) | Individual Assignment 1 (Guilherme). It is stored here but not linked on the site. |
| `previews/` | Images of each PDF's first two pages, used for the hover preview on the site. |

On the website they appear in the **Reports** section. Stages 3–6 show as "Em breve" until their PDFs are added.

---

## 🚀 Running the site

Requires **Node.js 20.19+ or 22.12+** (needed by Vite).

```bash
npm install      # install dependencies (first time only)
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check and build the static site into dist/
npm run preview  # serve the built dist/ locally
```

---

## 🗂️ Project structure

```
.
├── index.html                 # HTML entry: loads the Google Fonts (Rubik Dirt + Rubik) and src/main.tsx
├── package.json               # scripts and dependencies
├── vite.config.ts             # Vite config (React plugin)
├── tsconfig.json              # TypeScript config
│
├── public/                    # served as-is at the site root (/reports/..., /members/...)
│   ├── reports/               # 📄 all report PDFs, plus previews/ (generated images)
│   ├── members/               # team photos used in the Equipa section
│   └── img/                   # logo and other images
│
├── scripts/
│   └── previews.swift         # generates public/reports/previews/ from the PDFs (macOS only)
│
└── src/
    ├── main.tsx               # React entry point
    ├── App.tsx                # page layout: Header, Hero, sections, Footer
    │
    ├── data/
    │   └── site.ts            # ✏️ ALL CONTENT: nav links, team members, report stages
    │
    ├── components/
    │   ├── Header.tsx         # "VS" navbar: P1 (Pessoa) vs P2 (Máquina) HP bars, links, mobile menu
    │   ├── Footer.tsx
    │   ├── hero/
    │   │   ├── Hero.tsx       # title, CSS person vs robot, the attack mini-game, K.O. screen
    │   │   ├── Person.tsx     # the person, drawn with CSS only
    │   │   ├── Robot.tsx      # the robot, drawn with CSS only
    │   │   └── Figures.module.css  # figure drawings and fight poses (attack / hit / K.O.)
    │   └── sections/
    │       ├── Section.tsx    # shared wrapper (number + title + intro)
    │       ├── About.tsx      # 01 Quem Somos
    │       ├── Team.tsx       # 02 Equipa: member cards, photo revealed on hover
    │       ├── Reports.tsx    # 03 Reports: list with a floating PDF preview on hover
    │       └── Development.tsx# 04 Development: link to the app prototype
    │
    ├── fight/
    │   └── FightContext.tsx   # shared HP state for the hero fight and the navbar bars
    │
    ├── hooks/
    │   ├── useActiveSection.ts # highlights the nav link of the section being read
    │   ├── useFollowCursor.ts  # makes the report preview trail the mouse
    │   └── useLookAt.ts        # makes the figures' eyes follow the cursor
    │
    └── styles/
        └── global.css         # colour tokens, fonts, buttons, reduced-motion rules
```

Each component's styles live next to it as a CSS Module (`*.module.css`).

---

## ✏️ Common tasks

### Add a new stage report
1. Put the PDF in `public/reports/`, named `G_03_stageN.pdf` (e.g. `G_03_stage3.pdf`).
2. Generate its preview images (macOS only; on other systems, ask someone with a Mac):
   ```bash
   npm run previews
   ```
3. In [`src/data/site.ts`](src/data/site.ts), add the stage to `stageTopics`:
   ```ts
   3: { topics: ["Protótipo", "Avaliação"], pages: 5 },
   ```
   Adding this line is what makes the stage clickable on the site.

### Change a team member's photo
Replace the file in `public/members/`. If the face isn't well framed on the card, adjust `photoPosition` (and optionally `photoZoom`) for that member in [`src/data/site.ts`](src/data/site.ts).

> ⚠️ Photos straight from a phone can contain the **GPS location** where they were taken. Remove the metadata before committing, for example by re-exporting the image without location.

### Edit text
Section texts are in the components under `src/components/sections/`. Names, numbers, nav links and report data are in [`src/data/site.ts`](src/data/site.ts).

---

## 🛠️ Stack

- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev) for dev server and build
- Plain CSS Modules (no UI framework). The person and the robot are drawn with CSS only, with no images.
- Fonts: [Rubik Dirt](https://fonts.google.com/specimen/Rubik+Dirt) (headings) and [Rubik](https://fonts.google.com/specimen/Rubik) (text), from Google Fonts
