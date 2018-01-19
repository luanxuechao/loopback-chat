'use strict';
const utils = require('../tools/Utils');
module.exports = function(Model, options) {
  Model.observe('before save', function(ctx, next) {
    let props = Model.definition.properties;
    if (!ctx.data && !ctx.isNewInstance) {
      return next();
    }
    let keys, key;
    let result = {};
    if (ctx.data) {
      keys = Object.keys(ctx.data);
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('$') == 0) {
          continue;
        }
        key = keys[i];
        if (!props[key]) {
          delete ctx.data[key];
        }
      }
    }
    if (ctx.isNewInstance) {
      keys = Object.keys(ctx.instance['__data']);
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('$') == 0) {
          continue;
        }
        key = keys[i];
        if (!props[key]) {
          delete ctx.instance['__data'][key];
        }
      }
    }
    next();
  });
};
