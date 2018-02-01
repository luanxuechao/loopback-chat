'use strict';
const friendMessageService = require('../../common/services/FriendMessageService');
const Utils = require('../../common/tools/Utils')
const ObjectId = require('mongodb').ObjectId;
const pageService = require('../../common/services/PageService')
const Enums = require('../../common/enums/Enums')
const chatService = require('../../common/services/ChatService')

function socketsHandler(app) {
  let chatMessage = app.models.ChatMessage;
  let chatServer = app.io.of('/chat');
  let ExtendedAccessToken = app.models.ExtendedAccessToken;
  let FriendMessage = app.models.FriendMessage;
  let ChatRoomUserLink = app.models.ChatRoomUserLink;
  let ChatRoom = app.models.ChatRoom;
  let ChatMessageUserLink =  app.models.ChatMessageUserLink;
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
    socket.on('joinRooms', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.userId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少必要信息'});
        cb && cb(error);
      }
      ChatRoomUserLink.find({
        where: {chatUserId: ObjectId(param.userId)},
        fields: ['chatRoomId']
      }, function(err, roomLinks) {
        if (err) {
          cb && cb(err);
        } else {
          let rooms = roomLinks.map(function(roomLink) {
            return roomLink.chatRoomId.toString();
          });
          socket.join(rooms, function() {
            cb && cb(null, true);
          });
        };
      });
    });
    socket.on('disconnect', function() {
      console.log('user disconnected');
    });
    socket.on('addFriend', function(param, cb) {
      friendMessageService.sendFriendMessage(app, param.userId, param.userType, param.mobile, function(err, message) {
        cb(err, message);
      });
    });
     // 标记消息已读
     socket.on('readChatMessage', function(message, cb) {
      if (Utils.isNlOrUndOrEmpty(message.userId) || Utils.isNlOrUndOrEmpty(message.chatRoomId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少消息必要信息'});
        cb && cb(error);
      } else {
        if (message.id) {
          ChatMessageUserLink.updateAll({
            chatMessageId: ObjectId(message.id),
            blogUserId: ObjectId(message.userId),
            chatRoomId: ObjectId(message.chatRoomId),
          }, {status: Enums.MessageStatus.READ}, function(err, userMessageLink) {
            if (err) {
              cb && cb(err);
            } else {
              cb && cb(null, userMessageLink);
            }
          });
        } else {
          ChatMessageUserLink.updateAll({
            blogUserId: ObjectId(message.userId),
            chatRoomId: ObjectId(message.chatRoomId),
            createdAt: {lte: new Date()},
            status: Enums.MessageStatus.UNREAD
          }, {status: Enums.MessageStatus.READ}, function(err, ChatMessageUserLinks) {
            if (err) {
              cb && cb(err);
            } else {
              cb && cb(null, ChatMessageUserLinks);
            }
          });
        }
      }
    });
    socket.on('getFriendMessages', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.userId)) {
        let error = Object.assign(new Error(), {
          statusCode: 404,
          code: 'MISSING_PARAMETER',
          message: '缺少站内信必要信息'
        });
        return cb && cb(error);
      }
      let where = {
        or: [{
          receiverId: ObjectId(param.userId),
          receiverDeleted:false
        }, {
          creatorId: ObjectId(param.userId),
          creatorDeleted:false
        }]
      };
      let include = ['creator', 'receiver'];
      pageService.find(FriendMessage, where, include, param.pageNo, param.pageSize, function(err, result) {
        if (err) return cb && cb(err);
        cb && cb(null, result);
      })
    });
    socket.on('readFriendMessages', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.userId)) {
        let error = Object.assign(new Error(), {
          statusCode: 404,
          code: 'MISSING_PARAMETER',
          message: '缺少站内信必要信息'
        });
        cb && cb(error);
      } else {
        FriendMessage.updateAll({
          receiverId: ObjectId(param.userId),
        }, {
          status: Enums.MessageStatus.READ
        }, function(err, messages) {
          if (err) {
            cb && cb(err);
          } else {
            cb && cb(null, messages);
          }
        });
      }
    });
    socket.on('unReadFriendMessageCount', function(params, cb) {
      if (Utils.isNlOrUndOrEmpty(params.userId)) {
        let error = Object.assign(new Error(), {
          statusCode: 404,
          code: 'MISSING_PARAMETER',
          message: '缺少站内信必要信息'
        });
        return cb && cb(error);
      }
      FriendMessage.count({
        status: Enums.MessageStatus.UNREAD,
        receiverId: ObjectId(params.userId)
      }, function(err, count) {
        if (err) {
          cb && cb(err);
        } else {
          cb && cb(null, {
            count: count
          });
        }
      });
    })
    socket.on('message', function(message, cb) {
      if (Utils.isNlOrUndOrEmpty(message.messageContent) || Utils.isNlOrUndOrEmpty(message.userId) || Utils.isNlOrUndOrEmpty(message.chatRoomId) || Utils.isNlOrUndOrEmpty(message.messageType) || Utils.isNlOrUndOrEmpty(message.userType)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少消息必要信息'});
        cb && cb(error);
      } else {
        chatService.sendChatMessage(chatMessage.app, message, (err, data) => {
          if (err) {
            cb && cb(err);
          } else {
            chatMessage.findById(data.id, {include: 'sender'}, (err, messageModel)=>{
              socket.to(messageModel.chatRoomId).emit('message', messageModel);
              cb && cb(null, messageModel);
            });
          }
        });
      }
    });
    socket.on('resolveFriendMessage', function(message, cb) {
      if (Utils.isNlOrUndOrEmpty(message.messageId) || Utils.isNlOrUndOrEmpty(message.prompt)) {
        let error = Object.assign(new Error(), {
          statusCode: 404,
          code: 'MISSING_PARAMETER',
          message: '缺少必要信息'
        });
        return cb && cb(error);
      }
      friendMessageService.resolveFriendMessage(app, message, function(err, message) {
        cb(err, message);
      });
    });
     // 获取历史消息
     socket.on('getHistoryMessage', function(param, cb) {
      if (Utils.isNlOrUndOrEmpty(param.chatRoomId)) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MISSING_PARAMETER', message: '缺少必要信息'});
        cb && cb(error);
      } else {
        if (!param.limit) {
          param.limit = 5;
        }
          param.accessToken={
            userId:ObjectId(param.userId),
            principalType:param.userType
        }
        ChatRoom.getHistoryMessageWithDate(param.chatRoomId, param.createdAt, param.limit, param,function(err, data) {
          if (err) {
            cb && cb(err);
          } else {
            cb &&cb(null, data);
          }
        });
      }
    });
  });

}
module.exports = socketsHandler;
