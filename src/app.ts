import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import { routes } from "./api";
import { Socket } from "socket.io";
import mqtt from "mqtt";

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

const mqttClient = mqtt.connect({
  host: "d887ebbbf00045b6b1405a5f76f66686.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "cpe_ds",
  password: "CPEds261361",
});

mqttClient.on("connect", () => {
  // console.log("connected.");
});

mqttClient.on("error", (error) => {
  // console.log(error);
});

mqttClient.on("message", (topic, message) => {
  // console.log(topic, message.toString());
  mqttClient.end();
});

mqttClient.subscribe("pi/on_off");
// mqttClient.publish("pi/on_off", "on");

export { mqttClient };

export { io };
