import { Response, Router } from "express";
const request = require("request");

export const proxy = Router();

proxy.get("/", (req, res) => {
  const url = req.query.url as string;
  request(url)
    .on("response", (response: any) => {
      delete response.headers["x-frame-options"];
      delete response.headers["content-security-policy"];
    })
    .pipe(res)
    .on("error", (err: any) => {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    });
});
