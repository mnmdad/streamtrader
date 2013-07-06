/* Simpler Server for Faye Messaging
*/

var Faye   = require('faye'),
    server = new Faye.NodeAdapter({mount: '/faye'});

var MessageProvider = require('./messageprovider-mongodb').MessageProvider;

var messageProvider = new MessageProvider('localhost', 27017);

messageProvider.save( [ {   sym: "AUDUSD", bid: 103 } ], 
    function (error, docs) { 
      if(error) console.log("Error from Mongo: " + error + " Docs:" + docs);
      else {
        console.log("Save to Mongo Worked");
        console.log("\tSaved: " + docs[0].sym + " saved");
      }

    }
  );




server.bind('handshake', function(clientId) {
	console.log('Got Handshake from ClientId == ' + clientId);
});
server.bind('subscribe', function(clientId, channel) {
	console.log('Got Subscription, ClientId: ' + clientId + ' Channel: ' 
		+ channel);
});
server.bind('publish', function(clientId, channel) {
	console.log('Got Publish, ClientId: ' + clientId + ' Channel: ' 
		+ channel);
});


server.addExtension({
  outgoing: function(message, callback) {
    if (message.channel === '/meta/subscribe' && message.successful) {
      message.ext = message.ext || {};
      //message.ext.currentState = getCurrentStateData(message.subscription);
    }
    callback(message);
  }
});

/*
var client = new Db('test', new Server("127.0.0.1", 27017, {}), {w: 1}),
        test = function (err, collection) {
          collection.insert({a:2}, function(err, docs) {

            collection.count(function(err, count) {
              test.assertEquals(1, count);
            });

            // Locate all the entries using find
            collection.find().toArray(function(err, results) {
              test.assertEquals(1, results.length);
              test.assertTrue(results[0].a === 2);

              // Let's close the db
              client.close();
            });
          });
        };

    client.open(function(err, p_client) {
      client.collection('test_insert', test);
    });

*/
server.listen(8080);


