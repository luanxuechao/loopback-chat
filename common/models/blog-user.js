'use strict';
const co = require('co');
const utils = require('../tools/Utils');
module.exports = function(Bloguser) {
  Bloguser.beforeRemote('create', function(ctx, model, next) {
    console.log(ctx.body);
    next();
  });
  Bloguser.beforeRemote('login', function event(ctx, modelInstance, next) {
    if (utils.isNlOrUndOrEmpty(ctx.req.body.mobile) || utils.isNlOrUndOrEmpty(ctx.req.body.password)) {
      let error = new Error('手机号或者密码不能为空');
      error.statusCode = '404';
      error.code = 'MISSING_PARAMETER';
      return next(error);
    }
    co(function*() {
      let user = yield function(callback) {
        Bloguser.findOne({
          where:{
            mobile: ctx.req.body.mobile
          }
        }, function(err, user) {
          callback(err, user);
        });
      };
      if (!user) {
        let error = new Error('账号不存在');
        error.statusCode = '404';
        error.code = 'USER_NOT_FOUND';
        throw error;
      }
      let isMatch = yield function(callback) {
        user.hasPassword(ctx.req.body.password, callback);
      };
      if (!isMatch) {
        let error = new Error('用户名密码错误');
        error.statusCode = '401';
        error.code = 'LOGIN_ERROR';
        throw error;
      }
      let accessToken = yield function(cb) {
        user.accessTokens.create({'ttl': 1209600}, function(err, token) {
          if (err) cb(err);
          cb(null, token);
        });
      };
      user.token = accessToken.id;
      return user;
    }).then(function(value) {
      ctx.res.send(value);
      ctx.res.end();
    }).catch(function(err) {
      next(err);
    });
  });
  Bloguser.beforeRemote('replaceById',function(ctx, model, next){
    co(function*() {
      delete ctx.req.body.id
      delete ctx.req.body.mobile
      let info = yield function(callback){
        Bloguser.updateAll({id:ctx.req.params.id},ctx.req.body,callback)
      };
      return info

    }).then(function(value){
       ctx.res.send(value);
       return ctx.res.end();
    }).catch(function(err){
      next(err);
    });
  });
};
