'use strict';
var co = require('co');
var chatUserService = require('../services/ChatUserService');
var chatRoomService = require('../services/ChatRoomService.js');
module.exports = function(Chatroom) {
  Chatroom.getChatRoom = function(req, cb) {
    co(function*() {
      let userId = req.accessToken.userId;
      let UserModel = Chatroom.app.models[req.accessToken.principalType];
      let ChatRoomUserLink = Chatroom.app.models.ChatRoomUserLink;
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
};
