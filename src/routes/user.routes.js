import { Router } from "express";
import { loginUser , registerUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js" 
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// jaise hi koi register pe request bhejega, waise hi registerUser 
// impliment hoga , lekin execute hone se pahle middleware se 
// milte hue jana 
// uske liye import karo upload from multer 
// aur "registerUser" se pahle middleware ko laga do
router.route("/register").post(
    upload.fields([
        // sice we are accepting two files , avatar and cover image
        // isiliye yaha pe 2 objects ayege
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
         );
    // router.post('/register', upload.fields([{ name: 'avatar' }, { name: 'coverImage' }]), (req, res) => {
   //  console.log('Request Files:', req.files);
  //     res.status(200).json({ files: req.files });
 //   });


 router.route("/login").post(loginUser)

 // secured routes
 // pahle verifyJWT karo uske baad logoutUser me chale jao 
 router.route("/logout").post(verifyJWT , logoutUser)

 router.route("/refresh-token").post(refreshAccessToken)







export default router                                                                                                                                                                                                                                                                                                                                                                                                                                                                       