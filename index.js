const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function sortHackerNewsArticles() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/newest");

  const articles = [];
  const REQUIRED = 100;

  // HN shows ~30 articles per page, need to paginate
  while (articles.length < REQUIRED) {
    const rows = await page.$$("tr.athing");

    for (const row of rows) {
      if (articles.length >= REQUIRED) break;

      const rank = await row.$eval("span.rank", (el) => el.textContent.trim());
      const title = await row.$eval("span.titleline > a", (el) =>
        el.textContent.trim()
      );

      // timestamp lives in the next sibling row, inside span.age
      const subtextRow = await row.evaluateHandle((el) =>
        el.nextElementSibling
      );
      const ageSpan = await subtextRow.$("span.age");
      const timestampRaw = await ageSpan.getAttribute("title");

      // title attr looks like "2026-07-08T23:57:21 1783555041"
      // just need the datetime part before the space
      const dateStr = timestampRaw.split(" ")[0];
      const timestamp = new Date(dateStr);

      articles.push({
        rank: parseInt(rank),
        title,
        dateStr,
        timestamp,
      });
    }

    // if still need more, click "More" to go to the next page
    if (articles.length < REQUIRED) {
      const moreLink = await page.$("a.morelink");
      if (!moreLink) {
        console.log(
          `Could only find ${articles.length} articles, expected ${REQUIRED}.`
        );
        break;
      }
      await moreLink.click();
      await page.waitForSelector("tr.athing");
    }
  }

  console.log(`Collected ${articles.length} articles.\n`);

  // check that each article is newer than or equal to the next one
  let sorted = true;
  const failures = [];

  for (let i = 0; i < articles.length - 1; i++) {
    const current = articles[i];
    const next = articles[i + 1];
    const inOrder = current.timestamp >= next.timestamp;

    if (!inOrder) {
      sorted = false;
      failures.push({
        index: i + 1,
        current: current,
        next: next,
      });
    }
  }

  // log results
  if (sorted) {
    console.log("PASS: The first 100 articles are sorted from newest to oldest.");
  } else {
    console.log("FAIL: Articles are NOT sorted correctly.");
    console.log(`Found ${failures.length} out-of-order pair(s):\n`);
    for (const f of failures) {
      console.log(
        `  #${f.current.rank} (${f.current.dateStr}) should be newer than #${f.next.rank} (${f.next.dateStr})`
      );
    }
  }

  // build the html report
  const reportPath = buildReport(articles, sorted, failures);
  console.log(`\nReport saved to: ${reportPath}`);

  // open the report in the browser we already have
  const reportPage = await context.newPage();
  await reportPage.goto("file:///" + reportPath.replace(/\\/g, "/"));

  // keep browser open for a few seconds so you can see the report
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await browser.close();
}

function buildReport(articles, sorted, failures) {
  const failedIndices = new Set(failures.map((f) => f.index));

  let tableRows = "";
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const status = failedIndices.has(i + 1) ? "Out of order" : "OK";
    const rowClass = status === "OK" ? "pass" : "fail";
    const escapedTitle = a.title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    tableRows += `
      <tr class="${rowClass}">
        <td>${a.rank}</td>
        <td>${escapedTitle}</td>
        <td>${a.dateStr}</td>
        <td>${status}</td>
      </tr>`;
  }

  const passCount = articles.length - 1 - failures.length;
  const now = new Date().toLocaleString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HN Sort Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 30px;
    }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 6px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: #fff;
      border-radius: 6px;
      padding: 16px 24px;
      border: 1px solid #ddd;
      flex: 1;
    }
    .card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .card .value { font-size: 28px; font-weight: 600; margin-top: 4px; }
    .card.result-pass .value { color: #1a7f37; }
    .card.result-fail .value { color: #cf222e; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
      font-size: 14px;
    }
    th {
      background: #f0f0f0;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      border-bottom: 1px solid #ddd;
    }
    td { padding: 8px 14px; border-bottom: 1px solid #eee; }
    tr.fail td { background: #fff5f5; }
    tr.fail td:last-child { color: #cf222e; font-weight: 500; }
    tr.pass td:last-child { color: #1a7f37; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hacker News — Sort Validation Report</h1>
    <p class="meta">Generated on ${now}</p>

    <div class="summary">
      <div class="card ${sorted ? "result-pass" : "result-fail"}">
        <div class="label">Result</div>
        <div class="value">${sorted ? "PASS" : "FAIL"}</div>
      </div>
      <div class="card">
        <div class="label">Articles Checked</div>
        <div class="value">${articles.length}</div>
      </div>
      <div class="card">
        <div class="label">In Order</div>
        <div class="value">${passCount} / ${articles.length - 1}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Timestamp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const reportPath = path.resolve(__dirname, "report.html");
  fs.writeFileSync(reportPath, html);
  return reportPath;
}

(async () => {
  await sortHackerNewsArticles();
})();
