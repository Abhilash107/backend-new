import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
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


    // need to add this after writting the deleteOnCloudinary function

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