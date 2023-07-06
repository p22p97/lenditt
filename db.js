var mysql = require("mysql")

var client = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456789"
});

client.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

async function query(qry) {
    try {
        return new Promise((resolve, reject) => {
            client.query(qry, function (err, results, fields) {
                if (err) {
                    console.log("errrror", err)
                    reject(err)
                }
                if (results) {
                    resolve(results)
                }
            })
        })
    } catch (e) {
        console.log("error in getQuery", e)
        return []
    }
}

module.exports={query}