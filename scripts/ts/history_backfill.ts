import { determineTiogaOpen } from "./check_tioga";
import {
  clearHistoryTable,
  createDb,
  getAllHistory,
  insertHistory,
  sentEmailThisYear,
} from "./db";

const historicalData = [
  {
    date: "May 26, 2023",
    text: `_May 26, 2023 (updated every Friday)_

Plows are 15 miles from the Crane Flat gate.

_Yosemite had record snowpack (over 240% of average) as of April 1, 2023. In the previous snowiest years, Tioga Road opened in late June or early July. There is no way to provide a more precise estimate for this year._

_Tioga Road is typically open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15._`,
    result: {
      is_open: false,
      is_open_soon: false,
    },
  },
  {
    date: "May 18, 2023",
    text: `_May 18, 2023 (updated every Friday)_

Plows are 14 miles from the Crane Flat gate (just west of White Wolf), plowing through 8 to 11 feet of snow. Avalanche crews (ahead of the plows) are blasting at Olmsted Point but are seeing very thick ice there.

_Yosemite had record snowpack (over 240% of average) as of April 1, 2023. In the previous snowiest years, Tioga Road opened in late June or early July. There is no way to provide a more precise estimate for this year._

_Tioga Road is typically open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15._`,
    result: {
      is_open: false,
      is_open_soon: false,
    },
  },
  {
    date: "May 11, 2023",
    text: `_May 11, 2023 (updated every Friday)_

Plows are 11 miles from the Crane Flat gate (about 3 miles west of White Wolf), plowing through 8 to 11 feet of snow. Three dozers and three blowers are working on the road.

_Yosemite had record snowpack (over 240% of average) as of April 1, 2023. In the previous snowiest years, Tioga Road opened in late June or early July. There is no way to provide a more precise estimate for this year._

_Tioga Road is typically open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15._`,
    result: {
      is_open: false,
      is_open_soon: false,
    },
  },
  {
    date: "April 28, 2023",
    text: `_April 28, 2023 (updated every Friday)_

The avalanche team has been traveling the road by snowcat has begun to mitigate avalanche zones. More equipment is being hauled up to begin work.

_Yosemite had record snowpack (over 240% of average) as of April 1, 2023. In the previous snowiest years, Tioga Road opened in late June or early July. There is no way to provide a more precise estimate for this year._

_Tioga Road is typically open to vehicles from late May or June until sometime in November. Plowing typically begins around April 15._`,
    result: {
      is_open: false,
      is_open_soon: false,
    },
  },
];

if (require.main === module) {
  (async () => {
    await createDb();
    await clearHistoryTable();

    await Promise.all(
      historicalData.map(async ({ date, text }) => {
        console.log("Query chatgpt for info with date", date);
        const result = await determineTiogaOpen(text);
        console.log("Insert for date", date);
        const misc_data = {};
        const will_send_email = false;
        const ts = new Date(date).getTime() / 1000;
        await insertHistory(text, text, misc_data, result, will_send_email, ts);
      })
    );

    const histories = await getAllHistory();
    console.log("Histories", histories);
  })();
}
