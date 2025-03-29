// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { GoogleSpreadsheet } from 'google-spreadsheet';
// import { JWT } from 'google-auth-library';
// import axios from 'axios';
// import { MongoClient } from 'mongodb';
// import credentials from './obuvkawomenintegration-ce5d5ef3521a.json' assert { type: 'json' };

// const app = express();
// const port = process.env.PORT || 3000;

// // Разрешаем CORS (например, для http://127.0.0.1:5500)
// app.use(cors({ origin: 'http://127.0.0.1:5500' }));
// app.use(express.json());

// // Определяем путь к статическим файлам (интерфейс)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, 'public')));

// // -----------------------
// // Конфигурация Google Sheets и KeyCRM
// const GOOGLE_SHEET_ID = '1NHd9JVWQ7yriMVbavebqotFzdw0iexuRrI4sCY9p5kg';
// const keycrmUrlStock = "https://openapi.keycrm.app/v1/order";
// const keycrmToken = "NDUyZTNjNjk0OGM5NTc2YWYxNGIyN2YxYTIyYzM3YTQwMzUwNzQxZg";

// // Заголовки для данных из Sheets (порядок соответствует колонкам)
// const headers = [
//   "№", "AKR", "ттн", "Дата", "Артикул", "Товар", "р", "Артикул1",
//   "Товар1", "Размер", "Кол-во", "Цена", "Предоплата", "Ост", "3405,14",
//   "статус", "ФИО", "телеофн", "Источник", "Сотрудник", "никнейм", "Коммент", "№А"
// ];

// const serviceAccountAuth = new JWT({
//   email: credentials.client_email,
//   key: credentials.private_key,
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });
// const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

// // -----------------------
// // Конфигурация MongoDB
// const MONGODB_URI = 'mongodb+srv://salaryapp5:aM5DtXeMRklFosy5@cluster0.l1wfm.mongodb.net/test?retryWrites=true&w=majority';
// const DB_NAME = 'test';
// const PROGRESS_COLLECTION = 'progress';

// async function getMongoClient() {
//   const client = new MongoClient(MONGODB_URI, {
//     tls: true,
//   });
//   await client.connect();
//   return client;
// }

// async function getLastProcessedIndex(db) {
//   const progressDoc = await db.collection(PROGRESS_COLLECTION).findOne({ sheetId: GOOGLE_SHEET_ID });
//   if (progressDoc) return progressDoc.lastIndex || 0;
//   await db.collection(PROGRESS_COLLECTION).insertOne({ sheetId: GOOGLE_SHEET_ID, lastIndex: 0 });
//   return 0;
// }

// async function updateLastProcessedIndex(db, index) {
//   await db.collection(PROGRESS_COLLECTION).updateOne(
//     { sheetId: GOOGLE_SHEET_ID },
//     { $set: { lastIndex: index } }
//   );
// }

// async function updateOrder(orderId, data, originalPayload, logs) {
//   const updatePayload = {
//     buyer_comment: originalPayload.buyer_comment,
//     manager_comment: originalPayload.manager_comment,
//     status_id: parseInt(data["статус"]) || 0
//   };

//   try {
//     const updateUrl = `${keycrmUrlStock}/${orderId}`;
//     const updateResponse = await axios.put(updateUrl, updatePayload, {
//       headers: {
//         'Authorization': `Bearer ${keycrmToken}`,
//         'Content-Type': 'application/json'
//       },
//     });
//     logs.push({ event: "updateOrder", orderId, message: "Order updated successfully.", details: updateResponse.data });
//   } catch (error) {
//     const errMsg = error.response ? error.response.data : error.message;
//     logs.push({ event: "updateOrder", orderId, message: "Error updating order.", error: errMsg });
//   }
// }

// async function transferData() {
//   const logs = [];
//   const mongoClient = await getMongoClient();
//   const db = mongoClient.db(DB_NAME);

