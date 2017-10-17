'use strict';
var baseDate = new Date('1970-01-01');
var app = require('../../server/server');

module.exports = {
  // 获取聊天室id
  getChatRoomIds: function(rooms) {
    if (rooms != null) {
      var roomIds = [];
      for (var i = 0; i < rooms.length; i++) {
        roomIds[i] = rooms[i].id;
      }
      return roomIds;
    } else {
      return null;
    }
  },
  /*
  * 获取最小修改时间
  */
  obtainActiveTime: function(chatRoom, userId) {
    for (var i in chatRoom.chatRoomUserLinks) {
      if (userId == chatRoom.chatRoomUserLinks[i].chatUserId.toString() &&
         (chatRoom.chatRoomUserLinks[i].lastObtentionMsgTime != undefined ||
          chatRoom.chatRoomUserLinks[i].lastObtentionMsgTime != null)) {
        return new Date(chatRoom.chatRoomUserLinks[i].lastObtentionMsgTime);
      }
    }
    return baseDate;
  },
  // 修改获取消息最后时间
  updatelastObtain: function(userId) {
    var ChatRoomUserLink = app.models.ChatRoomUserLink;
    ChatRoomUserLink.updateAll({chatUserId: userId},
      {'lastObtentionMsgTime': new Date()},
      function(err, ChatRoomUserLink) {
        if (err) throw err;
      });
  }
};
