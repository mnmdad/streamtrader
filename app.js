
/**
 * Module dependencies.
 * Copywright Agile Architechs
 */

//
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
//
var fs    = require('fs'),
    nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: 'path/to/config.json' });


var express = require('express')
  , store = require('./routes/store')
  , http = require('http')
  , path = require('path');

var Faye   = require('faye'),
    adapter = new Faye.NodeAdapter({mount: '/faye'});

/* Create Express App and Configure
*/
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/* setup routes to view templates
*/
app.get('/', store.index);
app.get('/sales', store.sales);
app.get('/trader', store.trader);
app.get('/insto', store.insto);
app.get('/boots', store.boots);

// Server-side extension to lock player messages to client that added
// the player in the first place,
// http://japhr.blogspot.com/2010/08/per-message-authorization-in-faye.html
var serverAuth = {
  incoming: function(message, callback) {
    // ...
  }
};

/* Create Server (http), then attach the Faye Adapter, then start listening.
*/
var server = http.createServer(app);
adapter.attach(server);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

