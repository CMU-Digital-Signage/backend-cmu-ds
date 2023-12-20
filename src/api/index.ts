import express from "express";
import { cmuOAuth } from "./cmuOAuth";
import { user } from "./user";

export const routes = express.Router();

routes.use(cmuOAuth);
routes.use(user);
