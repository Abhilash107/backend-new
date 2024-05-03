import dotenv from "dotenv";

import mongoose from "mongoose";

import {DB_NAME} from './constants.js';

import connectDB from "../db/index.js";

connectDB();


dotenv.config({
    path: './env'
})



/*
import express from "express";

const app = express();
// use try catch
// the db is always on different continent. it takes time


;{ async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on('error' , (error) => {
            console.log("Error: ", error);
            throw error;

        })

        app.listen(process.env.PORT, ()=> {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("error", error);
        throw error;
    }

} }{}
*/
