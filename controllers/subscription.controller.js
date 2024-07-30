import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400, "Invalid channelId")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(isSubscribed){
        const unsubscribeChannel = await Subscription.findByIdAndDelete(isSubscribed?._id)

        if(!unsubscribeChannel){
            throw new ApiError(500, "failed to unsubscribe from the channel")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, {subscribed: false}, "unsubscribed successfully")
        )
    }

    const subscribeChannel = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (!subscribeChannel) {
        throw new ApiError(500, "Failed to subscribe to the channel");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {subscribed: true},"subscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400, "Invalid channelId")
    }

    const channel= await Subscription.findById(channelId)

    if(!channel){
        throw new ApiError(404, "No channels found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel_id: new mongoose.Types.ObjectId(channelId) 
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        // here we use lookup to subscriptions, to get channels
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        }
                    },

                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [new mongoose.Types.ObjectId(channelId), 
                                            "$subscribedToSubscriber.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            },

                            subscribersCount: {
                                $size: "$subscribedToSubscriber"
                            }
                            
                        }
                    }
                ]
            }
        },

        {
            $unwind: "$subscriber"
        },

        {
            $project: {
                _id: 0,
                subscriber:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1
                }
            }
        }
    ])

    if(!subscribers?.length){
        throw new ApiError(404, "No subscribers found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "subscribers fetched successfully")
    )

})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //*pipeline
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400, "invalid subscriberId")
    }
    
    const subscriber = await Subscription.findById(subscriberId);

    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    } 

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        },

                    },

                    {
                        $addFields: {
                            latestVideo:{
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },

        {
            $unwind: "$subscribedChannel"
        },

        {
            $project:{
                _id: 1,
                subscribedChannel:{
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id:1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration:1 ,
                        views: 1,
                        createdAt: 1
                    }

                }
            }
        }
    ])

    if(!subscribedChannels?.length){
        throw new ApiResponse(404, [], "No subscribed channels found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedChannels, "subscribed channels fetched successfully")
    )
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}