//   try {
//     await doc.loadInfo();
//     logs.push({ event: "loadInfo", message: `Loaded document: ${doc.title}` });
//     const sheet = doc.sheetsByIndex[0];
//     logs.push({ event: "sheetInfo", message: `Sheet: ${sheet.title} (Rows: ${sheet.rowCount})` });
//     const rows = await sheet.getRows();
//     const lastIndex = await getLastProcessedIndex(db);
//     logs.push({ event: "processingStart", message: `Starting processing from row index: ${lastIndex}` });

//     for (let i = lastIndex; i < rows.length; i++) {
//       const row = rows[i];
//       const data = {};
//       headers.forEach((header, index) => {
//         data[header] = row._rawData[index];
//       });
//       logs.push({ event: "processRow", row: i, data });

//       const payload = {
//         source_id: 1,
//         source_uuid: data["№"],
//         buyer: {
//           full_name: data["ФИО"],
//           phone: data["телеофн"],
//           email: ""
//         },
//         manager_comment: data["Сотрудник"],
//         buyer_comment: data["никнейм"],
//         shipping: {
//           delivery_service_id: 2,
//           tracking_code: data["ттн"]
//         },
//         products: [
//           {
//             sku: data["Артикул"],
//             name: data["Товар"],
//             price: parseFloat(data["р"].replace(',', '.')) || parseFloat(data["Цена"].replace(',', '.')),
//             quantity: parseInt(data["Кол-во"]),
//             properties: [
//               { name: "Размер", value: data["Размер"] },
//               { name: "Артикул1", value: data["Артикул1"] },
//               { name: "Товар1", value: data["Товар1"] }
//             ]
//           }
//         ],
//         custom_fields: [
//           {
//             uuid: "order_number",
//             value: data["№А"]
//           }
//         ]
//       };

//       try {
//         const createResponse = await axios.post(keycrmUrlStock, payload, {
//           headers: {
//             'Authorization': `Bearer ${keycrmToken}`,
//             'Content-Type': 'application/json'
//           },
//         });
//         logs.push({ event: "sendRow", row: i, message: "Row sent successfully.", response: createResponse.data });
//         const orderId = createResponse.data.id;
//         if (orderId) {
//           await updateOrder(orderId, data, payload, logs);
//         } else {
//           logs.push({ event: "sendRow", row: i, message: "Order not created, missing id in response." });
//         }
//       } catch (error) {
//         const errMsg = error.response ? error.response.data : error.message;
//         logs.push({ event: "sendRow", row: i, message: "Error sending row to KeyCRM.", error: errMsg });
//       }
//       await updateLastProcessedIndex(db, i + 1);
//     }
//   } catch (error) {
//     logs.push({ event: "transferData", message: "Error with Google Sheets.", error: error.message });
//   } finally {
//     await mongoClient.close();
//     logs.push({ event: "mongoClose", message: "MongoDB connection closed." });
//   }
//   return { success: true, logs };
// }

// // -----------------------
// // Планирование передачи данных

// // Переменная для хранения интервала (в минутах), по умолчанию 60
// let transferIntervalMinutes = 60;
// let transferIntervalId = null;
// // Флаг, указывающий, запущен ли скрипт
// let isRunning = true;

// function scheduleTransfer() {
//   if (transferIntervalId) clearInterval(transferIntervalId);
//   const intervalMs = transferIntervalMinutes * 60 * 1000;
//   transferIntervalId = setInterval(async () => {
//     if (isRunning) {
//       console.log(`Автоматический запуск передачи данных каждые ${transferIntervalMinutes} минут.`);
//       await transferData();
//     }
//   }, intervalMs);
//   console.log(`Скрипт передачи данных запланирован каждые ${transferIntervalMinutes} минут.`);
// }

// // Изначально запускаем планирование
// scheduleTransfer();

// // Эндпоинты для получения и обновления transferIntervalMinutes
// app.get('/transferInterval', (req, res) => {
//   res.json({ transferIntervalMinutes });
// });

// app.post('/transferInterval', (req, res) => {
//   const { transferInterval } = req.body;
//   if (transferInterval === undefined || isNaN(transferInterval)) {
//     return res.status(400).json({ error: "Некорректное значение интервала." });
//   }
//   transferIntervalMinutes = Number(transferInterval);
//   scheduleTransfer();
//   res.json({ success: true, transferIntervalMinutes });
// });

