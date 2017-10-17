// 'use strict';
//
// module.exports = function(server) {
//   // Install a `/` route that returns server status
//   var router = server.loopback.Router();
//   router.get('/', server.loopback.status());
//   server.use(router);
// };

'use strict';
var ChatUserService = require('../../common/services/ChatUserService');
module.exports = function(app) {
  var router = app.loopback.Router();

  router.get('/', function(req, res) {
    res.render('index');
  });

  router.get('/lab', function(req, res) {
    res.render('lab');
  });

  router.get('/chat/userList', function(req, res) {
    app.models.ChatUser.find({}, function(err, contractorUsers) {
      if (err) console.log(err);
      res.render('chat/userList', {
        contractorUsers: contractorUsers,
      });
    });
  });

  router.get('/chat/user/:userId/rooms', function(req, res) {
    app.models.ChatUser.find({
      where: {'id': req.params.userId},
      include: 'chatRooms',
    }, function(err, contractUser) {
      if (err) console.log(err);
      res.render('chat/rooms', {
        rooms: contractUser[0].chatRooms(),
        userId: req.params.userId,
      });
    });
  });

  // router.post('/chat/login', function(req, res) {
  //   app.models.ChatRoom.find(
  //     {where: {'chatUserList.userId': req.body.username}},
  //     function(err, chatRooms) {
  //       if (err) console.log(err);
  //       res.render('chat/rooms', {
  //         rooms: chatRooms,
  //         userId: req.body.username
  //       });
  //     });
  // });

  router.get('/chat/room/:roomId/user/:userId', function(req, res) {
    app.models.ChatRoom.findById(req.params.roomId, function(err, chatRoom) {
      if (err) console.log(err);
      ChatUserService.findChatUser([chatRoom], function(err, chatRooms) {
        // res.send(chatRooms);
        // res.end();
        res.render('chat/chatroom', {
          room: chatRooms[0],
          userId: req.params.userId,
        });
      });
    });
  });

  app.use(router);
};
