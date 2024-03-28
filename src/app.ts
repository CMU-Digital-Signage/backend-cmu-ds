import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import { routes } from "./api";
import { Socket } from "socket.io";
import schedule from 'node-schedule';
import { clearImageCache } from "./utils/config";

const socket = require("socket.io");
dotenv.config();
const app = express();
const port = process.env.PORT;
const prefix = "/api/v1";

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

const server = app.listen(port, () =>
  console.log(`Server running on port ${port}!`)
);

// Schedule to clear imageCache at 4:00 am every day
schedule.scheduleJob('0 4 * * *', clearImageCache);

const io = socket(server, {
  cors: { origin: "*" },
  transports: ["polling", "websocket"],
}).of("/api/v1");

io.on("connection", (socket: Socket) => {
  // console.log("user is connected");
  socket.on("disconnect", () => {
    // console.log(`socket ${socket.id} disconnected`);
  });
});

export { io };
