import jwt from "jsonwebtoken";
import { JWT_ACCESS_TOKEN_SECRET } from "../config/env.js";
import User from "../models/user/user.model.js";
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorize",
      });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorize",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
