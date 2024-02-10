import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Prisma } from "@prisma/client";

export const poster = Router();

type Schedule = {
  startDate: string;
  endDate: string;
  time: [
    {
      startTime: string;
      endTime: string;
    }
  ];
  duration: number;
  MACaddress: string[];
};

// GET /poster/search : return array of posters
poster.get("/search", async (req: any, res: any) => {
  try {
    const regex = `.*${req.query.title}.*`;
    const poster =
      await prisma.$queryRaw`SELECT title, MACaddress, startDate, endDate, startTime, endTime
                              FROM Poster NATURAL JOIN Display WHERE title REGEXP ${regex}`;
    return res.send({ ok: true, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// GET /poster : return array of posters
poster.get("/", async (req: any, res: any) => {
  try {
    const poster =
      await prisma.$queryRaw`SELECT posterId, id, title, description, createdAt,
                              priority, image, MACaddress, startDate, endDate, startTime, endTime, duration
                              FROM Poster NATURAL JOIN Image NATURAL JOIN Display`;
    return res.send({ ok: true, poster });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// POST /poster : add poster with schedules
poster.post("/", async (req: any, res: any) => {
  try {
    const posterName = await prisma.poster.findUnique({
      where: {
        title: req.body.poster.title,
      },
    });
    if (posterName == null) {
      const user = await prisma.user.findUnique({
        where: { email: req.auth.email },
      });
      const createPoster = await prisma.poster.create({
        data: {
          title: req.body.poster.title,
          description: req.body.poster.description,
          image: req.body.poster.image,
          User: {
            connect: {
              id: user?.id,
            },
          },
        },
      });
      const createImage = await prisma.image.create({
        data: {
          posterId: createPoster?.posterId,
          image: req.body.poster.image,
          priority: 1,
        }
      });
      const schedules: Schedule[] = req.body.display;
      schedules.forEach((schedule) => {
        schedule.time.forEach((time) => {
          schedule.MACaddress.forEach(async (mac) => {
            const createDisplay = await prisma.display.createMany({
              data: {
                MACaddress: mac,
                posterId: createPoster?.posterId,
                startDate: new Date(schedule.startDate),
                endDate: new Date(schedule.endDate),
                startTime: new Date(time.startTime),
                endTime: new Date(time.endTime),
                duration: schedule.duration,
              },
            });
          });
        });
      });
      return res.send({ ok: true, createPoster });
    } else {
      return res.status(400).send({
        ok: false,
        message: "title is duplicated!",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// PUT /poster : edit poster and schedule
poster.put("/", async (req: any, res: any) => {
  try {
    try {
      const editPoster = await prisma.poster.update({
        where: {
          posterId: req.query.posterId,
        },
        data: {
          title: req.body.poster.title,
          description: req.body.poster.description,
          image: req.body.poster.image,
        },
      });
      const editImage = await prisma.image.updateMany({
        where: {
          posterId: req.query.posterId,
        },
        data: {
          image: req.body.poster.image,
        }
      });
      const deletedDisplay = await prisma.display.deleteMany({
        where: {
          posterId: req.query.posterId,
        },
      });
      const schedules: Schedule[] = req.body.display;
      schedules.forEach((schedule) => {
        schedule.time.forEach((time) => {
          schedule.MACaddress.forEach(async (mac) => {
            const createDisplay = await prisma.display.createMany({
              data: {
                MACaddress: mac,
                posterId: req.query.posterId,
                startDate: new Date(schedule.startDate),
                endDate: new Date(schedule.endDate),
                startTime: new Date(time.startTime),
                endTime: new Date(time.endTime),
                duration: schedule.duration,
              },
            });
          });
        });
      });
      return res.send({ ok: true, editPoster });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return res.status(400).send({
            ok: false,
            message: "new poster name is already used.",
          });
        } else if (err.code === "P2025") {
          return res.status(400).send({
            ok: false,
            message: "Record to edit poster not found.",
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

// DELETE /poster : delete poster
poster.delete("/", async (req: any, res: any) => {
  try {
    try {
      const deletedDisplay = await prisma.display.deleteMany({
        where: {
          posterId: req.query.posterId,
        },
      });
      const deleteImage = await prisma.image.deleteMany({
        where: {
          posterId: req.query.posterId,
        },
      });
      const deletePoster = await prisma.poster.delete({
        where: {
          posterId: req.query.posterId,
        },
      });
      return res.send({ ok: true, deletePoster });
    } catch (err) {
      return res.status(400).send({
        ok: false,
        message: "Record to remove poster not found",
        err,
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// GET /poster/emergency : get emergency poster
poster.get("/emergency", async (req: any, res: any) => {
  try {
    const emergency = await prisma.emergency.findMany();
    return res.send({ ok: true, emergency });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// POST /poster/emergency : add emergency poster
poster.post("/emergency", async (req: any, res: any) => {
  try {
    const emer = await prisma.emergency.findUnique({
      select: {
        incidentName: true,
      },
      where: {
        incidentName: req.body.incidentName,
      },
    });
    if (emer == null) {
      const emergency = await prisma.emergency.create({
        data: {
          incidentName: req.body.incidentName,
          emergencyImage: req.body.emergencyImage,
          description: req.body.description,
        },
      });
      return res.send({ ok: true, emergency });
    } else {
      return res.status(400).send({
        ok: false,
        message: `incidentName = "${emer.incidentName}" is duplicated!`,
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// PUT /poster/emergency : edit emergency poster
poster.put("/emergency", async (req: any, res: any) => {
  try {
    try {
      const emergency = await prisma.emergency.update({
        where: {
          incidentName: req.query.incidentName,
        },
        data: {
          incidentName: req.body.incidentName,
          description: req.body.description,
        },
      });
      return res.send({ ok: true, emergency });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return res.status(400).send({
            ok: false,
            message: "incidentName is already used.",
          });
        } else if (err.code === "P2025") {
          return res.status(400).send({
            ok: false,
            message: "Record to edit emergency poster not found.",
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

// DELETE /poster/emergency : delete emergency poster
poster.delete("/emergency", async (req: any, res: any) => {
  try {
    try {
      const emergency = await prisma.emergency.delete({
        where: {
          incidentName: req.query.incidentName,
        },
      });
      return res.send({ ok: true, emergency });
    } catch (err) {
      return res.status(400).send({
        ok: false,
        message: "Record to remove emergency poster not found",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});
