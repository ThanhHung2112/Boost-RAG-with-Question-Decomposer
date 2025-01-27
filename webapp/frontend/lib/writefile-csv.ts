// // import * as fs from 'fs';
// import path from 'path';
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// interface Messenger {
//     id: string
//     userId: string,
//     context: string,
//     sender: string,
//     createdTime: string,
// };

// export const WriteCSV = (data: Messenger) => {
//     const { userId } = data;

//     const directoryPath = path.join(process.cwd(), 'storage/app/private/chat_history');
//     const filePath = path.join(directoryPath, `${userId}.csv`);

//     // const fileExists = fs.existsSync(filePath);

//     let isAppend = false;
//     // if (fileExists) isAppend = true;

//     const csvWriter = createCsvWriter({
//         path: filePath,
//         header: [
//             { id: 'id', title: 'id' },
//             { id: 'userId', title: 'userId' },
//             { id: 'context', title: 'context' },
//             { id: 'sender', title: 'sender' },
//             { id: 'createdTime', title: 'createdTime' },
//         ],
//         append: isAppend
//     });

//     const records = [
//         { ...data }
//     ];

//     csvWriter.writeRecords(records)
//         .then(() => {
//             console.log('...Done');
//         });
// };
