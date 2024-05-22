import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"
import {Like} from "../models/like.models.js";
import {Comment} from "../models/comment.models.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
   
    // TODO: get video, upload to cloudinary, create video 
    const { title, description} = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

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
    .json(new ApiResponse(200, video, "Video   uploaded successfully"));
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(400, "invalid video id")
    }





})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body

    if (!videoId) {
        throw new ApiError(400, "Invalid video Id")
    }

    if(! (title && description) ){
        throw new ApiError(400, "Video title and description are required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if (video?.owner.toString() != req.user?._id) {// A best approach
        throw new ApiError(404, "Only valid user can update the video")
    }

    // deleting old thumbnail and updating new thumbnail

    const thumbnailToDelete = video.thumbnail.public_id

    const thumbnailLocalPath = req.file?.thumbnailLocalPath

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

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(400, "invalid video Id")
    }

    //* search by Id
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No video found");
    }

    //* check if user is the owner or not
    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "you can't delete this video, as you are not the owner")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if(!deleteVideo){
        throw new ApiError(500, "failed to delete this video, please try again")
    }

    await deleteOnCloudinary(video.thumbnail.public_id)

    await deleteOnCloudinary(video.videoFile, "video")

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}