import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";
import { io } from "../app";
import {
  bucketName,
  convertUrlToFile,
  folderDevice,
  minioClient,
  uploadFile,
} from "../utils/config";

export const device = Router();

// GET /device : return array of devices
device.get("/", async (req: any, res: any) => {
  try {
    let data: any = await prisma.device.findMany({
      orderBy: {
        deviceName: "asc",
      },
    });
    const promises = data.map(async (e: any) => {
      if (e.location) {
        const url = await minioClient.presignedGetObject(
          bucketName,
          e.location
        );
        e.location = url;
      }
    });
    await Promise.all(promises);
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
    let device = await prisma.device.findUnique({
      where: {
        MACaddress: req.body.MACaddress,
      },
    });
    if (device && device.deviceName) {
      return res.status(400).send({
        ok: false,
        message: "MAC Address has already been added.",
      });
    } else {
      let file: File | any | null = req.body.location;
      if (typeof file === "string") {
        file = await convertUrlToFile(file);
      }
      const path = `${folderDevice}/${file?.name}`;
      if (file) {
        uploadFile(file, path);
      }
      device = await prisma.device.create({
        data: {
          MACaddress: req.body.MACaddress,
          deviceName: req.body.deviceName,
          room: req.body.room,
          location: file ? path : null,
          description: req.body.description,
          status: true,
        },
      });
    }
    io.emit("addDevice", device);
    return res.send({ ok: true, device, message: "Add device successfully." });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// PUT /device : edit device in database
device.put("/", async (req: any, res: any) => {
  try {
    const oldName = await prisma.device.findUnique({
      where: {
        MACaddress: req.body.MACaddress,
      },
    });
    if (!oldName) {
      return res.status(404).send({ ok: false, message: "Device not found" });
    }
    await minioClient.removeObject(bucketName, `${oldName.location}`);
    let file: File | any | null = req.body.location;
    if (typeof file === "string") {
      file = await convertUrlToFile(file);
    }
    const path = `${folderDevice}/${file?.name}`;
    if (file) {
      uploadFile(file, path);
    }
    try {
      let device: any = await prisma.device.update({
        where: {
          MACaddress: req.body.MACaddress,
        },
        data: {
          deviceName: req.body.deviceName,
          room: req.body.room,
          location: file ? path : null,
          description: req.body.description,
        },
      });

      device.location = file;

      io.emit("updateDevice", device);
      return res.send({
        ok: true,
        device,
        message: "Edit device successfully.",
      });
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
    console.log(err);

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
      (async () => {
        if (device.location)
          await minioClient.removeObject(bucketName, device.location);
      })();

      io.emit("deleteDevice", req.query.MACaddress);
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
