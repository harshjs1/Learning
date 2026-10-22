import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret:CLOUDINARY_API_SECRET
});

const uploadonCloudinary=async (file, folder)=>{
    try{
        if(!localFileExists(file)){
            throw new Error("File does not exist")
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"       
        })
        return response
    }
    catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}