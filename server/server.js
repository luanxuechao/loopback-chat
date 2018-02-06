'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var socketHandler = require('./socket/socket');
var redis = require('socket.io-redis');


var app = module.exports = loopback();
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs'); // LoopBack comes with EJS out-of-box
app.set('json spaces', 2); // format json responses for easier viewing

app.start = function() {
  // start the web server
  var res = app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  app.io = require('socket.io')(res);
  app.io.adapter(redis(app.datasources.redisDs.settings));
  app.io.set('transports', ['websocket']);
  socketHandler(app);
  return res;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
  app.start()
  // app.io = require('socket.io')(app.start());
  // app.io.adapter(redis({ host: 'localhost', port: 6379 }));
  // app.io.set('transports', ['websocket']);
  // socketHandler(app);
});
