import {ApiError} from "../utils/apiError.js";
import {asyncHandler} from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {

   try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
    if(!token){
       throw new ApiError(401 , "Unauthorized request")
    }
   
    // verify jo method hai -> avaliable in mongodb(isiliye direct use kar liya )
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
   
    // agar refresh token mila gya hai decodedToken se to waha se _id le lo 
    // aur password aur refresh token ko select mat karo
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
    if(!user){
     throw new ApiError(401 , "Invalid Access Token")
    }
 
    req.user = user
    next()

   } catch (error) {
       throw new ApiError(401 , error?.message || "Invalid Access Token")
   }





})