/* js/activities.js
 * Part 2 — Activities + Visualizations (Vega-Lite)
 * Fills:
 *   #numberActivities (distinct activity types among completed tweets with a parsed type)
 *   #firstMost, #secondMost, #thirdMost (top-3 most frequent types)
 *   #longestActivityType, #shortestActivityType (by average distance, among parsed types)
 *   #weekdayOrWeekendLonger ("weekdays" or "weekends")
 * Charts:
 *   #activityVis (bar: count by activity type)
 *   #distanceVis (scatter: distance vs day, top-3 types)
 *   #distanceVisAggregated (mean bar/small multiples: distance vs day, top-3 types)
 * Toggle:
 *   #aggregate (button switches between raw and aggregated)
 *
 * Assumes:
 * - RUNKEEPER_TWEETS global + Tweet class
 * - vega, vegaLite, vegaEmbed loaded
 * - math.js loaded
 */

(function main() {
  const tweets = RUNKEEPER_TWEETS.map(t => new Tweet(t.text, t.created_at));
  const completed = tweets.filter(t => t.source === "completed_event");

  // Build rows with parsed type, miles, and day-of-week (0 Sun … 6 Sat)
  const rows = completed.map(t => ({
    type: t.activityType,             // string or "unknown"
    miles: t.distance,                // number (0 if unknown)
    dow: t.time.getDay(),             // 0..6
  }));

  // Keep only rows with a recognized type AND a valid positive distance
  const valid = rows.filter(r => r.type && r.type !== "unknown" && typeof r.miles === "number" && r.miles > 0);

  // Distinct activity types + counts
  const countsMap = new Map();
  for (const r of valid) countsMap.set(r.type, (countsMap.get(r.type) ?? 0) + 1);

  const typeCounts = Array.from(countsMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Fill numberActivities (distinct types)
  document.querySelector("#numberActivities").textContent = String(new Set(valid.map(v => v.type)).size);

  // Top 3 types
  const top3 = typeCounts.slice(0, 3).map(x => x.type);
  document.querySelector("#firstMost").textContent  = top3[0] ?? "(n/a)";
  document.querySelector("#secondMost").textContent = top3[1] ?? "(n/a)";
  document.querySelector("#thirdMost").textContent  = top3[2] ?? "(n/a)";

  // Average distance by type (for longest/shortest)
  const aggType = new Map(); // type -> { total, n }
  for (const r of valid) {
    const a = aggType.get(r.type) ?? { total: 0, n: 0 };
    a.total += r.miles; a.n += 1;
    aggType.set(r.type, a);
  }
  const avgByType = Array.from(aggType.entries()).map(([type, { total, n }]) => ({ type, avg: total / n }));
  avgByType.sort((a, b) => b.avg - a.avg);
  document.querySelector("#longestActivityType").textContent  = avgByType[0]?.type ?? "(n/a)";
  document.querySelector("#shortestActivityType").textContent = avgByType[avgByType.length - 1]?.type ?? "(n/a)";

  // Weekday vs weekend average distance (across all types)
  const isWeekend = d => d === 0 || d === 6;
  let wkSum = 0, wkN = 0, weSum = 0, weN = 0;
  for (const r of valid) {
    if (isWeekend(r.dow)) { weSum += r.miles; weN++; }
    else { wkSum += r.miles; wkN++; }
  }
  const wkAvg = wkN ? wkSum / wkN : 0;
  const weAvg = weN ? weSum / weN : 0;
  document.querySelector("#weekdayOrWeekendLonger").textContent = weAvg > wkAvg ? "weekends" : "weekdays";

  // ---------- Charts ----------

  // 1) Count per activity type (bar)
  const specCounts = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Count of activities by type",
    data: { values: typeCounts },
    mark: "bar",
    encoding: {
      x: { field: "type", type: "nominal", sort: "-y", title: "Activity type" },
      y: { field: "count", type: "quantitative", title: "Count" },
      tooltip: [{ field: "type" }, { field: "count" }]
    }
  };
  vegaEmbed("#activityVis", specCounts, { actions: false });

  // 2) Distances by day of week for the top-3 types (raw points)
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const distTop3 = valid
    .filter(r => top3.includes(r.type))
    .map(r => ({ type: r.type, day: dayNames[r.dow], miles: r.miles }));

  const specRaw = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Distance by day (raw), top-3 types",
    data: { values: distTop3 },
    mark: "circle",
    encoding: {
      x: { field: "day", type: "ordinal", sort: dayNames, title: "Day of week" },
      y: { field: "miles", type: "quantitative", title: "Distance (mi)" },
      color: { field: "type", type: "nominal", title: "Activity" },
      tooltip: [{ field: "type" }, { field: "day" }, { field: "miles" }]
    }
  };

  // 3) Mean distance by day for the top-3 types (aggregated)
  const specAgg = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Mean distance by day, top-3 types",
    data: { values: distTop3 },
    mark: "bar",
    encoding: {
      x: { field: "day", type: "ordinal", sort: dayNames, title: "Day of week" },
      y: { aggregate: "mean", field: "miles", type: "quantitative", title: "Mean distance (mi)" },
      color: { field: "type", type: "nominal", title: "Activity" },
      column: { field: "type", type: "nominal", title: null }
    }
  };

  // Initial render: show raw; hide aggregated (empty container first)
  let showingMeans = false;
  const render = () => {
    document.querySelector("#distanceVis").innerHTML = "";
    document.querySelector("#distanceVisAggregated").innerHTML = "";
    if (!showingMeans) {
      vegaEmbed("#distanceVis", specRaw, { actions: false });
    } else {
      vegaEmbed("#distanceVisAggregated", specAgg, { actions: false });
    }
    document.querySelector("#aggregate").textContent = showingMeans ? "Show raw" : "Show means";
  };
  render();

  // Toggle on click
  document.querySelector("#aggregate").addEventListener("click", () => {
    showingMeans = !showingMeans;
    render();
  });
})();
