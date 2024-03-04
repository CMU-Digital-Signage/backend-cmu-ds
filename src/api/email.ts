import { Request, Response, Router } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { MailOptions } from "nodemailer/lib/sendmail-transport";

export const email = Router();

email.post("/", async (req: any, res: Response) => {
  try {
    const email = req.auth.email;
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET!,
      // Token will last for 3 min only
      { expiresIn: "180s" }
    );
    const link = req.body.link + token;

    const wrapedSendMail = async (mailOptions: MailOptions) => {
      return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
          service: "gmail",
          port: 587,
          auth: {
            user: process.env.USER_SEND_EMAIL,
            pass: process.env.PASS_SEND_EMAIL,
          },
        });
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log("error is " + err);
            resolve(false);
          } else {
            console.log("Email sent: " + info.response);
            resolve(true);
          }
        });
      });
    };

    const sendMail = async () => {
      const mailOptions = {
        from: "pixelParade <noreply>",
        to: email,
        subject: "Reset Emergency Password",
        attachments: [
          {
            filename: "cpe-logo.jpg",
            path: `${__dirname}/../../image/cpe-logo.png`,
            cid: "cpelogo", //same cid value as in the html img src
          },
        ],
        html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap')
          </style>
        </head>
        
        <body style="background-color:rgb(255,255,255); margin-top:auto; font-family:"Roboto"; margin-bottom:auto; margin-left:auto; margin-right:auto; padding-left:0.5rem ;padding-right:0.5rem;">
          <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:650px;border-width:2px;border-style:solid;border-color:rgb(131, 194, 57);border-radius:0.55rem;margin-top:40px;margin-bottom:40px;margin-left:auto;margin-right:auto;padding:10px">
            <tbody>
              <tr style="width:100%">
                <td>
                  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:32px">
                    <tbody>
                      <tr>
                        <td>
                          <img id="no-background" alt="cpelogo" height="55" src="cid:cpelogo" style="display:block; background-color: rgba(255,255,255,0.5); outline:none; border:none; margin-left:auto; margin-right:auto" width="200" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <h1 class="" style="color:rgb(0,0,0);font-size:24px;font-weight:400;text-align:center;padding:0px;margin-top:30px;margin-bottom:30px;margin-left:0px;margin-right:0px"> 
                  <strong>pixelParade</strong>
                  <br/>
                  <strong>Emergency Password Reset</strong>
                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Hello, ${req.auth.firstName} ${req.auth.lastName}</p>
                  <p style="font-size:14px;line-height:24px;margin:36px 0;color:rgb(0,0,0)">
                    <strong>Someone requested that the Emergency Password be reset following CMU Account</strong> 
                    <br/>To reset your Emergency Password, click on the button below 
                  </p>
                  
                  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="text-align:center;margin-top:32px;margin-bottom:32px">
                    <tbody>
                      <tr>
                        <td>
                          <a href=${link} style="background-color:rgb(3, 154, 229);border-radius:0.25rem;color:rgb(255,255,255); font-size:15px; font-weight:600; text-align:center; padding-left:1.25rem; padding-right:1.25rem; padding-top:0.75rem; padding-bottom:0.75rem; line-height:100%; display:inline-block;max-width:100%;padding:12px 20px 12px 20px" target="_blank"><span><!--[if mso]>
                          <i style="letter-spacing: 20px;mso-font-width:-100%;mso-text-raise:18" hidden>&nbsp;</i>
                          <![endif]--></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">
                          Reset your Emergency Password</span><span><!--[if mso]><i style="letter-spacing: 20px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]--></span></a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                </td>
              </tr>
            </tbody>
          </table>
        </body>
        
      </html>`,
      };
      const resp = await wrapedSendMail(mailOptions);
      return resp;
    };

    const send = await sendMail();
    if (send) {
      return res.send({ ok: true });
    }
    return res.send({ ok: false, message: "Failed to send email." });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
