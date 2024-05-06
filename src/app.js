import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();

app.use( cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    // explore all .use()
}) )


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit: "16kb"}))
app.use(express.static("public"));
app.use(cookieParser());// to get access and set cookies of the client's browser


export { app };





//CORS stands for Cross-Origin Resource Sharing, and it's a security feature implemented by web browsers to restrict web pages from making requests to a different domain (origin) than the one that served the web page.

//CORS is a security feature that allows servers to control which origins are allowed to access their resources. It's an essential aspect of modern web development, especially when building client-server applications or consuming APIs from different domains. Properly understanding and implementing CORS is crucial for ensuring the security and functionality of web applications.

//"Parse" refers to the process of analyzing a string of characters or data and interpreting its components according to a specific set of rules or syntax.


//Cookies are small pieces of data stored in the client's web browser. They are commonly used for various purposes in web development, such as session management, user authentication, and tracking user preferences.

//Cookies are sent by the server to the client's browser via HTTP response headers. Once stored in the browser, cookies are automatically included in subsequent HTTP requests to the same domain. This allows servers to retrieve and manipulate cookie data on subsequent requests.

//In Express.js, you can use middleware like cookie-parser to parse cookies sent by the client and make them available in the request object (req.cookies). This makes it easy to work with cookies in your Express.js applications.

//Parsing often involves breaking down a string of characters into its individual components, such as words, symbols, or data values. This process can include tasks like separating words in a sentence, extracting numbers from a string, or identifying specific patterns or structures within the string.

//Overall, parsing is a fundamental concept in computer science and programming, enabling software to understand and process structured data and instructions according to predefined rules or specifications.







