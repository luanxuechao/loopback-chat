'use strict';
const blogUserService = require('./BlogUserService');
const co = require('co');
const Enums = require('../enums/Enums')
const ObjectId = require('mongodb').ObjectId;
module.exports ={
  sendFriendMessage: function(app,sendUserId,sendUserType,receiverMobile,cb){
    co(function*(){
      let receiverUser = yield function(callback){
        blogUserService.isbe(app.models.BlogUser,receiverMobile,callback);
      }
      if(!receiverUser){
        throw Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '添加的好友不存在'});
      }
      let friendMessage = yield function(callback){
        app.models.FriendMessage.findOne({
          where:{
            receiverId:receiverUser.id,
            creatorId:sendUserId,
            result:Enums.MessageResult.AUTHENTICATION
          },
          include:'creator'
        },callback)
      }
      if(friendMessage){
        app.io.of('/chat').to(receiverMobile).emit('newFriend', friendMessage);
        return friendMessage
      };
       friendMessage ={
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
  },
  resolveFriendMessage:function(app,message,cb){
    co(function*(){
      let info = yield function(callback){
        app.models.FriendMessage.updateAll({
          id:ObjectId(message.messageId),
          receiverId:ObjectId(message.userId)
        },{result:message.prompt},callback);
      };
      if(info.count == 0){
        throw Object.assign(new Error(), {statusCode: 404, code: 'MODEL_NOT_FOUND', message: '没有找到对应信息'});
      }
      let friendMessage = yield function(callback){
        app.models.FriendMessage.findById(message.messageId,{include:'creator'},callback);
      }
      app.io.of('/chat').to(friendMessage.creator().mobile).emit('newFriendMessage', friendMessage);
      return friendMessage
    }).then(function(value){
      cb(null,value);
    }).catch(function(err){
      cb(value);
    });
  }
}
