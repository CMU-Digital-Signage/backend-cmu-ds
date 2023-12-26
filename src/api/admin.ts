import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { config } from "../utils/config";

export const admin = Router();

var { expressjwt: jwt } = require("express-jwt");

admin.get("/admin",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      const admin = await prisma.user.findMany({
        where: {
          isAdmin: true,
        },
      });

      return res.send({ ok: true, admin });
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);
