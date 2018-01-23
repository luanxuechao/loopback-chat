'use strict';
const friendMessageService = require('../../common/services/FriendMessageService');
const Utils = require('../../common/tools/Utils')
const ObjectId = require('mongodb').ObjectId;
const pageService = require('../../common/services/PageService')
const Enums = require('../../common/enums/Enums')
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
    socket.on('getFriendMessages', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.userId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少站内信必要信息'});
         return cb && cb(error);
      }
      let where ={
        or: [{receiverId: ObjectId(param.userId)}, {creatorId: ObjectId(param.userId)}]
      };
      let include = ['creator','receiver'];
      pageService.find(FriendMessage, where, include,param.pageNo, param.pageSize, function(err,result){
        if(err) return cb && cb(err);
        cb && cb(null,result);
      })
    });
    socket.on('readFriendMessages', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.userId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少站内信必要信息'});
        cb && cb(error);
      } else {
        FriendMessage.updateAll({
          receiverId: ObjectId(param.userId),
        }, {status: Enums.MessageStatus.READ}, function(err, messages) {
          if (err) {
            cb && cb(err);
          } else {
            cb && cb(null, messages);
          }
        });
      }
    });
    socket.on('unReadFriendMessageCount',function(params,cb){
      if (Utils.isNlOrUndOrEmpty(params.userId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少站内信必要信息'});
         return cb && cb(error);
      }
      FriendMessage.count({
        status: Enums.MessageStatus.UNREAD,
        receiverId: ObjectId(params.userId)
      },function(err, count) {
        if (err) {
          cb && cb(err);
        } else {
          cb && cb(null, {count:count});
        }
      });
    })
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
