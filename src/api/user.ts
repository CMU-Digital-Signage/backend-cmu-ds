import { verifyAndValidateToken } from "../utils/jwtUtils";
import { Request, Response, Router } from "express";

export const user = Router();

user.get("/user", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    const user = await verifyAndValidateToken(token, res);

    if (!user.email) {
      return res.status(403).send({ ok: false, message: "Invalid token" });
    }

    return res.send({ ok: true, user });
  } catch (err) {
    return res
      .status(500)
      .send({ ok: false, message: "Internal Server Error" });
  }
});

user.post("/user/signOut", async (req: Request, res: Response) => {
  return res.clearCookie("token").send({ ok: true });
});
