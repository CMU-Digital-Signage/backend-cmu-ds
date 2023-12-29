import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { config } from "../utils/config";

export const poster = Router();

var { expressjwt: jwt } = require("express-jwt");

// GET /poster : return array of posters
poster.get("/poster",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      const poster = await prisma.poster.findMany({
        where: {
          title: {
            contains: req.query.title 
          }
        }
      });
        return res.send({ ok: true, poster });
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error", err });
    }
  }
);