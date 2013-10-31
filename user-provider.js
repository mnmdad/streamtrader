/**
 * Created with IntelliJ IDEA.
 * User: david
 * Date: 29/09/13
 * Time: 9:19 PM
 * To change this template use File | Settings | File Templates.
 */
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

UserProvider = function(host, port) {
    this.db= new Db('tapaas-user', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
    this.db.open(function(){});
};


UserProvider.prototype.getCollection= function(callback) {
    this.db.collection('users', function(error, user_collection) {
        if( error ) callback(error);
        else callback(null, user_collection);
    });
};

//find all users
UserProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, user_collection) {
        if( error ) callback(error)
        else {
            user_collection.find().toArray(function(error, results) {
                if( error ) callback(error)
                else callback(null, results)
            });
        }
    });
};

//find an user by username
UserProvider.prototype.findByUsername = function(username, callback) {
    this.getCollection(function(error, user_collection) {
        if( error ) callback(error)
        else {
            user_collection.findOne({'username': username }, function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
        }
    });
};


//find one user
UserProvider.prototype.findOne = function(criteria, callback) {
    this.getCollection(function(error, user_collection) {
        if( error ) callback(error)
        else {
            user_collection.findOne(criteria, function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
        }
    });
};
//save new user
UserProvider.prototype.save = function(users, callback) {
    this.getCollection(function(error, user_collection) {
        if( error ) callback(error)
        else {
            if( typeof(users.length)=="undefined")
                users = [users];

            for( var i =0;i< users.length;i++ ) {
                user = users[i];
                user.created_at = new Date();
            }

            user_collection.insert(users, function() {
                callback(null, users);
            });
        }
    });
};

exports.UserProvider = UserProvider;