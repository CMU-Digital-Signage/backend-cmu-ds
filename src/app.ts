import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import { routes } from "./api";

const app = express();
dotenv.config();
const port = process.env.PORT;
const prefix = "/api/v1";

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.URL_PATH_WEB_APP as string],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(json({ limit: "50mb" }));

app.use(`${prefix}/`, routes);

app.listen(port, () => console.log(`Server running on port ${port}!`));
