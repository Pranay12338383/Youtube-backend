// making a rapper function , which we will use everywhere 
// this will make life easy
// Utility function
// Using promises

const asyncHandler = (requestHandler) => {

     (req , res , next) => {
        Promise.resolve(requestHandler(req , res , next))
        .catch((err) => next(err))

  }
}

export {asyncHandler}

// Using TRY - CATCH 


// const asyncHandler = (fn) => async ( req , res , next ) => {

//     try {
//            await fn( req , res , next )
//     }
//     catch ( error ){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message 
//         })
//     }
    
// }