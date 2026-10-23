import { Router } from "express";
import{loginUser,}
import { registerUser } from "../controllers/user.controller.js";

import {upload} from "../middleware/multer.middleware.js"

const router = Router();

router.route("/register").post(upload.single([
    upload.fields([
        {
          name:"avatar",
          maxCount:1  
        },
        {
            name:"coverImages",
            maxCount:1
        }

    ])
]),
 registerUser);


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router;