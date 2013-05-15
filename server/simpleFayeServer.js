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
server.listen(8000);


