'use strict';
module.exports = function(Model, options) {
  Model.observe('access', function(ctx, next) {
    if (ctx.query.where && ctx.query.where.id) return next();
    ctx.query.order = ctx.query.order || 'createdAt DESC';
    next();
  });
};
