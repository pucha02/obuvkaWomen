// import { GoogleSpreadsheet } from 'google-spreadsheet';
// import { JWT } from 'google-auth-library';
// import axios from 'axios';
// import credentials from './jovial-archive-451414-f2-978896cab533.json' assert { type: 'json' };

// // Замените на фактический ID вашей таблицы (часть URL между "/d/" и "/edit")
// const GOOGLE_SHEET_ID = '1NHd9JVWQ7yriMVbavebqotFzdw0iexuRrI4sCY9p5kg';

// // URL и токен KeyCRM
// const keycrmUrlStock = "https://openapi.keycrm.app/v1/order";
// const keycrmToken = "NDUyZTNjNjk0OGM5NTc2YWYxNGIyN2YxYTIyYzM3YTQwMzUwNzQxZg";

// // Определяем заголовки в том порядке, в котором они идут в таблице
// const headers = [
//   "№",         // 0
//   "AKR",       // 1
//   "ттн",       // 2
//   "Дата",      // 3
//   "Артикул",   // 4
//   "Товар",     // 5
//   "р",         // 6
//   "Артикул1",  // 7
//   "Товар1",    // 8
//   "Размер",    // 9
//   "Кол-во",    // 10
//   "Цена",      // 11
//   "Предоплата",// 12
//   "Ост",       // 13
//   "3405,14",   // 14
//   "статус",    // 15
//   "ФИО",       // 16
//   "телеофн",   // 17
//   "Источник",  // 18
//   "Сотрудник", // 19
//   "никнейм",   // 20
//   "Коммент",   // 21
//   "№А"         // 22
// ];

// // Инициализация аутентификации через JWT
// const serviceAccountAuth = new JWT({
//   email: credentials.client_email,
//   key: credentials.private_key,
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });

// // Создаём объект документа Google Sheets с аутентификацией
// const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

// // Основная функция для загрузки данных и передачи их в KeyCRM
// async function transferData() {
//   try {
//     await doc.loadInfo(); // Загружаем свойства документа и листы
//     console.log(`Документ загружен: ${doc.title}`);

//     // Выбираем первый лист (или укажите нужный лист по индексу/ID/названию)
//     const sheet = doc.sheetsByIndex[0];
//     console.log(`Лист: ${sheet.title} (Строк: ${sheet.rowCount})`);

//     // Получаем все строки из листа
//     const rows = await sheet.getRows();

//     // Обрабатываем каждую строку
//     for (const row of rows) {
//       // Преобразуем массив данных в объект с нужными заголовками
//       const data = {};
//       headers.forEach((header, index) => {
//         data[header] = row._rawData[index];
//       });
      
//       console.log(data); // Вывод объекта для проверки

//       // Формируем payload для KeyCRM, используя объект data
//       const payload = {
//         source_id: 1,
//         source_uuid: data["№"],
//         // ordered_at: data["Дата"],
//         buyer: {
//           full_name: data["ФИО"],
//           phone: data["телеофн"],
//           email: "", // Если требуется, добавьте столбец для email
//         },
//         manager_comment: data["Сотрудник"],
//         buyer_comment: data["никнейм"],
//         shipping: {
//           delivery_service_id: 2,
//           tracking_code: data["ттн"],
//         },
//         products: [
//           {
//             sku: data["Артикул"],
//             name: data["Товар"],
//             // Приоритет: используем поле "р" или "Цена"
//             price: parseFloat(data["р"].replace(',', '.')) || parseFloat(data["Цена"].replace(',', '.')),
//             quantity: parseInt(data["Кол-во"]),
//             properties: [
//               {
//                 name: "Размер",
//                 value: data["Размер"],
//               },
//               {
//                 name: "Артикул1",
//                 value: data["Артикул1"],
//               },
//               {
//                 name: "Товар1",
//                 value: data["Товар1"],
//               },
//             ],
//           },
//         ],
//         // payments: [
//         //   {
//         //     amount: parseFloat(data["Предоплата"].replace(',', '.')),
//         //     description: data["Коммент"],
//         //     payment_date: data["Дата"],
//         //     status: data["статус"],
//         //     payment_method_id: 0,
//         //   },
//         // ],
//         custom_fields: [
//           {
//             uuid: "order_number", // UUID настраиваемого поля для номера заказа, измените по необходимости
//             value: data["№А"],
//           },
//         ],
//       };

