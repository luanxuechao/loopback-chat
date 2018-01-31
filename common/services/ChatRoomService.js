'use strict';
var baseDate = new Date('1970-01-01');

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
  isFriend: function(app,sendUserId,receiverUserId,cb){
    var ChatRoomUserLink = app.models.ChatRoomUserLink;
    ChatRoomUserLink.find({where:{
      chatUserId:{inq:[sendUserId,receiverUserId]}
    }},function(err,links){
      if(err) cb(err);
      for(let i=0;i<links.length; i++){
        for(let j=i+1;j<links.length;j++){
          if(links[i].chatRoomId.toString() == links[j].chatRoomId.toString()){
            return cb(null,true);
          }
        }
      }
      return cb(null,false)
    })
  },
    // 过滤每个ChatRoom 未读消息数
    filterUnReadMessages: function(chatRooms, UnReadMessages) {
      for (let i = 0; i <= chatRooms.length - 1; i++) {
        chatRooms[i].UnReadMessagesNum = 0;
        for (let k = 0; k <= UnReadMessages.length - 1; k++) {
          if (chatRooms[i].chatRoomId.toString() == UnReadMessages[k].chatMessage().chatRoomId.toString()) {
            chatRooms[i].UnReadMessagesNum++;
          }
        }
      }
      return chatRooms;
    },
};
