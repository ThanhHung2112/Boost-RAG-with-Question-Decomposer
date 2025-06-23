# RAGSY CHATBOT
![npm](https://img.shields.io/npm/v/npm.svg?style=for-the-badge)

![NPM](https://img.shields.io/npm/l/react-toastify.svg?label=%F0%9F%93%9Clicense&style=for-the-badge)

# Features
- Support for sending PDF files and hyperlinks.
- Create and manage multiple independent conversations for different purposes.
- Easy execution of tasks like sending messages, files, and hyperlinks.
- Support for Markdown in bot response messages.
- Support for drag and drop PDF files.
- View PDF files directly within the conversation

# Getting Started
## Installation

### Install Dependencies
```
npm install
```
### Run Dev
```
npm run dev
```
### Run Build
```
npm run build
```
### Run Production
```
npm run start
```
### Format Code and Check Errors
```
npm run lint
```
### Environment Setup
- Create a .env file in the project root directory and configure variables according to the (Setup Environment) section
- Reference templates from .env.example
### Troubleshooting
- Delete the node_modules folder and run npm i if encountering conflicts or dependency errors
- Clear cache if installation issues occur
```
npm cache clean --force
```
### Requirements
- Node.js version > 16
- Initialize necessary keys
## Configuration
### Environment Configuration

| **.env Value**                | **Type** | **Description**                                                                 |
|-----------------------------|------------------|---------------------------------------------------------------------------|
| `NEXT_PUBLIC_VERSION_APP`   | String           | Current version.                                         |
| `NEXT_UV_THREADPOOL_SIZE`   | Integer          | Size of the thread pool used for I/O tasks in Node.js.        |
| `NEXT_PUBLIC_APP_NAME`      | String           | Display name                                             |
| `NEXT_PUBLIC_APP_KEY`       | String           | Application key for authentication or encryption of important data (Currently used as Redis Queue management key)            |

### Key Session App

| **.env Value**                         | **Type** | **Description**                                                                    |
|--------------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_KEY_SESSION_PDF`        | String           | Session key for temporary storage of PDF file objects                                                 |
| `NEXT_PUBLIC_KEY_SESSION_HYPERLINK`  | String           | Session key for temporary storage of hyperlink objects                                                 |
| `NEXT_PUBLIC_KEY_SESSION_JOB`        | String           | Session key for temporary storage of Queue ID                                             |
| `NEXT_PUBLIC_KEY_SESSION_MESSAGE`    | String           | Session key for temporary storage of message objects                                                 |

### Redis
| **.env Value**                         | **Type** | **Description**                                                                       |
|-----------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_NAME_SERVICE`  | String           | Name of the Redis service.                                                       |
| `NEXT_PUBLIC_REDIS_URL`     | String           | Redis URL address.                                                       |
| `NEXT_PUBLIC_REDIS_PORT`    | Integer          | Redis port. 

### API APP

| **.env Value**                         | **Type** | **Description**                                                                    |
|---------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_VERSION_API`       | String           | API version.                                                               |
| `NEXT_PUBLIC_CHAT_APP`          | String           | Chat application URL.                                                       |
| `NEXT_PUBLIC_API_URL`           | String           | Base API URL.                                                                 |
| `NEXT_PUBLIC_API_APP_URL`       | String           | Application API URL.                                                        |
| `NEXT_PUBLIC_CHAT_HISTORY`      | String           | API URL for retrieving chatbot history.                                              |

### Service Chatbot

| **.env Value**                         | **Type** | **Description**                                                                    |
|--------------------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_SERVICE_CHATBOT`          | String           | Chatbot service API URL.                                                 |
| `NEXT_PUBLIC_SERVICE_CHATBOT`              | String           | Base URL of the Chatbot service.                                                 |
| `NEXT_PUBLIC_SERVICE_GET_CONVERSATION_NAME`| String           | Endpoint for retrieving conversation names.                                         |
| `NEXT_PUBLIC_SERVICE_POST_INDEX_PDF`       | String           | Endpoint for PDF file indexing                                 |
| `NEXT_PUBLIC_SERVICE_GET_INDEX_PDF_STATUS` | String           | Endpoint for retrieving PDF file indexing status                     |
| `NEXT_PUBLIC_SERVICE_POST_INDEX_DATA_PRIORITY`| String        | Endpoint for sending data for indexing execution                                 |
| `NEXT_PUBLIC_SERVICE_REMOVE_DOCUMENT`      | String           | Endpoint for document removal.                                                    |
| `NEXT_PUBLIC_SERVICE_GET_RESPONSE`         | String           | Endpoint for retrieving responses from Chatbot.                                         |

## DIRECTORY STRUCTURE
### The Root Directory
```
.
├── app
├── components
├── constants
├── contexts
├── docs
├── hooks
├── interfaces
├── public
├── lib
├── services
├── shared
├── states
├── storage
├── styles
├── types
└── utils
```

| **Name directory** | **Description**                                                                          |
|---------------------|------------------------------------------------------------------------------------------|
| `app`              | Main directory containing related files or modules, routes, APIs  |
| `components`       | Contains UI components that are reused           |
| `constants`        | Contains constants used in the application, such as API endpoints or config. |
| `contexts`         | Contains files related to Context API for state management |
| `docs`             | Contains documentation or notes related to the project.                                          |
| `hooks`            | Contains custom hooks (React hooks) that are reused                    |
| `interfaces`       | Contains interface definitions or data types (TypeScript interfaces).                     |
| `public`           | Contains static files like images, favicon, or publicly accessible files.       |
| `lib`              | Contains libraries or helper functions being used                     |
| `services`         | N/A                       |
| `shared`           | Contains resources or code shared between multiple parts             |
| `states`           | Contains files related to state management like Session or Redux           |
| `storage`          | Stores images, videos, CSV files, temporary databases.     |
| `styles`           | Contains CSS files, animations                                 |
| `types`            | Contains data types or data type definitions             |
| `utils`            | Contains helper files or utility functions             |

# DATABASE
## STORAGE STRUCTURE
Storage is where conversation data, messages, PDF files, hyperlinks, and temporary (temporary file memory) are managed.
## DEFINITIONS
### Storage / Temporary
#### File temp_docs
When a file is uploaded, the system will automatically store the file in CSV format in the temp_docs folder before proceeding with further processing.

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each file |
| `originalName` | Original name of the file uploaded by the user  |
| `pathName` | Storage path location of the file on server -> storage |
| `type` | Type of file uploaded |
| `size` | Size of the uploaded file |
| `createdTime` | Time when the file was successfully uploaded and saved to server |

#### File temp_hyperlinks
When a file is uploaded, the system will automatically store the file in CSV format in the temp_hyperlinks folder before proceeding with further processing.

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each uploaded PDF file |
| `title` | Title crawled from the web title being indexed; if a web page has no title, the link will be used as the title  |
| `link` | Stores the hyperlink sent to the server for indexing |
| `createdTime` | Time when the file was successfully uploaded and saved to server |

### Storage / history_hyperlinks
#### File history_hyperlinks

The history_hyperlinks directory stores uploaded hyperlinks. The conversation ID serves as the filename used to store the record of hyperlinks uploaded to the server.

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each uploaded hyperlink |
| `conversationId` | Conversation ID |
| `title` | Title crawled from the web title being indexed; if a web page has no title, the link will be used as the title |
| `link` | Stores the hyperlink sent to the server for indexing |
| `createdTime` | Time when the hyperlink was successfully uploaded and saved to server |

### Storage / history_files
#### File history_files

The history_files directory stores files uploaded to that conversation. The conversation ID serves as the filename used to store the record of files uploaded to the server.

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each file |
| `originalName` | Original name of the file uploaded by the user  |
| `pathName` | Storage path location of the file on server -> storage |
| `type` | Type of file uploaded |
| `size` | Size of the uploaded file |
| `createdTime` | Time when the file was successfully uploaded and saved to server |

### Storage / conversations
#### File db_conversations

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each conversation |
| `conversationName` | Name of each conversation when the conversation is successfully created  |
| `createdTime` | Time when the conversation was created |

### Storage / chat_history

The chat_history directory is used to store the content of conversations. File names storing conversation content are identified based on the conversation ID that was created.

| **Fields (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Unique ID for each chat segment belonging to the conversation |
| `conversationId` | ID of the conversation |
| `context` | Content of the chat message |
| `sender` | Type of message sender: "CLIENT" is the sender, "BOT" is the bot's response |
| `createdTime` | Time when the message was sent |