//       try {
//         const response = await axios.post(keycrmUrlStock, payload, {
//           headers: {
//             'Authorization': `Bearer ${keycrmToken}`,
//             'Content-Type': 'application/json'
//           },
//         });
//         console.log('Данные успешно переданы:', response.data);
//       } catch (error) {
//         console.error('Ошибка при передаче данных в KeyCRM:', error.response ? error.response.data : error.message);
//       }
//     }
//   } catch (error) {
//     console.error('Ошибка при работе с Google Sheets:', error);
//   }
// }

// transferData();


import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import axios from 'axios';
import { MongoClient } from 'mongodb';
import credentials from './obuvkawomenintegration-ce5d5ef3521a.json' assert { type: 'json' };

// Конфигурация Google Sheets
const GOOGLE_SHEET_ID = '1NHd9JVWQ7yriMVbavebqotFzdw0iexuRrI4sCY9p5kg';

// Конфигурация KeyCRM
const keycrmUrlStock = "https://openapi.keycrm.app/v1/order";
const keycrmToken = "NDUyZTNjNjk0OGM5NTc2YWYxNGIyN2YxYTIyYzM3YTQwMzUwNzQxZg";

// Определяем заголовки в нужном порядке
const headers = [
  "№",         // 0
  "AKR",       // 1
  "ттн",       // 2
  "Дата",      // 3
  "Артикул",   // 4
  "Товар",     // 5
  "р",         // 6
  "Артикул1",  // 7
  "Товар1",    // 8
  "Размер",    // 9
  "Кол-во",    // 10
  "Цена",      // 11
  "Предоплата",// 12
  "Ост",       // 13
  "3405,14",   // 14
  "статус",    // 15
  "ФИО",       // 16
  "телеофн",   // 17
  "Источник",  // 18
  "Сотрудник", // 19
  "никнейм",   // 20
  "Коммент",   // 21
  "№А"         // 22
];

// Конфигурация аутентификации для Google Sheets
const serviceAccountAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

// Конфигурация MongoDB
const MONGODB_URI = 'mongodb+srv://salaryapp5:aM5DtXeMRklFosy5@cluster0.l1wfm.mongodb.net/test?retryWrites=true&w=majority'; // Замените на ваш URI подключения
const DB_NAME = 'test';                    
const PROGRESS_COLLECTION = 'progress';          

// Функция для подключения к MongoDB
async function getMongoClient() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

// Получение последнего обработанного индекса для данной таблицы
async function getLastProcessedIndex(db) {
  const progressDoc = await db.collection(PROGRESS_COLLECTION).findOne({ sheetId: GOOGLE_SHEET_ID });
  if (progressDoc) return progressDoc.lastIndex || 0;
  // Если запись отсутствует, создаём её
  await db.collection(PROGRESS_COLLECTION).insertOne({ sheetId: GOOGLE_SHEET_ID, lastIndex: 0 });
  return 0;
}

// Обновление последнего обработанного индекса в MongoDB
async function updateLastProcessedIndex(db, index) {
  await db.collection(PROGRESS_COLLECTION).updateOne(
    { sheetId: GOOGLE_SHEET_ID },
    { $set: { lastIndex: index } }
  );
}

