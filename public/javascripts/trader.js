// This is app uses knockoutjs for mvvm and faye for bayeux messaging
//  simply creates a collection of Objects.
//  LiveQuoteModel contains a collection of Quotes that each subscribed to
//  channel


// TODO: this file no longer used.. .see if there is anyting special to save.
// Config
var channelPrefix = '/faye';
var oid = 10101;	
var client = new Faye.Client('http://localhost:3000/faye');

var transportState = ko.observable(false);
client.bind('transport:down', function() {
	transportState(false);
});
client.bind('transport:up', function() {
	transportState(true);
});
//ko.applyBindings(transportState);

var LiveQuoteModel = function(sym, bid, ask, qid) {
	var self = this;
	this.sym = sym, this.bid = ko.observable( bid ? bid : 0.0), this.ask = ko.observable( ask ? ask : 0.0), this.qid = ko.observable( qid ? qid : 0), this.equals = function(x) {
		if (this === x)
			return true;
		//if (! (x instanceOf LiveQuoteModel)) return false;
		if (this.sym == x.sym)
			return true;
		return false;
	}
	this.onMessage = function(message) {
		//	    if(message.sym != this.sym) return;
		if (message.bid != undefined) {
			self.bid(message.bid);
		}
		if (message.ask != undefined) {
			self.ask(message.ask);
		}
		self.qid(message.qid);
	}
	this.subscribe = function(client) {
		var channel = '/faye/fx/quote/' + this.sym;
		this.subscription = client.subscribe(channel, this.onMessage);
	}
	this.sendBuyOrder = function() {
		client.publish('/faye/fx/order/' + self.sym, {
			orderId: oid++, 
			qid : self.qid(),
			buySell : 'B',
			size : 1000,
			price : self.ask(),
			sym : self.sym
		});
	}
	this.sendSellOrder = function() {
		client.publish('/faye/fx/order/' + self.sym, {
			orderId: oid++, 
			qid : self.qid(),
			buySell : 'S',
			size : 1000,
			price : self.bid(),
			sym : self.sym
		});
	}
}
//var LiveOrderModel = function (orderId, status, sym, buySell, price, size) {
//require('js/liveOrderBlotter.js');

var LiveOrderModel = function(message) {
	var self = this;
	self.orderId = ko.observable(message.orderId ? message.orderId : 123);
	self.orderTime = ko.observable(Date());
	self.sym = ko.observable(message.sym ? message.sym : 'AUDUSD');
	self.buySell = ko.observable(message.buySell ? message.buySell : 'B');
	self.price = ko.observable(message.price ? message.price : 151.51);
	self.size = ko.observable(message.size ? message.size : 1000);
	

	self.amount = ko.observable(message.amount ? message.amount : 151510);
	self.filledSize = ko.observable(message.filledSize ? message.filledSize : 0);
	self.filledAmount = ko.observable(message.filledAmount ? message.filledAmount : 0);
	
	this.subscribe = function (client) {
		var channel = '/faye/fx/fill/' + self.orderId() ;
		this.subscription = client.subscribe(channel, this.onMessage);
    }
	this.cancelOrder = function() {

	}
	this.onMessage = function (message){
    	self.filledSize(message.filledSize + self.filledSize());
   
    }

	this.fillOrder = function() {
		var channel = '/faye/fx/fill/' + self.orderId();
		var message = {
			'orderId' : self.orderId(),
			'filledSize' : self.size(),
			'filledPrice' : self.price()
		}
		client.publish(channel, message);
	}
}
var LiveOrderBlotterModel = function(orders) {
	var self = this;
	self.orders = ko.observableArray(orders);

	this.subscribe = function(client) {
		var channel = '/faye/fx/order/**';
		this.subscription = client.subscribe(channel, this.onMessage);
	}
	this.onMessage = function(message) {
		//alert("Got a Message" + message);
		var order = new LiveOrderModel(message)
		self.orders.push(order);

	}
}
var initialData = [new LiveQuoteModel("AUDJPY"), new LiveQuoteModel("AUDUSD", 145.45, 145.47), new LiveQuoteModel("AUDEUR", 45.45, 45.47)];

var WatchListModel = function(things) {
	var self = this;
	self.items = ko.observableArray(things);

};
var theStuff = new WatchListModel(initialData);
var theLiveOrderBlotterModel = new LiveOrderBlotterModel([new LiveOrderModel({})]);

// Need to do this onload to be sure document is complete before
// attempting to bind model to view.

window.onload = function() {

	ko.applyBindings(theStuff, document.getElementById('watchlist'));
	ko.applyBindings(theLiveOrderBlotterModel, document.getElementById('order-blotter'));

	ko.applyBindings(transportState, document.getElementById('status-bar'));

	for (var i = 0; i < theStuff.items().length; i++) {
		theStuff.items()[i].subscribe(client);
	}

	theLiveOrderBlotterModel.subscribe(client);
	// Test Function - for each row, create a dummy message and call onMessage
	// setInterval(function() {

	// 	for(var i=0;i<watchList.items().length; i++) {
	// 	    var message = {};
	// 	    message.sym = watchList.items()[i].sym;
	// 	    message.bid = watchList.items()[i].bid() + 121;
	// 	    message.ask = watchList.items()[i].ask() + 125;
	// 	    watchList.items()[i].onMessage(message);
	// 	}
	//     }, 2000);
}
function subscribeAll() {
	for (var i = 0; i < theStuff.items().length; i++) {
		theStuff.items()[i].subscribe(client);
	}
	theLiveOrderBlotterModel.subscribe(client);
}

function unSubscribeAll() {
	for (var i = 0; i < theStuff.items().length; i++) {
		theLiveOrderBlotterModel.items()[i].subscription.unsubscribe();
	}
}

function displayDate() {
	document.getElementById("demo").innerHTML = theStuff.items()[0].bid;
}

