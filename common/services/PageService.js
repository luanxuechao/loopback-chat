'use strict';
const co = require('co');
module.exports = {
  find: function(model, where, include,pageNo, pageSize, cb) {
    let result = {
      count: 0,
      datas: [],
      pageNo: pageNo,
      pageSize: pageSize
    };
    let skip = pageSize * pageNo;
    co(function* () {
      let count = yield function(callback) {
        model.count(where, function(err, modelsCount) {
          if (err) return callback(err);
          callback(null, modelsCount);
        });
      };
      result.count = count;
      if (count == 0) {
        cb(null, result);
      };
      let filter = {
        where: where,
        skip: skip,
        include:include
      };
      if (parseInt(pageSize)) {
        filter.limit = pageSize;
      }
      let datas = yield function(callback) {
        model.find(filter, function(err, resDatas) {
          if (err) return callback(err);
          callback(null, resDatas);
        });
      };
      result.datas = datas;
      return result;
    }).then(function(value) {
      cb(null, value);
    }).catch(function(err) {
      cb(err);
    });
  }
};
