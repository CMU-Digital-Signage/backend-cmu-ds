import jwt from "jsonwebtoken";
import { Response } from "express";
import { User } from "@prisma/client";

export const verifyAndValidateToken = (
  token: string,
  res: Response
): Promise<User> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
      if (err) {
        return res.status(401).send({ ok: false, message: "Invalid token" });
      } else {
        resolve(user as User);
      }
    });
  });
};
