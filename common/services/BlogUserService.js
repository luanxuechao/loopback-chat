'use strict'
module.exports ={
  isbe: function(Model,mobile,cb){
    Model.find({
      where:{
        mobile:mobile
      }
    },function(err,users){
      if(err) return cb(err);
      cb(err,users[0]);
    })
  }
}
