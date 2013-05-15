// This is app uses knockoutjs for mvvm and faye for bayeux messaging
//  simply creates a collection of Objects.
//  LiveQuoteModel contains a collection of Quotes that each subscribed to 
//  channel

// Config
var channelPrefix = '/faye';

var client = new Faye.Client('http://localhost:3000/faye');

var oid = 10101;	
var transportState = ko.observable(false);
client.bind('transport:down', function() {
        transportState(false);
    });
client.bind('transport:up', function() {
        transportState (true);
    });
//ko.applyBindings(transportState);
//require('js/liveQuoteModel.js')
var LiveQuoteModel = function ( sym, bid, ask, qid, timestamp ) {
    var self = this;
    this.sym = sym,
    this.bid = ko.observable(bid ? bid : 0.0),
    this.ask = ko.observable(ask ? ask : 0.0),
    this.qid = ko.observable(qid ? qid : 0),
    this.timestamp = ko.observable(timestamp ? timestamp : 0),
    this.latency = ko.computed(function() {
        return (self.timestamp() - new Date().getTime() );
    });
    this.equals = function (x) {
	if (this === x) return true;
	//if (! (x instanceOf LiveQuoteModel)) return false;
	if ( this.sym == x.sym) return true;
	return false; 
    }
    this.onMessage = function (message) {
	//	    if(message.sym != this.sym) return;
	   if(message.bid != undefined) {
	       self.bid(message.bid);
	   }
	   if(message.ask != undefined) {
	        self.ask(message.ask);
	   }
	   self.qid( message.qid);
    
        self.timestamp(message.timestamp);
    }
    this.subscribe = function (client) {
		var channel = '/faye/fx/quote/' + this.sym ;
		this.subscription = client.subscribe(channel, this.onMessage);
    }
    this.sendBuyOrder = function() {
	client.publish('/faye/fx/order/' + self.sym, {
		orderId: oid++, 
		qid: self.qid(),
		buySell: 'B',
		size: 1000,
		price: self.ask(),
		sym: self.sym
	    }
	    );
    }
    this.sendSellOrder = function() {
	client.publish('/faye/fx/order/' + self.sym, {
		orderId: oid++,
		qid: self.qid(),
		buySell: 'S',
		size: 1000,
		price: self.bid(),
		sym: self.sym
	    }
	    );
    }
}
       
   
//var LiveOrderModel = function (orderId, status, sym, buySell, price, size) {
var LiveOrderModel = function (message) {
    var self = this;
    self.orderId = ko.observable(message.orderId ? message.orderId : oid++);
    self.orderTime = ko.observable(Date());
    self.sym = ko.observable(message.sym ? message.sym : 'AUDUSD');
    self.buySell = ko.observable(message.buySell ? message.buySell : 'B');
    self.price = ko.observable(message.price ? message.price : 151.51);
    self.size = ko.observable(message.size ? message.size : 1000);
    self.lastPrice = ko.observable(message.price ? message.price : 151.51);
    self.filledSize = ko.observable(message.filledSize ? message.filledSize : 100 );
    self.filledAvgPrice = ko.observable(message.filledAvgPrice ? 
        message.filledAvgPrice : 151 );

    self.cost = ko.computed (function () {
        return self.filledSize() * self.filledAvgPrice(); 
    });
    self.value = ko.computed (function () {
        return self.filledSize() * self.lastPrice();
    });
    self.filledSize = ko.observable(message.filledSize ? message.filledSize : 0);
 	self.filledAvgPrice = ko.observable(message.filledAvgPrice ? message.filledAvgPrice : 0);
 	self.pnl = ko.computed(function() { 
        return self.filledSize() * self.lastPrice();
    });
    this.subscribe = function (client) {
		var channel = '/faye/fx/fill/' + self.orderId() ;
		this.fillSubscription = client.subscribe(channel, this.onFill);
        this.pxSubscription = client.subscribe('/faye/fx/quote/' + this.sym(),
            this.onPx);
    }
    this.cancelOrder = function ( ) {
    		
    }
    this.onPx = function(px) {
        self.lastPrice(px.bid);

    }
    this.onFill = function (fill){
        var preFilledSize = self.filledSize();
        var preFilledAvgPrice = self.filledAvgPrice();
    	self.filledSize(fill.filledSize + self.filledSize());
        self.filledAvgPrice(
            ((fill.filledPrice * fill.filledSize ) +
            (self.filledAvgPrice() * self.filledSize())) / 
            ( preFilledSize + fill.filledSize )
            );
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
		var channel = '/faye/fx/order/**' ;
		this.subscription = client.subscribe(channel, this.onMessage);
	}
	this.onMessage = function(message) {
		//alert("Got a Message" + message);
		var order = new LiveOrderModel(message)
		order.subscribe(client);
		self.orders.push(order);
		
	}
}


    
var initialData = [
   new LiveQuoteModel( "AUDJPY" ),
    new LiveQuoteModel( "AUDUSD", 145.45, 145.47 ),
    new LiveQuoteModel( "AUDEUR",  45.45,  45.47 )
];

var WatchListModel = function(things) {
    var self = this;
    self.items = ko.observableArray(things);

};
var theStuff = new WatchListModel(initialData);
var theOtherStuff = new LiveOrderBlotterModel([ new LiveOrderModel({}) ]);

// Need to do this onload to be sure document is complete before 
// attempting to bind model to view.

window.onload=function() {

    ko.applyBindings(theStuff,
    		document.getElementById('watchlist'));

    ko.applyBindings(theOtherStuff,
  		document.getElementById('order-blotter'));

    for(var i=0;i<theStuff.items().length; i++) {
	theStuff.items()[i].subscribe(client);
    }
     theOtherStuff.subscribe(client);
   
// Test Function - for each row, create a dummy message and call onMessage
// setInterval(function() {

// 	for(var i=0;i<theStuff.items().length; i++) {
// 	    var message = {};
// 	    message.sym = theStuff.items()[i].sym;
// 	    message.bid = theStuff.items()[i].bid() + 121;
// 	    message.ask = theStuff.items()[i].ask() + 125;
// 	    theStuff.items()[i].onMessage(message);
// 	}
//     }, 2000);
}

    
function subscribeAll () {
    for(var i=0;i<theStuff.items().length; i++) {
	theStuff.items()[i].subscribe(client);
    }
     theOtherStuff.subscribe(client);
}

    
function unSubscribeAll () {
    for(var i=0;i<theStuff.items().length; i++) {
	theStuff.items()[i].fillSubscription.unsubscribe();
    }
}

function displayDate()
{
document.getElementById("demo").innerHTML=theStuff.items()[0].bid;
}



