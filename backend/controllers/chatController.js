const socketIo = require('socket.io');

// Function to handle user joining a room
const joinRoom = (socket, room) => {
  socket.join(room);
  console.log(`User ${socket.id} joined room: ${room}`);
};


// Function to handle sending a message to a room
const sendMessage = (io, message) => {
    if (!message.content.trim()) {
      console.log('Empty message, not broadcasting.');
      return; // Prevent broadcasting empty messages
    }
    io.to(message.room).emit('message', message);  // Broadcast message to the room
  };

// Function to handle confirming message receipt
const messageReceived = (socket, messageId) => {
  socket.emit('messageAck', messageId);  // Send acknowledgment
};

module.exports = {
  joinRoom,
  sendMessage,
  messageReceived
};