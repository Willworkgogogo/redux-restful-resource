/**
 * Created by YS on 2016/11/4.
 */
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Action_1 = require("./Action");
var Utils_1 = require("./Utils");
var index_1 = require("../index");
var defaultOptions = {
    baseUrl: "/",
    fetch: window.fetch.bind(window),
    actions: [],
    overrideMethod: {},
    getID: function (m) { return m['id']; },
    getDataFromResponse: function (x) { return x; },
    requestInit: {}
};
var RestfulResource = /** @class */ (function () {
    function RestfulResource(options) {
        var _this = this;
        this.options = __assign({}, defaultOptions, options);
        this.options.baseUrl = index_1.stripTrailingSlash(this.options.baseUrl);
        var _a = this.options, actions = _a.actions, overrideMethod = _a.overrideMethod, baseUrl = _a.baseUrl, fetch = _a.fetch, getDataFromResponse = _a.getDataFromResponse, getID = _a.getID;
        this.getBaseUrl = baseUrl.includes(":") ? function () {
            return Utils_1.fillParametersInPath(baseUrl, _this.query);
        } : function () { return baseUrl; };
        if (actions) {
            this.actions = {};
            if (actions instanceof Array)
                actions.forEach(function (action) {
                    _this.actions[action.key] = Action_1.RestfulActionFactory({
                        baseUrl: baseUrl,
                        actionDef: action,
                        fetch: fetch,
                        getDataFromResponse: getDataFromResponse,
                        getID: getID
                    });
                });
        }
        //todo: is there a better way?
        ['get', 'count', 'delete', 'post', 'put', 'addModelAction', 'deleteModelAction', 'updateModelAction', 'setAllModelsAction'].forEach(function (method) {
            _this[method] = (overrideMethod[method] || _this[method]).bind(_this);
        });
    }
    RestfulResource.prototype.withQuery = function (query) {
        this.query = query;
        return this;
    };
    RestfulResource.prototype.afterRequest = function () {
        if (this.options.clearQueryAfterRequest !== false)
            this.query = null;
    };
    RestfulResource.prototype.afterResponse = function () {
    };
    RestfulResource.prototype.isQueryPresent = function () {
        return this.query && Object.keys(this.query).length;
    };
    RestfulResource.prototype.get = function (id) {
        var _this = this;
        var extraURL = "";
        if (id)
            extraURL += "/" + id;
        extraURL += Utils_1.buildQuery(this.query);
        var res = this.options.fetch(this.getBaseUrl() + extraURL, this.options.requestInit)
            .then(function (res) { return res.json(); }).then(function (res) {
            var models = _this.options.getDataFromResponse(res, 'get');
            if (_this.options.saveGetAllWhenFilterPresent || !_this.isQueryPresent()) {
                if (!id) {
                    _this.options.dispatch(_this.setAllModelsAction(models, _this.options.getOffsetFromResponse ? _this.options.getOffsetFromResponse(res) : null));
                }
                else {
                    _this.options.dispatch(_this.updateModelAction(models));
                }
            }
            _this.afterResponse();
            _this.query = null;
            return models;
        });
        this.afterRequest();
        return res;
    };
    RestfulResource.prototype.delete = function (data) {
        var _this = this;
        var res = this.options.fetch(this.getBaseUrl() + "/" + this.options.getID(data) + Utils_1.buildQuery(this.query), __assign({}, this.options.requestInit, { method: "DELETE" })).then(function (res) { return res.json(); }).then(function (res) {
            var resData = _this.options.getDataFromResponse(res, 'delete');
            if (resData) {
                _this.options.dispatch(_this.deleteModelAction(data));
                _this.afterResponse();
                return true;
            }
            return false;
        });
        this.afterRequest();
        return res;
    };
    RestfulResource.prototype.put = function (data) {
        var _this = this;
        var res = this.options.fetch(this.getBaseUrl() + "/" + this.options.getID(data) + Utils_1.buildQuery(this.query), __assign({}, this.options.requestInit, { method: "PUT", body: JSON.stringify(data) })).then(function (res) { return res.json(); }).then(function (res) {
            var model = _this.options.getDataFromResponse(res, 'put');
            if (model) {
                _this.options.dispatch(_this.updateModelAction(typeof model === 'object' ? model : data));
            }
            _this.afterResponse();
            return model;
        });
        this.afterRequest();
        return res;
    };
    RestfulResource.prototype.post = function (data) {
        var _this = this;
        var res = this.options.fetch(this.getBaseUrl() + Utils_1.buildQuery(this.query), __assign({}, this.options.requestInit, { method: "POST", body: JSON.stringify(data) })).then(function (res) { return res.json(); }).then(function (res) {
            var model = _this.options.getDataFromResponse(res, 'post');
            if (model) {
                _this.options.dispatch(_this.addModelAction(typeof model === 'object' ? model : data));
            }
            _this.afterResponse();
            return model;
        });
        this.afterRequest();
        return res;
    };
    RestfulResource.prototype.batch = function () {
        throw new Error("Not implemented");
    };
    RestfulResource.prototype.head = function () {
        throw new Error("Not implemented");
    };
    RestfulResource.prototype.addModelAction = function (model) {
        return {
            type: "@@resource/post",
            payload: {
                pathInState: this.options.pathInState,
                key: this.options.getID,
                model: model
            }
        };
    };
    RestfulResource.prototype.deleteModelAction = function (model) {
        return {
            type: "@@resource/delete",
            payload: {
                pathInState: this.options.pathInState,
                key: this.options.getID,
                model: model,
            }
        };
    };
    RestfulResource.prototype.updateModelAction = function (model) {
        return {
            type: "@@resource/put",
            payload: {
                pathInState: this.options.pathInState,
                key: this.options.getID,
                model: model
            }
        };
    };
    RestfulResource.prototype.setAllModelsAction = function (models, offset) {
        if (offset === void 0) { offset = null; }
        return {
            type: "@@resource/get",
            payload: {
                pathInState: this.options.pathInState,
                key: this.options.getID,
                models: models,
                offset: offset
            }
        };
    };
    return RestfulResource;
}());
exports.RestfulResource = RestfulResource;
//# sourceMappingURL=RestfulResource.js.map