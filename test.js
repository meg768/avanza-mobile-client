

var Avanza = require('./index.js');

require('dotenv').config();

function login() {
    var avanza = new Avanza();
 
    //var credentials = {username: process.env.AVANZA_USERNAME, password:process.env.AVANZA_PASSWORD};
    var credentials = {ssid: process.env.AVANZA_SSID};
	console.log(credentials);
 
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

login();