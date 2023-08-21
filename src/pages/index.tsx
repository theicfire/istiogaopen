import { Inter } from "next/font/google";

import RiDoubleQuotesLeft from "@/components/svg/RiDoubleQuotesLeft";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import {
  HistoryRow,
  get_all_history,
  get_all_conditions_history,
  ConditionsHistoryRow,
} from "@/tioga_db";
import { markdownToHtml } from "@/markdown_parse";
import RxCrossCircled from "@/components/svg/RxCrossCircled";
import RxCheckCircled from "@/components/svg/RxCheckCircled";
import RxExclamationTriangle from "@/components/svg/RxExclamationTriangle";
import RxTwitter from "@/components/svg/RxTwitter";
import { type } from "os";

const SHOW_DEV_TOGGLER = process.env.DEVELOPMENT_BUTTONS === "True";

const inter = Inter({ subsets: ["latin"] });

const WorksText = () => (
  <div className="whitespace-pre-line text-sm">
    I scrape the two official Yosemite websites (
    <a href="https://www.nps.gov/yose/planyourvisit/tioga.htm">first</a>
    {", "}
    <a href="https://www.nps.gov/yose/planyourvisit/conditions.htm">second</a>)
    a few times a day. Whenever there are changes, I run some analysis through
    ChatGPT to determine if the road is open or not. The code is on{" "}
    <a href="https://github.com/theicfire/istiogaopen">Github</a>. I track the{" "}
    <Link href="/history">history of the Yosemite page</Link> updates if you’re
    curious.
    {"\n\n"}
    Any changes that are not reflected on that Yosemite website will not show up
    here either.
  </div>
);

const AboutText = () => (
  <div className="whitespace-pre-line text-sm">
    Hi, I{"'"}m <a href="https://chaselambda.com/">Chase</a>. The initial reason
    for building this was for biking. Tioga Road is typically open to cyclists
    only for one or two days every year. Yosemite gives notice when this is
    happening only a few days before prior, so if you want to ensure that you
    get the opportunity to ride it, you either need to check the website
    frequently, or simply subscribe to updates from here.
    {"\n\n"}
    Here’s a{" "}
    <a href="https://www.strava.com/routes/6579857">
      one-way Strava segment (58 miles, 6k elevation gain).
    </a>
    {"\n\n"}
    Of course, you might find this helpful for other reasons.
  </div>
);

const TiogaText = () => (
  <div className="whitespace-pre-line text-sm">
    Tioga Road is a gorgeous path that cuts through Yosemite, bridging the
    eastern and western Sierras. It also provides access to many incredible
    hikes. It’s closed about half of the year due to snow.
  </div>
);

interface StatusWrapperProps {
  icon: React.ReactNode;
  text: string;
  history: HistoryRow;
}

const StatusWrapper: React.FC<StatusWrapperProps> = ({
  icon,
  text,
  history,
}) => (
  <div>
    <div className="my-4 flex w-full items-center justify-center text-sm">
      <div className="mr-4 flex ">{icon}</div>
      <div className="flex">{text}</div>
    </div>
    <div className=" mt-4 mb-1 flex">
      <div className="mr-2 text-6xl">
        <RiDoubleQuotesLeft width={20} height={20} />
      </div>
      <div className="text-sm tioga-scraped-text">
        {markdownToHtml(history.tioga_contents)}
      </div>
    </div>
    <div className="text-sm flex w-full justify-end mb-6">
      - The{" "}
      <a
        className="ml-1"
        href="https://www.nps.gov/yose/planyourvisit/tioga.htm"
      >
        official Yosemite website
      </a>
    </div>
  </div>
);

const StatusOpenSoon = ({ history }: { history: HistoryRow }) => {
  const icon = <RxExclamationTriangle width={30} height={30} stroke="yellow" />;
  const text = "No, but it will open soon.";

  return <StatusWrapper icon={icon} text={text} history={history} />;
};

const StatusClosed = ({ history }: { history: HistoryRow }) => {
  const icon = <RxCrossCircled width={30} height={30} stroke={"Red"} />;
  const text = "No, and it's unclear when it will open.";
  return <StatusWrapper icon={icon} text={text} history={history} />;
};

const StatusMaybeOpen = () => {
  const icon = <RxExclamationTriangle width={30} height={30} stroke="yellow" />;
  return (
    <div className="my-4 items-center text-sm">
      <div className="flex">
        <div className="mr-4 flex ">{icon}</div>
        <div>
          {
            "Hmm. One website says it is open and the other says it's not. Look at "
          }
          <a href="https://www.nps.gov/yose/planyourvisit/conditions.htm">
            this
          </a>
          {" and "}
          <a href="https://www.nps.gov/yose/planyourvisit/tioga.htm">this</a>
        </div>
      </div>
    </div>
  );
};

