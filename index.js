
var WebSocket    = require('ws');
var EventEmitter = require('events');
var querystring  = require('querystring');
var Path         = require('path');

var sprintf     = require('yow/sprintf');
var extend      = require('yow/extend');
var isArray     = require('yow/is').isArray;
var isString    = require('yow/is').isString;
var isObject    = require('yow/is').isObject;
var isFunction  = require('yow/is').isObject;
var Request     = require('yow/request');

const BASE_URL   = 'www.avanza.se';
const SOCKET_URL = 'wss://www.avanza.se/_push/cometd';
const USER_AGENT = 'Avanza/se.avanzabank.androidapplikation (3.8.0 (541); Android 6.0.1)';



class AvanzaSocket extends EventEmitter {

	constructor(subscriptionId) {
		super();

		var self = this;

		self._socket = undefined;
		self._id = 1;
		self._clientId = undefined;
		self._subscriptionId = subscriptionId;
		self._messages = {};
	}

	send(message) {
		this._socket.send(JSON.stringify([message]));
	};

	open(subscriptionId) {
		var self = this;
		var socket = new WebSocket(SOCKET_URL);


		function send(message) {
			socket.send(JSON.stringify([message]));
		};

		socket.on('open', function() {
			send({
				ext                      : {subscriptionId:subscriptionId},
				supportedConnectionTypes : ['websocket', 'long-polling', 'callback-polling'],
				channel                  : '/meta/handshake',
				id                       : self._id++,
				version                  : '1.0'
			});

		});


		socket.on('message', function(data, flags) {

			var response = JSON.parse(data);

			if (isArray(response))
				response = response[0];

			switch(response.channel) {
				case '/meta/handshake': {
					self._socket = socket;
					self._clientId = response.clientId;

					send({
						advice         : {timeout:0},
						channel        : '/meta/connect',
						clientId       : self._clientId,
						connectionType : 'websocket',
						id             : self._id++
					});

					break;
				}

				case '/meta/connect': {

					send({
						advice         : {timeout:30000},
						channel        : '/meta/connect',
						clientId       : self._clientId,
						connectionType : 'websocket',
						id             : self._id++
					});

					break;
				}

				case '/meta/subscribe': {
					break;
				}

				default: {
					var parts = response.channel.split('/');

					if (parts.length == 3)
						self.emit(parts[1], response.data);

					break;
				}

			}
		});

		return new Promise(function(resolve, reject) {

			var iterations = 50;

			function poll() {
				if (isString(self._clientId))
					resolve();
				else {
					if (iterations-- <= 0) {
						socket.close();
						reject(new Error('Socket timed out. No handshake.'));

					}
					else
						setTimeout(poll, 100);
				}
			}

			poll();

		});


	}


	close() {
		if (this._socket != undefined) {
			this._socket.close();
		}

		this._socket = undefined;
		this._clientId = undefined;
	}

	subscribe(channel, id) {

		var self = this;

		if (self._socket == undefined)
			throw new Error('The socket is not yet open. You must open() before subscribing to channels.');

		if (!isString(self._clientId))
			throw new Error('The socket requires a client ID to work.');

		if (isArray(id))
			id = id.join(',');

		var subscription = sprintf('/%s/%s', channel, id);

		self.send({
			channel        : '/meta/subscribe',
			connectionType : 'websocket',
			clientId       : self._clientId,
			id             : self._id++,
			subscription   : subscription

		});

	};

}


class Avanza {


	constructor() {
		this.session = {};
		this.socket  = new AvanzaSocket();

		this.gopher = new Request('https://www.avanza.se', {
			headers  : {
				'Accept'         : '*/*',
				'Content-Type'   : 'application/json',
				'User-Agent'     : USER_AGENT
			}
		});
	}


	request(method, path, query, body) {

		var self = this;

		return new Promise(function(resolve, reject) {

			var options = {
				method   : method,
				path     : path,
				body     : body,
				query    : query,
				headers  : {
					'X-AuthenticationSession' : self.session.authenticationSession,
					'X-SecurityToken'         : self.session.securityToken
				}
			};

			self.gopher.request(options).then(function(response) {
				resolve(response.body);
			})
			.catch(function(error) {
				reject(error);
			})
		});
	}

