import express from "express";
import { admin } from "./admin";
import { cmuOAuth } from "./cmuOAuth";
import { cpe } from "./cpe";
import { device } from "./device";
import { poster } from "./poster";
import { user } from "./user";
import { pi } from "./pi";
import { jwtMiddleware, handleJWTError } from "../utils/authen";
import { email } from "./email";

export const routes = express.Router();

const pathToRegexp = require("path-to-regexp");
const unprotected = [
  pathToRegexp("/api/v1/pi*"),
  pathToRegexp("/api/v1/cmuOAuth"),
];

routes.use(jwtMiddleware.unless({ path: unprotected }));

routes.use("/cmuOAuth", cmuOAuth);
routes.use("/pi", pi);
routes.use("/cpe", cpe);
routes.use("/user", user);
routes.use("/admin", admin);
routes.use("/device", device);
routes.use("/poster", poster);
routes.use("/email", email);

routes.use(handleJWTError);
