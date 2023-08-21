import { AsyncDatabase as sqlite3 } from "promised-sqlite3";

export async function createDb() {
  const db = await sqlite3.open("./storage/tioga.db");

  await db.run(`
            CREATE TABLE IF NOT EXISTS History (
                id INTEGER PRIMARY KEY,
                ts INTEGER DEFAULT (strftime('%s', 'now')),
                full_markdown TEXT,
                tioga_contents TEXT,
                misc_data TEXT,
                result TEXT,
                sent_email INTEGER DEFAULT 0
            )`);

  await db.run(`
            CREATE TABLE IF NOT EXISTS ConditionsHistory (
                id INTEGER PRIMARY KEY,
                ts INTEGER DEFAULT (strftime('%s', 'now')),
                found_html TEXT,
                is_open INTEGER DEFAULT 0
            )`);

  await db.run(`
            CREATE TABLE IF NOT EXISTS EmailList (
                id INTEGER PRIMARY KEY,
                ts INTEGER DEFAULT (strftime('%s', 'now')),
                email TEXT UNIQUE,
                ip_address TEXT
            )`);

  await db.close();
}

export async function insertConditionHistory(
  foundHtml: string,
  isOpen: boolean
) {
  const db = await sqlite3.open("./storage/tioga.db");
  const query = `
        INSERT INTO ConditionsHistory (found_html, is_open)
        VALUES (?, ?)`;
  await db.run(query, [foundHtml, isOpen ? 1 : 0]);
  await db.close();
}

export async function insertHistory(
  full_markdown: string,
  tioga_contents: string,
  misc_data: object,
  result: object,
  sent_email: boolean,
  ts?: number
) {
  const db = await sqlite3.open("./storage/tioga.db");
  if (ts) {
    const query = `
        INSERT INTO History (ts, full_markdown, tioga_contents, misc_data, result, sent_email)
        VALUES (?, ?, ?, ?, ?, ?)`;
    await db.run(query, [
      ts,
      full_markdown,
      tioga_contents,
      JSON.stringify(misc_data),
      JSON.stringify(result),
      sent_email,
    ]);
  } else {
    const query = `
        INSERT INTO History (full_markdown, tioga_contents, misc_data, result, sent_email)
        VALUES (?, ?, ?, ?, ?)`;
    await db.run(query, [
      full_markdown,
      tioga_contents,
      JSON.stringify(misc_data),
      JSON.stringify(result),
      sent_email,
    ]);
  }

  await db.close();
}

export async function clearHistoryTable() {
  const db = await sqlite3.open("./storage/tioga.db");
  await db.run(`DELETE FROM History`);
  await db.close();
}

export interface HistoryRow {
  id: number;
  ts: number;
  full_markdown: string;
  tioga_contents: string;
  misc_data: string;
  result: string;
  sent_email: number;
}
export interface ConditionsHistoryRow {
  id: number;
  ts: number;
  found_html: string;
  is_open: number;
}

export async function getAllHistory(): Promise<HistoryRow[]> {
  const db = await sqlite3.open("./storage/tioga.db");
  const rows: any = await db.all(`SELECT * FROM History ORDER BY ts DESC`);
  await db.close();
  return rows;
}

export async function getAllConditionsHistory(): Promise<
  ConditionsHistoryRow[]
> {
  const db = await sqlite3.open("./storage/tioga.db");
  const rows: any = await db.all(
    `SELECT * FROM ConditionsHistory ORDER BY ts DESC`
  );
  await db.close();
  return rows;
}

export async function getAllEmails(): Promise<string[]> {
  const db = await sqlite3.open("./storage/tioga.db");
  const rows: any = await db.all(`SELECT ts, email FROM EmailList`);
  await db.close();
  return rows.map((row: any) => row.email);
}

async function mostRecentSentEmail(): Promise<string> {
  const db = await sqlite3.open("./storage/tioga.db");
  const rows: any = await db.all(`
              SELECT ts FROM History
            WHERE sent_email = 1
            ORDER BY ts DESC
            LIMIT 1`);
  await db.close();
  return rows.length === 0 ? null : rows[0].ts;
}

export async function sentEmailThisYear() {
  const ts = await mostRecentSentEmail();
  if (ts === null) {
    return false;
  } else {
    const year = new Date(parseInt(ts, 10) * 1000).getFullYear();
    const currentYear = new Date().getFullYear();
    return year === currentYear;
  }
}

export async function insertEmail(email: string, ip_address: string) {
  const db = await sqlite3.open("./storage/tioga.db");

  await db.run(
    `INSERT INTO EmailList (email, ip_address)
        VALUES (?, ?)`,
    [email, ip_address]
  );

  await db.close();
}
