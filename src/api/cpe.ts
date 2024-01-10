import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import axios from "axios";

export const cpe = Router();

cpe.get("/instructor", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${process.env.URL_PATH_CPE}/teacher`, {
      headers: { Authorization: `Bearer ${process.env.TOKEN_API_CPE}` },
    });

    let instructors: { firstName: string; lastName: string }[] = [];
    response.data.teachers.map((e: any) => {
      instructors.push({ firstName: e.firstNameEN, lastName: e.lastNameEN });
    });

    instructors.map(async (instructor) => {
      const existingUser = await prisma.user.findUnique({
        where: {
          firstName_lastName: {
            firstName: instructor.firstName,
            lastName: instructor.lastName,
          },
        },
      });

      if (!existingUser) {
        return prisma.user.create({
          data: {
            firstName: instructor.firstName,
            lastName: instructor.lastName,
          },
        });
      }
      return;
    });

    const user = await prisma.user.findMany();

    return res.send({ ok: true, user });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});
