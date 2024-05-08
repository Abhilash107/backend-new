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

    // const coverImageLocalPath = req.files?.coverImage[0]?.path

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

    if(!avatar  || !avatar.url){
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