// // Эндпоинты для управления работой скрипта (пауза/возобновление)
// app.post('/pauseTransfer', (req, res) => {
//   isRunning = false;
//   res.json({ success: true, message: "Передача данных приостановлена." });
// });

// app.post('/resumeTransfer', (req, res) => {
//   isRunning = true;
//   res.json({ success: true, message: "Передача данных возобновлена." });
// });

// // Эндпоинты для lastIndex (как ранее)
// app.get('/lastIndex', async (req, res) => {
//   try {
//     const client = await getMongoClient();
//     const db = client.db(DB_NAME);
//     const lastIndex = await getLastProcessedIndex(db);
//     await client.close();
//     res.json({ lastIndex });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/lastIndex', async (req, res) => {
//   try {
//     const { lastIndex } = req.body;
//     if (lastIndex === undefined) {
//       return res.status(400).json({ error: "Не указан lastIndex" });
//     }
//     const client = await getMongoClient();
//     const db = client.db(DB_NAME);
//     await updateLastProcessedIndex(db, lastIndex);
//     await client.close();
//     res.json({ success: true, lastIndex });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Главная страница – отдаём интерфейс
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Эндпоинт для запуска передачи данных вручную
// app.post('/transfer', async (req, res) => {
//   try {
//     const result = await transferData();
//     result.logsFormatted = JSON.stringify(result.logs, null, 2);
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: 'Error transferring data' });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { GoogleSpreadsheet } from 'google-spreadsheet';
// import { JWT } from 'google-auth-library';
// import axios from 'axios';
// import { MongoClient } from 'mongodb';
// import credentials from './obuvkawomenintegration-ce5d5ef3521a.json' assert { type: 'json' };

// const app = express();
// const port = process.env.PORT || 3000;

// // Разрешаем CORS (например, для http://127.0.0.1:5500)
// app.use(cors({ origin: 'http://127.0.0.1:5500' }));
// app.use(express.json());

// // Определяем путь к статическим файлам (интерфейс)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, 'public')));

// // -----------------------
// // Конфигурация Google Sheets и KeyCRM
// const GOOGLE_SHEET_ID = '1NHd9JVWQ7yriMVbavebqotFzdw0iexuRrI4sCY9p5kg';
// const keycrmUrlStock = "https://openapi.keycrm.app/v1/order";
// const keycrmToken = "NDUyZTNjNjk0OGM5NTc2YWYxNGIyN2YxYTIyYzM3YTQwMzUwNzQxZg";

// // Заголовки для данных из Sheets (порядок соответствует колонкам)
// const headers = [
//   "№", "AKR", "ттн", "Дата", "Артикул", "Товар", "р", "Артикул1",
//   "Товар1", "Размер", "Кол-во", "Цена", "Предоплата", "Ост", "3405,14",
//   "статус", "ФИО", "телеофн", "Источник", "Сотрудник", "никнейм", "Коммент", "№А"
// ];

// const serviceAccountAuth = new JWT({
//   email: credentials.client_email,
//   key: credentials.private_key,
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });
// const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

// // -----------------------
// // Конфигурация MongoDB
// const MONGODB_URI = 'mongodb+srv://salaryapp5:aM5DtXeMRklFosy5@cluster0.l1wfm.mongodb.net/test?retryWrites=true&w=majority';
// const DB_NAME = 'test';
// const PROGRESS_COLLECTION = 'progress';

// async function getMongoClient() {
//   const client = new MongoClient(MONGODB_URI, {
//     tls: true,
//   });
//   await client.connect();
//   return client;
// }

// async function getLastProcessedIndex(db) {
//   const progressDoc = await db.collection(PROGRESS_COLLECTION).findOne({ sheetId: GOOGLE_SHEET_ID });
//   if (progressDoc) return progressDoc.lastIndex || 0;
//   await db.collection(PROGRESS_COLLECTION).insertOne({ sheetId: GOOGLE_SHEET_ID, lastIndex: 0 });
//   return 0;
// }

