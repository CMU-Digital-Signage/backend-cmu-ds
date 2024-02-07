import { Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Request } from "express-jwt";
export const user = Router();

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
