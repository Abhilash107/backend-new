import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js";
import { User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
    

    //user datails
    const {fullName, email, username, password} = req.body;
    
    if(
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")      
    ){
        throw new ApiError(400,"All fields are required")
    }

    //check  if user already exists or not
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(49, "User with email or username already exists")
    }

    //images
    //access given by multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path


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

export { registerUser };

