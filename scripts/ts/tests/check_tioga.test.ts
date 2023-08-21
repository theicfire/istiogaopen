import { determine_tioga_open } from "../check_tioga";

import logger from "../logger";

const testMessages = [
  {
    query: `
        ## Tioga Road
        Tioga Road (the continuation of Highway 120 through the park) is scheduled to open to vehicular traffic on Friday, May 27, 2022, at 9 am. A reservation is required to drive into or through Yosemite between 6 am and 4 pm through September 30; this includes travelers passing through the park on Tioga Road.
        Road work has already begun in the Tenaya Lake and Tuolumne Meadows areas. Expect delays of up to 30 minutes during the day and one hour at night from Sunday nights through Friday afternoons.
        Tioga Road will be open to bicycles on May 21 and 22 only. (A reservation is still required unless entering the park before 6 am, after 4 pm, or by bicycle.) Cyclists should expect administrative traffic on the road. The road will be closed to bicycles May 23 through 26 due to construction and hazardous conditions.
        Tioga Road is normally open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15.
        `,
    answer: { is_open: false, is_open_soon: true },
  },
  {
    query: `
        ## Tioga Road
        Tioga Road (the continuation of Highway 120 through the park) opened on Friday, May 27, 2022, at 9 am. A reservation is required to drive into or through Yosemite between 6 am and 4 pm through September 30; this includes travelers passing through the park on Tioga Road.
        Road work has already begun in the Tenaya Lake and Tuolumne Meadows areas. Expect delays of up to 30 minutes during the day and one hour at night from Sunday nights through Friday afternoons.
        Tioga Road is normally open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15.
        `,
    answer: { is_open: true, is_open_soon: false },
  },
  {
    query: `
        ## Tioga Road
        Tioga Road (the continuation of Highway 120 through the park) closed for the season on October 21, 2021.
        Tioga Road is normally open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15.
        `,
    answer: { is_open: false, is_open_soon: false },
  },
  {
    query: `
        ## Tioga Road
        Plowing began on April 15. Crews have plowed the length of Tioga Road, but several weeks of additional work are required before the road can open.
        Tioga Road is normally open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15.
        `,
    answer: { is_open: false, is_open_soon: false },
  },
];

function resultMatches(
  result: Record<string, any>,
  answer: Record<string, any>
) {
  if (result.is_open === true) {
    return result.is_open === answer.is_open;
  }
  return (
    result.is_open === answer.is_open &&
    result.is_open_soon === answer.is_open_soon
  );
}

async function runTests() {
  testMessages.forEach(async (msg) => {
    logger.info("run query");
    const result = await determine_tioga_open(msg.query);
    if (resultMatches(result, msg.answer)) {
      logger.info(`PASS. ${JSON.stringify(msg, null, 2)}`);
    } else {
      logger.error(
        `Result does not match for message: ${JSON.stringify(
          msg,
          null,
          2
        )}\n\nInstead, got ${JSON.stringify(result)}`
      );
    }
  });
}

(async () => {
  await runTests();
})();
