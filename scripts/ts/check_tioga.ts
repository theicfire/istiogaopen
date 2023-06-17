import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
import {
  create_db,
  get_all_emails,
  get_all_history,
  insert_history,
  sent_email_this_year,
} from "./tioga_db";
import { extractTiogaSection, scrapeTioga } from "./scrape_tioga";
import { sendEmailAsync } from "./send_email";
import logger from "./logger";
import "dotenv/config";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
  messages: Array<{
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
  }>;

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

    const response = await openai.createChatCompletion({
      // model: "gpt-3.5-turbo",
      model: "gpt-4-0314",
      messages: this.messages,
      temperature: 0.5,
      n: 1,
    });

    const result = response.data?.["choices"][0]?.["message"]?.["content"];

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

function decode_json_blob(str: string) {
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

export async function determine_tioga_open(text: string): Promise<TiogaOpen> {
  const chain = new LLMChain();
  let result = await chain.run(SYSTEM_PROMPT + text);
  logger.info(`RESULT1: ${result}`);
  result = await chain.run(SYSTEM_PROMPT_2);
  if (!result) {
    throw new Error("Could not get result from LLM chain");
  }
  logger.info(`RESULT2, to decode: ${result}`);
  const res = decode_json_blob(result);
  return TiogaOpen.from_dict(res);
}

export async function fullScrapeTioga() {
  logger.info("====Let's Scrape Tioga!====");
  await create_db();
  const full_markdown = await scrapeTioga();
  const tioga_contents = extractTiogaSection(full_markdown);

  const histories = await get_all_history();
  const mostRecentHistory = histories[0];
  if (mostRecentHistory.tioga_contents === tioga_contents) {
    logger.info("Tioga contents have not changed, quitting");
    return;
  }
  logger.info(`Tioga contents: ${tioga_contents}`);

  const result = await determine_tioga_open(tioga_contents);
  logger.info(`Result: ${JSON.stringify(result, null, 2)}`);
  let will_send_email = result.is_open || result.is_open_soon;
  if (will_send_email) {
    if (await sent_email_this_year()) {
      logger.info("Already sent email this year, not sending again");
      will_send_email = false;
    }
  }
  if (will_send_email) {
    const bcc_recipients = await get_all_emails();
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
  await insert_history(
    full_markdown,
    tioga_contents,
    misc_data,
    result,
    will_send_email
  );
}

if (require.main === module) {
  (async () => {
    await fullScrapeTioga();
  })();
}
