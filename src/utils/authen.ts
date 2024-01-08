import { Response, NextFunction } from "express";
import { Request } from "express-jwt";
import { config } from "./config";

const { expressjwt: jwt } = require("express-jwt");

export const jwtMiddleware = jwt({
  secret: config.secret,
  algorithms: [config.jwtAlgo],
});

export const handleJWTError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ ok: false, message: "Invalid token" });
  }
  next(err);
};
