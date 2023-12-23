export const config = {
  secret: process.env.JWT_SECRET,
  jwtAlgo: "HS256",
};

// type of file
export const signatures = {
  JVBERi0: "application/pdf",
  R0lGODdh: "image/gif",
  R0lGODlh: "image/gif",
  iVBORw0KGgo: "image/png",
  TU0AK: "image/tiff",
  "/9j/": "image/jpg",
};
