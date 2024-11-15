import mongoose , {mongo, Schema} from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcrypt"
import e from "express";


const userSchema = new Schema({
       
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
       
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,          
    },
       
    fullname: {
        type: String,
        required: true,
        trim: true,  
        index: true        
    },
       
    avatar: {
        type: String, // we will use Cloudinary URL
        required: true,
    },

    coverImage: {
        type: String,
    },

    watchHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Video"
        }
    ],

    password: {
        type: String,
        required: [true , 'Password is required']
    },

    refeshToken: {
        type: String
    }

  },

     {
        timestamps: true
     }

)


// This will encrypt the password 
userSchema.pre("save" , async  function (next) {
    
    // agar password modified nhi hua hai to next pe chale jao 
    if(!this.isModified("password")) return next();
    
    // warna password change kar do
    this.password = bcrypt.hash(this.password , 10)
    next();
    
})

// passwrod  - jo user enter karta hai wo hai
// this.password - bcrypt karne ke baad jo password milega wo hai ye

userSchema.methods.isPasswordCorrect = async function (password){

    return await bcrypt.compare(password , this.password)

}


userSchema.methods.generateAccessToken = function(){
     return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY 
        }
    )
}


userSchema.methods.generateRefreshToken = function(){
     return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY  
        }
    )
}



export const User = mongoose.model('User' , userSchema);