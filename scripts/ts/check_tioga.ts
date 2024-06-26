import { OpenAI } from "openai";

import {
  createDb,
  getAllEmails,
  getAllHistory,
  getAllConditionsHistory,
  insertHistory as insertPlowingHistory,
  sentEmailThisYear,
  insertConditionHistory,
  updateHealthCheck,
  HealthCheckStatus,
} from "./tioga_db";
import {
  extractTiogaSection,
  scrapePlowingPage,
  scrapeConditionsPage,
} from "./scrape_pages";
import { sendEmailAsync } from "./send_email";
import logger from "./logger";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Analyze the content provided. List out all the dates in the content, and summarize what that date is referring to. Please capture every type of date, like "tomorrow", a month, a day of the week, or a specific date. The dates do not have to be specific. For example "sometime in June or July" is a valid date, and should be mentioned.

Here are some examples:

Text: Tioga Road is closed until further notice.
Answer: There are no dates in the provided text.

Text: Tioga Road is being plowed and will open June 12, 2023.
Answer:
- June 12, 2023. This is when Tioga Road will open.

Text: Tioga Road is will open next week. Only tractors will be able to drive on it. It will likely close again in November.
Answer:
- Next week. This is when Tioga Road will open.
- November. This is when Tioga Road will close.

Text: Tioga Road is will open tomorrow to bikes only.
Answer:
- Tomorrow. This is when Tioga Road will open to bikes only.

Text: Tigo Road will open Tuesday, November 27, 2022.
Answer:
- Tuesday, November 27, 2022. This is when Tioga Road will open.

Here is the content:

`;

const SYSTEM_PROMPT_2 = `
Great. Now, provide the following information in JSON: 
  - Is Tioga Road currently open when this text was written? For example, if the text says "Tioga Road opened in May", say that it is open because this is written in past tense. Provide this in the "is_open" field as a boolean value.
  - Is Tioga Road expected to open at a precise date in the future? Descriptions like "this weekend" or "June 8th" or "the first Friday of July" are all precise, whereas "sometime in July" is not. Provide this in the "is_open_soon" field as a boolean value.
  - Provide an explanation in the "explanation" field. Don\'t respond with anything else other than the JSON.
`;

class LLMChain {
  messages: Array<OpenAI.ChatCompletionMessageParam>;

  constructor() {
    this.messages = [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
    ];
  }

  async run(message: string): Promise<string | null> {
    this.messages.push({
      role: "user",
      content: message,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: this.messages,
      temperature: 0.5,
      n: 1,
    });

    const result = response.choices[0]?.message?.content;

    if (result) {
      this.messages.push({
        role: "assistant",
        content: result,
      });
      return result;
    } else {
      return null;
    }
  }
}

function decodeJsonBlob(str: string) {
  let startIdx = str.indexOf("{");
  if (startIdx === -1) return null;

  let braceCount = 0;
  for (let endIdx = startIdx + 1; endIdx <= str.length; endIdx++) {
    if (str[endIdx] === "{") {
      braceCount++;
    } else if (str[endIdx] === "}") {
      if (braceCount === 0) {
        let subStr = str.substring(startIdx, endIdx + 1);
        try {
          return JSON.parse(subStr);
        } catch (e) {
          // Not valid JSON, continue searching
        }
      } else {
        braceCount--;
      }
    }
  }

  // No valid JSON found in the string
  throw new Error("No valid JSON blob found in the text.");
}

class TiogaOpen {
  is_open: boolean = false;
  is_open_soon: boolean = false;
  explanation: string = "";

  constructor(is_open: boolean, is_open_soon: boolean, explanation: string) {
    this.is_open = is_open;
    this.is_open_soon = is_open_soon;
    this.explanation = explanation;
  }

  static from_dict(d: any) {
    return new TiogaOpen(d["is_open"], d["is_open_soon"], d["explanation"]);
  }
}

export async function determineTiogaOpen(text: string): Promise<TiogaOpen> {
  const chain = new LLMChain();
  let result = await chain.run(SYSTEM_PROMPT + text);
  logger.info(`RESULT1: ${result}`);
  result = await chain.run(SYSTEM_PROMPT_2);
  if (!result) {
    throw new Error("Could not get result from LLM chain");
  }
  logger.info(`RESULT2, to decode: ${result}`);
  const res = decodeJsonBlob(result);
  return TiogaOpen.from_dict(res);
}

export async function scrapeAndHandlePlowingPageUpdates() {
  const full_markdown = await scrapePlowingPage();
  const tioga_contents = extractTiogaSection(full_markdown);

  const histories = await getAllHistory();
  if (histories.length > 0) {
    const mostRecentHistory = histories[0];
    if (mostRecentHistory.tioga_contents === tioga_contents) {
      logger.info("Plowing page has not changed, skipping");
      return;
    }
  }
  logger.info(`Tioga contents: ${tioga_contents}`);

  const result = await determineTiogaOpen(tioga_contents);
  logger.info(`Result: ${JSON.stringify(result, null, 2)}`);
  let will_send_email = result.is_open || result.is_open_soon;
  if (will_send_email) {
    if (await sentEmailThisYear()) {
      logger.info("Already sent email this year, not sending again");
      will_send_email = false;
    }
  }
  if (will_send_email) {
    const bcc_recipients = await getAllEmails();
    const subject = "Tioga is possibly open soon!";
    let contents = `I *think* Tioga road will be opening soon!!

    Double check me, though: https://www.nps.gov/yose/planyourvisit/tioga.htm

    Sorry if there's a bug, I'll fix it quickly. It's possible the AI mischaracterized the website.

    Love,
    istiogaopen.com

    You can respond back directly to unsubscribe or to send some love to another random human :).`;
    contents = contents
      .split("\n")
      .map((line) => line.trim())
      .join("\n");

    logger.info(`Sending email to ${bcc_recipients}`);
    sendEmailAsync(bcc_recipients, subject, contents);
  }
  const misc_data = {};

  logger.info("Inserting history");
  await insertPlowingHistory(
    full_markdown,
    tioga_contents,
    misc_data,
    result,
    will_send_email
  );
}

export async function scrapeAndHandleConditionsPageUpdates() {
  const { foundHtml, isOpen } = await scrapeConditionsPage();
  const histories = await getAllConditionsHistory();
  if (histories.length > 0) {
    const mostRecentHistory = histories[0];
    if (!!mostRecentHistory.is_open === isOpen) {
      logger.info("Conditions website has not changed, skipping");
      return;
    }
  }

  console.log("After scraping the conditions website, isOpen is: ", isOpen);
  await insertConditionHistory(foundHtml, isOpen);
}

if (require.main === module) {
  (async () => {
    logger.info("====Let's scrape the plowing and conditions pages!====");
    try {
      await createDb();
      await scrapeAndHandlePlowingPageUpdates();
      await scrapeAndHandleConditionsPageUpdates();
      updateHealthCheck(HealthCheckStatus.OK);
    } catch (e) {
      updateHealthCheck(HealthCheckStatus.ERROR);
      console.log("Error", e);
    }
  })();
}
