import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import { routes } from "./api";
import { Socket, Server } from "socket.io";
import { createServer } from "http";

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

const httpServer = createServer(app);
// const server = app.listen(port, () =>
//   console.log(`Server running on port ${port}!`)
// );

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// const io = socket(server, {
//   cors: {
//     origin: "*",
//     credentials: true,
//   },
// });

io.on("connection", (socket: Socket) => {
  // console.log("user is connected");
  socket.on("disconnect", () => {
    // console.log(`socket ${socket.id} disconnected`);
  });
});

httpServer.listen(port);

export { io };
