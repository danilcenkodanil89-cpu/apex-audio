# Apex Audio

> *Your music, mastered. Play it your way, everywhere.*

![JSON](https://img.shields.io/badge/JSON-000000.svg?style=flat-square&logo=JSON&logoColor=white)  ![electronbuilder](https://img.shields.io/badge/electronbuilder-000000.svg?style=flat-square&logo=electron-builder&logoColor=white)  ![npm](https://img.shields.io/badge/npm-CB3837.svg?style=flat-square&logo=npm&logoColor=white)  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat-square&logo=JavaScript&logoColor=black)  ![sharp](https://img.shields.io/badge/sharp-99CC00.svg?style=flat-square&logo=sharp&logoColor=white)  ![Electron](https://img.shields.io/badge/Electron-47848F.svg?style=flat-square&logo=Electron&logoColor=white)  ![GitHub%20Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF.svg?style=flat-square&logo=GitHub-Actions&logoColor=white)  ![CSS](https://img.shields.io/badge/CSS-663399.svg?style=flat-square&logo=CSS&logoColor=white)

## Overview

Apex Audio is a cross-platform desktop music player built with Electron. It provides a clean, sidebar-driven interface for managing and playing local audio libraries, with playlist support and a persistent playback bar.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

## Features

|      | Component        | Details |
| :--- | :--------------- | :------ |
| ⚙️  | **Architecture** | Electron desktop application — main/renderer process separation via `main.js` and `renderer.js`, with a secure `preload.js` bridge |
| 🎵  | **Playback**     | Local audio library management with sidebar navigation, playlist support, and a persistent player bar |
| 🎨  | **UI**           | CSS-styled dark interface with a sidebar, central track listing area, and fixed bottom playback controls |
| 📦  | **Distribution** | Packaged via `electron-builder` with auto-generated application icon via `sharp` and GitHub Actions CI |

---

## Project Structure

```
└── Apex Audio/
    ├── .github
    │   └── workflows
    ├── generate-icon.js
    ├── icon.png
    ├── index.html
    ├── LICENSE
    ├── main.css
    ├── main.js
    ├── package.json
    ├── preload.js
    ├── README.md
    └── renderer.js
```

---

## Getting Started

### Prerequisites

- Python 3.10+ / Node.js 18+ *(depending on the stack above)*

### Installation

```sh
git clone "https://github.com/danilcenkodanil89-cpu/Apex Audio"
cd "Apex Audio"
npm install
```

### Usage

```sh
npm start
```

---

## Contributing

- [Report Issues](https://github.com/danilcenkodanil89-cpu/Apex Audio/issues)
- [Submit Pull Requests](https://github.com/danilcenkodanil89-cpu/Apex Audio/pulls)
- [Discussions](https://github.com/danilcenkodanil89-cpu/Apex Audio/discussions)

---

## License

Distributed under the [AGPL-3.0](LICENSE) license.
