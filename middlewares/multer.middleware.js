import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,"./public/temp")
    },

    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }

})
  
export const upload = multer({
  storage,
});

//Multer allows you to specify how files should be stored. Here, diskStorage is used to store files on the disk.

//In the destination function, it specifies the directory where uploaded files should be stored. In this case, it's "./public/temp".

//In the filename function, it determines the name of the uploaded file. Here, it's set to the original name of the file being uploaded.

//destination,filename  are just keys in the object we can define any name as per our wish.

// req:  The req object represents the HTTP request made by the client to the server. It includes various information about the request, such as headers, query parameters, form data, and files being uploaded. The multer middleware intercepts this request and parses the uploaded files, making them available for processing.

//file: The file object represents an individual file being uploaded by the client. It contains metadata and properties about the uploaded file, such as its fieldname, original filename, encoding, mimetype, and size. The multer middleware parses the uploaded files and provides this file object as a parameter to functions within the diskStorage configuration, such as the destination and filename functions.




//In summary, req and file originate from the client's HTTP request. The req object represents the entire request, while the file object represents a specific file being uploaded within that request.
