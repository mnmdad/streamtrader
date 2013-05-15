/* Meta Message Subscriber
*/
var Faye   = require('faye') ;

console.log("Started");
var client = new Faye.Client('http://localhost:8000/faye');

console.assert(client);
console.log("Connected!");

var subfunc = function (message) {
	var ms = "";
	for (var k in message) {
		ms += message[k];
	}	
	console.log(Date() + " Got Message: " + ms);

}

client.subscribe ( '/faye/meta/**', subfunc );


