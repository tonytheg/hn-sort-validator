const test = require("node:test");
const assert = require("node:assert/strict");

const {
  escapeHtml,
  evaluateValidationRun,
  parseHackerNewsTimestamp,
  validateArticleOrder,
} = require("../lib/validation");

function article(rank, timestamp) {
  return { rank, title: `Article ${rank}`, dateStr: timestamp.toISOString(), timestamp };
}

test("parses the Unix timestamp supplied by Hacker News", () => {
  const parsed = parseHackerNewsTimestamp("2024-01-01T00:00:00 1704067200");

  assert.equal(parsed.dateStr, "2024-01-01T00:00:00");
  assert.equal(parsed.timestamp.toISOString(), "2024-01-01T00:00:00.000Z");
});

test("rejects malformed Hacker News timestamps", () => {
  assert.throws(
    () => parseHackerNewsTimestamp("not-a-timestamp"),
    /Invalid Hacker News timestamp/
  );
});

test("accepts descending and equal timestamps", () => {
  const articles = [
    article(1, new Date("2024-01-03T00:00:00Z")),
    article(2, new Date("2024-01-02T00:00:00Z")),
    article(3, new Date("2024-01-02T00:00:00Z")),
  ];

  assert.deepEqual(validateArticleOrder(articles), {
    sorted: true,
    failures: [],
    comparisonCount: 2,
  });
});

test("reports every adjacent out-of-order pair", () => {
  const articles = [
    article(1, new Date("2024-01-01T00:00:00Z")),
    article(2, new Date("2024-01-03T00:00:00Z")),
    article(3, new Date("2024-01-04T00:00:00Z")),
  ];
  const result = validateArticleOrder(articles);

  assert.equal(result.sorted, false);
  assert.equal(result.comparisonCount, 2);
  assert.deepEqual(
    result.failures.map(({ index, current, next }) => [index, current.rank, next.rank]),
    [
      [1, 1, 2],
      [2, 2, 3],
    ]
  );
});

test("fails an otherwise sorted run when the required count is not collected", () => {
  const articles = [
    article(1, new Date("2024-01-03T00:00:00Z")),
    article(2, new Date("2024-01-02T00:00:00Z")),
  ];
  const result = evaluateValidationRun(articles, 3);

  assert.equal(result.sorted, true);
  assert.equal(result.collectionComplete, false);
  assert.equal(result.passed, false);
});

test("escapes article titles before inserting them into the HTML report", () => {
  assert.equal(
    escapeHtml("Research & <testing>"),
    "Research &amp; &lt;testing&gt;"
  );
});
