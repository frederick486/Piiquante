require('dotenv').config()
const express = require('express')
// const cors = require("cors")
const app = express()
const saucesRoutes = require("./routes/sauces");

const path = require('path');

// Mongo
const mongoose = require("./services/db");

// Routes
const userRoutes = require('./routes/user');

const bodyParser = require("body-parser");

app.use(bodyParser.json());

// middleware
// app.use(cors())

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