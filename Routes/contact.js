const express = require("express")
const controler = require("../Controller/contact.js")
let router1 = express.Router()

router1.post("/createContact", controler.create_contact)
router1.get("/getContact", controler.get_contact)
router1.get("/searchContact", controler.search_contact)

module.exports = router1