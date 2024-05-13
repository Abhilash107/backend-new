import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId || videoId.trim() === ""){
        throw new ApiError(400, "Invalid video id")
    }

    const comments = await Comment
    .find({videoId})
    .skip((page-1)* limit)
    .limit(limit).exec();

    //const comments = await Comment.aggregate([
    //     {
    //         $match: matchCriteria
    //     },
    //     {
    //         $skip: (page - 1) * limit
    //     },
    //     {
    //         $limit: limit
    //     }
    // ]);

    if(!comments){
        throw new ApiError(400, "video don't exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "retrived all comments")
    )


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params 
    if(!videoId || videoId.trim() === ""){
        throw new ApiError(400, "Invalid video id")
    }
     

    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }

    //we can use .create() || .save() by creating an instance (object)

    const newComment = Comment.create({
        content,
        videoId: videoId,
        owner: req.user?._id,
    })

    // const newComments = Comment.create([
    // {
    //     content,
    //     videoId: videoId,
    //     owner: req.user?._id,
    // },
    // {
    //     content,
    //     videoId: videoId,
    //     owner: req.user?._id,
    // },
    // {
    //     content,
    //     videoId: videoId,
    //     owner: req.user?._id,
    // }
    // ]);
    
    if(!newComment){
        throw new ApiError(400, "Something went wrong while adding comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newComment, "Comments added successfully")
    )    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "Invalid comment id")
    }

    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment?.owner.toString() != req.user?._id) {// A best approach
        throw new ApiError(404, "Only valid user can update comment")
    }

    const updateComment = await Comment.findByIdAndUpdate( 
        commentId, 
        {
            $set: {
                content
            }
        },
        { new : true }
    )

    if(!updateComment){
        throw new ApiError(400, "Something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment upadated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(400, "Invalid commentId")
    }

    //it's better to check the id is present or not i DB
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment don't exist")
    }

    if (comment?.owner.toString() != req.user?._id) {
        throw new ApiError(401, "Only valid user can delete comment")
    }

       // user .findOneAndDelete for deleting single element

    const deleteComment = await Comment.findOneAndDelete(commentId)// imp , no need of $set / $unset
    if (!deleteComment) {
        throw new ApiError(400, "Something went wrong while deleting comment")
    }

    //using mongooseAggregatePaginate  
   // const deleteResult = await Comment.aggregate([
        // {
        //     $match: {
        //         _id: mongoose.Types.ObjectId(commentId)
        //     }
        // },
        // {
        //     $unset: {
        //         // Optionally unset any fields you want to remove before deleting
        //     }
        // },
        // // Optionally project fields if needed
        // {
        //     $project: {
        //         // Project fields if needed
        //     }
        // }
   // ]);

   // using aggregation for simple delete operations like this can add unnecessary complexity and overhead. It's generally more straightforward and efficient to use findByIdAndDelete or similar methods for direct document deletion by ID.

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "comment deleted successfully")
    )
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