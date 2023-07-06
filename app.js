const express = require("express")
const app = express()// method aquire of express
require("dotenv").config()

app.use(express.json({"limit":'100mb'}))
app.use(express.urlencoded()) //for param read
// const bodyparser = require(body-parser) // to read the request body
require("./db")

const router = require("./router")(app)

// app.use(bodyparser.json()) // it will read the json data of body


let port= process.env.port||8000 //process.env.port-- get port variable value from .env file/ if no env file it will pick undefined
app.listen(port,()=>{console.log(`App port num ${port}`)}) //portal on which server will hit