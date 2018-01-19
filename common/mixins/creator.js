'use strict';
const ObjectId = require('mongodb').ObjectId;
module.exports = function createId(Model, options) {
  let creatorId = options.creatorId || 'creatorId';
  let creatorType = options.creatorType || 'creatorType';
  let required = (options.required === undefined ? true : options.required);
  Model.defineProperty(creatorId, {type: ObjectId, required: required});
  Model.defineProperty(creatorType, {type: String, required: required});
  Model.observe('before save', function event(context, next) {
    let isNewInstance = context.isNewInstance;
    let userId = null;
    let userType = null;
    if (context.options.accessToken) {
      userId = context.options.accessToken.userId;
      userType = context.options.accessToken.principalType;
    }
    if (isNewInstance && userId) {
      context.instance[creatorId] = userId;
      context.instance[creatorType] = userType;
    }
    next();
  });
};
