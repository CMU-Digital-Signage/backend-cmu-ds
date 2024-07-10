import { Response, Router } from "express";
const request = require("request");

export const proxy = Router();

proxy.get("/", (req, res) => {
  const url = req.query.url as string;
  try {
    request(url)
      .on("response", (response: any) => {
        if (
          typeof response.headers["x-frame-options"] != "undefined" ||
          response.headers["content-security-policy"]?.includes(
            "frame-ancestors"
          )
        ) {
          // delete response.headers["x-frame-options"];
          // delete response.headers["content-security-policy"];
          return res
            .status(400)
            .send({
              ok: false,
              message: "Website does not allow display due to security restrictions",
            });
        } else {
          return res.send({ ok: true, message: "Success" });
        }
      })
      // .pipe(res)
      .on("error", (error: any) => {
        return res
          .status(400)
          .send({ ok: false, message: `Website URL does not exist` });
      });
  } catch (err) {
    return res
      .status(400)
      .send({ ok: false, message: `Website URL does not exist` });
  }
});
