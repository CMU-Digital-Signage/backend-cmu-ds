import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";
import nodemailer from "nodemailer";

export const email = Router();

email.post("/", async (req: any, res: Response) => {
  try {
    const userEmail = req.auth.email;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      auth: {
        user: "nomon0210@gmail.com",
        pass: "pvum guwv pwbu sbvo",
      },
    });

    const mailOptions = {
      from: "CPE DS <noreply>",
      to: userEmail,
      subject: "Reset Password for Activet Emergency",
      html: `
      <html>
        <h1>Welcome</h1>
        <button>That was easy!</button>
      </html>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.send({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
