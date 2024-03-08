import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { io } from "../app";

export const admin = Router();

// POST /admin : add more role admin to user
admin.post("/", async (req: any, res: any) => {
  try {
    try {
      let admin;
      const user = await prisma.user.findUnique({
        where: {
          email: req.query.email,
        },
      });
      if (user) {
        admin = await prisma.user.update({
          where: {
            email: req.query.email,
          },
          data: {
            isAdmin: true,
          },
        });
      } else {
        admin = await prisma.user.create({
          data: {
            email: req.query.email,
            isAdmin: true,
          },
        });
      }
      io.emit("addAdmin", admin);
      return res.send({ ok: true, admin });
    } catch (err) {
      return res.status(400).send({
        ok: false,
        id: req.query.id,
        message: "Record to add admin role not found",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// DELETE /admin : remove role admin from user
admin.delete("/", async (req: any, res: any) => {
  try {
    try {
      const user = await prisma.user.update({
        where: {
          id: req.query.id,
        },
        data: {
          isAdmin: false,
        },
      });
      if (!user.firstName) {
        await prisma.user.delete({
          where: {
            id: req.query.id,
          },
        });
      }
      io.emit("deleteAdmin", user);
      return res.send({ ok: true, user });
    } catch (err) {
      console.log(err);

      return res.status(400).send({
        ok: false,
        id: req.query.id,
        message: "Record to remove admin role not found",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});
