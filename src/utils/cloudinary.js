import {v2 as cloudinary} from "cloudinary"

import fs from "fs"  // file system --> help to do manage file system

import { v2 as cloudinary } from 'cloudinary';



// Configuration
 cloudinary.config({ 
        cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
        api_key: 'process.env.CLOUDINARY_API_KEY', 
        api_secret: 'process.env.CLOUDINARY_API_SECRET'
});


const upLodOnCloudinary =  async (localFilePath) => {

    try{
        if(!localFilePath) return null;

        //now next step is to upload the file on cloudinary 
        const response = awaitcloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // now the file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        return response;  

    } catch(error){

        fs.unlink(localFilePath)// will remove the locally saved 
        // temperory file as the upload got failed
        return null;
    }
}

export {upLodOnCloudinary}
    
    