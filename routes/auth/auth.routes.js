import { Router } from "express";
import {
  loginController,
  logoutController,
  registerController,
  refreshController,
} from "../../controller/auth/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/logout", logoutController);
authRouter.post("/refresh", refreshController);

export default authRouter;
