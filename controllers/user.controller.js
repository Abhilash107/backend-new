import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js";
import { User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'; 
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from 'mongoose';


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong")
        
    }
}

const registerUser = asyncHandler( async (req, res)=>{
  
    // get user details from frontend
    //validation -not empty
    //if user already exists(check email or username)
    //check for avatar, images
    //upload them to cloudinary , avatar
    //create user object - create entry in DB
    //remove password and refreshToken field from response
    //check for user creation
    //return res
    

    //user datails  (destructuring)
    const {fullName, email, username, password} = req.body;
    
    if(
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")      
    ){
        throw new ApiError(400,"All fields are required")
    }
    //check  if user already exists or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //images
    //access given by multer
    const avatarLocalPath = req.files?.avatar[0]?.path


    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path;

    }
    //console.log(req.files);

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //uploading to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath) ;
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) ;

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required")
    }

    //create entry in DB==> create an object
    //.create is a mongoDb method
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    // check if user is created or not
    // removing password and refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse (200, createdUser, "user registered successfully")
    )



})

const loginUser = asyncHandler( async (req, res)=>{
    // req body
    // username or email 
    // find the user
    // password check
    // access & refresh token
    // send cookies
    const {email, username, password} = req.body
    if((!username) || (!email)){
        throw new ApiError(400, "username or email is required")    
    }

    const user =await User.findOne({
        $or:[{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Inalid user credentials" )
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse (
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )

})

const logOutUser = asyncHandler (async (req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,

            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }
    // This option ensures that the cookie is inaccessible to client-side scripts. y making the cookie accessible only to the server, it helps prevent malicious scripts from accessing sensitive cookie data 

    // When set to true, this option instructs the browser to only send the cookie over HTTPS connections.This helps protect the cookie from being intercepted by attackers during transmission over unsecured HTTP connections. It ensures that the cookie is only transmitted over secure channels, adding an extra layer of security to the cookie data.

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )


})

const refreshAccessToken = asyncHandler( async (req, res)=>{
    //get token from user
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    //req.body==> for for mobile users

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    

    //we want decoded data so...
    try {// trycatch for DB calls
        const decodedToken = jwt.verify(
            incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        //check the incomingRefreshToken === refreshtoken saved in DB
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        
        //better to declare as g variable
        const options = {
            httpOnly: true,
            secure: true
        }
    
        //generateAccessAndRefreshToken
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newrefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, newrefreshToken
                },
                "Access token refreshed successfully"
    
            )
        )
    } 
    catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid refresh token"
        )
    }

} )

const changeCurrentPassword = asyncHandler(async (req, res) =>{
    const {oldPassword, newPassword} = req.body;

    //get user._id from DB
    const user = await User.findById(req.user?._id)
    //isPasswordCorrect method is defined in user.models.js 

    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    //set newPassword to user's password 
    user.password = newPassword
    //Now save it in the DB
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )





})


const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched successfully")
    )
})


const updateAccountDetails = asyncHandler(async (req, res)=>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, "account details updated successfully")
    )

    

})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    //req.file ==not files(here only)
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is missing")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar ")

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new :true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )


} )


const updateUserCoverImage = asyncHandler(async (req, res)=>{
    //req.file ==not files(here only)
    const coverImageLocalPath = req.file?.path
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "Image file is missing")

    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on coverImage ")

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new :true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )


} )

const getUserChannelProfile = asyncHandler(async (req, res)=>{
    //get url of the profile
    const {username} = req.body
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase(),
            }
        },

        {
            $lookup:{//lowercase and in plurals
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"//my subscribers

            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"//my subscribed channels
            }
        },

        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                        then: true,
                        else: false

                    }
                }

            } 
        },

        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel doesn't exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse( 200, channel[0], "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async (req,res)=>{
    //req.user.Id =>> string
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [//sub aggregate(add sub pipelines) pipeline to $lookup)
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]

                        }

                    },
                    {
                        $addFields: {//for getting value from field use '$' 
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]

            }

        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully ")
    )
})


export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage,getUserChannelProfile,getWatchHistory };





// req.files ===>

//[Object: null prototype] {
    //avatar: [
    //     {
    //       fieldname: 'avatar',
    //       originalname: 'leo2019.jpg',
    //       encoding: '7bit',
    //       mimetype: 'image/jpeg',
    //       destination: './public/temp',
    //       filename: 'leo2019.jpg',
    //       path: 'public\\temp\\leo2019.jpg',
    //       size: 1848363
    //     }
    //   ],
    //   coverImage: [
    //     {
    //       fieldname: 'coverImage',
    //       originalname: 'leo.jpg',
    //       encoding: '7bit',
    //       mimetype: 'image/jpeg',
    //       destination: './public/temp',
    //       filename: 'leo.jpg',
    //       path: 'public\\temp\\leo.jpg',
    //       size: 2159033
    //     }
    //   ]
    // }


//In MongoDB, the .findOne() method is used to retrieve a single document from a collection that matches a specified query criteria. It returns the first document that satisfies the query condition within the collection.


// const generateAccessAndRefreshToken = async(userId)=>{: This line defines an asynchronous function named generateAccessAndRefreshToken that takes a userId as its parameter.
//     try {: Begins a try block to handle potential errors within the function.
//     const user = await User.findById(userId): This line awaits the result of a database query to find a user by their ID (userId). It assigns the result to the user variable.
//     const accessToken = user.generateAccessToken(): Calls a method generateAccessToken() on the retrieved user object to generate an access token. It assigns the result to the accessToken variable.
//     const refreshToken = user.generateRefreshToken(): Similar to the previous line, this generates a refresh token for the user and assigns it to the refreshToken variable.
//     user.refreshToken = refreshToken: Assigns the generated refresh token to the refreshToken property of the user object.
//     await user.save({ validateBeforesave: false}): Saves the modified user object back to the database. The { validateBeforesave: false } option disables any built-in validation checks before saving.
//     return {accessToken, refreshToken}: Constructs and returns an object containing both the access token and the refresh token.
//     } catch (error) {: Catches any errors that occur within the try block.
//     throw new ApiError(500, "Something went wrong"): Throws a new ApiError object with a status code of 500 and a message indicating that something went wrong.



// const options = { httpOnly: true, secure: true }: Defines an object named options containing properties for cookie settings. httpOnly: true means the cookie is accessible only through HTTP requests, not through JavaScript. secure: true indicates that the cookie should only be sent over HTTPS connections.

// return res: Begins the return statement with the response object (res), indicating that the following methods are chained to this response object.
// .status(200): Sets the HTTP status code of the response to 200, indicating a successful request.

// .cookie("accessToken",accessToken, options): Sets a cookie named "accessToken" in the response with the value of the accessToken variable (presumably containing the access token generated earlier), and applies the cookie options defined in the options object.

// .cookie("refreshToken",refreshToken, options): Sets a cookie named "refreshToken" in the response with the value of the refreshToken variable (presumably containing the refresh token generated earlier), and applies the same cookie options as defined in the options object.

// .json(...): Converts the provided JavaScript object into JSON format and sends it as the response body.

// new ApiResponse (...): Constructs a new ApiResponse object. It includes the HTTP status code (200), a data object containing information about the logged-in user (loggedInUser), as well as the access token and refresh token, and a message indicating successful user login.