// This is app uses knockoutjs for mvvm and faye for bayeux messaging
//  simply creates a collection of Objects.
//  LiveQuoteModel contains a collection of Quotes that each subscribed to 
//  channel

// Config
var channelPrefix = '/faye';

var client = new Faye.Client('http://localhost:3000/faye');

var oid = 10101;	

var LiveQuoteModel = function ( sym, bid, ask, qid ) {
    var self = this;
    this.sym = sym,
    this.bid = bid ? bid : 0.0,
    this.ask = ask ? ask : 0.0,
    this.qid = qid ? qid : 0,
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
       
/* var LiveQuoteModel = function ( sym, bid, ask, qid ) {
*/
var wlist = [
	new LiveQuoteModel ( 'AUD/USD', 1.0505, 1.0506)   ,
	new LiveQuoteModel ( 'AUD/USD', 1.0505, 1.0506)   ,
	new LiveQuoteModel ( 'AUD/USD', 1.0505, 1.0506)  
	] 

// 	    message.ask = watchList.items()[i].ask() + 125;
// 	    watchList.items()[i].onMessage(message);
// 	}
//     }, 2000);

    
function subscribeAll () {
    for(var i=0;i<watchList.items().length; i++) {
	watchList.items()[i].subscribe(client);
    }
     orderList.subscribe(client);
}

    
function unSubscribeAll () {
    for(var i=0;i<watchList.items().length; i++) {
	watchList.items()[i].subscription.unsubscribe();
    }
}


