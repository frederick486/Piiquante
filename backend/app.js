const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require("body-parser");
const saucesRoutes = require("./routes/sauces");
const userRoutes = require('./routes/user');

require('dotenv').config()
require("./services/db");

app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  // res.setHeader('Content-Security-Policy', "default-src 'self'")
  next();
});

app.use("/api/sauces", saucesRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;