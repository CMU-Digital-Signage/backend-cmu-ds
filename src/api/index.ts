import express from "express";
import { admin } from "./admin";
import { cmuOAuth } from "./cmuOAuth";
import { device } from "./device";
import { poster } from "./poster";
import { user } from "./user";
import { pi } from "./pi";
import { email } from "./email";
import { proxy } from "./proxy";
import { jwtMiddleware, handleJWTError } from "../utils/authen";

export const routes = express.Router();

const pathToRegexp = require("path-to-regexp");
const unprotected = [
  pathToRegexp("/api/v1/pi*"),
  pathToRegexp("/api/v1/proxy*"),
  pathToRegexp("/api/v1/cmuOAuth"),
  pathToRegexp("/api/v1/poster/emergency*"),
];

routes.use(jwtMiddleware.unless({ path: unprotected }));

routes.use("/proxy", proxy);
routes.use("/cmuOAuth", cmuOAuth);
routes.use("/pi", pi);
routes.use("/user", user);
routes.use("/admin", admin);
routes.use("/device", device);
routes.use("/poster", poster);
routes.use("/email", email);

routes.use(handleJWTError);
