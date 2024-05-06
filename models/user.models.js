import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    username:{
        type:String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
        index: true,//for searching
    },
    email:{
        type:String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },
    fullname:{
        type:String,
        required: true,
        trim: true,
        index: true,//for searching
    },
    avatar:{
        type:String,
        required: true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type:String,
        required: [true, 'password is required'],
    },
    refreshToken: {
        type: String,
    }

}, {timestamps: true})



export const User = mongoose.model("User" , userSchema)