'use strict';

function socketsHandler(app) {
  var chatMessage = app.models.ChatMessage;
  var chatServer = app.io.of('/chat');
  chatServer.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('disconnect', function() {
      console.log('user disconnected');
    });
    socket.on('joinRoom', function(roomId, cb) {
      socket.join(roomId, function() {
        // app.io.of('/chat').adapter.clients((err, clients) => {
        //   console.log("clients",clients); // an array containing all connected socket ids
        // });
        // app.io.of('/chat').adapter.allRooms((err, rooms) => {
        //   console.log("rooms",rooms); // an array containing all rooms (accross every node)
        // });
        cb(true);
      });
    });
    socket.on('joinRooms', function(rooms, cb) {
      socket.join(rooms, function() {
        cb(true);
      });
    });
    socket.on('message', function(message, cb) {
      chatMessage.create({
        'messageContent': message.messageContent,
        'userId': message.userId,
        'chatRoomId': message.chatRoomId
      },
      function(err, message) {
        chatMessage.findById(message.id, function(err, data) {
          socket.to(data.chatRoomId).emit('message', data);
          cb(data);
        });
      });
    });
  });

}
module.exports = socketsHandler;
