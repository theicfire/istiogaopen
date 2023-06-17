import nodemailer from "nodemailer";
import logger from "./logger";
import "dotenv/config";

export function sendEmailAsync(
  bccRecipients: string[],
  subject: string,
  contents: string
) {
  if (bccRecipients.length === 0) {
    logger.info("No recipients, not sending email");
    return;
  }
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  let mailOptions = {
    from: `Chase Lambert <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
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


//  let bccRecipients = ["chase.g.lambert@gmail.com"];
//  let subject = "This is a test email2";
//  let contents = "This is the body of the email";
//  sendEmailAsync(bccRecipients, subject, contents);
