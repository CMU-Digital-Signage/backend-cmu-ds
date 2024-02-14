import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";

export const pi = Router();

pi.post("/", async (req: any, res: any) => {
  try {
    try {
      if (!req.query.mac) {
        return res.status(400).send({ ok: true, message: "Invalid Input" });
      }
      const device = await prisma.device.create({
        data: {
          MACaddress: req.query.mac,
        },
      });
      io.emit("addPi", device);
      return res.send({ ok: true, message: "Add device successfully." });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return res.status(400).send({
            ok: false,
            message: "Device Name or MAC Address are already used.",
            err,
          });
        }
      }
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.get("/poster", async (req: any, res: any) => {
  try {
    const date = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const poster = await prisma.$queryRaw`
      SELECT title, priority, image, startDate, endDate, startTime, endTime, duration
      FROM Display NATURAL JOIN Poster NATURAL JOIN Image
      WHERE MACaddress = ${req.query.mac}
      AND startDate <= ${date} AND endDate >= ${date}
      `;

    return res.send({ ok: true, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// ไม่ได้ใช้แล้วอะ ลืมว่าใช้ socket แล้ว ขอโทษที
// pi.get("/poster/emergency", async (req: any, res: any) => {
//   try {
//     const emergency = await prisma.emergency.findMany({
//       where: {
//         status: true,
//       }
//     });
//     return res.send({ ok: true, emergency });
//   } catch (err) {
//     return res
//       .status(500)
//       .send({ ok: false, message: "Internal Server Error", err });
//   }
// });
