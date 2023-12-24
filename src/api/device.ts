import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";
import { signatures } from "../utils/config";

export const device = Router();

function detectMimeType(b64: string): string | undefined {
  for (var s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s as keyof typeof signatures];
    }
  }
}

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
      .send({ ok: false, message: "Internal Server Error" });
  }
});
