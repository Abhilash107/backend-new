import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";


const userSchema = new Schema({
    username:{
        type:String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
        index: true,//for searching
    },
    email:{
        type:String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },
    fullName:{
        type:String,
        required: true,
        trim: true,
        index: true,//for searching
    },
    avatar:{
        type:String,
        required: true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type:String,
        required: [true, 'password is required'],
    },
    refreshToken: {
        type: String,
    }

}, {timestamps: true})

userSchema.pre("save" , async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)  
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
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


export const User = mongoose.model("User" , userSchema)

// bcrypt: bcrypt is a library used for hashing passwords in a secure and irreversible way. It's particularly popular in Node.js applications for securely storing user passwords in databases.

//bcrypt.hash() is used to hash a plaintext password before storing it in the database.

//bcrypt.compare() is used to compare a plaintext password provided during login with the hashed password retrieved from the database

//JSON Web Tokens (JWT) are a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are typically used to provide information about an authenticated user or to grant access to specific resources. JWTs are commonly used for authentication and authorization in web applications.

//For example, after a user logs in to a web application, the server may issue a JWT containing the user's ID and other relevant information. The client then includes this JWT in subsequent requests to the server to access protected resources. The server can verify the JWT to ensure that the user is authenticated and has the necessary permissions to access the requested resources.

//userSchema.pre("save", async function(next) { ... }): This line sets up a pre-save hook for the save operation on the userSchema. This means the function inside the block will be executed before saving a user document.
//if (!this.isModified("password")) { return next() }: This line checks if the password field of the user document has been modified. If it hasn't (meaning the password hasn't changed), the function calls next() to proceed to the next middleware or the save operation.
//this.password = bcrypt.hash(this.password, 10): If the password has been modified, this line hashes the password using bcrypt with a salt round of 10. Bcrypt is a library for securely hashing passwords. The result is then assigned back to the password field of the user document.
//next(): Finally, this line calls next() to proceed to the next middleware or the save operation, indicating that this middleware function has completed its task.  In summary, this code ensures that whenever a user document is about to be saved to the database, it hashes the password if it has been modified, using bcrypt, before proceeding with the save operation.


//userSchema.methods.isPasswordCorrect = async function(password) { ... }: This line adds a custom method called isPasswordCorrect to the userSchema. This method takes a password parameter that will be compared with the hashed password stored in the user document.
//return await bcrypt.compare(password, this.password): Inside the method, it uses bcrypt.compare() to compare the provided password with the hashed password stored in the user document (this.password).
//bcrypt.compare() asynchronously compares the provided password with the hashed password. It returns a Promise that resolves to true if the passwords match, and false otherwise.
//The async keyword is used before the function definition, indicating that the function returns a Promise. The await keyword is used before bcrypt.compare() to wait for the comparison operation to complete and return the result   In summary, this method allows you to check if a provided password matches the hashed password stored in a user document. It's typically used during the authentication process to verify if a user-entered password is correct
