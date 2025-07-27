const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.get('/', (req, res) => {
  res.send('🛰️ Comet Server is live!');
});

io.on('connection', (socket) => {
  console.log(`[Comet] 🚀 User connected: ${socket.id}`);

  socket.on('message', (msg) => {
    io.emit('message', msg);
  });

  socket.on('call-user', (data) => {
    io.to(data.userToCall).emit('receive-call', {
      signal: data.signal,
      from: data.from,
    });
  });

  socket.on('accept-call', (data) => {
    io.to(data.to).emit('call-accepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log(`[Comet] ❌ User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
