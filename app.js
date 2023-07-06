const express = require("express")
const app = express()
require("dotenv").config()

app.use(express.json({"limit":'100mb'}))
app.use(express.urlencoded())
require("./db")

const router = require("./router")(app)

let port= process.env.port||8000 
app.listen(port,()=>{console.log(`App port num ${port}`)})