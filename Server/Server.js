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
//create tables and fill the table kategoria with categories
connection.query((
    `CREATE TABLE IF NOT EXISTS wypadek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    audioData VARCHAR(255),
    category VARCHAR(255) DEFAULT "nieznane"
  ) ;
  CREATE OR REPLACE TABLE kategoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(4096)
  ) ;
    delete from kategoria ;
INSERT INTO kategoria (id, name, description) VALUES 
(null, "wstrząs mózgu", "Upewnij się, że poszkodowany jest stabilny i zapewnij mu odpoczynek. 2. Zastosuj zimny okład na obszarze głowy, aby zmniejszyć obrzęk. 3. Monitoruj stan świadomości i reakcje poszkodowanego przez okres czasu."),
(null, "złamanie otwarte", "1. Zabezpiecz miejsce zdarzenia i upewnij się, że wszyscy są bezpieczni. 2. Nałóż opatrunek, który zatamuje krwawienie, unikając nacisku na ranę. 3. Unieruchom złamaną kończynę przy użyciu stabilizującego przedmiotu, takiego jak deska."),
(null, "zatrzymanie akcji serca", "1. Natychmiast rozpocznij resuscytację krążeniowo-oddechową (RKO). 2. Zadzwoń po pomoc medyczną i użyj defibrylatora, jeśli jest dostępny. 3. Wykonuj cykle ucisków klatki piersiowej i oddechów ratowniczych zgodnie z wytycznymi."),
(null, "niedrożność dróg oddechowych", "1. Spróbuj usunąć przeszkodę mechanicznie, jeśli jest widoczna. 2. Wykonuj manewr Heimlicha u osób dorosłych lub dzieci, jeśli są przytomne i mają trudności z oddychaniem. 3. Jeśli poszkodowany traci przytomność, rozpocznij resuscytację krążeniowo-oddechową (RKO)."),
(null, "amputacja", "1. Natychmiast zabezpiecz miejsce zdarzenia i zatrzymaj krwawienie. 2. Zbierz odseparowaną część ciała i przechowaj ją w czystym, chłodnym miejscu. 3. Zadzwoń po pomoc medyczną i przetransportuj poszkodowanego i odseparowaną część ciała do najbliższego szpitala."),
(null, "rana", "1. Oczyść ranę delikatnie wodą lub solą fizjologiczną. 2. Nałóż opatrunek, który zabezpieczy ranę przed zanieczyszczeniem i zatrzyma krwawienie. 3. Monitoruj ranę pod kątem infekcji i zapewnij regularną wymianę opatrunku."),
(null, "środowiskowe", "1. Zabezpiecz miejsce zdarzenia, aby uniknąć dodatkowych niebezpieczeństw dla siebie i innych. 2. Zadzwoń po odpowiednie służby ratownicze, takie jak straż pożarna lub służby medyczne. 3. Udziel pierwszej pomocy, jeśli to bezpieczne, zgodnie z potrzebami poszkodowanych."),
(null, "wypadek komunikacyjny", "1. Udziel pierwszej pomocy poszkodowanym, starając się nie narażać siebie na dodatkowe niebezpieczeństwo. 2. Zabezpiecz miejsce wypadku, oznaczając je i ostrzegając innych kierowców. 3. Zadzwoń po odpowiednie służby ratownicze i współpracuj z nimi, aby zapewnić szybką i skuteczną pomoc.") ;`).replace(/\n/g, " "),
    (err) =>
    {
        if (err)
        {
            console.log(err);
        }
    }
);

//test endpoint
app.get("/test", (req, res) =>
{
    const headers = {
        "Content-Type": "application/json"
    };
    //fetch() wypadek, with example data
    fetch("http://" + fullhostname() + "/wypadek",
        {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                name: "Jan", surname: "Kowalski", desc: "Przewróciłem się i boli mnie ręka",
                audioData: "test"
            })
        }
    ).then((response2)=>
        {
            console.log(response2);
            res.status(200).send({message: "Test completed", response: response2});
        }
    ).catch(err =>
    {
        console.log(err);
        res.status(500).send({message: "Error during test"});
    });
});

//send data abt accident, save it to the database and categorize it
app.post("/wypadek", (req, res) =>
    {
        let {name, surname, desc, audioData} = req.body;
                let category = "nieznane";

                const stringOfCategories = categories.join(", ");
                //use chatgpt to categorize the description of the accident
                let responseStr = "";
                console.log("chat is categorizing the accident");
                const f = async (transcription) =>
                    {
                        //prompt for chat
                        const response = await openai.chat.completions.create({
                            model: "gpt-3.5-turbo-0125",
                            messages: [
                                {
                                    role: "system",
                                    content: "You will get two descriptions of the accident (second one is from speech to text, so the first description, if contains anything is more important). Please categorize the accident described in those descriptions, by only telling the name of category. Available categories are: " + stringOfCategories + "; Description1 : " + desc + "; Description2 : " + audioData
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
                    if (categories.includes(responseStr.toLowerCase()))
                    {
                        category = responseStr;
                    } else
                    {
                        category = "nieznane";
                    }
                    const sql = `INSERT INTO wypadek (id, name, surname, description, audioData, category) VALUES (null, ?, ?, ?, ?, ?)`;
                    connection.query(sql, [name, surname, desc, audioData, category], (err, result) =>
                    {
                        //let transcription = "";
                        if (err)
                        {
                            console.log(err);
                            res.status(500).send("Error saving the data");
                        }
                    });
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