import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        // customers,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        //customers subscribe to the channel 
        ref: "User"

    }


}
,{timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)