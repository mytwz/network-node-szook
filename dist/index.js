"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/*
 * @Author: Summer
 * @LastEditors: Summer
 * @Description:
 * @Date: 2021-03-18 16:49:43 +0800
 * @LastEditTime: 2021-03-23 11:05:28 +0800
 * @FilePath: /network-node-szook/src/index.ts
 */
const koa_1 = __importDefault(require("koa"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_body_1 = __importDefault(require("koa-body"));
const buffer_xor_1 = __importDefault(require("buffer-xor"));
const crypto_1 = __importDefault(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
const net_1 = __importDefault(require("net"));
let __index__ = 0;
const id24_buffer = Buffer.alloc(16);
const Utils = {
    /**
     * 获取一个 24 位的ID
     * - 进程ID + 时间戳后 6 位 + 6 位序列号 + 随机数后 6 位
     * - 经测试 100W 次运行中，没有发现重复ID
     */
    get ID24() {
        let offset = 0;
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
    MD5(str, key) {
        return crypto_1.default.createHash('md5').update(str + key).digest('hex');
    },
    XOREncoder(a, key) {
        try {
            return buffer_xor_1.default(typeof (a) === "string" ? Buffer.from(a) : Buffer.from(JSON.stringify(a)), Buffer.from(key)).toString("base64");
        }
        catch (error) {
            console.error(error);
            return a;
        }
    },
    XORDecoder(a, key) {
        try {
            return JSON.parse(buffer_xor_1.default(typeof (a) === "string" ? Buffer.from(a, "base64") : a, Buffer.from(key)).toString());
        }
        catch (error) {
            console.error(error);
            return a;
        }
    },
    /**
     * 测试目标存活
     * @param ip
     * @param port
     */
    survive(ip, port) {
        return new Promise((resolve, reject) => {
            let survive = false;
            let socket = net_1.default.connect(port, ip, function () {
                socket.destroy();
                survive = true;
            });
            socket.on('error', function (err) {
                socket.destroy();
            });
            socket.on('close', function () {
                resolve(survive);
            });
        });
    }
};
ioredis_1.default.prototype.keys = function (pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        let cursor = 0;
        let list = [];
        do {
            let res = yield this.scan(cursor, "match", pattern, "count", 2000);
            cursor = +res[0];
            list = list.concat(res[1]);
        } while (cursor != 0);
        return list;
    });
};
ioredis_1.default.prototype.findHosts = function findHosts(key) {
    return __awaiter(this, void 0, void 0, function* () {
        let hosts = [];
        let list = yield this.keys(key + "*");
        for (let key of list) {
            let [_, ip, port] = key.split(":");
            if (ip && port) {
                let online = yield this.get(key);
                hosts.push({ ip, port: +port, online: !!+online });
            }
        }
        return hosts;
    });
};
class SZook extends koa_1.default {
    constructor(config) {
        super();
        this.config = config;
        this.zookRoot = new ZookRoot(this);
        this.redis = new ioredis_1.default(this.config.redis);
        if (this.config.redis.password)
            this.redis.auth(this.config.redis.password).then(_ => console.log("redis", "auth successfully"));
        this.use(koa_body_1.default());
        this.use(this.requestInterceptor.bind(this));
        this.use(this.zookRoot.routes());
        this.use(this.zookRoot.allowedMethods());
        this.use(this.responseInterceptor.bind(this));
    }
    requestInterceptor(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = ctx.request.body.data;
            try {
                let data = Utils.XORDecoder(body, this.config.signKey);
                if (data.sign) {
                    console.log("request", ctx.URL.toString(), ":", data);
                    let sign = data.sign;
                    delete data.sign;
                    if (Utils.MD5(JSON.stringify(data), this.config.signKey) === sign) {
                        ctx.params = data;
                        return yield next();
                    }
                }
            }
            catch (error) {
                console.error(error, body);
            }
            ctx.body = {
                data: {
                    code: -1, msg: "数据包格式错误"
                }
            };
        });
    }
    responseInterceptor(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("response", ctx.URL.toString(), ":", ctx.body);
            ctx.body = { data: Utils.XOREncoder(ctx.body, this.config.signKey) };
            yield next();
        });
    }
}
class ZookRoot extends koa_router_1.default {
    constructor(app) {
        super();
        this.app = app;
        this.post("/server/online", this.online.bind(this));
    }
    online(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let hosts = yield this.app.redis.findHosts(this.app.config.keepKey);
            let host = {};
            for (let h of hosts) {
                if (h.ip + h.port != ctx.params.ip + ctx.params.port) {
                    let online = yield Utils.survive(h.ip, h.port);
                    if (online) {
                        host = h;
                        host.online = online;
                        break;
                    }
                }
            }
            if (!(host === null || host === void 0 ? void 0 : host.ip))
                yield this.app.redis.del(this.app.config.jobServerKey);
            ctx.body = {
                keepKey: this.app.config.keepKey,
                ip: host === null || host === void 0 ? void 0 : host.ip,
                port: host === null || host === void 0 ? void 0 : host.port,
                jobServerKey: this.app.config.jobServerKey,
                redis: this.app.config.redis
            };
            yield next();
        });
    }
}
module.exports = SZook;