// async function updateLastProcessedIndex(db, index) {
//   await db.collection(PROGRESS_COLLECTION).updateOne(
//     { sheetId: GOOGLE_SHEET_ID },
//     { $set: { lastIndex: index } }
//   );
// }

// async function updateOrder(orderId, data, originalPayload, logs) {
//   const updatePayload = {
//     buyer_comment: originalPayload.buyer_comment,
//     manager_comment: originalPayload.manager_comment,
//     status_id: parseInt(data["статус"]) || 0
//   };

//   try {
//     const updateUrl = `${keycrmUrlStock}/${orderId}`;
//     const updateResponse = await axios.put(updateUrl, updatePayload, {
//       headers: {
//         'Authorization': `Bearer ${keycrmToken}`,
//         'Content-Type': 'application/json'
//       },
//     });
//     logs.push({ event: "updateOrder", orderId, message: "Order updated successfully.", details: updateResponse.data });
//   } catch (error) {
//     const errMsg = error.response ? error.response.data : error.message;
//     logs.push({ event: "updateOrder", orderId, message: "Error updating order.", error: errMsg });
//   }
// }

// async function transferData() {
//   const logs = [];
//   const mongoClient = await getMongoClient();
//   const db = mongoClient.db(DB_NAME);

//   try {
//     await doc.loadInfo();
//     logs.push({ event: "loadInfo", message: `Loaded document: ${doc.title}` });
//     const sheet = doc.sheetsByIndex[0];
//     logs.push({ event: "sheetInfo", message: `Sheet: ${sheet.title} (Rows: ${sheet.rowCount})` });
//     const rows = await sheet.getRows();
//     const lastIndex = await getLastProcessedIndex(db);
//     logs.push({ event: "processingStart", message: `Starting processing from row index: ${lastIndex}` });

//     for (let i = lastIndex; i < rows.length; i++) {
//       const row = rows[i];

//       // Получаем значение поля "Артикул" (находится в индексе 4, согласно массиву headers)
//       const artikul = row._rawData[4];

//       // Если поле "Артикул" пустое или отсутствует, прекращаем обработку строк
//       if (!artikul) {
//         logs.push({ event: "stopProcessing", row: i, message: "Поле 'Артикул' пустое. Прекращение обработки." });
//         break;
//       }

//       // Создаем объект data, заполняя его на основе headers
//       const data = {};
//       headers.forEach((header, index) => {
//         data[header] = row._rawData[index];
//       });
//       logs.push({ event: "processRow", row: i, data });

//       const prepayment = parseFloat((data["Предоплата"] || '').replace(',', '.'));
//       const ost = parseFloat((data["Ост"] || '').replace(',', '.'));

//       // Формируем массив платежей в зависимости от условий
//       const payments = [];

//       if (!isNaN(prepayment) && prepayment > 0) {
//         payments.push({
//           payment_method_id: 2,
//           payment_method: "Apple Pay",
//           amount: prepayment,
//           description: "Авансовий платіж",
//           payment_date: "2021-02-21 14:44:00", // можно заменить на актуальную дату
//           status: "paid"
//         });
//       }

//       if (!isNaN(ost) && ost > 0) {
//         payments.push({
//           payment_method_id: 2,
//           payment_method: "Apple Pay",
//           amount: ost,
//           description: "Остаток платежа",
//           payment_date: "2021-02-21 14:44:00", // можно заменить на актуальную дату
//           status: "not_paid"
//         });
//       }

//       const payload = {
//         source_id: 1,
//         source_uuid: data["№"],
//         buyer: {
//           full_name: data["ФИО"],
//           phone: data["телеофн"],
//           email: ""
//         },
//         manager_comment: data["Сотрудник"],
//         buyer_comment: data["никнейм"],
//         shipping: {
//           delivery_service_id: 2,
//           tracking_code: data["ттн"]
//         },
//         products: [
//           {
//             sku: data["Артикул"],
//             name: data["Товар"],
//             price: parseFloat(data["р"].replace(',', '.')) || parseFloat(data["Цена"].replace(',', '.')),
//             quantity: parseInt(data["Кол-во"]),
//             properties: [
//               { name: "Размер", value: data["Размер"] },
//               { name: "Артикул1", value: data["Артикул1"] },
//               { name: "Товар1", value: data["Товар1"] }
//             ]
//           }
//         ],
//         payments, // динамически сформированный массив платежей
//         custom_fields: [
//           {
//             uuid: "order_number",
//             value: data["№А"]
//           }
//         ]
//       };

