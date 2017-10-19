
module.exports= function(app){
 var ChatUser = app.models.ChatUser;
 var ChatRoom = app.models.ChatRoom;

 ChatRoom.create([
   {name:'测试房间1'},
   {name:'测试房间2'}
  ],function(err,chatRooms){
    if(err) throw err;
    chatRooms[0].chatUsers.create([
      {nickName:"测试人1"},
      {nickName:"测试人2"}
    ],function(err,users){
      if(err) throw err;
      console.log(users);
    })
 })

}
