const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const mysql = require('mysql2');
const logger = require('./middleware/loggers/loggers');
dotenv.config();
const app = express();
const cartRoutes = require('./routes'); 
const { processPendingFiles } = require('./cronJobs');
const http = require('http');
const socketIo = require('socket.io');
const chatController = require('./controllers/chatController');
const swaggerSetup = require('./controllers/swagger');  // Adjust the path as needed

// Middleware
swaggerSetup(app);
// **Create HTTP Server**
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",  // Allow requests from the frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true  // Allow credentials if needed (e.g., for cookies or sessions)
  },
  transports: ['websocket', 'polling']  // WebSocket as the primary transport
});

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cartRoutes);

const users = {}; // Store users and their socket IDs

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Handle user joining
  socket.on('joinRoom', (username) => {
    users[username] = socket.id;
    io.emit('message', { sender: 'System', content: `${username} joined the chat` });
    io.emit('onlineUsers', Object.keys(users));
  });

  // Handle group messages
  socket.on('sendMessage', (data) => {
    io.emit('message', data);
  });

  // Handle private messages
  socket.on('privateMessage', ({ sender, receiver, content }) => {
    if (users[receiver]) {
      io.to(users[receiver]).emit('privateMessage', { sender, content });
    }
  });

  // Handle typing
  socket.on('typing', (username) => {
    socket.broadcast.emit('userTyping', username);
  });

  // Handle stop typing
  socket.on('stopTyping', () => {
    socket.broadcast.emit('userStopTyping');
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    let username = Object.keys(users).find((key) => users[key] === socket.id);
    if (username) {
      delete users[username];
      io.emit('message', { sender: 'System', content: `${username} left the chat` });
      io.emit('onlineUsers', Object.keys(users));
    }
  });
});


app.use('/api/cart', cartRoutes);

logger.info('its working yash!');
const userId = 123;
logger.info(`User with ID ${userId} has logged in`);

// const dotenv = require('dotenv');
// dotenv.config({path:'../'});

const connection = mysql.createConnection({
  host: 'localhost',      
  user: 'root',         
  password: 'Yashu@123',           
  database: 'inventoryy'  
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

const PORT = 5001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
   
    // Ensure the function is called correctly
    setImmediate(() => processPendingFiles());

    // Set interval to run every 10 minutes
    setInterval(() => processPendingFiles(), 10 * 60 * 1000);
});

