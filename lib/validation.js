function parseHackerNewsTimestamp(timestampRaw) {
  if (typeof timestampRaw !== "string") {
    throw new TypeError("Hacker News timestamp must be a string.");
  }

  const [dateStr, unixSecondsRaw] = timestampRaw.trim().split(/\s+/);
  const unixSeconds = Number(unixSecondsRaw);

  if (!dateStr || !Number.isFinite(unixSeconds)) {
    throw new TypeError(`Invalid Hacker News timestamp: ${timestampRaw}`);
  }

  const timestamp = new Date(unixSeconds * 1000);
  if (Number.isNaN(timestamp.getTime())) {
    throw new TypeError(`Invalid Hacker News timestamp: ${timestampRaw}`);
  }

  return { dateStr, timestamp };
}

function validateArticleOrder(articles) {
  if (!Array.isArray(articles)) {
    throw new TypeError("Articles must be an array.");
  }

  const failures = [];

  for (let index = 0; index < articles.length - 1; index += 1) {
    const current = articles[index];
    const next = articles[index + 1];
    const currentTime = current.timestamp?.getTime();
    const nextTime = next.timestamp?.getTime();

    if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime)) {
      throw new TypeError("Every article must have a valid Date timestamp.");
    }

    if (currentTime < nextTime) {
      failures.push({ index: index + 1, current, next });
    }
  }

  return {
    sorted: failures.length === 0,
    failures,
    comparisonCount: Math.max(articles.length - 1, 0),
  };
}

function evaluateValidationRun(articles, requiredArticleCount) {
  if (!Number.isInteger(requiredArticleCount) || requiredArticleCount < 1) {
    throw new TypeError("Required article count must be a positive integer.");
  }

  const validation = validateArticleOrder(articles);
  const collectionComplete = articles.length === requiredArticleCount;

  return {
    ...validation,
    collectionComplete,
    passed: collectionComplete && validation.sorted,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = {
  escapeHtml,
  evaluateValidationRun,
  parseHackerNewsTimestamp,
  validateArticleOrder,
};
