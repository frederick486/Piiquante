const express = require('express');
const helmet = require("helmet");
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const saucesRoutes = require("./routes/sauces");
const userRoutes = require('./routes/user');

require('dotenv').config()
require("./services/db");

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(bodyParser.json());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(helmet());
app.use("/api/sauces", saucesRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;