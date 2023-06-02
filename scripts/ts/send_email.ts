import nodemailer from "nodemailer";
import logger from "./logger";
import "dotenv/config";

export async function sendEmail(
  bccRecipients: string[],
  subject: string,
  contents: string
) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.GMAIL_USER,
    to: "", //empty if no recipient
    bcc: bccRecipients,
    subject: subject,
    text: contents,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.info(error);
    } else {
      logger.info("Email sent: " + info.response);
    }
  });
}

// let bccRecipients = ["chase.g.lambert@gmail.com"];
// let subject = "This is a test email";
// let contents = "This is the body of the email";
// sendEmail(bccRecipients, subject, contents);
