import express from "express";
import { admin } from "./admin";
import { cmuOAuth } from "./cmuOAuth";
import { cpe } from "./cpe";
import { device } from "./device";
import { poster } from "./poster";
import { user } from "./user";
import { pi } from "./pi";
import { jwtMiddleware, handleJWTError } from "../utils/authen";

export const routes = express.Router();

routes.use(jwtMiddleware.unless({ path: ["/pi"] }));

routes.use("/cmuOAuth", cmuOAuth);
routes.use("/pi", pi);
routes.use("/cpe", cpe);
routes.use("/user", user);
routes.use("/admin", admin);
routes.use("/device", device);
routes.use("/poster", poster);

routes.use(handleJWTError);
