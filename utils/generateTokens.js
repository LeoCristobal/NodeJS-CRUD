import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
} from "../config/env.js";
import User from "../models/user/user.model.js";
import crypto from "crypto";
export const generateTokens = async (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  // ACCESS TOKEN (short life)
  const accessToken = jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
  });

  // REFRESH TOKEN (long life)
  const refreshToken = jwt.sign(payload, JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN || "30d",
  });

  return { accessToken, refreshToken };
};
