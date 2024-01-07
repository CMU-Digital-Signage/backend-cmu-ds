import express from "express";
import { cmuOAuth } from "./cmuOAuth";
import { user } from "./user";
import { device } from "./device";
import { admin } from "./admin";
import { poster } from "./poster";
import { cpe } from "./cpe";

export const routes = express.Router();

routes.use(cmuOAuth);
routes.use(cpe)
routes.use(user);
routes.use(device);
routes.use(admin);
routes.use(poster);