// This is app uses knockoutjs for mvvm and faye for bayeux messaging
//  simply creates a collection of Objects.
//  LiveQuoteModel contains a collection of Quotes that each subscribed to 
//  channel
// todo: remove trader.js and rename insto.js - split js files into blotter or div specific files
//   and break up View files the same using include / import statements in jade


// Knockout extenter to round numerics.
ko.extenders.numeric = function (target, precision) {
    //create a writeable computed observable to intercept writes to our observable
    var result = ko.computed({
        read: target,  //always return the original observables value
        write: function (newValue) {
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};

// Faye Messaging Client Configuration - todo: externalise faye config
var channelPrefix = '/faye';

var client = new Faye.Client('http://localhost:3000/faye');

var oid = 10101;
var transportState = ko.observable(false);
client.bind('transport:down', function () {
    transportState(false);
});
client.bind('transport:up', function () {
    transportState(true);
});
//ko.applyBindings(transportState);

//todo: attempted to split and require js files..
//require('js/liveQuoteModel.js')

// MVVM Model for the streaming Quotes displayed in Watchlist
var LiveQuoteModel = function (sym, bid, ask, qid, timestamp) {

    var self = this;
    this.sym = sym,
        this.bid = ko.observable(bid ? bid : 0.0).extend({ numeric: 6 }),
        this.ask = ko.observable(ask ? ask : 0.0).extend({ numeric: 6 }),
        this.qid = ko.observable(qid ? qid : 0).extend({ numeric: 6 }),
        this.timestamp = ko.observable(timestamp ? timestamp : 12345),
        this.latency = ko.computed(function () {
            return (self.timestamp() - new Date().getTime() );
        });
    this.equals = function (x) {
        if (this === x) return true;
        //if (! (x instanceOf LiveQuoteModel)) return false;
        if (this.sym == x.sym) return true;
        return false;
    }
    this.onMessage = function (message) {
        //	    if(message.sym != this.sym) return;
        if (message.bid != undefined) {
            self.bid(message.bid);
        }
        if (message.ask != undefined) {
            self.ask(message.ask);
        }
        self.qid(message.qid);

        self.timestamp(message.timestamp);
    }
    this.subscribe = function (client) {
        var channel = '/faye/fx/quote/' + this.sym;
        this.subscription = client.subscribe(channel, this.onMessage);
    }
    this.sendBuyOrder = function () {
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
    this.sendSellOrder = function () {
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



//MVVM list to contain the live quotes
var WatchListModel = function (quotes) {
    var self = this;
    self.items = ko.observableArray(quotes);

};

// MVVM for Order Instance
// todo: need to fix how initiliased...

//var LiveOrderModel = function (orderId, status, sym, buySell, price, size) {
var LiveOrderModel = function (message) {
    var self = this;
    self.orderId = ko.observable(message.orderId ? message.orderId : oid++);
    self.orderTime = ko.observable(Date());
    self.sym = ko.observable(message.sym ? message.sym : 'AUDUSD');
    self.buySell = ko.observable(message.buySell ? message.buySell : 'B');
    self.price = ko.observable(message.price ? message.price : 151.51).extend({ numeric: 6 });
    self.size = ko.observable(message.size ? message.size : 1000);
    self.lastPrice = ko.observable(message.price ? message.price : 151.51).extend({ numeric: 6 });
    self.filledSize = ko.observable(message.filledSize ? message.filledSize : 100).extend({ numeric: 6 });
    self.filledAvgPrice = ko.observable(message.filledAvgPrice ?
        message.filledAvgPrice : 151).extend({ numeric: 6 });

    self.cost = ko.computed(function () {
        return self.filledSize() * self.filledAvgPrice();
    }).extend({ numeric: 6 });
    self.value = ko.computed(function () {
        return self.filledSize() * self.lastPrice();
    }).extend({ numeric: 6 });
    self.filledSize = ko.observable(message.filledSize ? message.filledSize : 0).extend({ numeric: 6 });
    self.filledAvgPrice = ko.observable(message.filledAvgPrice ? message.filledAvgPrice : 0).extend({ numeric: 6 });
    self.pnl = ko.computed(function () {
        return self.filledSize() * self.lastPrice();
    }).extend({ numeric: 6 });

    this.subscribe = function (client) {
        var channel = '/faye/fx/fill/' + self.orderId();
        this.fillSubscription = client.subscribe(channel, this.onFill);
        this.pxSubscription = client.subscribe('/faye/fx/quote/' + this.sym(),
            this.onPx);
    }
    this.cancelOrder = function () {
        // todo: add code to cancel order

    }
    this.onPx = function (px) {
        if (self.buySell == 'B') {
            self.lastPrice(px.bid);
        }
        else {
            self.lastPrice(px.ask);
        }

    }
    this.onFill = function (fill) {
        var preFilledSize = self.filledSize();
        var preFilledAvgPrice = self.filledAvgPrice();
        self.filledSize(fill.filledSize + self.filledSize());
        self.filledAvgPrice(
            ((fill.filledPrice * fill.filledSize ) +
                (self.filledAvgPrice() * self.filledSize())) /
                ( preFilledSize + fill.filledSize )
        );
    }
    this.fillOrder = function () {
        var channel = '/faye/fx/fill/' + self.orderId();
        var message = {
            'orderId': self.orderId(),
            'filledSize': self.size(),
            'filledPrice': self.price()
        }
        client.publish(channel, message);
    }

}
var LiveOrderBlotterModel = function (orders) {
    var self = this;
    self.orders = ko.observableArray(orders);

    this.subscribe = function (client) {
        var channel = '/faye/fx/order/**';
        this.subscription = client.subscribe(channel, this.onMessage);
    }
    this.onMessage = function (message) {
        //alert("Got a Message" + message);
        var order = new LiveOrderModel(message)
        order.subscribe(client);
        self.orders.push(order);

    }
}




// Initilising instances of Model Objects, then finding with ko bind
// TODO: see if this is really necessary - it creates noise rows on screen.
var initialData = [
    new LiveQuoteModel("AUDJPY", 94.4, 94.6),
    new LiveQuoteModel("AUDUSD", 145.45, 145.47),
    new LiveQuoteModel("AUDEUR", 45.45, 45.47)
];


var watchList = new WatchListModel(initialData);
var orderList = new LiveOrderBlotterModel([ new LiveOrderModel({}) ]);

// Need to do this onload to be sure document is complete before
// attempting to bind model to view.

window.onload = function () {

    ko.applyBindings(watchList,
        document.getElementById('watchlist'));

    ko.applyBindings(orderList,
        document.getElementById('order-blotter'));

    for (var i = 0; i < watchList.items().length; i++) {
        watchList.items()[i].subscribe(client);
    }
    orderList.subscribe(client);
};

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



function subscribeAll() {
    for (var i = 0; i < watchList.items().length; i++) {
        watchList.items()[i].subscribe(client);

    }
    orderList.subscribe(client);
}


function unSubscribeAll() {
    for (var i = 0; i < watchList.items().length; i++) {
        watchList.items()[i].fillSubscription.unsubscribe();
    }
}


function displayDate() {
    document.getElementById("demo").innerHTML = watchList.items()[0].bid;

}




