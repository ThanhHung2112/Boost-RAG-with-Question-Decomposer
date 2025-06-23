# RAGSY CHATBOT
![npm](https://img.shields.io/npm/v/npm.svg?style=for-the-badge)

![NPM](https://img.shields.io/npm/l/react-toastify.svg?label=%F0%9F%93%9Clicense&style=for-the-badge)

# Features
- Hỗ trợ thao tác gửi FILE PDF, Hyperlink.
- Tạo và quản lý nhiều cuộc trò chuyện độc lập, đáp ứng các mục đích sử dụng khác nhau.
- Dễ dàng thực hiện các tác vụ như gửi tin nhắn, File và Hyperlink.
- Hỗ trợ Markdown tin nhắn bot phản hồi.
- Hỗ trợ thực hiện Drop and Drag File PDF.
- Xem file PDF trực tiếp bên trong cuộc hội thoại

# Demos

# Technical Stack

# Getting Started
## Installation

### Install Dependencies
```
npm install
````
### Run Dev
```
npm run dev
```
### Run build
```
npm run build
```
### Run Product
```
npm run start
```
### Format code and check error
```
npm run lint
```
### Enviroment Setup
- Tạo tệp .env trong thư mục gốc của dự án và cấu hình các biến theo mục (Setup Environment)
- Tham chiếu các mẫu từ .env,example
### Troubleshooting
- Xóa thư mục node_modules và thực thi npm i nếu lỗi xung đôt hoặc lỗi dependency
- Xóa cache nếu gặp vấn đề cài đặt
```
npm cache clean --force
```
### Requirements
- Node.js phiên bản > 16
- Khơi tạo các key cần thiết
## Configruration
### Environment Configruration

| **.env Value**                | **Type** | **Description**                                                                 |
|-----------------------------|------------------|---------------------------------------------------------------------------|
| `NEXT_PUBLIC_VERSION_APP`   | String           | Phiên bản hiện tại.                                         |
| `NEXT_UV_THREADPOOL_SIZE`   | Integer          | Kích thước của thread pool dùng cho các tác vụ I/O trong Node.js.        |
| `NEXT_PUBLIC_APP_NAME`      | String           | Tên hiển thị                                             |
| `NEXT_PUBLIC_APP_KEY`       | String           | Khóa ứng dụng để xác thực hoặc mã hóa các dữ liệu quan trọng.(Hiện tại được sử dụng là key quản lý Queue ở Redis)            |

### Key Session App

| **.env Value**                         | **Type** | **Description**                                                                    |
|--------------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_KEY_SESSION_PDF`        | String           | Key session lưu trữ tạm đối tượng file PDF                                                 |
| `NEXT_PUBLIC_KEY_SESSION_HYPERLINK`  | String           | Key session lưu trữ tạm đối tượng Hyperlink                                                 |
| `NEXT_PUBLIC_KEY_SESSION_JOB`        | String           | Key session lưu trữ tạm ID Queue                                             |
| `NEXT_PUBLIC_KEY_SESSION_MESSAGE`    | String           | Key session lưu trữ tạm đối tượng tin nhắn.                                                 |

### Redis
| **.env Value**                         | **Type** | **Description**                                                                       |
|-----------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_NAME_SERVICE`  | String           | Tên của dịch vụ Redis.                                                       |
| `NEXT_PUBLIC_REDIS_URL`     | String           | Địa chỉ URL của Redis.                                                       |
| `NEXT_PUBLIC_REDIS_PORT`    | Integer          | Cổng của Redis. 

### API APP

| **.env Value**                         | **Type** | **Description**                                                                    |
|---------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_VERSION_API`       | String           | Phiên bản API.                                                               |
| `NEXT_PUBLIC_CHAT_APP`          | String           | URL của ứng dụng chat.                                                       |
| `NEXT_PUBLIC_API_URL`           | String           | URL API gốc.                                                                 |
| `NEXT_PUBLIC_API_APP_URL`       | String           | URL API của ứng dụng.                                                        |
| `NEXT_PUBLIC_CHAT_HISTORY`      | String           | URL API để lấy lịch sử chatbot.                                              |

### Service Chatbot

| **.env Value**                         | **Type** | **Description**                                                                    |
|--------------------------------------------|------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_SERVICE_CHATBOT`          | String           | URL API của dịch vụ Chatbot.                                                 |
| `NEXT_PUBLIC_SERVICE_CHATBOT`              | String           | URL gốc của dịch vụ Chatbot.                                                 |
| `NEXT_PUBLIC_SERVICE_GET_CONVERSATION_NAME`| String           | Endpoint để lấy tên cuộc trò chuyện.                                         |
| `NEXT_PUBLIC_SERVICE_POST_INDEX_PDF`       | String           | Endpoint để indexing file PDF                                 |
| `NEXT_PUBLIC_SERVICE_GET_INDEX_PDF_STATUS` | String           | Endpoint để lấy trạng thái indexing file PDF                     |
| `NEXT_PUBLIC_SERVICE_POST_INDEX_DATA_PRIORITY`| String        | Endpoint để gửi dữ liệu để thực hiện indexing                                 |
| `NEXT_PUBLIC_SERVICE_REMOVE_DOCUMENT`      | String           | Endpoint để xóa tài liệu.                                                    |
| `NEXT_PUBLIC_SERVICE_GET_RESPONSE`         | String           | Endpoint để lấy phản hồi từ Chatbot.                                         |

## DIRECTORY STRUCTOR
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
└── untils
```

| **Name directory** | **Description**                                                                          |
|---------------------|------------------------------------------------------------------------------------------|
| `app`              | Thư mục chính chứa các file hoặc module liên quan, route, api  |
| `components`       | Chứa các thành phần giao diện (UI components) được sử dụng lại           |
| `constants`        | Chứa các hằng số (constants) được sử dụng trong ứng dụng, như API endpoints hoặc config. |
| `contexts`         | Chứa các tệp liên quan đến Context API, giúp quản lý trạng thái |
| `docs`             | Chứa tài liệu hoặc ghi chú liên quan đến dự án.                                          |
| `hooks`            | Chứa các custom hooks (React hooks) được tái sử dụng                    |
| `interfaces`       | Chứa định nghĩa giao diện hoặc kiểu dữ liệu (TypeScript interfaces).                     |
| `public`           | Chứa các file tĩnh như hình ảnh, favicon, hoặc các file có thể truy cập công khai.       |
| `lib`              | Chứa các thư viện hoặc helper functions được sử dụng                     |
| `services`         | N.A                       |
| `shared`           | Chứa các tài nguyên hoặc code được dùng chung giữa nhiều phần             |
| `states`           | Chứa các file liên quan đến quản lý trạng thái như Session hoặc Redux           |
| `storage`          | Lưu trữ các file ảnh, video, file csv, database tạm thời.     |
| `styles`           | Chứa các file CSS, animations                                 |
| `types`            | Chứa các kiểu dữ liệu hoặc định nghĩa kiểu dữ liệu             |
| `utils`            | Chứa các file helper hoặc các hàm tiện ích             |

# DATABASE
## STORAGE STRUCTOR
Storage là nơi quản lý dữ liệu các cuộc hội thoại, tin nhắn, File PDF, Hyperlink và temporary (bộ nhớ tạm file).
## DEFINITIONS
### Storage / Temporary
#### File temp_docs
Khi tải một tệp lên, hệ thống sẽ tự động lưu trữ tệp đó dưới định dạng CSV vào thư mục temp_docs trước khi thực hiện tiến trình xử lý tiếp theo.

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi tệp |
| `originalName` | Tên gốc của file người dùng tải lên  |
| `pathName` | Đường dẫn lưu vị trí của File trên server -> storage |
| `type` | Loại file được tải lên |
| `size` | Kích thước của File được tải lên |
| `createdTime` | Thời gian File được tải lên thành công lưu vào server |

#### File temp_hyperlinks
Khi tải một tệp lên, hệ thống sẽ tự động lưu trữ tệp đó dưới định dạng CSV vào thư mục temp_hyperlinks trước khi thực hiện tiến trình xử lý tiếp theo.

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi File PDF tải lên |
| `title` | Title được crawler từ title web được indexing nếu web nào không có title thì sẽ link làm title  |
| `link` | Lưu lại Hyperlink gửi lên server thực hiện indexing |
| `createdTime` | Thời gian File được tải lên thành công lưu vào server |

### Storage / history_hyperlinks
#### File history_hyperlinks

Thư mục history_hyperlinks thực hiện lưu trữ lại các hyperlinks được tải lên. Và Id cuộc hội thoại là tên file dùng để lưu trữ bảng ghi tải hyperlinks lên server.

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi Hyperlink tải lên |
| `conversationId` | Title được crawler từ title web được indexing nếu web nào không có title thì sẽ link làm title  |
| `title` | Title được crawler từ title web được indexing nếu web nào không có title thì sẽ link làm title |
| `link` | Lưu lại Hyperlink gửi lên server thực hiện indexing |
| `createdTime` | Thời gian Hyperlink được tải lên thành công lưu vào server |

### Storage / history_files
#### File history_files

Thư mục history_files thực hiện lưu trữ lại File được tải lên cuộc hội thoại đó. Và Id cuộc hội thoại là tên file dùng để lưu trữ bảng ghi tải file lên server.

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi tệp |
| `originalName` | Tên gốc của file người dùng tải lên  |
| `pathName` | Đường dẫn lưu vị trí của File trên server -> storage |
| `type` | Loại file được tải lên |
| `size` | Kích thước của File được tải lên |
| `createdTime` | Thời gian File được tải lên thành công lưu vào server |

### Storage / conversations
#### File db_conversations

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi cuộc hội thoại |
| `conversationName` | Tên mỗi cuộc hội thoại khi tạo cuộc hội thoại thành công  |
| `createdTime` | Thời gian tạo cuộc hội thoại |

### Storage / chat_history

Trong thư mục chat_history dùng để lưu trữ nội dung của các cuộc trò chuyện. Định danh các tên file lưu trữ nội dung cuộc hội thoại dựa được trên ID cuộc hội thoại được tạo.

| **Fileds (columns)** | **Description** |
|---------------------|------------------------------------------------------------------------------------------|
| `id` | Id duy nhất cho mỗi đoạn chat thuộc đoạn hội thoại |
| `conversationId` | Id đoạn của cuộc hội thoại |
| `context` | Nội dung câu chat |
| `sender` | Loại người thực hiện gửi tin nhắn "CLIENT" là người gửi, "BOT" là phản hồi của bot |
| `createdTime` | Thời gian gửi tin nhắn |
