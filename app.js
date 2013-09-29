
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
    .file({ file: './config.json' });

// setup Express Web Application
var express = require('express')
  , store = require('./routes/store')
  , http = require('http')
  , path = require('path');


// Load Passport Authentication Library
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

// Setup Passport Local Strategy
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));

/* Create Express App and Configure
*/
var app = express();

app.configure(function(){
  app.set('port', nconf.get('http-listener:port'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/* Setup the Passport Login Page for Local Authentication
*/
app.post('/login',
    passport.authenticate(nconf.get('passport:strategy')),
    function(req, res) {
        // If this function gets called, authentication was successful.
        // `req.user` contains the authenticated user.
        res.redirect('/users/' + req.user.username);
});

/* setup routes to view templates
*/
app.get('/', store.index);
app.get('/login', store.login);
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


// setup Faye Pub/Sub Messaging
var Faye   = require('faye'),
    redis  = require('faye-redis')

var bayeux = new Faye.NodeAdapter({
    mount: nconf.get('faye:mount'),
    timeout: nconf.get('faye:timeout'),
    engine: {
        type: redis,
        host: nconf.get('faye-redis:host')
    }

});

/* Create Server (http), then attach the Faye Adapter, then start listening.
*/
var server = http.createServer(app);
bayeux.attach(server);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

