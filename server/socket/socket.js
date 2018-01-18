'use strict';

function socketsHandler(app) {
  let chatMessage = app.models.ChatMessage;
  let chatServer = app.io.of('/chat');
  let ExtendedAccessToken = app.models.ExtendedAccessToken;
  function isValid(token, cb) {
    ExtendedAccessToken.resolve(token, function(err, token) {
      if (err) cb(err);
      cb(null, token);
    });
  }
  app.io.use((socket, next) => {
    let a = app;
    let token = socket.handshake.query.access_token;
    isValid(token, function(err, data) {
      if (err) return next(err);
      if (data) {
        return next();
      } else {
        return next(Object.assign(new Error(), {statusCode: 401, code: 'AUTHORIZATION_REQUIRED', message: 'socket服务验证未通过'}));
      }
    });
  });
  chatServer.on('connection', function(socket) {
    console.log('a user connected');
    socket.join(socket.handshake.query.mobile, function() {
      return ;
    });
    socket.on('disconnect', function() {
      console.log('user disconnected');
    });
    socket.on('joinRoom', function(roomId, cb) {
      socket.join(roomId, function() {
        cb(true);
      });
    });
    socket.on('joinRooms', function(rooms, cb) {
      socket.join(rooms, function() {
        cb(true);
      });
    });
    socket.on('addFriend', function(param, cb) {
      socket.to(param.mobile).emit('newFriend', {data:'新的好友'});
      cb(null,true);
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
