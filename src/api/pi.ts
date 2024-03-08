import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";
import {
  bucketName,
  convertUrlToFile,
  minioClient,
  mqttClient,
} from "../utils/config";

mqttClient.on("connect", () => {
  // console.log("connected.");
});

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
    const date = new Date();
    date.setHours(date.getHours() + 7);
    date.setUTCHours(0, 0, 0, 0);

    const data: any = await prisma.$queryRaw`
      SELECT title, priority, image, startDate, endDate, startTime, endTime, duration, createdAt
      FROM Display NATURAL JOIN Poster NATURAL JOIN Image
      WHERE MACaddress = ${req.query.mac}
      AND startDate <= ${date} AND ${date} <= endDate 
      `;

    let poster: any[] = [];
    await Promise.all(
      data.map(async (e: any) => {
        const imgCol = data.filter((p: any) => p.title === e.title);
        let image: any[] = [];
        const promises = imgCol.map(async (p: any) => {
          try {
            if (!image.find((e) => e.priority === p.priority)) {
              const url = await minioClient.presignedGetObject(
                bucketName,
                p.image
              );
              let file = await convertUrlToFile(url);
              file.name = `${p.title}-${p.priority}${file.type}`;
              image.push({ image: file, priority: p.priority });
            }
          } catch (err) {}
        });
        await Promise.all(promises);

        if (
          !poster.find(
            (p: any) =>
              p.MACaddress === e.MACaddress &&
              p.title === e.title &&
              p.startDate.toDateString() === e.startDate.toDateString() &&
              p.endDate.toDateString() === e.endDate.toDateString() &&
              p.startTime === e.startTime &&
              p.endTime === e.endTime
          )
        ) {
          const { priority, ...rest } = e;
          poster.push({
            ...rest,
            image: [...image],
          });
        }
      })
    );

    const room = await prisma.device
      .findUnique({
        select: { room: true },
        where: { MACaddress: req.query.mac },
      })
      .then((e) => {
        return e?.room;
      });

    return res.send({ ok: true, room, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.post("/on_off", async (req: any, res: any) => {
  try {
    mqttClient.publish("pi/on_off", req.query.mac);
    io.emit("turnOnDevice", req.query.mac);
    return res.send({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.post("/status", async (req: any, res: any) => {
  try {
    const deviceStatus = await prisma.device.update({
      where: {
        MACaddress: req.query.mac,
      },
      data: {
        status: req.query.status.includes("True") ? true : false,
      },
    });
    io.emit("turnOnOffDevice", deviceStatus);
    return res.send({ ok: true, deviceStatus });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.get("/poster/emergency", async (req: any, res: any) => {
  try {
    const emergency = await prisma.emergency.findMany({
      where: {
        status: true,
      },
    });
    const promises = emergency.map(async (e) => {
      if (e.incidentName !== "banner") {
        const url = await minioClient.presignedGetObject(
          bucketName,
          e.emergencyImage
        );
        e.emergencyImage = url;
      }
    });
    await Promise.all(promises);

    return res.send({ ok: true, emergency });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
