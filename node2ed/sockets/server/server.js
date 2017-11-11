'use strict';

const
    path = require('path'),
    express = require('express'),
    http = require('http'),
    socketIO = require('socket.io');

const publicPath = path.join(__dirname, '../public');

const
    app = express(),
    port = process.env.PORT || 3000,
    server = http.createServer(app),
    io = socketIO(server),
    { isRealStreang } = require('./utils/validation'),
    { generateMessage, generateLocationMessage } = require('./utils/message');

app.use(express.static(publicPath));
app.use('/', function (req, res, next) {
    console.log('Request Url:' + req.url);
    next();
});

io.on('connection', (socket) => {
    console.log('new user connected');
  //  socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));    
   // socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined'));
    
    socket.on('join', (params, callback) => {
        if (!isRealStreang(params.name) || !isRealStreang(params.room)) {
            callback('Name and room name are required');
        }

        socket.join(params.room);
        // socket.leave(params.room);

        // io.emit -> io.to('The office Fans').emit
        // socket.broadcast.emit -> socket.broadcast.to('The Office Fans').emit
        // socket.emit

        socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
        socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} joined`));

        callback();
    });

    socket.on('createMessage', (message, callback) => {
        console.log('createMessage', message);                
        io.emit('newMessage', generateMessage(message.from, message.text));
        callback();
    });

    socket.on('createLocationMessage', (coords) => {
        io.emit('newLocationMessage', generateLocationMessage('Admin', coords.latitude, coords.longitude));
    });

    socket.on('disconnect', () => {
        console.log('User was disconnected');
    });
});

server.listen(port, () => {
    console.log(`server is up on port ${port}`);
});