	get(path, query) {
		return this.request('GET', path, query);
	}

	login(credentials) {

		var self = this;

		if (credentials == undefined) {
			credentials = {username: process.env.AVANZA_USERNAME, password:process.env.AVANZA_PASSWORD};
		}

		function loginWithUserName(username, password) {
			return new Promise(function(resolve, reject) {

				try {
					if (!isString(username) || !isString(password))
						throw new Error('Must specify username and password');


					var payload = {};
					payload.maxInactiveMinutes = 240;
					payload.username = username;
					payload.password = password;

					var options = {};
					options.path   = '/_api/authentication/sessions/username';
					options.body   = payload;

					self.gopher.post(options).then(function(response) {

						var session = {
							authenticationSession : response.body.authenticationSession,
							customerId            : response.body.customerId,
							username              : username,
							securityToken         : response.headers['x-securitytoken'],
							pushSubscriptionId    : response.body.pushSubscriptionId
						};

						self.socket.open = self.socket.open.bind(self.socket, session.pushSubscriptionId);

						resolve(self.session = session);
					})
					.catch(function(error) {
						reject(error);
					})

				}
				catch (error) {
					reject(error);
				}
			});

		}


		function loginWithBankID(ssid) {

			function initialize() {

				return new Promise(function(resolve, reject) {

					if (!isString(ssid))
						throw new Error('Must specify personal number');

					var options = {
						method: 'POST',
						path: '/_api/authentication/sessions/bankid',
						body: {identificationNumber:ssid}
					};

					self.gopher.request(options).then(function(response) {

						try {
							if (!response.body.transactionId)
								throw new Error('No transactionID present in response.');

							resolve({transactionId: response.body.transactionId});
						}
						catch (error) {
							reject(error);
						}

					})
					.catch(function(error) {
						reject(error);
					});
				});

			}

			function poll(session) {
				return new Promise(function(resolve, reject) {

					var options = {
						method: 'GET',
						path: sprintf('/_api/authentication/sessions/bankid/%s', session.transactionId)
					};

					self.gopher.request(options).then(function(response) {
						try {

							if (!response.body.transactionId)
								throw new Error('No transactionID');

							switch (response.body.state) {

								case 'COMPLETE': {

									resolve({
										loginPath: response.body.logins[0].loginPath,
										username: response.body.logins[0].username
									});
									break;
								}

								case 'OUTSTANDING_TRANSACTION':
								case 'USER_SIGN': {

									setTimeout(function() {
										poll(session).then(function(response) {
											resolve(response);
										})
										.catch(function(error) {
											throw error;
										});
									}, 3000);

									break;
								}

								default: {
									throw new Error(sprintf('BankID returned code %s', response.body.state));
								}
							}

						}
						catch (error) {
							reject(error);
						}

					})
					.catch(function(error) {
						reject(error);
					});
				});

			}


			function finalize(session) {
				return new Promise(function(resolve, reject) {

					var options = {
						method: 'GET',
						path: sprintf('%s?maxInactiveMinutes=240', session.loginPath)
					};

					self.gopher.request(options).then(function(response) {

						resolve({
							authenticationSession: response.body.authenticationSession,
							customerId: response.body.customerId,
							username: session.username,
							securityToken: response.headers['x-securitytoken'],
							pushSubscriptionId: response.body.pushSubscriptionId
						});

					})
					.catch(function(error) {
						reject(error);
					});
				});

			}

			return new Promise(function(resolve, reject) {

				initialize(ssid).then(function(json) {
					return poll(json);
				})
				.then(function(json) {
					return finalize(json)
				})
				.then(function(session) {

					self.session = session;

					// Bind the subscription ID to the socket.open() method
					self.socket.open = self.socket.open.bind(self.socket, self.session.pushSubscriptionId);

					resolve(self.session);
				})
				.catch(function(error) {
					reject(error);
				});
			});
		};

		if (isString(credentials.ssid))
			return loginWithBankID(credentials.ssid);

		return loginWithUserName(credentials.username, credentials.password);

	}

	search(options) {
		return this.get('/_mobile/market/search', options || {limit:10});
	}

	getAccounts(options) {
		return this.get('/_mobile/account/list', options || {onlyTradable:false});
	}

}


module.exports = Avanza;
