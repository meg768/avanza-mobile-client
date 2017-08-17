# avanza-mobile-client

Avanza Mobile Client

### Installation

````bash
npm install avanza-mobile-client --save
````

### Usage

````javascript
var Avanza = require('avanza-mobile-client');
var avanza = new Avanza();
````

### Methods

- **login(credentials)**       - Log in using the specified credentials. See examples below.
- **get(path, query)**         - Sends a GET request to Avanza with the specified query string/object.
- **post(path, query, body)**  - Sends a POST request to Avanza with the specified query string/object and JSON body.

### Properies

- **socket**  - Websocket to subscribe to quotes etc. See below.
- **session** - Session properties required for communication with Avanza.


### Examples

No real documentation is currently available, only some examples of how to use the module.

#### Login with username/password

````javascript
function login() {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	var credentials = {username: process.env.AVANZA_USERNAME, password:process.env.AVANZA_PASSWORD};

	avanza.login(credentials).then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "authenticationSession": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
		  "customerId": "123456",
		  "username": "user123",
		  "securityToken": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
		  "pushSubscriptionId": "XXXXXXXXXXXXXXXXXXXXXXXXX"
		}
		*/
	})
	.catch(function(error) {
		console.log(error);
	});

}
````

#### Login with Swedish BankID

````javascript
function loginWithBankID() {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login({ssid:'XXXXXX-XXXX'}).then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "authenticationSession": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
		  "customerId": "123456",
		  "username": "user123",
		  "securityToken": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
		  "pushSubscriptionId": "XXXXXXXXXXXXXXXXXXXXXXXXX"
		}
		*/
	})
	.catch(function(error) {
		console.log(error);
	});

}
````

#### Get Overview

````javascript
function getOverview() {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	// If login() is called without parameters,
	// process.env.AVANZA_USERNAME and process.env.AVANZA_PASSWORD
	// are used as credentials...

	avanza.login().then(function() {
		return avanza.get('/_mobile/account/overview');
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "accounts": [
			{
			  "accountType": "AktieFondkonto",
			  "interestRate": 0,
			  "depositable": true,
			  "active": true,
			  "performancePercent": 12345.67,
			  "totalProfit": 12345.67,
			  "attorney": false,
			  "accountId": "12345",
			  "tradable": true,
			  "totalBalance": 12345.67,
			  "accountPartlyOwned": false,
			  "totalBalanceDue": 0,
			  "ownCapital": 12345.67,
			  "buyingPower": 12345.67,
			  "totalProfitPercent": 12345.67,
			  "performance": 12345.67,
			  "name": "Depå"
			}
		  ],
		  "numberOfOrders": 0,
		  "numberOfDeals": 0,
		  "totalBuyingPower": 12345.67,
		  "totalOwnCapital": 12345.67,
		  "totalPerformancePercent": 12.34,
		  "totalPerformance": 12345.67,
		  "numberOfTransfers": 0,
		  "numberOfIntradayTransfers": 0,
		  "totalBalance": 12345.67
		}

		*/

	})
	.catch(function(error) {
		console.log(error);
	});
}
````

#### Subscribe

````javascript
function subscribe(id = '19002' /* Swedish OMX Index */) {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.socket.open();
	})
	.then(function() {
		avanza.socket.subscribe('quotes', id);

		avanza.socket.on('quotes', function(data) {
			var time = new Date(data.updated);
			console.log(time.toLocaleTimeString(), data.orderbookId, data.lastPrice);
		});

		return new Promise(function(resolve, reject) {
			setTimeout(resolve, 10000);
		});
	})
	.then(function() {
		avanza.socket.close();
	})
	.catch(function(error) {
		console.log(error);
	});
}
````

#### Get Accounts

````javascript
function getAccounts() {

	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.get('/_mobile/account/list', {onlyTradable:false});
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: [
		  {
			"totalBalance": 12345.67,
			"ownCapital": 12345.67,
			"buyingPower": 12345.67,
			"name": "Depå",
			"id": "1234567",
			"type": "AktieFondkonto"
		  }
		]
		*/

	})
	.catch(function(error) {
		console.log(error);
	});
}
````

#### Search

````javascript
function search(query = 'Mauritz') {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.get('/_mobile/market/search', {limit:10, query:query});
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "totalNumberOfHits": 1,
		  "hits": [
			{
			  "instrumentType": "STOCK",
			  "numberOfHits": 1,
			  "topHits": [
				{
				  "currency": "SEK",
				  "lastPrice": 211.8,
				  "changePercent": -1.3,
				  "flagCode": "SE",
				  "tradable": true,
				  "tickerSymbol": "HM B",
				  "name": "Hennes & Mauritz B",
				  "id": "5364"
				}
			  ]
			}
		  ]
		}
		*/

	})
	.catch(function(error) {
		console.log(error);
	});

}
````

#### Watch lists