//       try {
//         const createResponse = await axios.post(keycrmUrlStock, payload, {
//           headers: {
//             'Authorization': `Bearer ${keycrmToken}`,
//             'Content-Type': 'application/json'
//           },
//         });
//         logs.push({ event: "sendRow", row: i, message: "Row sent successfully.", response: createResponse.data });
//         const orderId = createResponse.data.id;
//         if (orderId) {
//           await updateOrder(orderId, data, payload, logs);
//         } else {
//           logs.push({ event: "sendRow", row: i, message: "Order not created, missing id in response." });
//         }
//       } catch (error) {
//         const errMsg = error.response ? error.response.data : error.message;
//         logs.push({ event: "sendRow", row: i, message: "Error sending row to KeyCRM.", error: errMsg });
//       }
//       await updateLastProcessedIndex(db, i + 1);
//     }
//   } catch (error) {
//     logs.push({ event: "transferData", message: "Error with Google Sheets.", error: error.message });
//   } finally {
//     await mongoClient.close();
//     logs.push({ event: "mongoClose", message: "MongoDB connection closed." });
//   }
//   return { success: true, logs };
// }

// // -----------------------
// // Планирование передачи данных

// // Переменная для хранения интервала (в минутах), по умолчанию 60
// let transferIntervalMinutes = 60;
// let transferIntervalId = null;
// // Флаг, указывающий, запущен ли скрипт
// let isRunning = true;

// function scheduleTransfer() {
//   if (transferIntervalId) clearInterval(transferIntervalId);
//   const intervalMs = transferIntervalMinutes * 60 * 1000;
//   transferIntervalId = setInterval(async () => {
//     if (isRunning) {
//       console.log(`Автоматический запуск передачи данных каждые ${transferIntervalMinutes} минут.`);
//       await transferData();
//     }
//   }, intervalMs);
//   console.log(`Скрипт передачи данных запланирован каждые ${transferIntervalMinutes} минут.`);
// }

// // Изначально запускаем планирование
// scheduleTransfer();

// // Эндпоинты для получения и обновления transferIntervalMinutes
// app.get('/transferInterval', (req, res) => {
//   res.json({ transferIntervalMinutes });
// });

// app.post('/transferInterval', (req, res) => {
//   const { transferInterval } = req.body;
//   if (transferInterval === undefined || isNaN(transferInterval)) {
//     return res.status(400).json({ error: "Некорректное значение интервала." });
//   }
//   transferIntervalMinutes = Number(transferInterval);
//   scheduleTransfer();
//   res.json({ success: true, transferIntervalMinutes });
// });

// // Эндпоинты для управления работой скрипта (пауза/возобновление)
// app.post('/pauseTransfer', (req, res) => {
//   isRunning = false;
//   res.json({ success: true, message: "Передача данных приостановлена." });
// });

// app.post('/resumeTransfer', (req, res) => {
//   isRunning = true;
//   res.json({ success: true, message: "Передача данных возобновлена." });
// });

// // Эндпоинты для lastIndex (как ранее)
// app.get('/lastIndex', async (req, res) => {
//   try {
//     const client = await getMongoClient();
//     const db = client.db(DB_NAME);
//     const lastIndex = await getLastProcessedIndex(db);
//     await client.close();
//     res.json({ lastIndex });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/lastIndex', async (req, res) => {
//   try {
//     const { lastIndex } = req.body;
//     if (lastIndex === undefined) {
//       return res.status(400).json({ error: "Не указан lastIndex" });
//     }
//     const client = await getMongoClient();
//     const db = client.db(DB_NAME);
//     await updateLastProcessedIndex(db, lastIndex);
//     await client.close();
//     res.json({ success: true, lastIndex });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Главная страница – отдаём интерфейс
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Эндпоинт для запуска передачи данных вручную
// app.post('/transfer', async (req, res) => {
//   try {
//     const result = await transferData();
//     result.logsFormatted = JSON.stringify(result.logs, null, 2);
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: 'Error transferring data' });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import axios from 'axios';
import { MongoClient } from 'mongodb';
import credentials from './obuvkawomenintegration-ce5d5ef3521a.json' assert { type: 'json' };

