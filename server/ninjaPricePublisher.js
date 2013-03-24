//  Dummy Rate Publisher

var Faye   = require('faye') ;

var transportState = false;
var pubTimer = 1;
var pubInterval = 500;
var quoteId = 1;	
var client = new Faye.Client('http://localhost:3000/faye');
//var client = new Faye.Client('http://122.248.206.244:9000/faye');

client.bind('transport:down', function() {
        transportState = false;
	clearInterval(pubTimer);
	console.log("Transport is Down! Stopped Publishing");
    });
client.bind('transport:up', function() {
        transportState = true ;
	console.log("Transport is Up! Start Publishing");
	pubTimer = setInterval(publishFunction, pubInterval, client);
    });

var waitInterval = setInterval(function() {
	if(!transportState) console.log("Waiting on Transport");
}, 2000);

var seeds = [
	{ sym: 'AUDJPY', mid: 82.6806, spread: .0015 }
	,{ sym: 'AUDUSD', mid: 1.0529, spread: .0015 }
	,{ sym: 'AUDGBP', mid: 0.6706, spread: .0015 }
	,{ sym: 'AUDEUR', mid: 0.8523, spread: .0015 }
	,{ sym: 'EURUSD', mid: 1.2351, spread: .0015 }
];

var publishFunction = function(c) {
	for (var i=0;i<seeds.length;i++) {

		var message = seeds[i];
		var channel = '/faye/fx/quote/' + message.sym;

		message.bid = message.mid - Math.random()*message.spread; 
		message.ask = message.bid + message.spread;
		message.qid = quoteId++;
		message.timestamp = new Date().getTime();
	 
		console.log(Date() + "Pub: " + message.sym + " : " + message.bid ); 
		client.publish (channel, message ); 
	};
};

pubTimer = setInterval(publishFunction, pubInterval, client);
