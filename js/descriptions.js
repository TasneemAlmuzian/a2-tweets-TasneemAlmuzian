/* js/descriptions.js
 * Part 3 — Live text search over user-written tweets
 * Fills/updates:
 *   #searchCount, #searchText, and <tbody id="tweetTable">
 * Input:
 *   #textFilter (updates on every keystroke)
 *
 * Assumes:
 * - RUNKEEPER_TWEETS global + Tweet class
 */

(function main() {
  // Wait for tweets to load
  const checkTweets = setInterval(() => {
    if (!window.RUNKEEPER_TWEETS || window.RUNKEEPER_TWEETS.length === 0) {
      return;
    }
    clearInterval(checkTweets);

    const Tweet = window.Tweet; // Declare the Tweet variable before using it
    const tweets = window.RUNKEEPER_TWEETS.map(
      (t) => new Tweet(t.text, t.created_at)
    );
    const userWritten = tweets.filter((t) => t.written);

    const input = document.querySelector("#textFilter");
    const countEl = document.querySelector("#searchCount");
    const textEl = document.querySelector("#searchText");
    const tbody = document.querySelector("#tweetTable");

    const renderRows = (rowsHtml) => {
      tbody.innerHTML = rowsHtml;
    };

    function search(queryRaw) {
      const q = (queryRaw ?? "").trim();
      if (q === "") {
        countEl.textContent = "0";
        textEl.textContent = "";
        renderRows("");
        return;
      }

      const qLower = q.toLowerCase();
      const matches = userWritten.filter((t) =>
        t.writtenText.toLowerCase().includes(qLower)
      );

      countEl.textContent = String(matches.length);
      textEl.textContent = q;

      // Row number is 1-based in UI; we can just index within filtered list
      const html = matches.map((t, i) => t.getHTMLTableRow(i)).join("");
      renderRows(html);
    }

    // Update on every keystroke
    input.addEventListener("input", (e) => search(e.target.value));
  }, 100);
})();