const app = express();
const port = process.env.PORT || 3000;

// Разрешаем CORS (например, для http://127.0.0.1:5500)
// app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(cors());

app.use(express.json());

// Определяем путь к статическим файлам (интерфейс)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------
// Конфигурация Google Sheets и KeyCRM
const GOOGLE_SHEET_ID = '1v3K90NUCZukJ8xhr_9YXfoDrxoe2qlxlQPdh29ONAF4';
const keycrmUrlStock = "https://openapi.keycrm.app/v1/order";
const keycrmToken = "OGM1YTM1MzA3ZTYzMDE0OTEwNDdlMGI2Mjg2NTlmMGFjMjU4YTE3OQ";

// Заголовки для данных из Sheets (порядок соответствует колонкам)
const headers = [
  "№", "AKR", "ттн", "Дата", "Артикул", "Товар", "р", "Артикул1",
  "Товар1", "Размер", "Кол-во", "Цена", "Предоплата", "Ост", "3405,14",
  "статус", "statusId", "ФИО", "телеофн", "Источник", "sourceId", "Сотрудник", "никнейм", "Коммент", "№А"
];

const serviceAccountAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

// -----------------------
// Конфигурация MongoDB
const MONGODB_URI = 'mongodb+srv://salaryapp5:aM5DtXeMRklFosy5@cluster0.l1wfm.mongodb.net/test?retryWrites=true&w=majority';
const DB_NAME = 'test';
const PROGRESS_COLLECTION = 'progress';

async function getMongoClient() {
  const client = new MongoClient(MONGODB_URI, {
    tls: true,
  });
  await client.connect();
  return client;
}

async function getLastProcessedIndex(db) {
  const progressDoc = await db.collection(PROGRESS_COLLECTION).findOne({ sheetId: GOOGLE_SHEET_ID });
  if (progressDoc) return progressDoc.lastIndex || 0;
  await db.collection(PROGRESS_COLLECTION).insertOne({ sheetId: GOOGLE_SHEET_ID, lastIndex: 0 });
  return 0;
}

async function updateLastProcessedIndex(db, index) {
  await db.collection(PROGRESS_COLLECTION).updateOne(
    { sheetId: GOOGLE_SHEET_ID },
    { $set: { lastIndex: index } }
  );
}

async function updateOrder(orderId, data, originalPayload, logs) {
  const updatePayload = {
    buyer_comment: originalPayload.buyer_comment,
    manager_comment: originalPayload.manager_comment,
    status_id: parseInt(data["statusId"]) || 0
  };

  try {
    const updateUrl = `${keycrmUrlStock}/${orderId}`;
    const updateResponse = await axios.put(updateUrl, updatePayload, {
      headers: {
        'Authorization': `Bearer ${keycrmToken}`,
        'Content-Type': 'application/json'
      },
    });
    logs.push({ event: "updateOrder", orderId, message: "Order updated successfully.", details: updateResponse.data });
  } catch (error) {
    const errMsg = error.response ? error.response.data : error.message;
    logs.push({ event: "updateOrder", orderId, message: "Error updating order.", error: errMsg });
  }
}

// Вспомогательная функция задержки (ms)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Получение маппинга статусов из БД (коллекция statuses)
async function getStatusesMapping(db) {
  const statuses = await db.collection('statuses').find({}).toArray();
  const mapping = {};
  statuses.forEach(item => { mapping[item.name] = item.id; });
  return mapping;
}

// Получение маппинга источников из БД (коллекция sources)
async function getSourcesMapping(db) {
  const sources = await db.collection('sources').find({}).toArray();
  const mapping = {};
  sources.forEach(item => { mapping[item.name] = item.id; });
  return mapping;
}

