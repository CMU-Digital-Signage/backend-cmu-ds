import mqtt from "mqtt";
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