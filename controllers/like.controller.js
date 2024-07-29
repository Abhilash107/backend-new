import mongoose, { mongo } from "mongoose"
import { Like } from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


//* deleteOne - Does not return the deleted document
//*           - More flexible as it allows you to specify complex queries.  
const toggleVideoLike = asyncHandler( async (req, res)=>{
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(400, "Invalid videoId")
    }

    const existingVideoLike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(existingVideoLike){
        // alternate
        //await Like.findByIdAndDelete(likedVideo?._id)
        await Like.deleteOne({
            video: videoId,
            likedBy: req.user?._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video unliked successfully" )
        )
    }


    const createVideoLike = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    if(!createVideoLike){
        throw new ApiError(500, "failed to like the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video liked successfully")
    )

} )

const toggleCommentLike = asyncHandler( async (req, res)=>{
    
    const {commentId} = req.params
    
    if(!commentId){
        throw new ApiError(400, "invalid commentId")
    }
    
    const existingCommentLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })
    
    if(existingCommentLike){
        await Like.deleteOne({
            comment: commentId,
            likedBy: req.user?._id
        })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        )
    }
    
    const createCommentLike = await Like.create({
        comment:commentId,
        likedBy: req.user?._id
    })

    if(!createCommentLike){
        throw new ApiError(500, "failed to like the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment likedsuccessfully")
    )

} )


const toggleTweetLike = asyncHandler( async (req, res)=>{
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400, 'Invalid tweet id')
    }

    const existingTweetLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(existingTweetLike){
        await Like.deleteOne({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        )
    }

    const createTweetLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(!createTweetLike){
        throw new ApiError(500, "failed to like the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet liked successfully")
    )

} )

//todo
//* pipeline
const getLikedVideos = asyncHandler( async (req, res)=>{
    const likedVideosAggregate = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            } 
        },

        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },

        {
            $unwind: "$likedVideo"
        },

        {
            $sort:{
                "likedVideo.createdAt": -1
            }
        },

        {
            $project: {
                _id: 0,
                likedVideo: {
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1

                    }
                }
            }
        }
    ])

    if(!likedVideosAggregate?.length){
        throw new ApiError(404, "No liked video found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideosAggregate, "liked videos fetched successfully")
    )

} )

export{toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos}
