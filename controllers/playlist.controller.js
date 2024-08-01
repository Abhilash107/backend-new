import mongoose from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "Both name and description are required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id
    })

    if(!playlist){
        throw new ApiError(500, "failed to create playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!name || !description){
        throw new ApiError(400, "both name and description are required")
    }

    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "only owner can edit the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description
            }
        },
        {new : true}
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "failed to update playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    )
    
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || ! videoId){
        throw new ApiError(400, "invalid playlistId or videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    } 

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Only owner can edit their playlist" )
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos: videoId
            }
        },
        {new: true}
    )

    if(!addVideo){
        throw new ApiError(500, "failed to add video to the playlist")
    }

    //? videoId is added to the videos array only if it is not already present.
    //? This prevents duplicate entries in the array.


    return res
    .status(200)
    .json(
        new ApiResponse(200, addVideo, "video added to playlist successfully")
    )
})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || ! videoId){
        throw new ApiError(400, "invalid playlistId or videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    } 

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Only owner can edit their playlist" )
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {new: true}
    )

    if(!removeVideo){
        throw new ApiError(500, "failed to remove video from playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, removeVideo, "Removed video from playlist successfully")
    )

})


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
   

    if(!playlistId){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "only owner can edit their playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "failed to delete playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "playlist deleted successfully")
    )
})


const getPlaylistById = asyncHandler(async (req, res) => {
    //*pipeline
    const {playlistId} = req.params
    
    if(!playlistId){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },

        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },

                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },

                    {
                        $unwind: "$owner"
                        //Unwind the owner array for proper $addFields
                    }
                ]
            }
        },

        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },

        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    if(!playlistVideos?.length){
        throw new ApiError(404, "no videos found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));

})


const getUserPlaylists = asyncHandler(async (req, res) => {
    //*pipeline
    const {userId} = req.params
    
    if(!userId){
        throw new ApiError(400, "invalid userId")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },

        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },

        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1

            }
        }
    ])

    if(!playlists?.length){
        throw new ApiError(404, "No playlists found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "user playlists fetched successfully")
    )

})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}