/*  Simple Test Subscriber


*/
console.log("Argv: " + process.argv.length );
if (process.argv.length < 3) {
	console.log("Usage: node simpleTestSubscriber.js crcypair");
	process.exit;
}
var Faye   = require('faye') ;

console.log("Started");
var client = new Faye.Client('http://localhost:3000/faye');

console.assert(client);
console.log("Connected!");

var subfunc = function (message) {
	console.log(Date() + " Got Message: \n\t" 
		+ message.channel + " : " + message.sym + "\n\t" + 
		message.bid + " / " + message.ask);

}
client.bind('transport:down', function() {
	console.log(Date() + "Transport Down");
});
client.bind('transport:up', function() {
	console.log(Date() + "Transport Up");
});
var subscription = client.subscribe ( '/faye/fx/quote/' + process.argv[2], subfunc );


