import { asyncHandler }  from "../utils/asyncHandlers.js" 

// below functin will register user

const registerUser = asyncHandler( async (req , res) => {
    res.status(200).json({
        message: "Pranay Singh"
    })
})

export {registerUser}