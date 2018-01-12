'use strict';

module.exports = function(Bloguser) {
  Bloguser.beforeRemote('create',function(ctx,model,next){
    console.log(ctx.body);
    next();
  });
};
