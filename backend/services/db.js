const mongoose = require("mongoose");
const password = process.env.PASSWORD;
const login = process.env.LOGIN;
const uri = `mongodb+srv://${login}:${password}@cluster0.o2hbnjb.mongodb.net/`

mongoose
    .connect(uri)
    .then(() => console.log("Connected to Mongo cluster"))
    .catch((err) => console.log("failed to connect to Mongo cluster:", err))

module.exports = {mongoose}