async function transferData() {
  const logs = [];
  const mongoClient = await getMongoClient();
  const db = mongoClient.db(DB_NAME);

  try {
    await doc.loadInfo();
    logs.push({ event: "loadInfo", message: `Loaded document: ${doc.title}` });
    const sheet = doc.sheetsByIndex[0];
    logs.push({ event: "sheetInfo", message: `Sheet: ${sheet.title} (Rows: ${sheet.rowCount})` });
    const rows = await sheet.getRows();
    const lastIndex = await getLastProcessedIndex(db);
    logs.push({ event: "processingStart", message: `Starting processing from row index: ${lastIndex}` });

    // Загружаем маппинги статусов и источников из БД
    const statusesMapping = await getStatusesMapping(db);
    const sourcesMapping = await getSourcesMapping(db);

    for (let i = lastIndex; i < rows.length; i++) {
      // Для теста прекращаем обработку после 15-й строки
      if (i === 15) {
        logs.push({ event: "testStop", row: i, message: "Тестовая остановка: обработка прекращена на 15 ряду." });
        break;
      }

      const row = rows[i];
      const artikul = row._rawData[4];
      if (!artikul) {
        logs.push({ event: "stopProcessing", row: i, message: "Поле 'Артикул' пустое. Прекращение обработки." });
        break;
      }

      const data = {};
      headers.forEach((header, index) => {
        data[header] = row._rawData[index];
      });
      logs.push({ event: "processRow", row: i, data });

      // Используем маппинги из БД: если не найдено – оставляем 0 или можно задать другое значение по умолчанию
      data["statusId"] = statusesMapping[data["статус"]] || 0;
      data["sourceId"] = sourcesMapping[data["Источник"]] || 0;

      const prepayment = parseFloat((data["Предоплата"] || '').replace(',', '.'));
      const ost = parseFloat((data["Ост"] || '').replace(',', '.'));

      const payments = [];
      if (!isNaN(prepayment) && prepayment > 0) {
        payments.push({
          payment_method_id: 2,
          payment_method: "Apple Pay",
          amount: prepayment,
          description: "Авансовий платіж",
          payment_date: "2021-02-21 14:44:00",
          status: "paid"
        });
      }
      if (!isNaN(ost) && ost > 0) {
        payments.push({
          payment_method_id: 2,
          payment_method: "Apple Pay",
          amount: ost,
          description: "Остаток платежа",
          payment_date: "2021-02-21 14:44:00",
          status: "not_paid"
        });
      }

      const payload = {
        source_id: data["sourceId"],
        buyer: {
          full_name: data["ФИО"],
          phone: data["телеофн"],
          email: ""
        },
        manager_comment: data["Сотрудник"],
        buyer_comment: data["никнейм"],
        products: [
          {
            sku: data["Артикул"],
            name: data["Товар"],
            price: parseFloat(data["р"].replace(',', '.')) || parseFloat(data["Цена"].replace(',', '.')),
            quantity: parseInt(data["Кол-во"]) || 0,
            properties: [
              { name: "Размер", value: data["Размер"] },
              { name: "Артикул1", value: data["Артикул1"] },
              { name: "Товар1", value: data["Товар1"] }
            ]
          }
        ],
        payments,
        custom_fields: [
          {
            uuid: "order_number",
            value: data["№А"]
          }
        ]
      };
      console.log("Payload before request:", JSON.stringify(payload, null, 2));

      try {
        const createResponse = await axios.post(keycrmUrlStock, payload, {
          headers: {
            'Authorization': `Bearer ${keycrmToken}`,
            'Content-Type': 'application/json'
          },
        });
      
        logs.push({
          event: "sendRow",
          row: i,
          message: "Row sent successfully.",
          response: createResponse.data
        });
      
        const orderId = createResponse.data.id;
        if (orderId) {
          await updateOrder(orderId, data, payload, logs);
        } else {
          logs.push({
            event: "sendRow",
            row: i,
            message: "Order not created, missing id in response.",
            response: createResponse.data
          });
        }
      } catch (error) {
        const statusCode = error.response ? error.response.status : null;
        const statusText = error.response ? error.response.statusText : null;
        const errData = error.response ? error.response.data : null;
        const errMsg = error.message;
        logs.push({
          event: "sendRow",
          row: i,
          message: "Error sending row to KeyCRM.",
          error: { statusCode, statusText, errData, errMsg }
        });
        console.error("Error sending row:", { row: i, statusCode, statusText, errData, errMsg });
      }

      await delay(1000);
      await updateLastProcessedIndex(db, i + 1);
    }
  } catch (error) {
    logs.push({ event: "transferData", message: "Error with Google Sheets.", error: error.message });
  } finally {
    await mongoClient.close();
    logs.push({ event: "mongoClose", message: "MongoDB connection closed." });
  }
  return { success: true, logs };
}

