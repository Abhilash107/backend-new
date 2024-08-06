import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"
import {Like} from "../models/like.models.js";
import {Comment} from "../models/comment.models.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //* Imp,  Use of Pre-defined Pipeline[]

    if([query, sortBy, sortType, userId].some(field => field === "" || field === undefined)){
        throw new ApiError(400, "All fields are required")
    }

    if(!userId){
        throw new ApiError(400, "Invalid userId")
    }

    const pipeline = []
        // match the userId and isPublished 
    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(userId),
            isPublished: true 
        }
    })


    // sortBy
    //Dynamic Field: [sortBy] allows you to use the value of the sortBy variable as the field name to sort by.
    if(sortBy && sortType){
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }else{
        pipeline.push({
            $sort:{
                createdAt: -1
            }
        })
    }

    pipeline.push(
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

        {
            $unwind: "$ownerDetails"
        },

        {
            $project: {
                title:1,
                views: 1
            }
        }

    )

    const videoAggregate = await Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    // Use aggregatePaginate when you need to paginate through the results of an aggregation query, simplifying the integration of aggregation and pagination.
    const videos = await Video.aggregatePaginate(videoAggregate, options)

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
   //* pipeline
   const {videoId} = req.params
   
   if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
   }
   
   if(!videoId){
    throw new ApiError(400, "Invalid videoId")
   }

   const video = await Video.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(videoId)
        }
    },
        //* channels details
        //owner, subscribers
    {   
        $lookup: {
            from: "users",
            localField:"owner",
            foreignField: "_id",
            as:"owner",
            pipeline:[
                {  
                    $lookup: {
                        from: "subscriptions",
                        localField:"_id",
                        foreignField: "channel",
                        as:"subscribers",
                    },
                },
                
                {
                    $addFields:{
                        subscriberCount: {
                            $size: "$subscribers"
                        },
                        
                        isSubscribed: {
                            $cond:{
                                if:{
                                    $in:[
                                        new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"
                                    ]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },

                {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                        subscriberCount: 1,
                        isSubscribed: 1,
                    }
                }

            ]
        }
    },

    { // likes
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes"
        }
    },

    {
        $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "comments",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "commenter"
                    }
                },

                {
                    $unwind: "$commenter"
                },

                {
                    $project: {
                        content: 1,
                        createdAt: 1,
                        "commenter.username": 1,
                        "commenter.avatar.url": 1
                    }
                }
            ]
        }
    },

    {
        $addFields:{
            likesCount: {
                $size: "$likes"
            },

            commentsCount: {
                $size: "$comments"
            },
            
            isLiked: {
                $cond:{
                    if: {
                        $in: [new mongoose.Types.ObjectId(req.user?._id),
                            "$likes.likedBy"
                        ]
                    },
                    then: true,
                    else: false,
                }
            },

            owner: {
                $first: "$owner"
            },
        }
    },

    {
        $project:{
            "videoFile.url": 1,
            "thumbnail.url": 1,
            owner: 1,
            title: 1,
            description: 1,
            views: 1,
            duration : 1,
            createdAt: 1,
            likesCount: 1,
            isLiked: 1,
            commentsCount:1,
            comments: 1,
            isPublished: 1
        }
    }
   ])

   if(!video?.length){
    throw new ApiError(404, "Video not found")
   }

   await Video.findByIdAndUpdate(
    videoId,
    {
        $inc: {
            views: 1
        }
    }
   )

   await User.findByIdAndUpdate(
    req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    }
   )

   return res
   .status(200)
   .json(
    new ApiResponse(200, video[0], "Video fetched successfully")
   )
})


const publishAVideo = asyncHandler(async (req, res) => {
   
    // TODO: get video, upload to Cloudinary, create video 
    const { title, description} = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(400, "videoFileLocalPath is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnailLocalPath is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400, "Video not ")
    }

    if(!thumbnailFile){
        throw new ApiError(400, "thumbnail file is required")
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration  ,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnailFile.url,
            public_id: thumbnailFile.public_id
        },
        owner: req.user?._id,
        isPublished: false
        
    })

    const videoUploaded = await Video.findById(video?._id)

    if (!videoUploaded) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
    
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body

    if (!videoId) {
        throw new ApiError(400, "Invalid video Id")
    }

    // if(! (title && description) ){
    //     throw new ApiError(400, "Video title and description are required")
    // }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if (video?.owner.toString() != req.user?._id) {// A best approach
        throw new ApiError(404, "Only valid user can update the video")
    }

    //? deleting old thumbnail and updating new thumbnail
    //* In your schema definition, the thumbnail field is an object with url and public_id properties. Therefore, to access the public_id,
    const thumbnailToDelete = video.thumbnail.public_id
    // upload.single so use req.file.path
    const thumbnailLocalPath =  req.file?.path;

    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail is required")
    }

    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!newThumbnail){
        throw new ApiError(400, "thumbnail not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: newThumbnail.public_id,
                    url: newThumbnail.url
                }
            }
        },
        {
            new: true
        }
    )

    if(!updateVideo){
        throw new ApiError(500, "Failed to update the video, Please try again")
    }


    // TODO: need to add this after writting the deleteOnCloudinary function

    // if(updatedVideo){
    //     await deleteOnCloudinary(thumbnailToDelete);
    // }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video updated successfully" )
    )
})


const deleteVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(400, "invalid videoId")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403, "only owner can edit their credentials"
        )
    }

    const videoDelete = await Video.findByIdAndDelete(videoId)

    if(!videoDelete){
        throw new ApiError(500, "failed to delete the video")
    }

    if (video.thumbnail && video.thumbnail.public_id) {
        await deleteOnCloudinary(video.thumbnail.public_id);
    }

    if (video.video && video.video.public_id) {
        await deleteOnCloudinary(video.video.public_id, "video");
    }

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    // await Promise.all([
    //     Like.deleteMany({ video: videoId }),
    //     Comment.deleteMany({ video: videoId })
    // ])

    //* This will execute both Like.deleteMany and Comment.deleteMany in parallel. They both start at the same time and complete independently. If either one fails, the whole Promise.all will fail.

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
    
})


const togglePublishStatus = asyncHandler(async (req, res)=>{
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Only owner can edit their credentials")
    }

    const toggledPublishStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {new: true}
    )

    if(!toggledPublishStatus){
        throw new ApiError(500, "failed to toggle Video publish status")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isPublished: toggledPublishStatus.isPublished},
            "video publish toggled successfully"
        )
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}


