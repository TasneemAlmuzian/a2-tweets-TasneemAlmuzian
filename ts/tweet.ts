/* ts/tweet.ts
 * TypeScript Tweet class compiled to js/tweet.js
 * Must match starter signature:
 *   constructor(tweet_text: string, tweet_time: string)
 * Exposed getters:
 *   - source: "live_event" | "achievement" | "completed_event" | "miscellaneous"
 *   - written: boolean
 *   - writtenText: string
 *   - activityType: string ("unknown" if not a completed_event or not detected)
 *   - distance: number (miles; 0 if unknown/not completed_event)
 *   - getHTMLTableRow(rowNumber: number): string (with clickable link)
 */

class Tweet {
  private text: string;
  time: Date;

  constructor(tweet_text: string, tweet_time: string) {
    this.text = (tweet_text ?? "").trim();
    this.time = new Date(tweet_time);
  }

  // -------- helpers --------
  private firstLink(): string | null {
    const m = this.text.match(/https?:\/\/\S+/);
    return m ? m[0] : null;
  }

  private stripped(): string {
    let s = this.text
      .replace(/#Runkeeper/gi, "")
      .replace(/#RunKeeper/gi, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/via @?runkeeper/gi, "")
      .trim();
    // collapse spaces + trim quotes
    s = s.replace(/\s+/g, " ").replace(/^"|"$/g, "").trim();
    return s;
  }

  // -------- source category --------
  // returns 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
  get source(): string {
    const t = this.text.toLowerCase();

    // completed examples: “Just completed a 3.00 mi run…”, “I just ran…”
    const looksCompleted =
      t.startsWith("just completed") ||
      t.startsWith("i just ") ||
      t.includes(" completed a ") ||
      t.includes(" completed an ");

    // live-ish examples: “Just posted a X…”, “is running…”
    const looksLive =
      t.startsWith("just posted") ||
      /\bis (running|biking|walking|skiing|swimming)\b/.test(t);

    const looksAchievement =
      t.includes("new personal record") ||
      t.includes("pr!") ||
      t.includes("achieved") ||
      t.includes("set a goal") ||
      t.includes("achievement");

    if (looksCompleted) return "completed_event";
    if (looksLive)      return "live_event";
    if (looksAchievement) return "achievement";
    return "miscellaneous";
  }

  // -------- user-written detection --------
  get written(): boolean {
    // After stripping boilerplate, remove common template phrases.
    let s = this.stripped().toLowerCase();

    // generic template-ish words RunKeeper often injects
    const templates = [
      "just completed", "just posted", "activity", "workout",
      "with runkeeper", "check it out", "distance", "time", "pace",
      "completed a", "completed an", "posted a", "posted an",
      "run", "walk", "bike", "ride", "swim", "hike", "elliptical",
    ];
    for (const w of templates) {
      s = s.replace(new RegExp("\\b" + w + "\\b", "g"), " ");
    }
    s = s.replace(/\s+/g, " ").trim();

    // if there are at least 3 alphanumerics left, consider it user-written
    const letters = s.replace(/[^a-z0-9]/g, "");
    return letters.length >= 3;
  }

  get writtenText(): string {
    return this.written ? this.stripped() : "";
  }

  // -------- activity type & distance (for completed_event only) --------
  get activityType(): string {
    if (this.source !== "completed_event") return "unknown";
    const t = this.text.toLowerCase();

    const map: Record<string, string[]> = {
      running: ["run", "jog", "jogging"],
      walking: ["walk", "hike", "hiking"],
      cycling: ["bike", "biked", "biking", "ride", "rode", "cycling"],
      swimming: ["swim", "swam", "swimming"],
      elliptical: ["elliptical"],
      rowing: ["row", "rowing"],
      yoga: ["yoga"]
    };

    for (const [label, aliases] of Object.entries(map)) {
      for (const a of aliases) {
        if (new RegExp(`\\b${a}\\b`).test(t)) return label;
      }
    }

    // fallback: “completed a/an X …”
    const m = t.match(/completed (?:a|an) (\w+)/);
    if (m) return m[1];
    return "unknown";
  }

  get distance(): number {
    if (this.source !== "completed_event") return 0;

    const t = this.text.toLowerCase();

    // miles
    let m = t.match(/(\d+(?:\.\d+)?)\s*(mi|mile|miles)\b/);
    if (m) return parseFloat(m[1]);

    // kilometers → miles (approx 1 mi = 1.609 km)
    m = t.match(/(\d+(?:\.\d+)?)\s*(km|kilometer|kilometers)\b/);
    if (m) {
      const km = parseFloat(m[1]);
      return km / 1.609;
    }

    return 0;
  }

  // -------- HTML row for the search table --------
  getHTMLTableRow(rowNumber: number): string {
    const num = rowNumber + 1;
    const act = this.activityType ?? "unknown";
    const link = this.firstLink();

    const snippet = this.written ? this.writtenText : this.stripped();
    const linkedSnippet = link
      ? `${snippet} <a href="${link}" target="_blank" rel="noopener">link</a>`
      : snippet;

    return `
      <tr>
        <td>${num}</td>
        <td>${act}</td>
        <td>${linkedSnippet}</td>
      </tr>
    `;
  }
}
