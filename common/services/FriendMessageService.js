'use strict';
const blogUserService = require('./BlogUserService');
const co = require('co');
const Enums = require('../enums/Enums')
const ObjectId = require('mongodb').ObjectId;
module.exports = {
  sendFriendMessage: function(app, sendUserId, sendUserType, receiverMobile, cb) {
    co(function*() {
      let receiverUser = yield function(callback) {
        blogUserService.isbe(app.models.BlogUser, receiverMobile, callback);
      }
      if (!receiverUser) {
        throw Object.assign(new Error(), {
          statusCode: 404,
          code: 'MODEL_NOT_FOUND',
          message: '添加的好友不存在'
        });
      }
      let friendMessage = yield function(callback) {
        app.models.FriendMessage.findOne({
          where: {
            receiverId: receiverUser.id,
            creatorId: sendUserId,
            result: Enums.MessageResult.AUTHENTICATION
          },
          include: 'creator'
        }, callback)
      }
      if (friendMessage) {
        app.io.of('/chat').to(receiverMobile).emit('newFriend', friendMessage);
        return friendMessage
      };
      friendMessage = {
        receiverId: receiverUser.id,
        receiverType: sendUserType
      }
      let options = {
        accessToken: {
          userId: sendUserId,
          principalType: sendUserType
        }
      }
      friendMessage = yield function(callback) {
        app.models.FriendMessage.create(friendMessage, options, callback);
      }
      friendMessage = yield function(callback) {
        app.models.FriendMessage.findOne({
          where: {
            receiverId: receiverUser.id,
            creatorId: sendUserId,
            result: Enums.MessageResult.AUTHENTICATION
          },
          include: 'creator'
        }, callback)
      }
      app.io.of('/chat').to(receiverMobile).emit('newFriend', friendMessage);
      return friendMessage
    }).then(function(value) {
      cb(null, value);
    }).catch(function(err) {
      cb(err);
    })
  },
  resolveFriendMessage: function(app, message, cb) {
    co(function*() {
      let chatRoom = {};
      let info = yield function(callback) {
        app.models.FriendMessage.updateAll({
          id: ObjectId(message.messageId),
          receiverId: ObjectId(message.userId)
        }, {
          result: message.prompt
        }, callback);
      };
      if (info.count == 0) {
        throw Object.assign(new Error(), {
          statusCode: 404,
          code: 'MODEL_NOT_FOUND',
          message: '没有找到对应信息'
        });
      }
      let friendMessage = yield function(callback) {
        app.models.FriendMessage.findById(message.messageId, {
          include: ['creator', 'receiver']
        }, callback);
      }
      let options = {
        accessToken: {
          userId: message.userId,
          principalType: message.userType
        }
      }
      if (friendMessage.result == Enums.MessageResult.SUCCESS) {
        chatRoom = yield function(callback) {
          app.models.ChatRoom.create({}, options, function(err, chatRoom) {
            if (err) return callback(err);
            callback(null, chatRoom);
          });
        };
        let chatRoomUserLinks = [{
          chatRoomId: chatRoom.id,
          chatUserId: friendMessage.creatorId
        }, {
          chatRoomId: chatRoom.id,
          chatUserId: friendMessage.receiverId
        }]
        chatRoomUserLinks = yield function(callback) {
          app.models.ChatRoomUserLink.create(chatRoomUserLinks, callback);
        }
        // 刷新聊天室列表
        app.io.of('/chat').to(friendMessage.creator().mobile).emit('newChatRoom', chatRoomUserLinks);
      };
      // 刷新朋友消息列表
      app.io.of('/chat').to(friendMessage.creator().mobile).emit('newFriendMessage', friendMessage);
      return friendMessage
    }).then(function(value) {
      cb(null, value);
    }).catch(function(err) {
      cb(value);
    });
  }
}
