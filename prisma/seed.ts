import { prisma } from "../src/utils/db.server";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

type Device = {
  MACaddress: string;
  IPaddress: string;
  name: string;
  room: number;
  location: Blob;
  description: string;
};

type Emergency = {
  incidentName: string;
  emergencyImage: Blob;
  description: string;
  status: boolean;
};