const StatusOpen = () => {
  const icon = <RxCheckCircled width={30} height={30} stroke={"#00FF57"} />;
  return (
    <div className="my-4 items-center text-sm">
      <div className="flex">
        <div className="mr-4 flex ">{icon}</div>
        <div>
          Yes! See{" "}
          <a href="https://www.nps.gov/yose/planyourvisit/conditions.htm">
            the official Yosemite website
          </a>
          {" which says it's open."}
        </div>
      </div>
    </div>
  );
};

const CurrentStatus = ({
  tiogaHistory,
  conditionsHistory,
}: {
  tiogaHistory: HistoryRow;
  conditionsHistory: ConditionsHistoryRow;
}) => {
  const tiogaOpenResult = JSON.parse(tiogaHistory.result);

  if (conditionsHistory.is_open) {
    return <StatusOpen />;
  } else if (tiogaOpenResult.is_open) {
    return <StatusMaybeOpen />;
  } else if (tiogaOpenResult.is_open_soon) {
    return <StatusOpenSoon history={tiogaHistory} />;
  } else {
    return <StatusClosed history={tiogaHistory} />;
  }
};

const DevToggler = ({
  mostRecentHistory,
  setMostRecentHistory,
  mostRecentConditionsHistory,
  setMostRecentConditionsHistory,
}: {
  setMostRecentHistory: (history: HistoryRow) => void;
  mostRecentHistory: HistoryRow;
  setMostRecentConditionsHistory: (history: ConditionsHistoryRow) => void;
  mostRecentConditionsHistory: ConditionsHistoryRow;
}) => {
  const historyOpen = {
    result: `{"is_open":true,"is_open_soon":true,"hardcode_override":true}`,
    id: 0,
    ts: 0,
    full_markdown: "",
    tioga_contents: "Oh baby, we plowed it!",
    misc_data: "",
    sent_email: 0,
  };
  const historyClosed = {
    result: `{"is_open":false,"is_open_soon":false,"hardcode_override":true}`,
    id: 0,
    ts: 0,
    full_markdown: "",
    tioga_contents: "Oh gosh, it's closed, not yet plowed",
    misc_data: "",
    sent_email: 0,
  };
  const historyOpenSoon = {
    result: `{"is_open":false,"is_open_soon":true,"hardcode_override":true}`,
    id: 0,
    ts: 0,
    full_markdown: "",
    tioga_contents: "Alllmost there!",
    misc_data: "",
    sent_email: 0,
  };
  const conditionsHistoyOpen = {
    is_open: 1,
    id: 0,
    ts: 0,
    found_html: "",
  };
  const conditionsHistoyClosed = {
    is_open: 0,
    id: 0,
    ts: 0,
    found_html: "",
  };
  // Show two sets of links that are clickable. One for the tioga road and one for the conditions.
  // When clicked, it will update the current status to that.
  // It will also make the selected one bold.

  enum HistoryStatus {
    open = "open",
    closed = "closed",
    open_soon = "open_soon",
  }

  useEffect(() => {
    setMostRecentConditionsHistory(conditionsHistoyOpen);
    setMostRecentHistory(historyOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const historyStatus = ((history: HistoryRow): HistoryStatus => {
    const result = JSON.parse(history.result);
    if (result.is_open) {
      return HistoryStatus.open;
    } else if (result.is_open_soon) {
      return HistoryStatus.open_soon;
    } else {
      return HistoryStatus.closed;
    }
  })(mostRecentHistory);

  const conditionsHistoryOpen = mostRecentConditionsHistory.is_open;

  return (
    <div className="flex justify-end w-full">
      <div className="flex flex-col border-2 p-4 border-sky-400">
        <div className="underline mb-2">
          Dev mode: play around with statuses
        </div>

        <div className="flex text-xs">
          <div className="mr-4 italic">Conditions Page:</div>
          <div className="mr-4">
            <button
              className={`${conditionsHistoryOpen ? "font-bold" : ""}`}
              onClick={() => {
                setMostRecentConditionsHistory(conditionsHistoyOpen);
              }}
            >
              Conditions Open
            </button>
          </div>
          <div className="mr-4">
            <button
              className={`${!conditionsHistoryOpen ? "font-bold" : ""}`}
              onClick={() => {
                setMostRecentConditionsHistory(conditionsHistoyClosed);
              }}
            >
              Conditions Closed
            </button>
          </div>
        </div>

        <div className="flex text-xs">
          <div className="mr-4 italic">Tioga Page:</div>
          <div className="mr-4">
            <button
              className={historyStatus == HistoryStatus.open ? "font-bold" : ""}
              onClick={() => {
                setMostRecentHistory(historyOpen);
              }}
            >
              Open
            </button>
          </div>
          <div className="mr-4">
            <button
              className={
                historyStatus == HistoryStatus.closed ? "font-bold" : ""
              }
              onClick={() => {
                setMostRecentHistory(historyClosed);
              }}
            >
              Closed
            </button>
          </div>
          <div className="mr-4">
            <button
              className={
                historyStatus == HistoryStatus.open_soon ? "font-bold" : ""
              }
              onClick={() => {
                setMostRecentHistory(historyOpenSoon);
              }}
            >
              Open Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function isValidEmail(email: string) {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
}

export default function Home({
  histories,
  conditionsHistories,
  showDevToggler,
}: {
  histories: HistoryRow[];
  conditionsHistories: ConditionsHistoryRow[];
  showDevToggler: boolean;
}) {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [doneForm, setDoneForm] = useState(false);
  const [mostRecentHistory, setMostRecentHistory] = useState(histories[0]);
  const [mostRecentConditionsHistory, setMostRecentConditionsHistory] =
    useState(conditionsHistories[0]);

  const handleEmailChange = (event: any) => {
    setEmail(event.target.value);
    setDoneForm(false);
  };

  const submitEmail = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isValidEmail(email)) {
      setFormError("Please enter a valid email.");
      return;
    }

    const res = await fetch("/api/main", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setDoneForm(false);
      setFormError("Eek, something went wrong.");
    } else {
      setDoneForm(true);
      setFormError("");
    }
  };
  const formClass = !!formError
    ? "border-red-500 focus:border-red-300"
    : "border-white focus:border-blue-500";
  return (
    <main className={`${inter.className}`}>
      {showDevToggler && (
        <DevToggler
          setMostRecentHistory={setMostRecentHistory}
          mostRecentHistory={mostRecentHistory}
          setMostRecentConditionsHistory={setMostRecentConditionsHistory}
          mostRecentConditionsHistory={mostRecentConditionsHistory}
        />
      )}
      <div className="flex justify-center m-4">
        <div className="flex max-w-lg flex-col items-center">
          <h1 className="text-3xl">Is Tioga Road Open?</h1>
          <CurrentStatus
            tiogaHistory={mostRecentHistory}
            conditionsHistory={mostRecentConditionsHistory}
          />

          <h1 className="text-3xl">Get Notified in 2024</h1>
          <div className="text-sm">
            Get notified in 2024 when Yosemite determines an exact date for when
            Tioga Road will open.
          </div>
          <div className="my-4 flex w-full items-center justify-evenly">
            <form onSubmit={submitEmail}>
              <div className="flex flex-col">
                <div className="text-xs">Email</div>
                <input
                  type="input"
                  className={`rounded-md border ${formClass} bg-transparent p-1 focus:outline-none`}
                  value={email}
                  onChange={handleEmailChange}
                />
                {!!formError && (
                  <div className="text-xs text-red-500">{formError}</div>
                )}
                {doneForm && (
                  <div className="text-xs text-green-500">
                    Added to the list!
                  </div>
                )}
                <button
                  type="submit"
                  className="my-2 w-full rounded-md bg-gradient-to-l from-blue-400 to-blue-600 py-1 font-bold shadow-md shadow-blue-500/50 transition-shadow duration-300 ease-in-out hover:shadow-none focus:shadow-none focus:outline-dashed focus:outline-1 focus:outline-offset-2 focus:outline-blue-500"
                  // onClick={submitEmail}
                >
                  Send Me Updates
                </button>
                <div className="mt-1 text-center text-xs text-gray-400">
                  Unsubscribe whenever.
                </div>
              </div>
            </form>
            {/* <div className="h-32 w-px bg-[#999]" />
            <div>
              <a className="mx-1 mb-4 block" href="https://twitter.com/">
                <RxTwitter width={80} height={80} stroke="#55ADEE" />
              </a>
            </div> */}
          </div>

          <h1 className="text-3xl">Tell Me More</h1>
          <AboutText />

          <h2 className="mt-8 flex w-full justify-start text-2xl">
            Can I trust this information?
          </h2>
          <WorksText />

          <h2 className="mt-8 flex w-full justify-start text-2xl">
            Tioga Road?
          </h2>
          <TiogaText />
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  //   const res = await fetch(
  //     "https://jsonplaceholder.typicode.com/posts?_limit=5"
  //   );
  const histories = await get_all_history();
  const conditionsHistories = await get_all_conditions_history();
  console.log(histories[0]);

  // const override_date = new Date(1990, 7, 22, 0, 0, 0, 0);
  // if (new Date() > override_date) {
  //   const override_history = {
  //     result: `{"is_open":true,"is_open_soon":true,"hardcode_override":true}`,
  //     id: 0,
  //     ts: 0,
  //     full_markdown: "",
  //     tioga_contents: "",
  //     misc_data: "",
  //     sent_email: 0,
  //   };
  //   histories.unshift(override_history);
  // }

  return {
    props: {
      histories,
      conditionsHistories,
      showDevToggler: SHOW_DEV_TOGGLER,
    },
  };
}
