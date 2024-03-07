import mqtt from "mqtt";
import * as Minio from "minio";

const secret = process.env.JWT_SECRET;

export const config = {
  secret: secret,
  jwtAlgo: "HS256",
};

export const mqttClient = mqtt.connect({
  host: "d887ebbbf00045b6b1405a5f76f66686.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "cpe_ds",
  password: "CPEds261361",
});

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_URL!,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  useSSL: true,
});

export const bucketName = "pixel-parade";
export const folderDevice = "devices";
export const folderPoster = "posters";
export const folderEmer = "emergencies";

export const uploadFile = (file: any, path: string) => {
  const base64Data = file.dataURL.replace(/^data:image\/\w+;base64,/, "");
  const bufferData = Buffer.from(base64Data, "base64");
  const type = file.type.includes("/")
    ? file.type
    : `image/${file.type.replace(".", "")}`;
  minioClient.putObject(
    bucketName,
    path,
    bufferData,
    file.size,
    {
      "Content-Type": type,
    },
    function (err: any, objInfo: any) {
      if (err) {
        return console.log(err);
      }
    }
  );
};
