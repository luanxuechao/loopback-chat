'use strict';
const friendMessageService = require('../../common/services/FriendMessageService');

function socketsHandler(app) {
  let chatMessage = app.models.ChatMessage;
  let chatServer = app.io.of('/chat');
  let ExtendedAccessToken = app.models.ExtendedAccessToken;
  let FriendMessage = app.models.FriendMessage;

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
        return next(Object.assign(new Error(), {
          statusCode: 401,
          code: 'AUTHORIZATION_REQUIRED',
          message: 'socket服务验证未通过'
        }));
      }
    });
  });
  chatServer.on('connection', function(socket) {
    console.log('a user connected');
    // 通过access_token 解析用户
    socket.use((packet, next) => {
      isValid(socket.handshake.query.access_token, function(err, data) {
        if (err) return next(err);
        if (data) {
          if (packet.length <= 2) {
            packet.splice(1, 0, {
              userId: data.userId.toString(),
              userType: data.principalType
            })
          } else {
            packet[1].userId = data.userId.toString();
            packet[1].userType = data.principalType;
          }
          return next();
        } else {
          return next(Object.assign(new Error(), {
            statusCode: 401,
            code: 'AUTHORIZATION_REQUIRED',
            message: 'socket服务验证未通过'
          }));
        }
      });
    });
    socket.join(socket.handshake.query.mobile, function() {
      return;
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
      friendMessageService.sendFriendMessage(app,param.userId,param.userType,param.mobile,function(err,message){
           cb(err,message);
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
