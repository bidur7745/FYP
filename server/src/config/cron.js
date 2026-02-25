import cron from "cron";
import https from "https";
import * as marketScraperService from "../services/marketScraperService.js";

const activeBackend = new cron.CronJob("*/14 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

/** Run once at 10:00 AM every day (server time) to scrape market prices */
const marketPriceScrapeJob = new cron.CronJob(
  "0 10 * * *",
  async function () {
    try {
      console.log("[Cron] Running scheduled market price scrape...");
      const result = await marketScraperService.scrapeAndSave();
      if (result.success) {
        console.log(
          `[Cron] Market prices scraped: ${result.saved} saved, ${result.scraped} from source`
        );
      } else {
        console.error("[Cron] Market price scrape failed:", result.error);
      }
    } catch (err) {
      console.error("[Cron] Market price scrape error:", err);
    }
  },
  null,
  false
);

/**
 * On server start: if there is no data for today, scrape once.
 * Call this after server.listen().
 */
export async function runMarketPriceScrapeIfNeeded() {
  try {
    const hasToday = await marketScraperService.hasTodayPrices();
    if (hasToday) {
      console.log("[Market prices] Today's data already present, skipping scrape.");
      return;
    }
    console.log("[Market prices] No data for today, running initial scrape...");
    const result = await marketScraperService.scrapeAndSave();
    if (result.success) {
      console.log(
        `[Market prices] Initial scrape done: ${result.saved} saved.`
      );
    } else {
      console.error("[Market prices] Initial scrape failed:", result.error);
    }
  } catch (err) {
    console.error("[Market prices] Initial scrape error:", err);
  }
}

export { marketPriceScrapeJob };
export default activeBackend;