/**
 * Module dependencies.
 * Copywright TaPaaS
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

// setup provider for user profile data
var UserProvider = require('./user-provider').UserProvider;
var userProvider= new UserProvider('localhost', 27017);

// Fake Authentication

// Setup Passport Local Strategy
passport.use(new LocalStrategy(
    function(username, password, done) {
        userProvider.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }  /*
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }    */
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    console.log("Serialised User:" , user);
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    userProvider.findOne({'_id': id}, function (err, user) {
        done(err, user);
    });
});
/* Create Express App and Configure
*/
var bodyParser = require('body-parser');

var app = express();

app.set('port', nconf.get('http-listener:port'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

/* Setup Middleware */

/*app.use(require('serve-favicon'));*/
var logger = require('morgan');
app.use(logger(nconf.get('logger')));
app.use(bodyParser.urlencoded({ extended: false}));
/*app.use(require('method-override'));*/
var cookieParser = require('cookie-parser');
app.use(cookieParser(nconf.get('cookie-secret')));
var expressSession = require('express-session');
app.use(expressSession({secret:'<my little>', saveUninitialized: true,
                 resave: true}));
app.use(passport.initialize());
app.use(passport.session());

/* Setup the Routes */

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
// User Access
app.get('/users', function(req, res){
    userProvider.findAll(function(error, users){
        res.render('users', {
            title: 'Users',
            users: users
        });
    });
});
app.get('/user/new', function(req, res) {
    res.render('user_new', {
        title: 'New User'
    });
});

//save new employee
app.post('/user/new', function(req, res){
    userProvider.save({
        username: req.param('username'),
        password: req.param('password')
    }, function( error, docs) {
        res.redirect('/users')
    });
});

app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

var errorHandler = require('errorhandler'); 
app.use(errorHandler());

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

