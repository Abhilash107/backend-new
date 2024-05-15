import mongoose from "mongoose"
import { Like } from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { response } from "express"



// import { asyncHandler } from '../utils/asyncHandler.js'
// import { ApiError } from "../utils/ApiError.js";
// import { User} from "../models/user.models.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import jwt from 'jsonwebtoken';
// import { ApiResponse } from "../utils/ApiResponse.js";
// import cookieParser from 'cookie-parser';
// import mongoose from 'mongoose';


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400, "Invalid videoId")
    }

    const likedVideo = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likedVideo){
        await Like.findByIdAndDelete(likedVideo?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video unliked successfully")
        )
    }

    const videoLiked = await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "video liked successfully")
    )

})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "Invalid commnet id")
        
    }

    const likedComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(likedComment){
        await Like.findByIdAndDelete(likedComment?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        )
    }

    const commnetLiked = await Like.create({
        comment:commentId,
        likedBy: req.user?._id,

    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Commnet liked succesfully")
    )


})



const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, 'Invalid tweet id')
    }

    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    // const likedTweet = await Like.aggregate([
    //     {
    //         $match: {
    //             tweet: mongoose.Types.ObjectId(tweetId),
    //             likedBy: mongoose.Types.ObjectId(req.user?._id)
    //         }
    //     },
    //     {
    //         $limit: 1 // Limiting to one result, as we only need to check if it exists
    //     }
    // ]);

    if(likedTweet){
        await Like.findByIdAndDelete(likedTweet?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        )
    }

    const tweetLiked = await Like.create({
        tweet:tweetId,
        likedBy: req.user?._id
    })

    return res.status(200)
    .json( new ApiResponse(200,{}, "Tweet liked successfully") )

})



const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    //imp
    // use pipelines we can get all videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(req.user?.id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    
                ]
            }
        }



    ])

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}