````javascript
function getWatchLists() {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.get('/_mobile/usercontent/watchlist');
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: [
		  {
			"orderbooks": [
			  "455636"
			],
			"editable": true,
			"name": "Aktier",
			"id": "XXXXXX"
		  },
		  {
			"orderbooks": [
			  "1933",
			  "157699"
			],
			"editable": true,
			"name": "Fonder",
			"id": "XXXXXX"
		  },
		  {
			"orderbooks": [
			  "19002",
			  "18984",
			  "18997",
			  "155541"
			],
			"editable": true,
			"name": "Index",
			"id": "XXXXXX"
		  },
		  {
			"orderbooks": [
			  "18998",
			  "19000"
			],
			"editable": true,
			"name": "Valutor",
			"id": "XXXXXX"
		  }
		]
		*/

	})
	.catch(function(error) {
		console.log(error);
	});

}
````

#### Market Index Values

````javascript
function getMarketIndex(id = '19002') {

	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.get('/_mobile/market/index/' + id);
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "priceThreeMonthsAgo": 1628.37,
		  "priceOneWeekAgo": 1554.75,
		  "priceOneMonthAgo": 1639.33,
		  "priceSixMonthsAgo": 1570.59,
		  "priceAtStartOfYear": 1517.2,
		  "priceOneYearAgo": 1392.05,
		  "priceThreeYearsAgo": 1352.98,
		  "priceFiveYearsAgo": 1091.46,
		  "numberOfPriceAlerts": 0,
		  "pushPermitted": true,
		  "currency": "SEK",
		  "description": "Index över de trettio mest omsatta aktierna på Stockholmsbörsen.",
		  "flagCode": "SE",
		  "quoteUpdated": "2017-08-17T17:30:11.349+0200",
		  "title": "OMX Stockholm 30 - Stockholmsbörsen",
		  "highestPrice": 1552.5,
		  "lowestPrice": 1538.72,
		  "lastPrice": 1540.09,
		  "lastPriceUpdated": "2017-08-17T17:30:11.349+0200",
		  "change": -12.07,
		  "changePercent": -0.78,
		  "name": "OMX Stockholm 30",
		  "id": "19002"
		}
		*/

	})
	.catch(function(error) {
		console.log(error);
	});
}
````

#### Order Information

````javascript
function getOrder(accountId = 'your-account-id', orderbookId = '5364') {
	var Avanza = require('avanza-mobile-client');
	var avanza = new Avanza();

	avanza.login().then(function() {
		return avanza.get('/_mobile/order', {accountId:accountId, orderbookId:orderbookId});
	})
	.then(function(reply) {
		console.log('reply:', JSON.stringify(reply, null, '  '));

		/*
		reply: {
		  "customer": {
			"showCourtageClassInfoOnOrderPage": false,
			"courtageClass": "XXXX"
		  },
		  "account": {
			"type": "AktieFondkonto",
			"totalBalance": 12345.67,
			"buyingPower": 12345.67,
			"name": "Depå",
			"id": "1234567"
		  },
		  "orderbook": {
			"lastPrice": 211.8,
			"lastPriceUpdated": "2017-08-17T17:29:32.000+0200",
			"change": -2.8,
			"changePercent": -1.3,
			"totalVolumeTraded": 3551786,
			"totalValueTraded": 754374744.9,
			"exchangeRate": 1,
			"currency": "SEK",
			"positionVolume": 0,
			"flagCode": "SE",
			"tradable": true,
			"tickerSymbol": "HM B",
			"tradingUnit": 1,
			"volumeFactor": 1,
			"name": "Hennes & Mauritz B",
			"id": "5364",
			"type": "STOCK"
		  },
		  "firstTradableDate": "2017-08-18",
		  "lastTradableDate": "2017-11-15",
		  "untradableDates": [],
		  "orderDepthLevels": [],
		  "orderDepthReceivedTime": "2017-08-17T17:29:32.395+0200",
		  "latestTrades": [
			{
			  "cancelled": false,
			  "buyer": "AVA",
			  "matchedOnMarket": true,
			  "price": 211.8,
			  "volume": 500,
			  "dealTime": "2017-08-17T17:29:32.000+0200"
			},
			{
			  "cancelled": false,
			  "buyer": "AVA",
			  "matchedOnMarket": true,
			  "price": 211.8,
			  "volume": 200,
			  "dealTime": "2017-08-17T17:29:32.000+0200"
			},
			{
			  "cancelled": false,
			  "buyer": "NON",
			  "seller": "SWB",
			  "matchedOnMarket": true,
			  "price": 211.8,
			  "volume": 173,
			  "dealTime": "2017-08-17T17:24:45.000+0200"
			}
		  ],
		  "marketTrades": true,
		  "hasShortSellKnowledge": true,
		  "hasInstrumentKnowledge": true,
		  "tickSizeRules": [
			{
			  "minPrice": 0,
			  "maxPrice": 0.4999,
			  "tickSize": 0.0001
			},
			{
			  "minPrice": 0.5,
			  "maxPrice": 0.9995,
			  "tickSize": 0.0005
			}
		  ]
		}
		*/

	})
	.catch(function(error) {
		console.log(error);
	});

}
````javascript
