'use strict';
module.exports={
  isNlOrUndOrEmpty: function(str) {
    return Boolean(str == null || str == undefined || str == '');
  }
}
