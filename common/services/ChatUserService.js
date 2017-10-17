'use strict';

let app = require('../../server/server');
var co = require('co');
module.exports = {
  findChatUser: function(chatRooms, cb) {
    let ChatRoomUserLink = app.models.ChatRoomUserLink;
    let ContractorUser = app.models.ContractorUser;
    let ProviderUser = app.models.ProviderUser;
    // let result = null;
    let roomIds = [];
    chatRooms.forEach(function(chatRoom) {
      roomIds.push(chatRoom.id);
    });
    co(function* () {
      // 查询聊天室关系
      let chatRoomUserLinks = yield function(callback) {
        ChatRoomUserLink.find({
          where: {
            chatRoomId: {inq: roomIds}
          },
          include: 'chatUser'
        }, function(err, chatRoomLinks) {
          if (err) callback(err);
          callback(null, chatRoomLinks);
        });
      };
      if (chatRoomUserLinks.length == 0) return null;
      // 聊天室添加了聊天关系信息
      chatRooms.forEach(function(chatRoom) {
        chatRoom.chatRoomUserLinks = [];
        for (let i = 0; i < chatRoomUserLinks.length; i++) {
          if (chatRoom.id.toString() == chatRoomUserLinks[i].chatRoomId.toString()) {
            chatRoom.chatRoomUserLinks.push(chatRoomUserLinks[i]);
          }
        }
      });
      return chatRooms;
    }).then(function(value) {
      cb(null, value);
    }).catch(function(error) {
      cb(null, error);
    });
  },
};
function filterUser(chatRoomLinks) {
  let result = {
    contractUserIds: [],
    providerUserIds: []
  };
  chatRoomLinks.forEach(function(chatRoomLink) {
    if (chatRoomLink.chatUserType == 'ProviderUser') {
      result.providerUserIds.push(chatRoomLink.chatUserId);
    }
    result.contractUserIds.push(chatRoomLink.chatUserId);
  });
  return result;
}
