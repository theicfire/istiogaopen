// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { createDb, get_all_emails, insert_email } from "@/tioga_db";
import { toErrorWithMessage } from "@/errorUtil";
import logger from "@/logger";

type Data = {
  done: string;
};

export default async function insertEmail(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const raw_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  logger.info(`raw_ip: ${raw_ip}`);
  let ip_address = "unknown";
  if (typeof raw_ip === "string") {
    ip_address = raw_ip;
  } else if (Array.isArray(raw_ip)) {
    ip_address = JSON.stringify(raw_ip);
  }

  createDb();
  const data = JSON.parse(req.body);
  const email = data.email;
  logger.info(`Attempt insert email: ${email}, ip: ${ip_address}`);
  try {
    await insert_email(email, ip_address);
  } catch (e: any) {
    const err = toErrorWithMessage(e);
    if (err.message.includes("UNIQUE constraint failed")) {
      logger.info("Email already exists");
    } else {
      throw e;
    }
  }

  res.status(200).json({ done: "done!" });
}
