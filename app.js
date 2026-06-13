import express from "express";
import { API_VERSION1, PORT } from "./config/env.js";
import authRouter from "./routes/auth/auth.routes.js";
import errorMiddleWare from "./middleware/error.middleware.js";
import userRouter from "./routes/user/user.routes.js";
import authMiddleware from "./middleware/auth.middleware.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middleware/arcjet.middleware.js";
const app = express();

// MIDDLEWARE
app.use([errorMiddleWare, express.json(), cookieParser(), arcjetMiddleware]);

// ROUTES
app.use(`${API_VERSION1}/auth`, authRouter);
app.use(`${API_VERSION1}/users`, authMiddleware, userRouter);

export default app;
