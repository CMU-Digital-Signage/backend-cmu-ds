import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";
import mqtt from "mqtt";

const mqttClient = mqtt.connect({
  host: "d887ebbbf00045b6b1405a5f76f66686.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "cpe_ds",
  password: "CPEds261361",
});

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
    const date = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const data: any = await prisma.$queryRaw`
      SELECT title, priority, image, startDate, endDate, startTime, endTime, duration, createdAt
      FROM Display NATURAL JOIN Poster NATURAL JOIN Image
      WHERE MACaddress = ${req.query.mac}
      AND startDate <= ${date} AND endDate >= ${date}
      `;

    let poster = [] as any;
    data.forEach((e: any) => {
      const imgCol = data.filter((p: any) => p.title === e.title);
      let image: any[] = [];
      imgCol.forEach((p: any) => {
        if (!image.find((e) => e.priority === p.priority)) {
          image.push({ image: p.image, priority: p.priority });
        }
      });
      if (
        !poster.find(
          (p: any) =>
            p.MACaddress === e.MACaddress &&
            p.title === e.title &&
            p.startDate.toDateString() === e.startDate.toDateString() &&
            p.endDate.toDateString() === e.endDate.toDateString() &&
            p.startTime.toTimeString() === e.startTime.toTimeString() &&
            p.endTime.toTimeString() === e.endTime.toTimeString()
        )
      ) {
        const { priority, ...rest } = e;
        poster.push({
          ...rest,
          image: image,
        });
      }
    });

    return res.send({ ok: true, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.post("/on", async (req: any, res: any) => {
  try {
    mqttClient.publish("pi/on_off", req.query.mac + "/on");
    await prisma.device.update({
      where: {
        MACaddress: req.query.mac,
      },
      data: {
        status: true,
      },
    });
    io.emit("turnOnDevice", req.query.mac);
    return res.send({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

pi.post("/off", async (req: any, res: any) => {
  try {
    mqttClient.publish("pi/on_off", req.query.mac + "/off");
    await prisma.device.update({
      where: {
        MACaddress: req.query.mac,
      },
      data: {
        status: false,
      },
    });
    io.emit("turnOffDevice", req.query.mac);
    return res.send({ ok: true });
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
    return res.send({ ok: true, emergency });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
