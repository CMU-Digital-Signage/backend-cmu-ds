const secret = process.env.JWT_SECRET;

export const config = {
  secret: secret,
  jwtAlgo: "HS256",
};
