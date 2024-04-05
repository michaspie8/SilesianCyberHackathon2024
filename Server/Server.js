"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require("mysql");
//openai client
const openaiModule = require("openai");
const openai = new openaiModule("sk-xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
const host = {
    hostname: "localhost",
    port: process.env.PORT || "3000",
}
function fullhostname(){
    return this.hostname+":"+this.port;
}

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

app.get("/test", (req, res) => {
    const headers = {
        "Content-Type": "application/json"
    }
   //fetch() wypadek, with example data, audio from nagr_test.m4a
    fetch(fullhostname()+"/wypadek",
        { method: "POST",
            headers: headers,
            body: JSON.stringify({id: 1, name: "Jan", surname: "Kowalski", desc: "Przy parkowaniu mój samochód uderzył w słup.",
                audioData: "test" })}
    ).then(response => {
        console.log(response);
        res.status(200).send({message: "Test completed", response: response});
    }
    ).catch(err => {
        console.log(err);
        res.status(500).send({message: "Error during test"});
    });
});

app.post("/wypadek", (req, res) => {
  let {id, name, surname, desc, audioData } = req.body;
  const sql = `INSERT INTO wypadek (id, name, surname, desc, audioData) VALUES (?, ?, ?, ?, ?)`;
  connection.query(sql, [id, name, surname, desc, audioData], (err, result) => {

        if (err) {
            console.log(err);
            res.status(500).send("Error saving the data");
        } else {
            if(audioData == "test"){
                //stream from audio file ./nagr_test.m4a
                audioData = fs.createReadStream("./nagr_test.m4a");
            }else{
            if(audioData && audioData.length > 0)
            {
                //try to convert audio to text
                const transcripton = openai.api().transcription.create({
                    file: audioData,
                    model: "whisper-1",
                });
                console.log("chat has transcribed audio: "+transcripton);

            }
            }
        }
      let category = "nieznane";
        const categories = [
            "wstrząs mózgu",
            "złamanie otwarte",
            "zatrzymanie akcji serca",
            "niedrożność dróg oddechowych",
            "amputacja",
            "rana",
            "środowiskowe",
            "wypadek komunikacyjny"
        ];
        const stringOfCategories = categories.join(", ");
        //use chatgpt to categorize the description of the accident
        const response = openai.api().chatCompletion.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: "You will get two descriptions of the accident (secound one is from speech to text). Please categorize the accident described in those descriptions. Available categories are: "+stringOfCategories+"; Description1 : "+desc+"; Description2 : "+transcripton},
                {role: "user", content: desc},
            ],
        });
        //if the chat response is a category, save it
       if(categories.includes(response.choices[0].message.content)){
           category = response.choices[0].message.content;
       }else{
           category = "nieznane";
       }
      res.status(201).send({message: "Data saved successfully", category: category});
    }
    );
}
);

//error handling
app.use((req, res) => {
    res.status(404).send("Błąd 404 - Endpoint not found");
});

app.listen(process.env.PORT || host.port, () => {
    console.log("Server is running");
});