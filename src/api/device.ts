import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";

export const device = Router();

// GET /device : return array of devices
device.get("/", async (req: any, res: any) => {
  try {
    const data = await prisma.device.findMany({
      orderBy: {
        deviceName: "asc",
      },
    });
    return res.send({ ok: true, data });
  } catch (err: any) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// POST /device : add device into database
device.post("/", async (req: any, res: any) => {
  try {
    try {
      let device = await prisma.device.findUnique({
        where: {
          MACaddress: req.body.MACaddress,
        },
      });
      if (!device) {
        return res.status(400).send({
          ok: false,
          message: "MAC Address not found.",
        });
      } else if (device.deviceName) {
        return res.status(400).send({
          ok: false,
          message: "MAC Address has already been added.",
        });
      } else {
        device = await prisma.device.update({
          where: {
            MACaddress: req.body.MACaddress,
          },
          data: {
            deviceName: req.body.deviceName,
            room: req.body.room,
            location: req.body.location,
            description: req.body.description,
          },
        });
      }
      io.emit("addDevice", device);
      return res.send({ ok: true, message: "Add device successfully." });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return res
            .status(400)
            .send({ ok: false, message: "MAC Address not found.", err });
        }
      }
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// PUT /device : edit device in database
device.put("/", async (req: any, res: any) => {
  try {
    try {
      const device = await prisma.device.update({
        where: {
          MACaddress: req.body.MACaddress,
        },
        data: {
          deviceName: req.body.deviceName,
          room: req.body.room,
          location: req.body.location,
          description: req.body.description,
        },
      });
      io.emit("updateDevice", device);
      return res.send({ ok: true, message: "Edit device successfully." });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return res.status(400).send({
            ok: false,
            message: "Device Name is already used in update device.",
          });
        } else if (err.code === "P2025") {
          return res.status(400).send({
            ok: false,
            message: "MAC Address not found for edit device.",
          });
        }
      }
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// DELETE /device : delete device from database
device.delete("/", async (req: any, res: any) => {
  try {
    try {
      const device = await prisma.device.delete({
        where: {
          MACaddress: req.query.MACaddress,
        },
      });
      io.emit("deleteDevice", device);
      return res.send({ ok: true, message: "Delete device successfully." });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return res.status(400).send({
            ok: false,
            message: "MAC Address not found for delete device.",
          });
        }
      }
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});
