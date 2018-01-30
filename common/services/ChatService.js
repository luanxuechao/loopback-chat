'use strict';
const co = require('co');
const Utils = require('../tools/Utils');
const ObjectId = require('mongodb').ObjectId;
const Enums = require('../enums/Enums');
module.exports = {
  sendChatMessage: function(app, message, cb) {
    co(function* () {
      let UserModel = app.models[message.userType];
      let ChatRoomLinkModel = app.models.ChatRoomUserLink;
      let ChatMessageUserLink = app.models.ChatMessageUserLink;
      let ChatMessage = app.models.ChatMessage;
      if (UserModel == null || UserModel == undefined) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '用户类型不存在'});
        throw error;
      }
      let sender = yield function(callback) {
        UserModel.findById(message.userId, function(err, user) {
          if (err) return callback(err);
          callback(null, user);
        });
      };
      if (sender == null || sender == undefined) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '发送人信息错误'});
        throw error;
      }
      let chatRoomLinks = yield function(callback) {
        ChatRoomLinkModel.find({
          where: {chatRoomId: message.chatRoomId}
        }, function(err, links) {
          if (err) return callback(err);
          callback(null, links);
        });
      };
      if (chatRoomLinks.length == 0) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '聊天室不存在'});
        throw error;
      }
      let isbe = false;
      for (let i = 0; i <= chatRoomLinks.length - 1; i++) {
        if (chatRoomLinks[i].chatUserId.toString() == sender.id.toString()) {
          chatRoomLinks.splice(i, 1);
          isbe = true;
          break;
        }
      }
      if (!isbe) {
        let error = Object.assign(new Error(), {statusCode: 404, code: 'USER_NOT_FOUND', message: '你不在该聊天室'});
        throw error;
      }
      let chatMessage = yield function(callback) {
        ChatMessage.create({
          messageContent: message.messageContent,
          chatRoomId: message.chatRoomId,
          messageType: message.messageType,
          senderId: sender.id,
          senderType: message.userType
        }, function(err, chatMessage) {
          if (err) return callback(err);
          callback(null, chatMessage);
        });
      };
      let messageLinks = [];
      for (let i = 0; i <= chatRoomLinks.length - 1; i++) {
        let messageLink = {};
        messageLink.chatMessageId = chatMessage.id;
        messageLink.blogUserId = chatRoomLinks[i].chatUserId;
        messageLink.chatRoomId = chatMessage.chatRoomId;
        messageLink.status = Enums.MessageStatus.UNREAD;
        messageLinks.push(messageLink);
      }
      let messageUserLink = yield function(callback) {
        ChatMessageUserLink.create(messageLinks, function(err, messageLink) {
          if (err) return callback(err);
          callback(null, messageLink);
        });
      };
      return chatMessage;
    }).then(function(value) {
      cb(null, value);
    }).catch(function(err) {
      cb(err);
    });
  },
};