// Функция для редактирования заказа в KeyCRM по его id
async function updateOrder(orderId, data, originalPayload) {
  // Формируем payload для обновления. Здесь обновляем хотя бы status_id,
  // а также можно передать buyer_comment и manager_comment, если нужно.
  const updatePayload = {
    buyer_comment: originalPayload.buyer_comment,
    manager_comment: originalPayload.manager_comment,
    status_id: parseInt(data["статус"]) || 0
    // При необходимости можно добавить и другие поля
  };

  try {
    const updateUrl = `${keycrmUrlStock}/${orderId}`;
    const updateResponse = await axios.put(updateUrl, updatePayload, {
      headers: {
        'Authorization': `Bearer ${keycrmToken}`,
        'Content-Type': 'application/json'
      },
    });
    console.log(`Заказ ${orderId} успешно обновлён:`, updateResponse.data);
  } catch (error) {
    console.error(`Ошибка при обновлении заказа ${orderId}:`, error.response ? error.response.data : error.message);
  }
}

// Основная функция для передачи данных
async function transferData() {
  // Подключаемся к MongoDB
  const mongoClient = await getMongoClient();
  const db = mongoClient.db(DB_NAME);

  try {
    // Загружаем данные Google Sheets
    await doc.loadInfo();
    console.log(`Документ загружен: ${doc.title}`);

    // Выбираем первый лист
    const sheet = doc.sheetsByIndex[0];
    console.log(`Лист: ${sheet.title} (Строк: ${sheet.rowCount})`);

    // Получаем все строки из листа
    const rows = await sheet.getRows();

    // Получаем индекс последней обработанной строки
    const lastIndex = await getLastProcessedIndex(db);
    console.log(`Начинаем обработку с индекса: ${lastIndex}`);

    // Обрабатываем строки начиная с lastIndex
    for (let i = lastIndex; i < rows.length; i++) {
      const row = rows[i];

      // Преобразуем массив данных в объект с нужными заголовками
      const data = {};
      headers.forEach((header, index) => {
        data[header] = row._rawData[index];
      });

      console.log(`Обработка строки ${i}:`, data);

      // Формируем payload для создания заказа в KeyCRM
      const payload = {
        source_id: 1,
        source_uuid: data["№"],
        buyer: {
          full_name: data["ФИО"],
          phone: data["телеофн"],
          email: "", // Если требуется, добавьте соответствующее поле
        },
        manager_comment: data["Сотрудник"],
        buyer_comment: data["никнейм"],
        shipping: {
          delivery_service_id: 2,
          tracking_code: data["ттн"],
        },
        products: [
          {
            sku: data["Артикул"],
            name: data["Товар"],
            price: parseFloat(data["р"].replace(',', '.')) || parseFloat(data["Цена"].replace(',', '.')),
            quantity: parseInt(data["Кол-во"]),
            properties: [
              {
                name: "Размер",
                value: data["Размер"],
              },
              {
                name: "Артикул1",
                value: data["Артикул1"],
              },
              {
                name: "Товар1",
                value: data["Товар1"],
              },
            ],
          },
        ],
        custom_fields: [
          {
            uuid: "order_number", // UUID настраиваемого поля для номера заказа
            value: data["№А"],
          },
        ],
      };

      // Отправка данных на создание заказа в KeyCRM
      try {
        const createResponse = await axios.post(keycrmUrlStock, payload, {
          headers: {
            'Authorization': `Bearer ${keycrmToken}`,
            'Content-Type': 'application/json'
          },
        });
        console.log(`Строка ${i} успешно передана:`, createResponse.data);

        // Предполагаем, что ответ содержит идентификатор заказа в поле id
        const orderId = createResponse.data.id;
        if (orderId) {
          // После создания заказа сразу отправляем запрос на его обновление
          await updateOrder(orderId, data, payload);
        } else {
          console.error(`Заказ не создан, отсутствует идентификатор в ответе для строки ${i}`);
        }
      } catch (error) {
        console.error(`Ошибка при передаче строки ${i} в KeyCRM:`, error.response ? error.response.data : error.message);
      }

      // Обновляем последний обработанный индекс после обработки строки
      await updateLastProcessedIndex(db, i + 1);
    }
  } catch (error) {
    console.error('Ошибка при работе с Google Sheets:', error);
  } finally {
    await mongoClient.close();
    console.log('Соединение с MongoDB закрыто');
  }
}

transferData();
