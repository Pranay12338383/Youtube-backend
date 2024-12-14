import {v2 as cloudinary} from "cloudinary"

import fs from "fs"  // file system --> help to do manage file system

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
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            debug: true,
        })
        // now the file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlink(localFilePath)
        return response;  

    } catch (error) {
        fs.unlinkSync(localFilePath)

        return null;
    }
}

export {upLodOnCloudinary}
    
    