'use strict';
const co = require('co');
const chatUserService = require('../services/ChatUserService');
const chatRoomService = require('../services/ChatRoomService.js');
const ObjectId = require('mongodb').ObjectId;
module.exports = function(Chatroom) {
  Chatroom.getChatRoom = function(req, cb) {
    co(function*() {
      let userId = req.accessToken.userId;
      let UserModel = Chatroom.app.models[req.accessToken.principalType];
      let ChatRoomUserLink = Chatroom.app.models.ChatRoomUserLink;
      let ChatMessageUserLink = Chatroom.app.models.ChatMessageUserLink;
      let links = yield function(callback) {
        ChatRoomUserLink.find({
          where: {
            chatUserId: userId
          }
        }, function(err, links) {
          if (err) return callback(err);
          callback(err, links);
        });
      }
      let chatRoomIds = links.map((link)=>{
        return link.chatRoomId;
      });
      let chatRoomlinks = yield function(callback){
        ChatRoomUserLink.find({
        where:{
          chatRoomId:{
            inq:chatRoomIds
          },
          chatUserId:{
            neq:userId
          }
        },
        include: [{
          relation: 'chatRoom',
          scope: {
            include: [{
              relation: 'chatMessages',
              scope: {
                order: 'createdAt DESC',
                limit: 1,
                include: 'sender'
              }
            }]
          }
        },{relation: 'chatUser'}]
      },callback);
      }
      let unReadMessages = yield function(callback) {
        ChatMessageUserLink.find({
          where: {blogUserId: userId, status: 'UNREAD'},
          include: ['chatMessage']
        }, function(err, unReadMessages) {
          if (err) return callback(err);
          callback(null, unReadMessages);
        });
      };
      chatRoomlinks = chatRoomService.filterUnReadMessages(chatRoomlinks, unReadMessages);
      return chatRoomlinks;
    }).then(function(value){
      cb(null,value);
    }).catch(function(err){
      cb(err);
    });
  }
  Chatroom.remoteMethod(
    'getChatRoom', {
      http: {
        path: '/findChatRooms',
        verb: 'get'
      },
      accepts: [
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'body', type: 'object', root: true}
    }
  );

    // 查询通过本地消息记录时间历史消息
    Chatroom.getHistoryMessageWithDate =
    function(chatRoomId, createdAt, limit, req, cb) {
      let userId = req.accessToken.userId;
      let Chatmessage = Chatroom.app.models.ChatMessage;
      let ChatRoomUserLink = Chatroom.app.models.ChatRoomUserLink;
      co(function* () {
        let userLink = yield function(callback) {
          ChatRoomUserLink.findOne({
            where: {
              chatUserId: userId,
              chatRoomId: ObjectId(chatRoomId)
            }
          }, function(err, link) {
            if (err) return callback(err);
            callback(null, link);
          });
        };
        if (!userLink) {
          throw Object.assign(new Error(), {statusCode: 404, code: 'USER_NOT_FOUND', message: '你不在该聊天室'});
        }
        let chatmessages = null;
        if (createdAt) {
          chatmessages = yield function(callback) {
            Chatmessage.find({
              where: {
                chatRoomId: chatRoomId,
                createdAt: {'lt': new Date(parseInt(createdAt))}
              },
              limit: limit,
              include: ['sender'],
              order: 'createdAt DESC'
            }, {include: ['BlogUser']},function(err, chatmessages) {
              if (err) return callback(err);
              callback(null, chatmessages);
            });
          };
        } else {
          chatmessages = yield function(callback) {
            Chatmessage.find({
              where: {chatRoomId: chatRoomId},
              limit: limit,
              include: ['sender'],
              order: 'createdAt DESC'
            }, {include: ['ProviderUser','ContractorUser']},function(err, chatmessages) {
              if (err) cb(err);
              cb(err, chatmessages);
            });
          };
        }
        return chatmessages;
      }).then(function(value) {
        cb(null, value);
      }).catch(function(err) {
        cb(err);
      });
    };
  Chatroom.remoteMethod(
    'getHistoryMessageWithDate', {
      http: {
        path: '/:id/ChatMessages/HistoryMessage',
        verb: 'get'
      },
      accepts: [
        {arg: 'id', type: 'string', http: {source: 'path'}},
        {arg: 'createdAt', type: 'string', http: {source: 'query'}},
        {arg: 'limit', type: 'string', http: {source: 'query'}},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'body', type: 'object', root: true}
    }
  );

};
