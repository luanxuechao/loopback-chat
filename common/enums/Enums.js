'use strict';
module.exports = Enums;

function Enums(){

}

// 消息状态
Enums.MessageStatus={
  'READ':'READ',
  'UNREAD':'UNREAD'
}

// 消息结果
Enums.MessageResult ={
  //等待验证
  AUTHENTICATION:'AUTHENTICATION',
  // 已添加
  SUCCESS:'SUCCESS',
  // 已拒绝
  FAILED:'FAILED'
}
