import { Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Request } from "express-jwt";
import bcrypt, { hash } from "bcrypt";
import { error, log } from "console";
export const user = Router();

const saltRounds = 10;

user.get("/", async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.auth.email },
    });
    return res.send({ ok: true, user });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

user.get("/all", async (req: any, res: any) => {
  try {
    const user = await prisma.user.findMany();
    return res.send({ ok: true, user });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// set password
user.post("/", async (req: any, res: any) => {
  try {
    let user = await prisma.user.findUnique({
      where: { email: req.auth.email },
    });
    let password = req.body.password;

    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, async (err: any, hash: string) => {
        if (err) {
          return res.status(400).send({
            ok: false,
            message: "Password cannot hash",
          });
        }
        if (user) {
          user = await prisma.user.update({
            where: {
              email: req.auth.email,
            },
            data: {
              password: hash,
            },
          });
        }
      });
    });
    return res.send({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// change password
user.put("/", async (req: any, res: any) => {
  try {
    let newPassword = req.body.newPassword;
    let oldPassword = req.body.oldPassword;
    let user = await prisma.user.findUnique({
      where: { email: req.auth.email },
    });

    const match = await bcrypt.compare(oldPassword, user?.password!);
    if (match) {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(newPassword, salt, async (err: any, hash: string) => {
          if (err) {
            return res.status(400).send({
              ok: false,
              message: "Password cannot hash",
            });
          }
          if (user) {
            user = await prisma.user.update({
              where: {
                email: req.auth.email,
              },
              data: {
                password: hash,
              },
            });
          }
        });
      });
      return res.send({ ok: true });
    }

    return res
      .status(400)
      .send({ ok: false, message: "Current Password incorrect" });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});
