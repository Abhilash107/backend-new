import { Tweet } from "../models/tweet.models.js"
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
        throw new ApiError(400, "Only owner can edit their tweet")
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
    //TODO: delete tweet
})

//* pipeline
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}