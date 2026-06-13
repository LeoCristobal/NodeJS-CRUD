import { Router } from "express";
import { getAllUsers } from "../../controller/user/user.controller.js";

const userRouter = Router();

userRouter.get("/", getAllUsers);

export default userRouter;
