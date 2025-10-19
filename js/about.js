/* js/about.js
 * Part 1 — Summarizing Tweets on index.html
 * - Fills: #numberTweets, #firstDate, #lastDate
 * - Fills counts & percentages for: .completedEvents, .liveEvents, .achievements, .miscellaneous
 *   and their companion percentage spans: .completedEventsPct, .liveEventsPct, .achievementsPct, .miscellaneousPct
 * - Fills user-written counts for completed tweets: .written and .writtenPct
 *
 * Assumes:
 * - RUNKEEPER_TWEETS is a global array of { text, created_at }
 * - global Tweet (compiled from ts/tweet.ts)
 * - math.js loaded (for fixed 2-decimal formatting)
 */

(function main() {
  // Build Tweet objects
  const tweets = RUNKEEPER_TWEETS.map(t => new Tweet(t.text, t.created_at));

  // Basic counts + dates
  const total = tweets.length;
  document.querySelector("#numberTweets").textContent = String(total);

  const sorted = [...tweets].sort((a, b) => a.time.getTime() - b.time.getTime());
  const earliest = sorted[0].time;
  const latest = sorted[sorted.length - 1].time;
  const fmtOpts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.querySelector("#firstDate").textContent = earliest.toLocaleDateString(undefined, fmtOpts);
  document.querySelector("#lastDate").textContent  = latest.toLocaleDateString(undefined, fmtOpts);

  // Category tallies
  const counts = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
  for (const t of tweets) counts[t.source] = (counts[t.source] ?? 0) + 1;

  // Fill helper for count + pct (two decimals)
  const setAll = (selectorCount, selectorPct, value) => {
    document.querySelectorAll(selectorCount).forEach(el => (el.textContent = String(value)));
    const pct = total ? (value / total) * 100 : 0;
    const pctStr = math.format(pct, { notation: "fixed", precision: 2 }) + "%";
    document.querySelectorAll(selectorPct).forEach(el => (el.textContent = pctStr));
  };

  setAll(".completedEvents", ".completedEventsPct", counts.completed_event);
  setAll(".liveEvents", ".liveEventsPct", counts.live_event);
  setAll(".achievements", ".achievementsPct", counts.achievement);
  setAll(".miscellaneous", ".miscellaneousPct", counts.miscellaneous);

  // User-written among completed tweets
  const completed = tweets.filter(t => t.source === "completed_event");
  const writtenCompleted = completed.filter(t => t.written);
  const wCount = writtenCompleted.length;
  document.querySelectorAll(".written").forEach(el => (el.textContent = String(wCount)));
  const wPct = completed.length ? (wCount / completed.length) * 100 : 0;
  const wPctStr = math.format(wPct, { notation: "fixed", precision: 2 }) + "%";
  document.querySelectorAll(".writtenPct").forEach(el => (el.textContent = wPctStr));
})();
