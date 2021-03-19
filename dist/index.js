"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/*
 * @Author: Summer
 * @LastEditors: Summer
 * @Description:
 * @Date: 2021-03-18 16:49:43 +0800
 * @LastEditTime: 2021-03-19 10:34:53 +0800
 * @FilePath: /network-node-szook/src/index.ts
 */
var koa_1 = __importDefault(require("koa"));
var koa_router_1 = __importDefault(require("koa-router"));
var koa_body_1 = __importDefault(require("koa-body"));
var buffer_xor_1 = __importDefault(require("buffer-xor"));
var crypto_1 = __importDefault(require("crypto"));
var ioredis_1 = __importDefault(require("ioredis"));
var __index__ = 0;
var id24_buffer = Buffer.alloc(16);
var Utils = {
    /**
     * 获取一个 24 位的ID
     * - 进程ID + 时间戳后 6 位 + 6 位序列号 + 随机数后 6 位
     * - 经测试 100W 次运行中，没有发现重复ID
     */
    get ID24() {
        var offset = 0;
        id24_buffer.writeUInt32BE(+process.pid, offset);
        offset += 4;
        id24_buffer.writeUInt32BE(+String(Date.now()).substr(-6), offset);
        offset += 4;
        id24_buffer.writeUInt32BE((++__index__ > 999999) ? (__index__ = 1) : __index__, offset);
        offset += 4;
        id24_buffer.writeUInt32BE(+String(Math.random()).substr(-6), offset);
        offset += 4;
        return id24_buffer.toString("base64");
    },
    /**
     * MD5
     * @param str
     */
    MD5: function (str, key) {
        return crypto_1.default.createHash('md5').update(str + key).digest('hex');
    },
    XOREncoder: function (a, key) {
        try {
            return buffer_xor_1.default(typeof (a) === "string" ? Buffer.from(a) : Buffer.from(JSON.stringify(a)), Buffer.from(key)).toString("base64");
        }
        catch (error) {
            console.error(error);
            return a;
        }
    },
    XORDecoder: function (a, key) {
        try {
            return JSON.parse(buffer_xor_1.default(typeof (a) === "string" ? Buffer.from(a, "base64") : a, Buffer.from(key)).toString());
        }
        catch (error) {
            console.error(error);
            return a;
        }
    },
};
ioredis_1.default.prototype.keys = function (pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var cursor, list, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cursor = 0;
                    list = [];
                    _a.label = 1;
                case 1: return [4 /*yield*/, this.scan(cursor, "match", pattern, "count", 2000)];
                case 2:
                    res = _a.sent();
                    cursor = +res[0];
                    list = list.concat(res[1]);
                    _a.label = 3;
                case 3:
                    if (cursor != 0) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4: return [2 /*return*/, list];
            }
        });
    });
};
ioredis_1.default.prototype.findHosts = function findHosts(key) {
    return __awaiter(this, void 0, void 0, function () {
        var hosts, list, _i, list_1, _a, addr, online, _b, ip, port;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    hosts = [];
                    return [4 /*yield*/, this.hgetall(key)];
                case 1:
                    list = _c.sent();
                    for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                        _a = list_1[_i], addr = _a[0], online = _a[1];
                        _b = String(addr).split("-"), ip = _b[0], port = _b[1];
                        hosts.push({ ip: ip, port: +port, online: !!+online });
                    }
                    return [2 /*return*/, hosts];
            }
        });
    });
};
var SZook = /** @class */ (function (_super) {
    __extends(SZook, _super);
    function SZook(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        _this.zookRoot = new ZookRoot(_this);
        _this.redis = new ioredis_1.default(_this.config.redis);
        if (_this.config.redis.password)
            _this.redis.auth(_this.config.redis.password).then(function (_) { return console.log("redis", "auth successfully"); });
        _this.use(koa_body_1.default());
        _this.use(_this.requestInterceptor.bind(_this));
        _this.use(_this.zookRoot.routes());
        _this.use(_this.zookRoot.allowedMethods());
        _this.use(_this.responseInterceptor.bind(_this));
        return _this;
    }
    SZook.prototype.requestInterceptor = function (ctx, next) {
        return __awaiter(this, void 0, void 0, function () {
            var body, data, sign, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = ctx.request.body.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        data = Utils.XORDecoder(body, this.config.signKey);
                        if (!data.sign) return [3 /*break*/, 3];
                        console.log("request", ctx.URL.toString(), ":", data);
                        sign = data.sign;
                        delete data.sign;
                        if (!(Utils.MD5(JSON.stringify(data), this.config.signKey) === sign)) return [3 /*break*/, 3];
                        ctx.params = data;
                        return [4 /*yield*/, next()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error(error_1, body);
                        return [3 /*break*/, 5];
                    case 5:
                        ctx.body = {
                            data: {
                                code: -1, msg: "数据包格式错误"
                            }
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    SZook.prototype.responseInterceptor = function (ctx, next) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("response", ctx.URL.toString(), ":", ctx.body);
                        ctx.body = { data: Utils.XOREncoder(ctx.body, this.config.signKey) };
                        return [4 /*yield*/, next()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SZook;
}(koa_1.default));
var ZookRoot = /** @class */ (function (_super) {
    __extends(ZookRoot, _super);
    function ZookRoot(app) {
        var _this = _super.call(this) || this;
        _this.app = app;
        _this.post("/server/online", _this.online.bind(_this));
        return _this;
    }
    ZookRoot.prototype.online = function (ctx, next) {
        return __awaiter(this, void 0, void 0, function () {
            var hosts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.app.redis.findHosts(this.app.config.keepKey)];
                    case 1:
                        hosts = _a.sent();
                        console.log(hosts);
                        ctx.body = {
                            keepKey: this.app.config.keepKey,
                            ip: this.app.config.keepKey,
                            port: this.app.config.keepKey,
                            id: this.app.config.keepKey,
                            jobServerKey: this.app.config.jobServerKey,
                            redis: this.app.config.redis
                        };
                        return [4 /*yield*/, next()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ZookRoot;
}(koa_router_1.default));
module.exports = SZook;
