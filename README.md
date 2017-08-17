# avanza-mobile-client

Avanza Mobile Client

### Installation

	npm install avanza-mobile-client --save

### Usage

    var avanza = new Avanza();
    var credentials = {username: process.env.AVANZA_USERNAME, password:process.env.AVANZA_PASSWORD};

    avanza.login(credentials).then(function() {
        return avanza.get('/_mobile/account/overview');
    })
    .then(function(reply) {
        console.log(reply);

        return avanza.socket.open();
    })
    .then(function() {
        // Subscribe to OMX index
        avanza.socket.subscribe('quotes', '19002');

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

#### Get Accounts

	function getAccounts() {

		var Avanza = require('avanza-mobile-client');
		var avanza = new Avanza();

		avanza.login().then(function() {
			return avanza.get('/_mobile/account/list', {onlyTradable:false});
		})
		.then(function(reply) {
			console.log(reply);

			/*
			var reply = [{
				totalBalance: 12345.67,
				ownCapital: 12345.67,
				buyingPower: 12345.67,
				name: 'Depå',
				id: '1234567',
				type: 'AktieFondkonto'
			}];
			*/

		})
		.catch(function(error) {
			console.log(error);
		});
	}
