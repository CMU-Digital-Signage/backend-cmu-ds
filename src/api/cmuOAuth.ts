import axios from "axios";
import jwt from "jsonwebtoken";
import { Request, Response, Router } from "express";
import { prisma } from "../utils/db.server";

export const cmuOAuth = Router();

const getCMUBasicInfoAsync = async (accessToken: string) => {
  try {
    const response = await axios.get(process.env.CMU_OAUTH_GET_BASIC_INFO!, {
      headers: { Authorization: "Bearer " + accessToken },
    });
    return response.data;
  } catch (err) {
    return err;
  }
};

cmuOAuth.post("/", async (req: Request, res: Response) => {
  try {
    //validate code
    if (typeof req.query.code !== "string") {
      return res
        .status(400)
        .send({ ok: false, message: "Invalid authorization code" });
    }
    //get access token
    let response;
    try {
      response = await axios.post(
        process.env.CMU_OAUTH_GET_TOKEN_URL!,
        {},
        {
          params: {
            code: req.query.code,
            redirect_uri: process.env.CMU_OAUTH_REDIRECT_URL,
            client_id: process.env.CMU_OAUTH_CLIENT_ID,
            client_secret: process.env.CMU_OAUTH_CLIENT_SECRET,
            grant_type: "authorization_code",
          },
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      );
    } catch (err) {
      return res
        .status(400)
        .send({ ok: false, message: "Cannot get OAuth access token" });
    }
    //get basic info
    let response2;
    try {
      response2 = await getCMUBasicInfoAsync(response.data.access_token);
    } catch (err) {
      return res
        .status(400)
        .send({ ok: false, message: "Cannot get cmu basic info" });
    }

    const email: string = response2.cmuitaccount;
    const firstName: string =
      response2.firstname_EN.charAt(0) +
      response2.firstname_EN.slice(1).toLowerCase();
    const lastName: string =
      response2.lastname_EN.charAt(0) +
      response2.lastname_EN.slice(1).toLowerCase();

    let user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user?.isAdmin) {
    } else if (
      !user &&
      response2.cmuitAccountType === "MISEmpAcc" &&
      response2.organization_name_EN === "Faculty of Engineering"
    ) {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
        },
      });
    } else if (!user || !user.isAdmin) {
      return res.status(401).send({ ok: false, message: "Permission Denied." });
    } else if (user.firstName === null) {
      user = await prisma.user.update({
        where: {
          email,
        },
        data: {
          firstName,
          lastName,
        },
      });
    }

    //create session
    const token = jwt.sign(
      {
        firstName,
        lastName,
        email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d", // Token will last for 7 day only
      }
    );

    return res.send({ user, token });
  } catch (err: any) {
    if (!err.response) {
      return res.status(500).send({
        ok: false,
        message: "Cannot connect to API Server. Please try again later.",
      });
    } else return err;
  }
});
