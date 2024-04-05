"use strict";
//openai api key must be set in the environment variables
console.log(process.env.OPENAI_API_KEY);
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require("mysql");
//openai client
const openaiModule = require("openai");
const fs = require("fs");
const openai = new openaiModule();
const host = {
    hostname: "localhost",
    port: process.env.PORT || "3000",
};

function fullhostname()
{
    return host.hostname + ":" + host.port;
}

const connection = mysql.createConnection({
    hostname: "localhost",
    user: "root",
    password: "",
    database: "wypadek",
});


const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));

//if database does not exist, create a new one
connection.query("CREATE DATABASE IF NOT EXISTS wypadek ;", (err) =>
{
    if (err)
    {
        console.log(err);
    }
});
console.log("Database created");

//create wypaddek table if it does not exist
connection.query(
    `CREATE TABLE IF NOT EXISTS wypadek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    audioData VARCHAR(255)
  ) ;`,
    (err) =>
    {
        if (err)
        {
            console.log(err);
        }
    }
);

app.get("/test", (req, res) =>
{
    const headers = {
        "Content-Type": "application/json"
    };
    //fetch() wypadek, with example data, audio from nagr_test.m4a
    fetch("http://" + fullhostname() + "/wypadek",
        {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                name: "Jan", surname: "Kowalski", desc: "Przy parkowaniu mój samochód uderzył w słup.",
                audioData: "test"
            })
        }
    ).then(response =>
        {
            console.log(response);
            res.status(200).send({message: "Test completed", response: response});
        }
    ).catch(err =>
    {
        console.log(err);
        res.status(500).send({message: "Error during test"});
    });
});

app.post("/wypadek", (req, res) =>
    {
        let {name, surname, desc, audioData} = req.body;
        const sql = `INSERT INTO wypadek (id, name, surname, description, audioData) VALUES (null, ?, ?, ?, ?)`;
        connection.query(sql, [name, surname, desc, audioData], (err, result) =>
        {
            //let transcription = "";
            if (err)
            {
                console.log(err);
                res.status(500).send("Error saving the data");
            }
        });
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
                let responseStr = "";
                console.log("chat is categorizing the accident");
                const f = async (transcription) =>
                    {
                        const response = await openai.chat.completions.create({
                            model: "gpt-3.5-turbo-0125",
                            messages: [
                                {
                                    role: "system",
                                    content: "You will get two descriptions of the accident (second one is from speech to text). Please categorize the accident described in those descriptions. Available categories are: " + stringOfCategories + "; Description1 : " + desc + "; Description2 : " + audioData
                                }
                            ],
                            stream: true
                        });
                        //iterate and get response
                        for await (const chunk of response){
                            responseStr += chunk.choices[0]?.delta?.content || "";
                        }
                        console.log(responseStr);
                    };
                f(audioData).then(() =>
                {
                    console.log(responseStr);
                    //if the chat response is a category, save it
                    if (categories.includes(responseStr))
                    {
                        category = responseStr;
                    } else
                    {
                        category = "nieznane";
                    }
                    res.status(201).send({message: "Data saved successfully", category: category});
                }).catch(err => console.log(err));

    }
);

//error handling
app.use((req, res) =>
{
    res.status(404).send("Błąd 404 - Endpoint not found");
});

app.listen(process.env.PORT || host.port, () =>
{
    console.log("Server is running");
});