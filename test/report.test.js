const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { buildReport } = require("../index");

test("writes a linked report while escaping untrusted article data", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "hn-report-"));
  const outputPath = path.join(tempDirectory, "report.html");

  try {
    buildReport(
      [
        {
          rank: 1,
          title: `Research & <testing> "today's"`,
          url: `https://example.com/article?a=1&label="test"`,
          dateStr: "2026-08-03T12:00:00",
        },
      ],
      { passed: true, failures: [], comparisonCount: 0 },
      { outputPath, generatedAt: new Date("2026-08-03T12:00:00Z") }
    );

    const html = fs.readFileSync(outputPath, "utf8");
    assert.match(
      html,
      /href="https:\/\/example\.com\/article\?a=1&amp;label=%22test%22"/
    );
    assert.match(
      html,
      /Research &amp; &lt;testing&gt; &quot;today&#39;s&quot;/
    );
    assert.doesNotMatch(html, /<testing>/);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test("renders unsafe article URLs as plain text", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "hn-report-"));
  const outputPath = path.join(tempDirectory, "report.html");

  try {
    buildReport(
      [
        {
          rank: 1,
          title: "Unsafe link",
          url: "javascript:alert(1)",
          dateStr: "2026-08-03T12:00:00",
        },
      ],
      { passed: false, failures: [], comparisonCount: 0 },
      { outputPath }
    );

    const html = fs.readFileSync(outputPath, "utf8");
    assert.match(html, /<td>Unsafe link<\/td>/);
    assert.doesNotMatch(html, /javascript:/);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
