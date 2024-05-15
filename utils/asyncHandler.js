import { Request, Response, NextFunction } from "express";

const asyncHandler = (reqHandler)=> {
    return (req, res, next)=>{
        Promise.resolve(reqHandler(req, res ,next))
        .catch( (err)=> next(err) );
    }


}

export { asyncHandler };


// const asyncHandler2 = (fn) => async (req, res, next)=>{
//     try {
//         await fn(req, res, next);
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: err.message,
//         });
        
//     }
// }


