import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { config } from "../utils/config";

export const user = Router();

var { expressjwt: jwt } = require("express-jwt");

user.get(
  "/user",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: req.auth.email,
        },
      });

      return res.send({ ok: true, user });
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);
