var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');

MessageProvider = function(host, port) {
  this.db = new Db('stdb', new Server(host, port), {safe: false});//, {auto_reconnect: true}, { w: 1, journal: true, fsync: false }));
  this.db.open(function(error, db){
    assert.equal(null,error);
  });
  this.db.stats(function(error, stats) {
    assert.equal(null, error);
    console.log( "Connected! Stats: Collections: " + stats.collections + " Objects: " + stats.objects ); 
  });

};


MessageProvider.prototype.getCollection= function(callback) {
  this.db.collection('messages', function(error, message_collection) {
    if( error ) callback(error);
    else {
      console.log("MP.getCollection got" , message_collection.collectionName);
      callback(null, message_collection);
    }
  });
};

MessageProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, message_collection) {
      if( error ) callback(error)
      else {

        message_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};


MessageProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, message_collection) {
      if( error ) callback(error)
      else {
        message_collection.findOne({_id: message_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

MessageProvider.prototype.save = function(messages, callback) {
    console.log("MP.save called with ", messages);
    this.getCollection( function(error, message_collection) {
      if( error ) callback(error)   
      else {

        message_collection.count(function(error, count){
          assert.equal(null, error) ;
          console.log("MP.save messages has:", count);
        });
        if( typeof(messages.length)=="undefined")
          messages = [messages];

        for( var i =0;i< messages.length;i++ ) {
          message = messages[i];
          message.created_at = new Date();
          if( message.comments === undefined ) message.comments = [];
          for(var j =0;j< message.comments.length; j++) {
            message.comments[j].created_at = new Date();
          }
        }
        console.log("MP.save calling col.insert: " , messages)

        message_collection.insert(messages, function(error, result) {
          assert.equal(null, error);
          var bla = message_collection.find();
          //console.log("MP.save after insert: ", bla);
          callback(null, result);
        });
        setTimeout(function() {
        // Fetch the document
            message_collection.find().toArray( function(err, items) {
              if(err) console.log("Error: ", err);
            assert.equal(null, err);
            console.log("MP.save: after save count: ", items[0] );
           
          })
        }, 100);
      }
    });
};
MessageProvider.prototype.close = function() {
  this.db.close();
};

exports.MessageProvider = MessageProvider;
