import axios from "axios";
import TurndownService from "turndown";

async function scrapeToMarkdown(url: string): Promise<string> {
  const response = await axios.get(url);
  const html = response.data;

  const turndownService = new TurndownService();
  return turndownService.turndown(html);
}

export function extractTiogaSection(markdown: string): string {
  const lines = markdown.split("\n");
  let tiogaSection: string[] = [];
  let foundTioga = false;

  for (const line of lines) {
    if (foundTioga) {
      if (line.startsWith("Glacier Point Road")) {
        break;
      } else {
        tiogaSection.push(line);
      }
    } else if (/^Tioga Road$/.test(line)) {
      foundTioga = true;
    }
  }

  if (!foundTioga) {
    throw new Error("Could not find Tioga Road section in markdown");
  }

  return tiogaSection.join("\n");
}

export async function scrapeTioga(): Promise<string> {
  const URL = "https://www.nps.gov/yose/planyourvisit/tioga.htm";
  const markdown = await scrapeToMarkdown(URL);
  return markdown;
}
