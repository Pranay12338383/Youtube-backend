import { asyncHandler }  from "../utils/asyncHandlers.js" 
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
// import { upLodOnCloudinary } from "../utils/cloudinary.js"
import { upLodOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) =>{

    try {
      const user = await User.findById(userId)// will give access of user
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      // ab refresh token ko database me save kardo taki user ko baar 
      // baar login na krna ho 
      user.refreshToken = refreshToken
      await user.save(validateBeforeSave, false)

      return {accessToken , refreshToken}

    } catch(error){
          throw new ApiError(500 , "Something went wrong while generating access and refresh tokens " , error)
    }
} 

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
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")       
    ) {
           throw new ApiError(400 , "All fields are required") 
      }
        
    // this is step 3 
    // for this import User from models
    const existedUser = await  User.findOne({
        $or: [{ username } , { email }]
    })
    if(existedUser){
        throw new ApiError(409 , "User with this name and email already exists")
    }
    

    // this is step 4
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && 
                   req.files.coverImage.length > 0)
                   {
                      coverImageLocalPath = req.files.coverImage[0].path
                   }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    // this is step 5
    // for this import cloudinary from utils cloudinary.js
      const avatar = await upLodOnCloudinary(avatarLocalPath)
      const coverImage = await upLodOnCloudinary(coverImageLocalPath)
      if(!avatar) {
        throw new ApiError(400 , "Avatar file is Required")
      }

    // this is step 6 
    // here only " User " is talking to database 
   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "" ,
        // means agar coverImage hai to uska url nikal lo warna empty rahen do
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

const loginUser = asyncHandler( async(req , res) => {
       //req body -> data  le kar aao 
       // username or email 
       // find the user in the database
       // password check 
       // if password is right then ,
       // generate access and refresh tocken 
       // send cookies 
        
       // step 1 : req.body se data le kar aao 
       const{email , username , password} = req.body

       if( !(email || username) ) {
        throw new ApiError(400 , "username or email is required")
       }
       
       // find the user in the database
       const user = await User.findOne({
         $or: [{username } , {email}]
       })
       
       // if user is not found 
       if(!user){
        throw new ApiError(404 , "User  does not exist")
       }

       // if user found 
       // check password
       const isPasswordValid = await user.isPasswordCorrect(password)
       
       if(!isPasswordValid){
        throw new ApiError(401 , "Password is invalid")
       }
       
       // Now since the password is correct
       // we need to generate access and refresh token 
       // access and refresh token bahot jagah use hoge isiliye 
       // ek seperate method bana lete hai , har jagah wahi use kar lege

       // humko refresh aur access dono token mil gya hai ab 
       const{accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

       // cookies 
       const options = {
        // only server se modify kar skte ho frontend se nhi 
        // this will enhance security 
        httpOnly: true,
        secure: true
       }

       return res
       .status(200)
       .cookie("accessToken" , accessToken , options)
       .cookie("refreshToken" , refreshToken , options)
       .json(
        new ApiResponse(
            200 , {
                user: accessToken, refreshToken, 
            },
            "User Logged In Successfully"
        )
       )
})

const logoutUser =  asyncHandler(async (req , res) => {
       await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refeshToken: undefined
                }
            },
            {
                new: true
            }
         )

         const options = {
            httpOnly: true,
            secure: true
         }

         return res
         .status(200)
         .clearCookie("accessToken", options)
         .clearCookie("refreshToken", options)
         .json(new ApiResponse(200 , {} , "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req , res) => {
    // ek refresh token database me save hai 
    // aur ye wala refresh token jo hai wo cookies se aa rha hai  
    const incomingRefreshToken = await req.cookies.refeshToken || req.body.refreshToken // body uske liye jo mobile me use karega esko 

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized request")
    }
    
    // agar decode nhi karege to pata nhi chal payega ki uss
    // uss refresh token me kya hai , phir hum compare nhi kare
    // payege dono ko 
    // isiliye pahle jo token hai usko decode kar liya 
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
            
            //matlab ab hume uss user ka refresh token mil gya hai
            // aur uss refresh token ke andar , user ki _id bhi hai
        )
         
        // phir uss user ki ._id pata kar liya 
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 , "Invalid refresh token")
        }
    
        // aur ab compare karege incomingRefreshToken aur ye decoded
        // wala jo token hai 
    
        if(incomingRefreshToken !== user?.refeshToken){
            throw new ApiError(401 , "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200 , 
                {accessToken , refreshToken: newrefreshToken},
                "Access token refreshed successfully"          
            )
    )
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword , newPassword} = req.body
    
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old passwords ")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {} , "Password changed successfully"))




})

// jab user login hoga tab Current user ko fetch kaise karoge
const getCurrentUser = asyncHandler(async(req, res)=>{
   return res
   .status(200)
   .json(200 , req.user , "Current user has been fetched successfully")
})

const updateAccountDetail = asyncHandler(async(req, res)=>{
   const{fullName , email} = req.body

   if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
   }

    User.findByIdAndUpdate(
        req.user?._id,
       {
           $set:{
                 fullName,
                 email: email
           }
       },
       {new: true}
    ).select("-password") // bus password field hata do 

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account detail updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res)=>{

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file not found")
    }

    const avatar = await upLodOnCloudinary(avatarLocalPath)
     
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar ")
    }

    const user = await  User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                avatar: avatar.url
            }
        },{new: true}
    ).select("-password")
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file not found")
    }

    const coverImage = await upLodOnCloudinary(coverImageLocalPath)
     
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },{new: true}   
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated Successfully ")
    )


})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage
}

// export {loginUser}
// export {logoutUser}