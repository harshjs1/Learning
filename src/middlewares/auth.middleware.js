import {ApiError} from "../utilities/ApiError";
import {asyncHandler} from "../utilities/asyncHandler";
import jwt from "jsonwebtoken"
import{User} from "../models/user.model"


export const verifyJWT= asyncHandler = (req, res, next) => {
    const token=req.cookies?.accessToken || req.header
    ("Authorization")?.replace("Bearer","")

    if(!token){
       throw new ApiError(401, "Unauthorized request") 
    }

    const decodedToken=jwt.verify(token,._id).select
    ("-password - refreshToken")

    if(!user){
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user=user;
    next()}
    catch(error){
        throw new ApiError(401,error?.message || "Invalid access token")
    }

