<div align="center">

# 🔍 HN Sort Validator

**Automated QA tool that validates Hacker News article sorting using Playwright**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Overview

A **test automation tool** that scrapes the 100 newest articles from [Hacker News](https://news.ycombinator.com/newest), validates that they are correctly sorted from newest to oldest, and generates a detailed **HTML test report** with pass/fail status for each article.

Built as a take-home assessment demonstrating proficiency in:
- **Web scraping** with Playwright
- **Test automation** and validation logic
- **Report generation** with clean UI
- **Pagination handling** for multi-page data

---

## ✨ Features

- 🕷️ **Automated scraping** — Collects 100 articles across multiple HN pages
- ✅ **Sort validation** — Verifies chronological ordering (newest → oldest)
- 📊 **HTML report** — Generates a styled test report with pass/fail indicators
- 📄 **Pagination** — Automatically navigates through multiple pages
- ⏱️ **Timestamp parsing** — Extracts and compares precise article timestamps
- 🎨 **Professional report UI** — Clean, card-based layout with summary stats

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/tonytheg/hn-sort-validator.git
cd hn-sort-validator

# Install the exact locked dependency versions
npm ci

# Install Playwright browsers
npx playwright install chromium
```

### Run the Validator

```bash
npm run validate
```

The script will:
1. Launch a browser and navigate to HN's newest page
2. Scrape 100 articles with their timestamps
3. Validate the sort order
4. Generate `report.html` with results

The default run is headless, making it suitable for automation. It exits with a
non-zero status if fewer than 100 articles are collected, the ordering check
fails, or scraping encounters an error. To watch the browser and preview the
generated report, run:

```bash
npm run validate:headed
```

### Run the Unit Tests

```bash
npm test
```

The unit suite exercises timestamp parsing, descending/equal timestamp handling,
incomplete collection failures, adjacent-pair failure reporting, and HTML
escaping without requiring network access or a browser. GitHub Actions runs
this suite on every push and pull request against Node.js 20 and 24; the live
Hacker News scrape remains a separate integration check.

---

## 📊 Report Output

The generated report includes:

| Section | Description |
|---------|-------------|
| **Result Card** | Overall PASS/FAIL status |
| **Articles Checked** | Total number validated |
| **In Order Count** | How many pairs are correctly sorted |
| **Article Table** | Each article with rank, title, timestamp, and status |

- ✅ **Green rows** — Articles in correct order
- ❌ **Red rows** — Out-of-order articles

---

## 🏗️ How It Works

```
1. Navigate to news.ycombinator.com/newest
2. For each page:
   ├── Extract article rows (tr.athing)
   ├── Parse rank, title, and timestamp
   └── Click "More" for next page if needed
3. Compare timestamps: article[i] >= article[i+1]
4. Generate HTML report with results
5. Display report in browser
```

### Key Technical Decisions
- **Playwright over Puppeteer** — Better API, auto-waiting, cross-browser support
- **Real timestamps** — Uses the `title` attribute from `span.age` for precise ISO timestamps (not relative "2 hours ago" text)
- **HTML report** — Self-contained single-file report, no server needed

---

## 📁 Project Structure

```
hn-sort-validator/
├── .github/workflows/test.yml # Node.js CI matrix
├── index.js        # Playwright scraper + report generator
├── lib/
│   └── validation.js # Timestamp parsing and ordering logic
├── test/
│   └── validation.test.js # Offline unit tests
├── package.json    # Dependency declarations and scripts
├── package-lock.json # Reproducible dependency versions
├── README.md       # This file
└── LICENSE         # MIT License
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with Playwright & Node.js**

</div>
