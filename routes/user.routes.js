import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, upadateAccountDetails, upadateUserAvatar, upadateUserCoverImage, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
 

router.route("/register").post( //(middleware , method to be called )
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1,
        }

    ]),
    registerUser)

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh_token").post(refreshAccessToken)

router.route("/change_password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

//patch
router.route("/upadte-account").patch(verifyJWT, upadateAccountDetails)

// single 
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), upadateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("cover-image"), upadateUserCoverImage)


router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router;
