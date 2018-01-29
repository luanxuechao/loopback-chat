'use strict';
const ObjectId = require('mongodb').ObjectId;
const co = require('co')
module.exports = function(Friendmessage) {

  Friendmessage.deleted = function(req, cb) {
    co(function*() {
      let userId = req.accessToken.userId;
      let info  = yield function(callback){
        Friendmessage.updateAll({
          creatorId: userId
        }, {
          creatorDeleted: true
        }, callback)
      };
      info  = yield function(callback){
        Friendmessage.updateAll({
          receiverId: userId
        }, {
          receiverDeleted: true
        }, callback)
      };
      return info;
    }).then(function(value){
      cb(null,value);
    }).catch(function(err){
      cb(err);
    })
  }
  Friendmessage.remoteMethod(
    'deleted', {
      http: {
        path: '/deletedMessage',
        verb: 'delete'
      },
      accepts: [{
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }],
      returns: {
        arg: 'body',
        type: 'object',
        root: true
      }
    }
  );
};
