import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";

export const poster = Router();

// GET /poster : return array of posters
poster.get("/", async (req: any, res: any) => {
  try {
    const regex = `.*${req.query.title}.*`;
    const poster =
      await prisma.$queryRaw`SELECT * FROM Poster NATURAL JOIN Pdatetime WHERE title REGEXP ${regex}`;
    return res.send({ ok: true, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
