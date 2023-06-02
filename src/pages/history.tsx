import { Inter } from "next/font/google";

import RiDoubleQuotesLeft from "@/components/svg/RiDoubleQuotesLeft";
import RxExclamationTriangle from "@/components/svg/RxExclamationTriangle";
import RxTwitter from "@/components/svg/RxTwitter";

import React, { useState } from "react";
import { get_all_history, HistoryRow } from "@/tioga_db";
import RxCrossCircled from "@/components/svg/RxCrossCircled";
import RxCheckCircled from "@/components/svg/RxCheckCircled";
import Link from "next/link";
import { markdownToHtml } from "@/markdown_parse";

const inter = Inter({ subsets: ["latin"] });

const HistoryEntry = ({ history }: { history: HistoryRow }) => {
  const result = JSON.parse(history.result);
  const dateString = new Date(history.ts * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="mt-4">
      <div className="text-xl">{dateString}</div>
      <div className="text-md mt-1 font-bold">Official Yosemite Text</div>
      <div className="text-sm ml-10 tioga-scraped-text">
        {markdownToHtml(history.tioga_contents)}
      </div>
      <div className="text-md mt-4 font-bold">ChatGPT{"'"}s Interpretation</div>
      <div className="ml-10 text-sm">
        {result.is_open ? (
          <div className="flex items-center mt-2">
            <RxCheckCircled width={20} height={20} stroke={"#00FF57"} />
            <div className="ml-2">Open!</div>
          </div>
        ) : (
          <div className="flex items-center mt-2">
            <RxCrossCircled width={20} height={20} stroke={"Red"} />
            <div className="ml-2">Not open</div>
          </div>
        )}
        {result.is_open_soon ? (
          <div className="flex items-center mt-2">
            <RxCheckCircled width={20} height={20} stroke={"#00FF57"} />
            <div className="ml-2">Open soon!</div>
          </div>
        ) : (
          <div className="flex items-center mt-2">
            <RxCrossCircled width={20} height={20} stroke={"Red"} />
            <div className="ml-2">Not open soon</div>
          </div>
        )}
        <div className="mt-1">
          {'"'}
          {result.explanation}
          {'"'}
        </div>
      </div>
    </div>
  );
};

export default function History({ histories }: { histories: HistoryRow[] }) {
  return (
    <main className={`${inter.className}`}>
      <div className="flex justify-center mx-4 my-2">
        <div className="flex max-w-lg flex-col items-center">
          <div className="flex justify-end w-full text-white">
            <Link className="text-sm" href="/">
              {"<"} Home
            </Link>
          </div>
          <div className="text-3xl">Tioga Website History</div>
          <div className="text-sm">
            A history of the updates from the
            <a
              className="mx-1"
              href="https://www.nps.gov/yose/planyourvisit/tioga.htm"
            >
              official Yosemite website
            </a>
          </div>
          <div className="whitespace-pre-line text-sm">
            {histories.map((history) => (
              <div key={history.ts}>
                <HistoryEntry history={history} />
              </div>
            ))}
          </div>
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
  return {
    props: {
      histories,
    },
  };
}
