const test = require("node:test");
const assert = require("node:assert/strict");

const { appendUniqueArticles, navigateWithRetry } = require("../index");

function response(status) {
  return {
    status: () => status,
    ok: () => status >= 200 && status < 300,
  };
}

function mockPage(statuses) {
  const calls = {
    goto: [],
    selectors: [],
    waits: [],
  };

  return {
    calls,
    async goto(url, options) {
      calls.goto.push({ url, options });
      return response(statuses.shift());
    },
    async waitForSelector(selector) {
      calls.selectors.push(selector);
    },
    async waitForTimeout(milliseconds) {
      calls.waits.push(milliseconds);
    },
  };
}

test("waits for article rows after a successful navigation", async () => {
  const page = mockPage([200]);

  await navigateWithRetry(page, "https://news.ycombinator.com/newest");

  assert.equal(page.calls.goto.length, 1);
  assert.deepEqual(page.calls.goto[0].options, {
    waitUntil: "domcontentloaded",
  });
  assert.deepEqual(page.calls.selectors, ["tr.athing"]);
  assert.deepEqual(page.calls.waits, []);
});

test("retries a rate-limited request before reading article rows", async () => {
  const page = mockPage([429, 200]);

  await navigateWithRetry(page, "https://news.ycombinator.com/newest", {
    maxAttempts: 2,
    retryDelayMs: 25,
  });

  assert.equal(page.calls.goto.length, 2);
  assert.deepEqual(page.calls.waits, [25]);
  assert.deepEqual(page.calls.selectors, ["tr.athing"]);
});

test("fails clearly when rate limiting persists", async () => {
  const page = mockPage([429, 429]);

  await assert.rejects(
    navigateWithRetry(page, "https://news.ycombinator.com/newest", {
      maxAttempts: 2,
      retryDelayMs: 25,
    }),
    /rate limit persisted after 2 attempts/
  );

  assert.equal(page.calls.goto.length, 2);
  assert.deepEqual(page.calls.waits, [25]);
  assert.deepEqual(page.calls.selectors, []);
});

test("fails immediately for a non-retryable HTTP response", async () => {
  const page = mockPage([503]);

  await assert.rejects(
    navigateWithRetry(page, "https://news.ycombinator.com/newest"),
    /failed with HTTP 503/
  );

  assert.equal(page.calls.goto.length, 1);
  assert.deepEqual(page.calls.waits, []);
  assert.deepEqual(page.calls.selectors, []);
});

test("collects the requested number of unique articles across pages", () => {
  const articles = [];
  const seenArticleIds = new Set();

  appendUniqueArticles(
    articles,
    [
      { id: "101", title: "First" },
      { id: "102", title: "Second" },
    ],
    seenArticleIds,
    3
  );
  appendUniqueArticles(
    articles,
    [
      { id: "102", title: "Second, shifted" },
      { id: "103", title: "Third" },
      { id: "104", title: "Fourth" },
    ],
    seenArticleIds,
    3
  );

  assert.deepEqual(
    articles.map(({ id }) => id),
    ["101", "102", "103"]
  );
  assert.equal(seenArticleIds.size, 3);
});

test("rejects article data without a stable Hacker News item ID", () => {
  assert.throws(
    () => appendUniqueArticles([], [{ title: "Missing ID" }], new Set()),
    /must have an item ID/
  );
});
