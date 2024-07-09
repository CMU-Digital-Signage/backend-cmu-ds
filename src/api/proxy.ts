import { Response, Router } from "express";
const request = require("request");

export const proxy = Router();

proxy.get("/", (req, res) => {
  const url = req.query.url as string;
  try {
    request(url)
      .on("response", (response: any) => {
        // delete response.headers["x-frame-options"];
        // delete response.headers["content-security-policy"];
        if (typeof response.headers["x-frame-options"] != "undefined") {
          return res
            .status(400)
            .send({ ok: false, message: "Website cannot display" });
        } else {
          return res.send({ ok: true, message: "Success" });
        }
      })
      // .pipe(res)
      .on("error", (error: any) => {
        return res.status(400).send({ ok: false, message: error });
      });
  } catch (err) {
    return res.status(400).send({ ok: false, message: `Invalid URL "${url}"` });
  }
});
