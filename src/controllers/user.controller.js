import { asyncHandler } from "../utils/asyncHandler.js";
import{ApiError} from "../utils/ApiError.js"
import {User, user} from "../models/user.model.js"

import {uploadonnCloudinary} from "../utils/cloudinary.js"
import{ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { trusted } from "mongoose";

const generateAccessAndRefreshToken = async(userId){
    try{
        const user = await user.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
    }
    catch(error){
        throw new ApiError(500, "Error generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    const { fullname, email, username, password } = req.body;
    console.log(fullname, email, username, password)
 
    if(fullname == "" || email == "" || username == "" || password == "") {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await user.findOne({ 
        $or: [{username}, {email}}]
    })

   if(existedUser){
    throw new ApiError(400, "User already exists");
   }

   const avatarLocalPath= req.files?.avatar[0]?.path;
   req.files?.coverImages[0]?.path;

   if(!avatarLocalPath || !coverImagesLocalPath){
    throw new ApiError(400, "Avatar and cover image are required");
   }

   const avatar= await uploadonCloudinary(avatarLocalPath, "avatars")
   const coverImage=await uploadonCloudinary(coverImagesLocalPath, "coverImages")
   if(!avatar){
    throw new ApiError(500, "Avatar is Required");
   }

   user.user=await user.create({
     fullname,  
     avatar: avatar.url,
     coverImage: coverImage.url || "",
     email,
     username=username.toLowerCase(),
     password
   })

   const loginUser =asyncHandler(async (req, res) => {
    const { email,username, password } = req.body;
    if (!email || !username) {
      throw new ApiError(400, "Email or userName are required");
    }
    const user = await User.findOne({
        $or: [{ email }, { username }],
    })
    
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password - refreshToken);

    const options = {
      .statusCode: 200,
       .cookie: ("accessToken", accessToken, options)
       .cookie("refreshToken", refreshToken, options)
       .json(
        new ApiResponse(200, "User logged in successfully", {
          user: loggedInUser,
          accessToken,
          refreshToken,
        })

        "User Logged In Successfully"
       )
    };
});


const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }           

const refreshAccessToken=asyncHandler(async(req,res)) =>{
    const incomingRefreshToken=req.cookies.
    refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH.TOKEN.SECRET
    )

    const user= await User.findByID(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token");
    }

    if(incomingRefreshToken!=user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }
    const options={
        httpOnly: true,
        secure:true
    }
    const {accessToken, newrefreshToken}= await generateAccessAndRefreshToken(user._id)
    return res
    .status(200)
    .cookie("accessToken" , accessToken, options)
    .coookie("refreshToken", newrefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessTokken, refreshToken,newRefreshToken},
            "Access token refreshed"
        )
    )
    catch(error){
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

}

export { registerUser, loginUser, logoutUser };