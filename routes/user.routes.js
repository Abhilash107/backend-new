import { Router } from "express";
import { loginUser, logOutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js'
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
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh_token").post(refreshAccessToken)

router.route("/change_password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

//patch
router.route("/upadte-account").patch(verifyJWT, updateAccountDetails)

// single 
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("cover-image"), updateUserCoverImage)


router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router;
