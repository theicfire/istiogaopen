import { scrapeConditionsPage } from "../scrape_pages";
import logger from "../logger";
import { promises as fs } from "fs";
import path from "path";

// function resultMatches(
//   result: Record<string, any>,
//   answer: Record<string, any>
// ) {
//   if (result.is_open === true) {
//     return result.is_open === answer.is_open;
//   }
//   return (
//     result.is_open === answer.is_open &&
//     result.is_open_soon === answer.is_open_soon
//   );
// }

async function testOpen() {
  const fname = path.resolve(__dirname, "./conditions_open.html");
  const html = await fs.readFile(fname, "utf8");
  const { isOpen } = await scrapeConditionsPage(html);
  if (isOpen) {
    logger.info("PASS. Tioga is open");
  } else {
    logger.error("FAIL. Tioga is not open");
  }
}

async function testClosed() {
  const fname = path.resolve(__dirname, "./conditions_closed.html");
  const html = await fs.readFile(fname, "utf8");
  const { isOpen } = await scrapeConditionsPage(html);
  if (!isOpen) {
    logger.info("PASS. Tioga is closed");
  } else {
    logger.error("FAIL. Tioga is not closed");
  }
}

async function testLive() {
  const fname = path.resolve(__dirname, "./conditions_closed.html");
  const html = await fs.readFile(fname, "utf8");
  const { isOpen } = await scrapeConditionsPage(html);
  if (isOpen) {
    console.log("Live test says Tioga is OPEN");
  } else {
    console.log("Live test says Tioga is CLOSED");
  }
}

async function runTests() {
  await testOpen();
  await testClosed();
  await testLive();
}

(async () => {
  await runTests();
})();
