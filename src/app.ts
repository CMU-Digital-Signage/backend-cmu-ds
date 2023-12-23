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

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(json());

app.use(`${prefix}/`, routes);

app.listen(5000,
  //"192.168.1.63",    // for test call api from raspberry pi, ip of server (PC)
  () =>
  console.log(`Server running on port ${port}!`)
);
