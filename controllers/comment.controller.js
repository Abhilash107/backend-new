import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const user= await Comment
    .find({videoId})
    .skip((page-1)* limit)
    .limit(limit).exec();


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}


//Comment.find({ videoId }): Queries the database for comments associated with the given videoId, returning a query object.

//.skip((page - 1) * limit): Skips a certain number of documents before returning results, based on the current page and the limit of comments per page.

//.limit(limit): Limits the number of comments returned by the query to the specified limit, ensuring only a certain number of comments are returned per page.

//.exec(): Executes the query, returning a promise that resolves to the query result. In Mongoose, exec() is used to execute queries.