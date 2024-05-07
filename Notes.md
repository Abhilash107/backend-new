1. Access Token:
An access token is a credential used by an application to access protected resources on behalf of a user.
It is issued by the authorization server after the user successfully authenticates and authorizes the application.
Access tokens are typically <b>short-lived</b> and have limited scope, meaning they only grant access to specific resources for a limited time.
They are used in API requests to authenticate the user and authorize access to the requested resources.


2. Refresh Token:
A refresh token is a credential used to obtain a new access token after the current access token expires.
Unlike access tokens, refresh tokens are typically long-lived and are stored securely on the client side.
When an access token expires, the client can use the refresh token to request a new access token without requiring the user to re-authenticate.
Refresh tokens are used to maintain continuous access to resources without requiring frequent user interaction for re-authentication.


3.Multer:
It is a popular middleware for handling file uploads in Node.js, particularly in web applications built using Express.js. It simplifies the process of handling multipart/form-data, which is typically used when uploading files through HTML forms.


4.fs: 
In Node.js, fs (File System) module provides functions to interact with the file system in a way similar to standard POSIX functions. It allows you to perform various operations on files and directories such as reading, writing, deleting, renaming, and modifying permissions.