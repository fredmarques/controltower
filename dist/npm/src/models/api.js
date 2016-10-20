'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

var _querystring = require('querystring');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultOptions = token => ({
    json: true,
    headers: {
        Authorization: `Bearer ${ token }`
    }
});

const createApiModel = config => ({
    namespace: 'api',
    state: {
        token: null,
        updatingBot: false,
        loadingBot: false,
        loadingUsers: false
    },
    reducers: {
        set: (state, data) => data,
        updateBotBegin: state => _extends({}, state, {
            updatingBot: true
        }),
        updateBotEnd: state => _extends({}, state, {
            updatingBot: false
        }),
        loadingUsersBegin: state => _extends({}, state, {
            loadingUsers: true
        }),
        loadingUsersEnd: state => _extends({}, state, {
            loadingUsers: false
        }),
        loadingBotBegin: state => _extends({}, state, {
            loadingBot: true
        }),
        loadingBotEnd: state => _extends({}, state, {
            loadingBot: false
        })
    },
    effects: {
        getCustomer: (state, data, send, done) => {
            const url = `${ config.apiUrl }/v1/customers`;
            const options = defaultOptions(state.token);
            _xhr2.default.post(url, options, (error, response) => {
                if (error) {
                    console.error(error);
                    return done();
                }
                send('customer:set', response.body, done);
                if (response.body.bots.length === 1) {
                    return send('api:getBot', { botId: response.body.bots[0] }, done);
                }
                return done();
            });
        },
        getBot: (state, data, send, done) => {
            const url = `${ config.apiUrl }/v1/bots/${ data.botId }`;
            const options = defaultOptions(state.token);
            send('api:loadingBotBegin', null, done);
            _xhr2.default.get(url, options, (error, response) => {
                console.log(response);
                if (error) {
                    console.log('response', response.body);
                    console.error(error);
                    return done();
                }
                const bot = response.body;
                send('ui:selectBot', bot.id, done);
                send('ui:enableSection', 'admins', done);
                if (bot.facebook) {
                    send('ui:enableSection', 'channels', done);
                } else {
                    send('ui:disableSection', 'channels', done);
                }
                if (bot.vtex) {
                    send('ui:enableSection', 'ecommerce', done);
                } else {
                    send('ui:disableSection', 'ecommerce', done);
                }
                if (bot.replies) {
                    const selectedReply = bot.type === 'ecommerce' ? 'start' : null;
                    send('ui:enableSection', 'replies', done);
                    send('replies:set', JSON.parse(bot.replies), done);
                    send('ui:selectReply', selectedReply, done);
                    send('api:loadingBotEnd', null, done);
                } else {
                    send('ui:disableSection', 'replies', done);
                }
                if (bot.sage && bot.sage.spellId) {
                    send('ui:enableSection', 'intents', done);
                    send('sage:setId', bot.sage.spellId, done);
                    send('sage:getSpell', { field: 'intents' }, done);
                    send('sage:getSpell', { field: 'utterances' }, done);
                } else {
                    send('ui:disableSection', 'intents', done);
                }
                send('api:getMutedChats', bot, done);
                return send('bot:set', bot, done);
            });
        },
        getMutedChats: (state, bot, send, done) => {
            const query = {
                botId: bot.id,
                botStatus: 'muted'
            };
            const url = `${ config.apiUrl }/v1/users/?${ (0, _querystring.stringify)(query) }`;
            const options = defaultOptions(state.token);
            send('api:loadingUsersBegin', null, done);
            _xhr2.default.get(url, options, (error, response) => {
                send('api:loadingUsersEnd', null, done);
                if (error) {
                    console.error(error);
                    return done();
                }
                send('ui:enableSection', 'mutedChats', done);
                return send('users:setMuted', response.body, done);
            });
        },
        unMuteChats: (state, data, send, done) => {
            const url = `${ config.apiUrl }/v1/users`;
            const options = defaultOptions(state.token);
            const body = _extends({}, data, {
                update: {
                    botStatus: 'active'
                }
            });
            send('api:loadingUsersBegin', null, done);
            _xhr2.default.put(url, _extends({}, options, { json: body }), (error, response) => {
                send('api:loadingUsersEnd', null, done);
                if (error) {
                    console.error(error);
                    return done();
                }
                send('ui:setSelectedMutedUsers', [], done);
                return send('users:unMuteUsers', response.body.map(item => item.id), done);
            });
        },
        updateBot: (state, data, send, done) => {
            const url = `${ config.apiUrl }/v1/bots/${ data.botId }`;
            const options = defaultOptions(state.token);
            const facebookUpdate = !data.facebookPage ? {} : {
                facebook: {
                    pageAccessToken: data.facebookPage.access_token,
                    pageId: data.facebookPage.id,
                    pageName: data.facebookPage.name
                }
            };
            const ownerId = data.ownerId ? { ownerId: data.ownerId } : {};
            const vtexUpdate = data.vtex ? data : {};
            const repliesUpdate = data.replies ? data : {};
            const inviteCodeUpdate = data.inviteCode ? data : {};
            const update = _extends({}, ownerId, facebookUpdate, vtexUpdate, repliesUpdate, inviteCodeUpdate);
            send('api:updateBotBegin', null, done);
            _xhr2.default.put(url, _extends({}, options, { json: update }), (error, response) => {
                send('api:updateBotEnd', null, done);
                if (error) {
                    console.error(error);
                    return done();
                }
                return send('bot:set', response.body, done);
            });
        },
        acceptInvite: (state, data, send, done) => {
            const url = `${ config.apiUrl }/v1/bots/${ data.botId }`;
            const options = defaultOptions(state.token);
            const update = {
                admins: 'me',
                customerId: data.ownerId,
                inviteCode: data.inviteCode
            };
            send('api:updateBotBegin', null, done);
            _xhr2.default.put(url, _extends({}, options, { json: update }), (error, response) => {
                send('api:updateBotEnd', null, done);
                if (error || response.body.error) {
                    console.error(error || response.body.error);
                    send('invite:setError', error || response.body.error, done);
                    return done();
                }
                window.location.search = '';
                return done();
            });
        }
    }
});

exports.default = createApiModel;
module.exports = exports['default'];