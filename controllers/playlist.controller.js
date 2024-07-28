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
    //TODO: get playlist by id
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    //*pipeline
    const {userId} = req.params
    //TODO: get user playlists
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