require("dotenv").config(); // 讀取 .env 檔案
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mysql = require("mysql2"); // 引入 mysql2 套件
const nodemailer = require("nodemailer"); // 引入 nodemailer
const app = express();

// 設置靜態檔案服務，提供根目錄下的前端檔案
app.use(express.static(path.join(__dirname)));

// 使用 body-parser 中間件解析 JSON 和 URL 編碼的資料
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 創建 MySQL 連接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 連接 MySQL 資料庫
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database.");
});

// 設定 nodemailer
const transporter = nodemailer.createTransport({
  service: "Yahoo",
  auth: {
    user: process.env.SENDER_EMAIL, // 發送者 Email
    pass: process.env.YAHOO_APP_PASSWORD, // Yahoo 應用程式密碼
  },
});

// 後端 API 路由：接收前端資料並儲存到資料庫
app.post("/api/data", (req, res) => {
  let { date, temperature, pressure, current } = req.body;

  // 將前端資料轉換為浮點數，無效為 null
  temperature = temperature ? parseFloat(temperature) : null;
  pressure = pressure ? parseFloat(pressure) : null;
  current = current ? parseFloat(current) : null;

  console.log(
    `Received data: Date: ${date}, Temperature: ${temperature}, Pressure: ${pressure}, Electric Current: ${current}`
  );

  // 檢查是否有缺少的欄位
  if (
    !date ||
    temperature === undefined ||
    pressure === undefined ||
    current === undefined
  ) {
    return res.status(400).send({
      message:
        "All fields (date, temperature, pressure, and current) are required.",
    });
  }

  // 將資料插入到 MySQL 資料表
  const query =
    "INSERT INTO equipment_data (created_date, temperature, pressure, electric_current) VALUES (CONVERT_TZ(?, '+00:00', '+08:00'), ?, ?, ?)";
  db.query(query, [date, temperature, pressure, current], (err, result) => {
    if (err) {
      console.error("Error inserting data into database: " + err.stack);
      return res.status(500).send({ message: "Error saving data" });
    }
    res.status(200).send({ message: "Data saved successfully!" });

    // 數據存入 MySQL 成功後，發送 Email
    // mail內容格式
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECEIVER_EMAIL,
      subject: "Equipment Monitoring Data",
      html: `
      <p>Equipment Monitoring Data：</p>
      <p>Date: ${date}</p>
      <p>Temperature: 
      <span style="color: ${
        temperature < 60 || temperature > 80 ? "red" : "black"
      };font-weight: bold;">
        ${temperature}°C
      </span>
      </p>
      <p>Pressure: <span style="color: ${
        pressure < 0.5 || pressure > 1 ? "red" : "black"
      };font-weight: bold;">
        ${pressure}atm
      </span></p>
      <p>Current: <span style="color: ${
        current < 0.5 || current > 1 ? "red" : "black"
      };font-weight: bold;">
        ${current}nA
      </span></p>
      <p style="color: gray;">This email is automatically sent by the system. Please do not reply.</p>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: " + error);
        return res
          .status(500)
          .send({ message: "Data saved, but email sending failed." });
      }
      console.log("Email sent: " + info.response);
      res
        .status(200)
        .send({ message: "Data saved and email sent successfully!" });
    });
  });
});

// 後端 API 路由：查詢資料
app.post("/api/query", (req, res) => {
  const { startDate, endDate } = req.body;
  console.log(`Querying data from ${startDate} to ${endDate}`);

  const query = `
    SELECT 
      DATE_FORMAT(CONVERT_TZ(created_date, '+00:00', '+08:00'), '%m/%d') AS created_date, 
      temperature, 
      pressure, 
      electric_current 
    FROM equipment_data 
    WHERE created_date BETWEEN ? AND ?;
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error querying data from database: " + err.stack);
      return res.status(500).send({ message: "Error fetching data" });
    }
    console.log("Query results:", results); // 檢查返回的資料
    res.status(200).send({ data: results });
  });
});

// 啟動伺服器
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
