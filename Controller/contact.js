const moment = require("moment")
const client = require("../db")
var crypto = require('crypto');

async function create_contact(req, res) {
    try {
        let reqBody = { ...req.body }
        if (reqBody) {
            let validationErr = []
            !(reqBody.user_id) ? validationErr.push({ "field": "user_id", "message": "Mandatory parameter missing" }) : true
            reqBody.Contacts.length > 0 ? true : validationErr.push({ "field": "Contacts", "message": "Mandatory parameter missing" })

            if (validationErr.length == 0) {

                let moment_time = moment().format('YYYY-MM-DD HH:mm:ss')

                for (let i = 0; i < reqBody.Contacts.length; i++) {

                    const algorithm = process.env.algorithm;
                    const password = process.env.encryption_key
                    let salt = 'my-salt'
                    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

                    const cipher = crypto.createCipheriv(algorithm, key, null);

                    var mob_num = cipher.update(reqBody.Contacts[i].number, 'utf8', 'hex') + cipher.final('hex');
                    console.log("mob_num>>  ", mob_num)
                    let get_hash_no_sql = `select id from assignment_db.contacts where contact_number = '${mob_num}'`
                    let get_hash_no_data = await client.query(get_hash_no_sql)
                    if (get_hash_no_data.length > 0) {
                        let get_id = get_hash_no_data[0]['id']

                        let insert_to_contacts_user_sql = `insert into assignment_db.contacts_user (user_id,contact_id,created_at) values('${reqBody.user_id}','${get_id}','${moment_time}')`
                        await client.query(insert_to_contacts_user_sql)
                    } else {
                        let insert_hash_sql = `insert into assignment_db.contacts (contact_number,contact_name,created_at) values('${mob_num}','${reqBody.Contacts[i].name}','${moment_time}')`
                        await client.query(insert_hash_sql)

                        let get_insert_contact_id = `select id from assignment_db.contacts where contact_number = '${mob_num}'`
                        let get_insert_contact_id_data = await client.query(get_insert_contact_id)

                        let insert_to_contacts_user_sql_1 = `insert into assignment_db.contacts_user (user_id,contact_id,created_at) values('${reqBody.user_id}','${get_insert_contact_id_data[0]['id']}','${moment_time}')`
                        await client.query(insert_to_contacts_user_sql_1)
                    }
                }
                res.json({ "Status": 200, "Message": "Data inserted successfully" })

            } else {
                res.json({ "Status": 400, "Message": validationErr })
            }
        } else {
            res.json({ "Status": 400, "Message": "Nothing to insert" })
        }
    } catch (e) {
        console.log(e)
        res.json({ "Status": 500, "Message": "Internal server error" })
    }
}

async function get_contact(req, res) {
    try {
        let validationErr = []
        !(req.query.number) ? validationErr.push({ "field": "number", "message": "Mandatory parameter missing" }) : true
        if (validationErr.length == 0) {

            const algorithm = process.env.algorithm;
            const password = process.env.encryption_key
            let salt = 'my-salt'
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

            const cipher = crypto.createCipheriv(algorithm, key, null);


            var hashed_mob_no = cipher.update(req.query.number, 'utf8', 'hex') + cipher.final('hex');
            console.log("hashed_mob_no>>>  ", hashed_mob_no)

            let get_contact_id = `select id from assignment_db.contacts where contact_number = '${hashed_mob_no}'`
            let get_contact_id_data = await client.query(get_contact_id)

            if (get_contact_id_data.length > 0) {
                let get_user_id = `select user_id from assignment_db.contacts_user where contact_id = '${get_contact_id_data[0]["id"]}'`
                let get_user_id_data = await client.query(get_user_id)
                if (get_user_id_data.length > 0) {
                    let obj = {
                        name: '',
                        users: []
                    }
                    get_user_id_data.map(ele => {
                        obj['name'] = ele['contact_name']
                        obj['users'].push(ele['user_id'])
                    })
                    res.json({ "Status": 200, "Data": obj })
                }
            } else {
                res.json({ "Status": 200, "Message": "Mobile number does not exist" })
            }
        } else {
            res.json({ "Status": 400, "Message": validationErr })
        }
    } catch (e) {
        console.log(e)
        res.json({ "Status": 500, "Message": "Internal server error" })
    }
}

async function search_contact(req, res) {
    try {
        let validationErr = []
        !(req.query.user) ? validationErr.push({ "field": "user", "message": "Mandatory parameter missing" }) : true
        if (validationErr.length == 0) {

            let get_user_id = `select contacts_user.contact_id, contacts.contact_number, contacts.contact_name 
            from assignment_db.contacts_user
            left join assignment_db.contacts on contacts.id= contacts_user.contact_id 
            where contacts_user.user_id = '${req.query.user}'`

            if (req.query.name) {
                get_user_id += ` and contacts.contact_name LIKE '%${req.query.name}%'`
            }

            if (req.query.page_size && req.query.page) {
                let cal = (req.query.page * req.query.page_size) - req.query.page_size
                get_user_id += ` LIMIT ${req.query.page_size} OFFSET ${cal}`
            }

            let get_user_id_data = await client.query(get_user_id)

            if (get_user_id_data.length > 0) {

                let result = []
                get_user_id_data.map((ele) => {
                    const algorithm = process.env.algorithm;
                    const password = process.env.encryption_key
                    let salt = 'my-salt'
                    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
                    const decipher = crypto.createDecipheriv(algorithm, key, null)
                    console.log("hiii", ele.contact_number)

                    var mob_num_hash = decipher.update(ele.contact_number, 'hex', 'utf8') + decipher.final('utf8');

                    console.log("mob_num_hash>> ", mob_num_hash)
                    result.push({ name: ele.contact_name, number: mob_num_hash })
                })
                res.json({ "Status": 200, "Count": get_user_id_data.length, "Data": result })
            } else {
                res.json({ "Status": 400, "Message": "No data found" })
            }
        } else {
            res.json({ "Status": 400, "Message": validationErr })
        }
    } catch (e) {
        console.log(e)
        res.json({ "Status": 500, "Message": "Internal server error" })
    }
}

module.exports = { create_contact, get_contact, search_contact }