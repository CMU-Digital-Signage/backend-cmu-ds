import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import { routes } from "./api";
const pathToRegexp = require("path-to-regexp");

dotenv.config();
const port = process.env.PORT;
const prefix = "/api/v1";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://10.10.182.134:4000",
      process.env.URL_PATH_WEB_APP as string,
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(json({ limit: "50mb" }));

app.use(`${prefix}/`, routes);

server.listen(port, () => console.log(`Server running on port ${port}!`));

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://10.10.182.134:4000",
      process.env.URL_PATH_WEB_APP as string,
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log("user is connected");
  socket.on("disconnect", () => {
    // console.log(`socket ${socket.id} disconnected`);
  });
});

export { io };
