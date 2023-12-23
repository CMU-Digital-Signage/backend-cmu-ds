import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";

export const device = Router();

device.get("/device", async (req: Request, res: Response) => {
  // for test
  console.log(req.query);

  const test = await prisma.device.findUnique({
    where: {
      MACaddress: req.query.mac as string,
    },
  });
  return res.send(test);
});
