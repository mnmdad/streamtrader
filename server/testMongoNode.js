/* Simpler Server for Faye Messaging
*/

var Faye   = require('faye'),
    server = new Faye.NodeAdapter({mount: '/faye'});

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


server.listen(8080);


