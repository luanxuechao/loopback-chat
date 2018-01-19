'use strict';
const blogUserService = require('./BlogUserService');
const co = require('co');
module.exports ={
  sendFriendMessage: function(app,sendUserId,sendUserType,receiverMobile,cb){
    co(function*(){
      let receiverUser = yield function(callback){
        blogUserService.isbe(app.models.BlogUser,receiverMobile,callback);
      }
      if(!receiverUser){
        throw Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '添加的好友不存在'});
      }
      let friendMessage ={
        receiverId:receiverUser.id,
        receiverType:sendUserType
      }
      let options ={
        accessToken:{
          userId:sendUserId,
          principalType:sendUserType
        }
      }
      friendMessage =yield function(callback){
        app.models.FriendMessage.create(friendMessage,options,callback);
      }
      app.io.of('/chat').to(receiverMobile).emit('newFriend', friendMessage);
      return friendMessage
    }).then(function(value){
      cb(null,value);
    }).catch(function(err) {
      cb(err);
    })
  }
}
