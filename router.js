var contact=require("./Routes/contact")

module.exports=function(app){
    app.use("/contact",contact)
}