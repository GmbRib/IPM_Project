# Interação Pessoa-Máquina: Grupo 03

Our group's work for the **Interação Pessoa-Máquina (IPM)** course at NOVA FCT, 2026/27, on **Pack&Sun**: a mobile app that helps people pack for a trip, with a personalised checklist, the weather at the destination and a travel agenda in one place.

This repository has two parts:

| Part | Where | What it is |
|---|---|---|
| **Website** | this folder (root) | The project's site, with every report and assignment: **[gmbrib.github.io/IPM_Project](https://gmbrib.github.io/IPM_Project/)** |
| **App** | [`app/`](app/) | The functional prototype (stage 4): an Expo / React Native app. See [Running the app](#-running-the-app-functional-prototype) |

**Team:** Dinis Santos (72815), Guilherme Ribeiro (75539), Joana Neves (75205), Rodrigo Loução (73984)
**Lab class:** P1 · **Professor:** Teresa Romão

---

## 📄 Where are the reports?

All PDFs are in **[`public/reports/`](public/reports/)**:

| File | What it is |
|---|---|
| [`G_03_stage1.pdf`](public/reports/G_03_stage1.pdf) | Stage 1: problem, target users, project goal, competitors |
| [`G_03_stage2.pdf`](public/reports/G_03_stage2.pdf) | Stage 2: problem, users, tasks, scenarios, interviews |
| [`G_03_stage3.pdf`](public/reports/G_03_stage3.pdf) | Stage 3: sketches, paper prototype, storyboards, briefing, scenarios, test feedback |
| [`G_03_stage4.pdf`](public/reports/G_03_stage4.pdf) | Stage 4: functional prototype (how to run it, briefing, test scenarios, features, incomplete parts, tools). Source: [`G_03_stage4.docx`](public/reports/G_03_stage4.docx) |
| [`assignment1-72815.pdf`](public/reports/assignment1-72815.pdf) | Individual Assignment 1: Dinis |
| [`assignment1-73984.pdf`](public/reports/assignment1-73984.pdf) | Individual Assignment 1: Rodrigo |
| [`assignment1-75205.pdf`](public/reports/assignment1-75205.pdf) | Individual Assignment 1: Joana |
| [`assignment1-75539.pdf`](public/reports/assignment1-75539.pdf) | Individual Assignment 1: Guilherme |
| `previews/` | Images of each PDF's first two pages, used for the hover preview on the site. |

On the website, group reports appear in the **Reports** section and individual assignments in the **Assignments** section. Anything not submitted yet shows as "Em breve".

File names follow a fixed pattern, which the site relies on:
- Group reports: `G_03_stage<N>.pdf`
- Individual assignments: `assignment<N>-<student number>.pdf`

---

## 📱 Running the app (functional prototype)

The app is in [`app/`](app/). It needs **Node.js 20.19+** and, to try it on a phone, the **Expo Go** app with the phone on the same Wi-Fi as the computer.

```bash
cd app
npm install        # first time only
npx expo start     # scan the QR code with Expo Go, or press "w" to open it in the browser
```

If the phone is on a different network, use `npx expo start --tunnel`.

`npx expo start` also runs the app's small server: accounts, shared trips and bags are saved on the computer running it (`app/server-data/db.json`, not in git).

**Demo accounts** (one button each on the login screen; the password is in [`app/src/data/demo.ts`](app/src/data/demo.ts)):

| Account | Starts with |
|---|---|
| `teresa.romao@email.pt` | The three test-scenario trips from the stage 4 report: Oslo (14–16 Dec 2026), Paris (22–26 Mar 2027) and Madrid (7–9 May 2027) |
| `rui@email.pt` | No trips: Teresa invites him with a code ("Convidar" → "Entrar com código") |
| `pedro@email.pt` | No trips, same as Rui |

To start again from this data: Perfil → "Repor dados de demonstração".

More detail (folders, server, roles, checks before committing) is in [`app/README.md`](app/README.md).

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
├── app/                       # 📱 the Pack&Sun app (Expo / React Native): see app/README.md
├── docs/                      # working documents (e.g. the stage 5 heuristic evaluation)
│
├── index.html                 # HTML entry: loads the Google Fonts (Rubik Dirt + Rubik) and src/main.tsx
├── package.json               # scripts and dependencies
├── vite.config.ts             # Vite config (React plugin)
├── tsconfig.json              # TypeScript config
│
├── public/                    # served as-is at the site root (/reports/..., /members/...)
│   ├── reports/               # 📄 all report PDFs (and the stage 4 .docx), plus previews/ (generated images)
│   ├── members/               # team photos used in the Equipa section
│   ├── logo/                  # the logo's versions, in order (logo-v1.jpg … logo-v4.jpg)
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
    │   └── site.ts            # ✏️ ALL CONTENT: nav links, team members, assignments, report stages, logo versions
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
    │       ├── Assignments.tsx# 03 Assignments: a file folder per member that opens on hover, with their PDFs as papers
    │       ├── Reports.tsx    # 04 Reports: group reports, stage by stage
    │       ├── FilePreview.tsx# floating PDF preview that follows the cursor (used by Reports)
    │       ├── LogoEvolution.tsx # 05 Logótipo: the logo's versions along a flight path
    │       └── Development.tsx# 06 Development: link to the app prototype
    │
    ├── fight/
    │   └── FightContext.tsx   # shared HP state for the hero fight and the navbar bars
    │
    ├── hooks/
    │   ├── useActiveSection.ts # highlights the nav link of the section being read
    │   ├── useFollowCursor.ts  # makes the PDF preview trail the mouse
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

### Add an individual assignment
1. Put the PDF in `public/reports/`, named `assignment<N>-<student number>.pdf` (e.g. `assignment1-73984.pdf`).
2. Generate its preview image:
   ```bash
   npm run previews
   ```
3. In [`src/data/site.ts`](src/data/site.ts), add the student number to that assignment's `submitted` list:
   ```ts
   { number: 1, title: "Assignment 1", submitted: ["75539", "73984"] },
   ```
   For a new assignment, add a new entry: `{ number: 2, title: "Assignment 2", submitted: [] }`.

### Add a new logo version
1. Put the image in `public/logo/` (e.g. `logo-v5.jpg`).
2. Add an entry at the end of `logoVersions` in [`src/data/site.ts`](src/data/site.ts) with its `src`, a short `name` for the timeline, a `title` and a `description`.

### Change a team member's photo
Replace the file in `public/members/`. If the face isn't well framed on the card, adjust `photoPosition` (and optionally `photoZoom`) for that member in [`src/data/site.ts`](src/data/site.ts).

> ⚠️ Photos straight from a phone can contain the **GPS location** where they were taken. Remove the metadata before committing, for example by re-exporting the image without location.

### Edit text
Section texts are in the components under `src/components/sections/`. Names, numbers, nav links and report data are in [`src/data/site.ts`](src/data/site.ts).

---

## 🛠️ Stack

**Website:**
- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev) for dev server and build, published on GitHub Pages
- Plain CSS Modules (no UI framework). The person and the robot are drawn with CSS only, with no images.
- Fonts: [Rubik Dirt](https://fonts.google.com/specimen/Rubik+Dirt) (headings) and [Rubik](https://fonts.google.com/specimen/Rubik) (text), from Google Fonts

**App:** Expo (SDK 58), React Native and TypeScript, with Expo Router, NativeWind, Zustand, React Hook Form + Zod, and Open-Meteo for the weather. The full list is in the stage 4 report (section 5.3).
