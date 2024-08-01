import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({

    videoFile: {
        type: {
            url: String,
            public_id: String,
        },
        required: true,      
    },
    thumbnail:{
        type:{
            url: String,// a good approach
            public_id: String,
        },
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type:Schema.Types.ObjectId,
        ref: "User",
    },
    
},{ timestamps: true});


videoSchema.plugin(mongooseAggregatePaginate);

//The mongooseAggregatePaginate plugin is likely designed to add pagination support to MongoDB aggregation queries in Mongoose. Pagination is a technique used to break down a large set of data into smaller, manageable chunks or pages.



export const Video = mongoose.model("Video" , videoSchema);
