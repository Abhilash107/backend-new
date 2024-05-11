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


5. MongoDB

MongoDB pipelines are used with the aggregation framework, which allows you to process data records and return computed results. A pipeline consists of stages, and each stage transforms the documents as they pass through it.

$match: This stage filters the documents based on specified criteria, similar to the find method. It's often used to narrow down the documents to only those that meet certain conditions.

$project: This stage reshapes the documents by including, excluding, or renaming fields. It's useful for creating new fields, extracting parts of existing fields, or removing unnecessary fields.

$group: This stage groups documents by a specified key and performs aggregation operations on the grouped data, such as counting the number of documents in each group, calculating the sum of a field's values, or finding the maximum or minimum value within each group.

$sort: This stage sorts the documents based on specified fields and sort orders.

$limit: This stage limits the number of documents passed to the next stage in the pipeline.

$skip: This stage skips a specified number of documents and passes the remaining documents to the next stage in the pipeline.

$unwind: This stage deconstructs an array field from the input documents and outputs one document for each element in the array. It's often used when you need to perform operations on array elements individually.

$lookup: This stage performs a left outer join between documents from the input collection and documents from another collection based on a specified condition. It's useful for combining data from multiple collections.

--->  
$cond:  
The $cond operator in MongoDB's aggregation framework is a conditional operator that evaluates a boolean expression and returns one of two specified values based on whether the expression is true or false.

{
  $cond: {
    if: <boolean_expression>,
    then: <value_if_true>,
    else: <value_if_false>
  }
}

