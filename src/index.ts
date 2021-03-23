/*
 * @Author: Summer
 * @LastEditors: Summer
 * @Description: 
 * @Date: 2021-03-18 16:49:43 +0800
 * @LastEditTime: 2021-03-23 11:05:28 +0800
 * @FilePath: /network-node-szook/src/index.ts
 */
import Koa from "koa";
import KoaRouter from "koa-router"
import KoaBody from "koa-body"
import xor from "buffer-xor"
import crypto from "crypto"
import Redis from "ioredis";
import { RedisOptions } from "ioredis";
import net from "net";

type SConfig = {
    signKey: string,
    redis: RedisOptions,
    jobServerKey: string,
    keepKey:string
}

type Host = {
    ip: string, port: number, online: boolean
}


let __index__ = 0
const id24_buffer = Buffer.alloc(16);

const Utils = {

    /**
     * 获取一个 24 位的ID 
     * - 进程ID + 时间戳后 6 位 + 6 位序列号 + 随机数后 6 位
     * - 经测试 100W 次运行中，没有发现重复ID
     */
    get ID24(): string {
        let offset = 0;
        id24_buffer.writeUInt32BE(+process.pid, offset); offset += 4;
        id24_buffer.writeUInt32BE(+String(Date.now()).substr(-6), offset); offset += 4;
        id24_buffer.writeUInt32BE((++__index__ > 999999) ? (__index__ = 1) : __index__, offset); offset += 4;
        id24_buffer.writeUInt32BE(+String(Math.random()).substr(-6), offset); offset += 4;
        return id24_buffer.toString("base64");
    },

    /**
     * MD5
     * @param str 
     */
    MD5(str: string, key: string): string {
        return crypto.createHash('md5').update(str + key).digest('hex');
    },

    XOREncoder(a: string | Object, key: string): string | Object {
        try {
            return xor(typeof (a) === "string" ? Buffer.from(a) : Buffer.from(JSON.stringify(a)), Buffer.from(key)).toString("base64");
        } catch (error) {
            console.error(error)
            return a;
        }
    },

    XORDecoder(a: string, key: string): any {
        try {
            return JSON.parse(xor(typeof (a) === "string" ? Buffer.from(a, "base64") : a, Buffer.from(key)).toString());
        } catch (error) {
            console.error(error)
            return a;
        }
    },

    /**
     * 测试目标存活
     * @param ip 
     * @param port 
     */
    survive(ip: string, port: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let survive = false;
            let socket = net.connect(port, ip, function(){
                socket.destroy();
                survive = true;
            });
     
            socket.on('error', function(err) {
                socket.destroy();
            });
     
            socket.on('close', function() {
                resolve(survive);
            });
        })
    }
}

declare namespace IORedis {
    interface Redis extends Redis.Commands {
        findHosts(key: Redis.KeyType): Promise<Host[]>;
    }
}


Redis.prototype.keys = async function(pattern: string){
    let cursor = 0;
    let list:string[] = [];
    do {
        let res = await this.scan(cursor, "match", pattern, "count", 2000);
        cursor = +res[0];
        list = list.concat(res[1]);
    } while (cursor != 0);

    return list;
}

Redis.prototype.findHosts = async function findHosts(key: KeyType): Promise<Host[]> {
    let hosts:Host[] = [];
    let list:string[] = await this.keys(key+"*");
    for(let key of list){
        let [_, ip, port] = key.split(":")
        if(ip && port){
            let online = await this.get(key)
            hosts.push({ ip, port:+port, online: !!+online });
        }
    }
    return hosts;
}

class SZook extends Koa {
    public zookRoot: ZookRoot;
    public redis: IORedis.Redis;
    public config: SConfig;
    constructor(config: SConfig){
        super();
        this.config = config;
        this.zookRoot = new ZookRoot(this);
        this.redis = <IORedis.Redis><unknown>new Redis(this.config.redis)    ;
        if (this.config.redis.password) this.redis.auth(this.config.redis.password).then(_ => console.log("redis", "auth successfully"));

        this.use(KoaBody());
        this.use(this.requestInterceptor.bind(this))
        this.use(this.zookRoot.routes());
        this.use(this.zookRoot.allowedMethods());
        this.use(this.responseInterceptor.bind(this))
    }

    private async requestInterceptor(ctx: Koa.ParameterizedContext, next: Function){
        let body = ctx.request.body.data;
        try {
            let data = Utils.XORDecoder(body, this.config.signKey);
            if (data.sign) {
                console.log("request", ctx.URL.toString(), ":", data);
                let sign = data.sign;
                delete data.sign;
                if (Utils.MD5(JSON.stringify(data), this.config.signKey) === sign) {
                    ctx.params = data;
                    return await next();
                }
            }
        } catch (error) {
            console.error(error, body)
        }
        ctx.body = {
            data: {
                code: -1, msg: "数据包格式错误"
            }
        }
    }

    private async responseInterceptor(ctx: Koa.ParameterizedContext, next: Function){
        console.log("response", ctx.URL.toString(), ":", ctx.body)
        ctx.body = { data: Utils.XOREncoder(<Object>ctx.body, this.config.signKey) };
        await next();
    }
}


class ZookRoot extends KoaRouter {
    constructor(private app: SZook){
        super();
        this.post("/server/online", this.online.bind(this));
    }

    private async online(ctx: Koa.ParameterizedContext, next: Function){
        let hosts = await this.app.redis.findHosts(this.app.config.keepKey);
        let host: Host = <Host>{};
        for(let h of hosts){
            if(h.ip + h.port != ctx.params.ip + ctx.params.port){
                let online = await Utils.survive(h.ip, h.port);
                if(online){
                    host = h;
                    host.online = online;
                    break;
                }
            }
        }
        if(!host?.ip) await this.app.redis.del(this.app.config.jobServerKey);
        ctx.body = {
            keepKey: this.app.config.keepKey, 
            ip: host?.ip, 
            port: host?.port, 
            jobServerKey: this.app.config.jobServerKey, 
            redis: this.app.config.redis
        }
        await next();
    }
}

export = SZook;