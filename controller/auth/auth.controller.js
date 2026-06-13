import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_SECRET,
  NODE_ENV,
} from "../../config/env.js";
import User from "../../models/user/user.model.js";
import {
  loginSchema,
  registerSchema,
} from "../../validators/auth.validator.js";
import { sendTokenCookies } from "../../utils/sendTokenCookies.js";
import { generateTokens } from "../../utils/generateTokens.js";
import crypto from "crypto";
import { hashToken } from "../../utils/hashToken.js";

export const registerController = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const { name, email, password } = result.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const users = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
        },
      ],
      { session },
    );

    const user = users[0];

    const { accessToken, refreshToken } = await generateTokens(user);

    const hashedRefreshToken = hashToken(refreshToken);

    user.refreshToken = hashedRefreshToken;
    await user.save({ session });

    await session.commitTransaction();

    sendTokenCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return res.status(201).json({
      success: true,
      message: "Registered Successfully",
      data: {
        accessToken,
        refreshToken,
        user: userObj,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};

export const loginController = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      });
    }

    // GET DATA
    const { email, password } = result.data;

    // FIND USER
    const user = await User.findOne({ email });

    // CHECK IF USER EXISTS
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // COMPARE PASSWORD
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // CHECK IF PASSWORD IS NOT SAME
    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 401);
    }

    // GET THE TOKENS
    const { accessToken, refreshToken } = await generateTokens(user);

    // HASHING REFRESH TOKEN
    const hashedRefreshToken = hashToken(refreshToken);

    // SAVING HASHED REFRESH TOKEN TO THE DATABASE
    user.refreshToken = hashedRefreshToken;
    await user.save();

    sendTokenCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return res.status(200).json({
      success: true,
      message: "Logged In Successfully",
      data: {
        accessToken,
        user: userObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req, res, next) => {
  try {
    // GET REFRESH TOKEN FROM COOKIES
    const refreshToken = req.cookies?.refreshToken;

    // CHECK IF REFRESH TOKEN IS AVAILABLE
    if (!refreshToken) {
      throw new AppError("Refresh Token not found", 401);
    }

    // VERIFY THE REFRESH TOKEN
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 403);
    }

    // FIND THE USER
    const user = await User.findById(decoded.userId);

    // CHECK IF USER EXISTS
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hashedRefreshToken = hashToken(refreshToken);

    // COMPARE THE USER'S REFRESH TOKEN TO THE COOKIE REFRESH TOKEN
    if (user.refreshToken !== hashedRefreshToken) {
      throw new AppError("Refresh Token do not match", 403);
    }

    // GENERATE NEW TOKENS (ACCESS & REFRESH)
    const newTokens = await generateTokens(user);
    const newHashedRefreshToken = hashToken(newTokens.refreshToken);

    user.refreshToken = newHashedRefreshToken;
    await user.save();

    // SEND THE TOKENS TO THE COOKIE
    sendTokenCookies(res, newTokens.accessToken, newTokens.refreshToken);

    // SEND STATUS
    res.status(200).json({
      success: true,
      message: "New access token created",
      data: {
        newTokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({
        success: false,
        message: "Already Logged out",
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
