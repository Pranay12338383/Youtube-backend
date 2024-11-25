import { asyncHandler }  from "../utils/asyncHandlers.js" 

import { ApiError } from "../utils/apiError.js"

import { User } from "../models/user.model.js"

import { upLodOnCloudinary } from "../utils/cloudinary.js"

import { ApiResponse } from "../utils/ApiResponse.js"

// below functin will register user

const registerUser = asyncHandler( async (req , res) => {
   
    // steps
    // 1 get user details from frontend
    // 2 validation - not empty
    // 3 check user is already exits: email, username
    // 4 check for images , check for avatar
    // 5 upload to cloudinary , again check avatar
    // 6 create user object  - create entry in db
    // 7 remove password and refresh token field from response 
    // 8 check for user creation 
    // 9 if yes then return response or send error
    
    
    const {fullName , email , username , password} = req.body
    console.log("email:" ,email);

    // this is step 2
    // for this import Api error 
    if(
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")       
    ) {
           throw new ApiError(400 , "All fields are required") 
      }
        
    // this is step 3 
    // for this import User from models
    const existedUser = User.findOne({
        $or: [{ username } , { email }]
    })
    if(existedUser){
        throw new ApiError(409 , "User with this name and email already exists")
    }

    // this is step 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    // this is step 5
    // for this import cloudinary from utils cloudinary.js
    const avatar = await upLodOnCloudinary(avatarLocalPath)
    const coverImage = await upLodOnCloudinary(coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    } 

    // this is step 6 
    // here only " User " is talking to database 
   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "" ,
        // means agar coverimage hai to uska url nikal lo warna empty rahen do
        email,
        password,
        username: username.toLowerCase()
    })
    
    // this is step 7
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"   
    )

    // this is step 8
    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    // this is step 9
     return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
     )

    
})

export {registerUser}