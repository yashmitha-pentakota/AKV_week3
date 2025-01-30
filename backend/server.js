const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const sharp = require('sharp'); 
const mysql = require('mysql2');
const logger = require('./middleware/loggers/loggers');
dotenv.config();
const app = express();
const cartRoutes = require('./routes');
// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cartRoutes);

// importing files

app.use('/api/cart', cartRoutes);

logger.info('its working yash!');
const userId = 123;
logger.info(`User with ID ${userId} has logged in`);

// const dotenv = require('dotenv');
// dotenv.config({path:'../'});

const connection = mysql.createConnection({
  host: 'localhost',      
  user: 'root',         
  password: '',           
  database: 'inventory'  
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});
// Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));