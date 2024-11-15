import mqtt from "mqtt";
import * as Minio from "minio";
import axios from "axios";

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

export const bucketName = "cpe-pixel-parade";
export const folderDevice = "devices";
export const folderPoster = "posters";
export const folderEmer = "emergencies";

export const imageCache: any = {};

export const clearImageCache = () => {
  for (const key in imageCache) {
    if (Object.prototype.hasOwnProperty.call(imageCache, key)) {
      delete imageCache[key];
    }
  }
  console.log("imageCache cleared at 4:00 am");
};

export const uploadFile = (
  file: any,
  path: string,
  fileType: string = "image"
) => {
  const base64Data = file.dataURL.replace(
    /^data:(image|video)\/\w+;base64,/,
    ""
  );
  const bufferData = Buffer.from(base64Data, "base64");
  const type = file.type.includes("/")
    ? file.type
    : `${fileType}/${file.type.replace(".", "")}`;
  minioClient.putObject(
    bucketName,
    path,
    bufferData,
    file.size,
    { "Content-Type": type },
    function (err: any, objInfo: any) {
      if (err) {
        return console.log(err);
      }
    }
  );
};

export const convertUrlToFile = async (url: string): Promise<any> => {
  const response = await convertImageToBase64(url);
  const base64Data = response.split(",")[1];
  const name = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("?"));
  const type = name.substring(name.lastIndexOf("."));
  const size = (base64Data.length * 3) / 4;

  return {
    dataURL: response,
    lastModified: new Date().getTime(),
    lastModifiedDate: new Date(),
    name,
    size,
    type,
  };
};

export const convertImageToBase64 = async (url: string): Promise<string> => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  const base64Data = Buffer.from(response.data, "binary").toString("base64");
  return `data:${response.headers["content-type"]};base64,${base64Data}`;
};
