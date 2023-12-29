import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { config } from "../utils/config";

export const admin = Router();

var { expressjwt: jwt } = require("express-jwt");

// GET /admin : return array of admins
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

// POST /admin : add more role admin to user
admin.post("/admin",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {   
      try {
        const admin = await prisma.user.update({
          where: {
            email: req.query.email,
          },
          data: {
            isAdmin: true,
          },
        })
        return res.send({ ok: true, admin });
      } catch (err) {
        return res.status(400)
        .send({ ok: false, email: req.query.email, message: "Record to add admin role not found" });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);

// DELETE /admin : remove role admin from user
admin.delete("/admin",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
        const user = await prisma.user.update({
          where: {
            email: req.query.email,
          },
          data: {
            isAdmin: false,
          },
        })
        return res.send({ ok: true, user });
      } catch (err) {
        return res.status(400)
        .send({ ok: false, email: req.query.email, message: "Record to remove admin role not found" });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);