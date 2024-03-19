import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { Image, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { io } from "../app";
import {
  bucketName,
  convertUrlToFile,
  folderEmer,
  folderPoster,
  imageCache,
  minioClient,
  mqttClient,
  uploadFile,
} from "../utils/config";

mqttClient.on("connect", () => {
  // console.log("connected.");
});

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
    const data: any =
      await prisma.$queryRaw`SELECT posterId, id, title, description, createdAt,
                              MACaddress, startDate, endDate, startTime, endTime, duration
                              FROM Poster NATURAL JOIN Display`;
    const imgCol: any = await prisma.image.findMany();
    let poster = [] as any;
    await Promise.all(
      data.map(async (e: any) => {
        const existingPoster = poster.find(
          (p: any) =>
            p.MACaddress === e.MACaddress &&
            p.title === e.title &&
            p.startDate.getTime() === e.startDate.getTime() &&
            p.endDate.getTime() === e.endDate.getTime() &&
            p.startTime.getTime() === e.startTime.getTime() &&
            p.endTime.getTime() === e.endTime.getTime()
        );

        if (!existingPoster) {
          let image = imgCol.filter((i: any) => i.posterId === e.posterId);
          const promises = image.map(async (img: any) => {
            try {
              const url = await minioClient.presignedGetObject(
                bucketName,
                img.image
              );
              img.image = url;
            } catch (err) {}
          });
          await Promise.all(promises);
          poster.push({ ...e, image: [...image] });
        }
      })
    );

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
            User: { connect: { id: user?.id } },
          },
        });

        const imageCol = req.body.poster.image;
        let image: Image[] = [];
        const promises1 = imageCol.map(async (e: any) => {
          let file = e.image;
          if (typeof file === "string") {
            file = await convertUrlToFile(file);
          }
          const path = `${folderPoster}/${file.name}`;
          uploadFile(file, path);
          image.push({
            posterId: createPoster.posterId,
            priority: e.priority,
            image: path,
          });
        });
        await Promise.all(promises1);
        await prisma.image.createMany({
          data: image,
        });

        const display: any[] = [];
        const schedules: Schedule[] = req.body.display;
        schedules.forEach((schedule) => {
          schedule.time.forEach((time) => {
            schedule.MACaddress.forEach(async (mac) => {
              display.push({
                MACaddress: mac,
                posterId: createPoster.posterId,
                startDate: new Date(schedule.startDate),
                endDate: new Date(schedule.endDate),
                startTime: new Date(time.startTime),
                endTime: new Date(time.endTime),
                duration: schedule.duration,
              });
            });
          });
        });
        await prisma.display.createMany({ data: display });

        const newPoster = display.map((e: any) => {
          return {
            ...e,
            ...createPoster,
            image: [...imageCol],
          };
        });

        io.emit("addPoster", newPoster);
        return res.send({ ok: true, newPoster });
      } else {
        return res.status(400).send({
          ok: false,
          message: "title is duplicated!",
        });
      }
    } catch (err) {
      const posterName = await prisma.poster.findUnique({
        where: {
          title: req.body.poster.title,
        },
      });
      if (posterName != null) {
        const deletePoster = await prisma.poster.delete({
          where: {
            posterId: posterName.posterId,
          },
        });
      }
      return res.status(400).send({
        ok: false,
        message: "something went wrong!",
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
    const oldName = await prisma.poster.findUnique({
      where: {
        posterId: req.query.posterId,
      },
      include: {
        Image: true,
      },
    });

    const editPoster = await prisma.poster.update({
      where: {
        posterId: req.query.posterId,
      },
      data: {
        title: req.body.poster.title,
        description: req.body.poster.description,
      },
    });

    if (oldName) {
      const promises = oldName.Image.map(async (e) => {
        try {
          delete imageCache[e.image];
          await minioClient.removeObject(bucketName, e.image);
        } catch (err) {}
      });
      await Promise.all(promises);
    }
    console.log(imageCache);

    await prisma.image.deleteMany({
      where: {
        posterId: req.query.posterId,
      },
    });
    const imageCol = req.body.poster.image;
    let image: Image[] = [];
    const promises1 = imageCol.map(async (e: any) => {
      let file = e.image;
      if (typeof file === "string") {
        file = await convertUrlToFile(file);
      }
      const path = `${folderPoster}/${file.name}`;
      uploadFile(file, path);
      image.push({
        posterId: req.query.posterId,
        priority: e.priority,
        image: path,
      });
    });
    await Promise.all(promises1);
    await prisma.image.createMany({
      data: image,
    });

    await prisma.display.deleteMany({
      where: {
        posterId: req.query.posterId,
      },
    });
    const schedules: Schedule[] = req.body.display;
    const display: any[] = [];
    schedules.forEach(async (schedule) => {
      schedule.time.forEach(async (time) => {
        schedule.MACaddress.forEach(async (mac) => {
          display.push({
            MACaddress: mac,
            posterId: req.query.posterId,
            startDate: new Date(schedule.startDate),
            endDate: new Date(schedule.endDate),
            startTime: new Date(time.startTime),
            endTime: new Date(time.endTime),
            duration: schedule.duration,
          });
        });
      });
    });
    await prisma.display.createMany({ data: display });

    const updatePoster = display.map((e) => {
      return {
        ...e,
        ...editPoster,
        image: [...imageCol],
      };
    });

    io.emit("updatePoster", updatePoster);
    return res.send({ ok: true, updatePoster });
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
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

// DELETE /poster : delete poster
poster.delete("/", async (req: any, res: any) => {
  try {
    try {
      const image = await prisma.image.findMany({
        where: { posterId: req.query.posterId },
      });
      const deletePoster = await prisma.poster.delete({
        where: { posterId: req.query.posterId },
      });

      const promises = image.map(async (e) => {
        try {
          delete imageCache[e.image];
          await minioClient.removeObject(bucketName, e.image);
        } catch (err) {}
      });
      await Promise.all(promises);

      io.emit("deletePoster", deletePoster);
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
    let emergency: any = await prisma.emergency.findMany();
    const promises = emergency.map(async (e: any) => {
      if (e.incidentName !== "banner") {
        try {
          const url = await minioClient.presignedGetObject(
            bucketName,
            e.emergencyImage
          );
          e.emergencyImage = url;
        } catch (err) {}
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
      const file = req.body.emergencyImage;
      const path = `${folderEmer}/${file.name}`;
      uploadFile(file, path);

      let emergency = await prisma.emergency.create({
        data: {
          incidentName: req.body.incidentName,
          emergencyImage: path,
          description: req.body.description,
          status: req.body.status ? true : false,
        },
      });

      emergency.emergencyImage = file;

      io.emit("addEmergency", emergency);
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
      if (req.query.incidentName === "banner") {
        const user = await prisma.user.findMany();
        let emergency;
        const password = req.body.password;
        let pass = false;
        for (const e of user) {
          if (e.password?.length) {
            const match = await bcrypt.compare(password, e.password);
            if (match) {
              try {
                emergency = await prisma.emergency.update({
                  where: {
                    incidentName: req.query.incidentName,
                  },
                  data: {
                    emergencyImage: req.body.emergencyImage,
                    status: true,
                  },
                });
                io.emit("activate", emergency);
                pass = match;
                break;
              } catch (err) {}
            }
          }
        }
        if (pass) {
          mqttClient.publish("pi/on_off", "EMGC");
          return res.send({
            ok: true,
            message: `${req.query.incidentName} has been Activate.`,
            emergency,
          });
        } else {
          return res
            .status(400)
            .send({ ok: false, message: "Password incorrect." });
        }
      }

      const oldName = await prisma.emergency.findUnique({
        where: {
          incidentName: req.query.incidentName,
        },
      });
      if (oldName) {
        await minioClient.removeObject(bucketName, `${oldName.emergencyImage}`);
      }

      let file = req.body.emergencyImage;
      if (typeof file === "string") {
        file = await convertUrlToFile(file);
      }
      const path = `${folderEmer}/${file.name}`;
      uploadFile(file, path);

      let emergency = await prisma.emergency.update({
        where: {
          incidentName: req.query.incidentName,
        },
        data: {
          incidentName: req.body.incidentName,
          emergencyImage: path,
          description: req.body.description || null,
        },
      });

      emergency.emergencyImage = file;

      io.emit("updateEmergency", req.query.incidentName, emergency);
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
      (async () => {
        await minioClient.removeObject(bucketName, emergency.emergencyImage);
      })();

      io.emit("deleteEmergency", emergency);
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

// POST /poster/emergency/activate : change status of emergency poster to activate
poster.post("/emergency/activate", async (req: any, res: any) => {
  try {
    const user = await prisma.user.findMany();
    let emergency;
    const password = req.body.password;
    let pass = false;

    for (const e of user) {
      if (e.password?.length) {
        const match = await bcrypt.compare(password, e.password);
        if (match) {
          emergency = await prisma.emergency.update({
            where: {
              incidentName: req.query.incidentName,
            },
            data: {
              status: true,
            },
          });
          io.emit("activate", req.query.incidentName);
          pass = match;
          break;
        }
      }
    }
    if (pass) {
      mqttClient.publish("pi/on_off", "EMGC");
      return res.send({
        ok: true,
        message: `${req.query.incidentName} has been Activate.`,
      });
    } else
      return res
        .status(400)
        .send({ ok: false, message: "Password incorrect." });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return res.status(400).send({
          ok: false,
          message: "Record to edit emergency poster not found.",
        });
      }
    }
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error", err });
  }
});

// POST /poster/emergency/deactivate : change status of emergency poster to inactivate
poster.post("/emergency/deactivate", async (req: any, res: any) => {
  try {
    try {
      const user = await prisma.user.findMany();
      let emergency;
      const password = req.body.password;
      let pass = false;

      for (const e of user) {
        if (e.password?.length) {
          const match = await bcrypt.compare(password, e.password);
          if (match) {
            if (req.query.incidentName === "banner") {
              emergency = await prisma.emergency.update({
                where: {
                  incidentName: req.query.incidentName,
                },
                data: {
                  emergencyImage: "",
                  status: false,
                },
              });
            } else {
              emergency = await prisma.emergency.update({
                where: {
                  incidentName: req.query.incidentName,
                },
                data: {
                  status: false,
                },
              });
            }

            io.emit("deactivate", req.query.incidentName);
            pass = match;
            break;
          }
        }
      }
      if (pass) {
        mqttClient.publish("pi/on_off", "Not EMGC");
        return res.send({
          ok: true,
          message: `${req.query.incidentName} has been Deactivate.`,
        });
      } else
        return res
          .status(400)
          .send({ ok: false, message: "Password incorrect." });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
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
