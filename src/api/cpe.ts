import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { config } from "../utils/config";
import axios from "axios";

export const cpe = Router();

var { expressjwt: jwt } = require("express-jwt");

cpe.get(
  "/instructor",
  jwt({ secret: config.secret, algorithms: [config.jwtAlgo] }),
  async (req: Request, res: Response) => {
    try {
      const response = await axios.get(`${process.env.URL_PATH_CPE}/teacher`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN_API_CPE}` },
      });
      let instructors = <any>[]
       response.data.teachers.map((e: any) => {
        instructors.push({firstName: e.firstNameEN, lastName: e.lastNameEN})
      });

      const ins = await prisma.user.createMany({
        data: instructors
      })
      return res.send({ ok: true, instructors });
    } catch (err) {
      return res
        .status(500)
        .send({ ok: false, message: "Internal Server Error" });
    }
  }
);
