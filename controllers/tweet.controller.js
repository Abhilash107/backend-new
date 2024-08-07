import mongoose from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    let {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    if (content.length > 280) {
        throw new ApiError(400, "Content exceeds maximum length of 280 characters");
    }

    content = content.replace(/<[^>]*>?/gm, '')

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new ApiError(500, "failed to create tweet, please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet created successfully")
    )
 
})



const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400, "Invalid tweetId")
    }
    
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Only owner can edit their tweet")
    }

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
       {new : true} 
    )
    if(!updatedTweet){
        throw new ApiError(500, "Failed to edit tweet please try again");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.body

    if(!tweetId){
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Only owner can edit their tweet")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deleteTweet){
        throw new ApiError(500, "failed to delete the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "tweet deleted successfully")
    )
})


//* pipeline
const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(400, "Invalid userId")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
            //* get the likes of the tweet
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project:{
                            likedBy: 1
                        }
                    }
                ]
                
            }
        },

        {
            $addFields:{
                likesCount: {
                    $size: "$likeDetails"
                },

                ownerDetails: {
                    $first: "$ownerDetails"
                },

                isLiked: {
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id), "$likeDetails.likedBy"],
                            then: true,
                            else: false
                        }
                    }
                }
            }
        },

        {
            $sort:{
                createdAt: -1
            }
        },

        {
            $project: {
                content: 1,
                ownerDetails: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1


            }
        }
    ])

    if(!tweets?.length){
        new ApiResponse(404, [], "No tweets found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )



})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}