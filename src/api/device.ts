import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { signatures } from "../utils/config";
import { config } from "../utils/config";
import { Prisma } from '@prisma/client'

export const device = Router();

var { expressjwt: jwt } = require("express-jwt");

function detectMimeType(b64: string): string | undefined {
  for (var s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s as keyof typeof signatures];
    }
  }
}

/*
device.get("/device", async (req: Request, res: Response) => {
  try {
    // find information of device in database
    // const mac = await prisma.device.findUnique({
    //   where: {
    //     MACaddress: req.query.mac as string,
    //   },
    // });
    // if (!mac) {
    //   return res.send({ ok: false, message: "This device doesn't add." });
    // }
    // return res.send({ ok: true, mac });

    // test send image to raspberry pi
    const data = await prisma.device.findUnique({
      select: { location: true },
      where: {
        MACaddress: req.query.mac as string,
      },
    });
    if (data?.location) {
      // const image = Buffer.from(data.location, "base64");
      const type = detectMimeType(data.location);
      // return res.send(`<img src="data:${type};base64,${data.location}" />`);
      return res.send({
        ok: true,
        image: `data:${type};base64,${data.location}`,
      });
    }
    return res.status(404).send({ ok: false, message: "Image not found" });
  } catch (err: any) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});
*/

// GET /device : return array of devices
device.get("/device", 
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      const data = await prisma.device.findMany();
      return res.send({ ok: true, data });
    } catch (err: any) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
});

// POST /device : add device into database
device.post("/device",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
          const device = await prisma.device.create({
            data: {
              deviceName: req.query.deviceName,
              MACaddress: req.query.MACaddress,
              room: parseInt(req.query.room),
              location: req.query.location,
              description: req.query.description,
            }
          });
          return res.send({ ok: true, message: "Add device successfully." });
      } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
          if (err.code === 'P2002'){
            return res.status(400)
              .send({ ok: false, message: "Device Name or MAC Address are already used." });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);

/*
device.post("/device",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
          const device = await prisma.device.update({
            where: {
              MACaddress: req.query.MACaddress
            },
            data: {
              deviceName: req.query.deviceName,
              floor: parseInt(req.query.floor),
              location: req.query.location,
              description: req.query.description,
            }
          });
          return res.send({ ok: true, message: "Add device successfully." });
      } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
          if (err.code === 'P2002'){
            return res.status(400)
              .send({ ok: false, message: "MAC Address not found.", err });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error", err });
    }
  }
);
*/

// PUT /device : edit device in database
device.put("/device",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
          const device = await prisma.device.update({
            where: {
              MACaddress: req.body.MACaddress
            },
            data: {
              deviceName: req.body.deviceName,
              room: parseInt(req.body.room),
              location: req.body.location,
              description: req.body.description,
            }
          });
          return res.send({ ok: true, message: "Edit device successfully." });
      } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
          if (err.code === 'P2002'){
            return res.status(400)
              .send({ ok: false, message: "Device Name is already used in update device." });
          }else if (err.code === 'P2025'){
            return res.status(400)
              .send({ ok: false, message: "MAC Address not found for edit device." });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);

// DELETE /device : delete device from database
device.delete("/device",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
        const device = await prisma.device.delete({
          where: {
            deviceName: req.query.deviceName,
          }
        });
        return res.send({ ok: true, message: "Delete device successfully." });
      } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
          if (err.code === 'P2025'){
            return res.status(400)
              .send({ ok: false, message: "MAC Address not found for delete device." });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);

/*
device.post("/device/mac",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: any, res: any) => {
    try {
      try {
          const device = await prisma.device.create({
            data: {
              MACaddress: req.query.MACaddress,
            }
          });
          return res.send({ ok: true, message: "Add device successfully." });
      } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
          if (err.code === 'P2002'){
            return res.status(400)
              .send({ ok: false, message: "Device Name or MAC Address are already used.", err });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error", err });
    }
  }
);
*/