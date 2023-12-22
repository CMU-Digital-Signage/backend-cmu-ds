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

cmuOAuth.post("/cmuOAuth", async (req: Request, res: Response) => {
  try {
    //validate code
    if (typeof req.query.code !== "string") {
      return res
        .status(400)
        .send({ ok: false, message: "Invalid authorization code" });
    }
    //get access token
    const response = await axios.post(
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
    if (!response) {
      return res
        .status(400)
        .send({ ok: false, message: "Cannot get OAuth access token" });
    }
    //get basic info
    const response2 = await getCMUBasicInfoAsync(response.data.access_token);
    if (!response2) {
      return res
        .status(400)
        .send({ ok: false, message: "Cannot get cmu basic info" });
    }

    let user = await prisma.user.findUnique({
      where: {
        email: response2.cmuitaccount,
      },
    });

    const firstName =
      response2.firstname_EN.charAt(0) +
      response2.firstname_EN.slice(1).toLowerCase();
    const lastName =
      response2.lastname_EN.charAt(0) +
      response2.lastname_EN.slice(1).toLowerCase();

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: response2.cmuitaccount,
        },
      });
    } else if (!user.firstName) {
      await prisma.user.update({
        where: {
          email: response2.cmuitaccount,
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
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d", // Token will last for 1 day only
      }
    );

    return res.send({ user, token });
  } catch (err: any) {
    if (!err.response) {
      return res.send({
        ok: false,
        message: "Cannot connect to API Server. Please try again later.",
      });
    } else if (!err.response.data.ok) return err.response.data;
    else return err;
  }
});