// -----------------------
// Планирование передачи данных

let transferIntervalMinutes = 60;
let transferIntervalId = null;
let isRunning = true;
let isProcessing = false;

function scheduleTransfer() {
  if (transferIntervalId) clearInterval(transferIntervalId);
  const intervalMs = transferIntervalMinutes * 60 * 1000;
  transferIntervalId = setInterval(async () => {
    if (isRunning && !isProcessing) {
      isProcessing = true;
      console.log(`Автоматический запуск передачи данных каждые ${transferIntervalMinutes} минут.`);
      try {
        await transferData();
      } catch (err) {
        console.error("Ошибка передачи данных:", err);
      } finally {
        isProcessing = false;
      }
    }
  }, intervalMs);
  console.log(`Скрипт передачи данных запланирован каждые ${transferIntervalMinutes} минут.`);
}

scheduleTransfer();

// Эндпоинты для настройки интервала, lastIndex, паузы/возобновления и передачи данных
app.get('/transferInterval', (req, res) => {
  res.json({ transferIntervalMinutes });
});

app.post('/transferInterval', (req, res) => {
  const { transferInterval } = req.body;
  if (transferInterval === undefined || isNaN(transferInterval)) {
    return res.status(400).json({ error: "Некорректное значение интервала." });
  }
  transferIntervalMinutes = Number(transferInterval);
  scheduleTransfer();
  res.json({ success: true, transferIntervalMinutes });
});

app.post('/pauseTransfer', (req, res) => {
  isRunning = false;
  res.json({ success: true, message: "Передача данных приостановлена." });
});

app.post('/resumeTransfer', (req, res) => {
  isRunning = true;
  res.json({ success: true, message: "Передача данных возобновлена." });
});

app.get('/lastIndex', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const lastIndex = await getLastProcessedIndex(db);
    await client.close();
    res.json({ lastIndex });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/lastIndex', async (req, res) => {
  try {
    const { lastIndex } = req.body;
    if (lastIndex === undefined) {
      return res.status(400).json({ error: "Не указан lastIndex" });
    }
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    await updateLastProcessedIndex(db, lastIndex);
    await client.close();
    res.json({ success: true, lastIndex });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/transfer', async (req, res) => {
  try {
    const result = await transferData();
    result.logsFormatted = JSON.stringify(result.logs, null, 2);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error transferring data' });
  }
});

// Эндпоинты для работы со статусами
app.get('/statuses', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const statuses = await db.collection('statuses').find({}).toArray();
    await client.close();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/statuses', async (req, res) => {
  try {
    const { name, id } = req.body;
    if (!name || id === undefined) {
      return res.status(400).json({ error: "Необходимо указать name и id статуса." });
    }
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    await db.collection('statuses').updateOne({ name }, { $set: { id } }, { upsert: true });
    await client.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Эндпоинты для работы с источниками
app.get('/sources', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const sources = await db.collection('sources').find({}).toArray();
    await client.close();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sources', async (req, res) => {
  try {
    const { name, id } = req.body;
    if (!name || id === undefined) {
      return res.status(400).json({ error: "Необходимо указать name и id источника." });
    }
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    await db.collection('sources').updateOne({ name }, { $set: { id } }, { upsert: true });
    await client.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
