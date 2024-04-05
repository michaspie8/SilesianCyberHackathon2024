"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require("mysql");
//openai client
const openaiModule = require("openai");
const openai = new openaiModule("sk-xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");


const connection = mysql.createConnection({
  host: "localhost:3306",
    user: "root",
    password: "password",
    database: "wypadek",
});


const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));

//if database does not exist, create a new one
connection.query("CREATE DATABASE IF NOT EXISTS wypadek", (err) => {
    if (err) {
        console.log(err);
    }
});

//create wypaddek table if it does not exist
connection.query(
    `CREATE TABLE IF NOT EXISTS wypadek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    desc VARCHAR(255) NOT NULL,
    audioData BYTE STREAM NOT NULL
  )`,
    (err) => {
        if (err) {
            console.log(err);
        }
    }
);

app.post("/wypadek", (req, res) => {
  const {id, name, surname, desc, audioData } = req.body;
  const sql = `INSERT INTO wypadek (id, name, surname, desc, audioData) VALUES (?, ?, ?, ?, ?)`;
  connection.query(sql, [id, name, surname, desc, audioData], (err, result) => {

        if (err) {
            console.log(err);
            res.status(500).send("Error saving the data");
        } else {
            if(audioData && audioData.length > 0)
            {
                //try to convert audio to text
                const transcripton = openai.api().transcription.create({
                    file: audioData,
                    model: "whisper-1",
                });



            }
        }
      let category = "unknown";
        const categories = [
            
        ];
        //use chatgpt to categorize the description of the accident
        const response = openai.api().chatCompletion.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: "You will get two descriptions of the accident (secound one is from speech to text). Please categorize the accident described in those descriptions. Available categories are: "},
                {role: "user", content: desc},
            ],
        });

      res.status(201).send({message: "Data saved successfully", category: category});
  });

}