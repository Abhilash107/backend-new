import {v2 as cloudinary} from "cloudinary";
import { response } from "express";
import fs from "fs";


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        } )
        //file has been uplaoded successfully
        console.log("File is uploaded on clodinary");
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        //removes the locally saved temp file as the upload operation got failed   
        
        
        
    }
}

