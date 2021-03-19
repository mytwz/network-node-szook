import Koa from "koa";
import KoaRouter from "koa-router";
import Redis from "ioredis";
import { RedisOptions } from "ioredis";
declare type SConfig = {
    signKey: string;
    redis: RedisOptions;
    jobServerKey: string;
    keepKey: string;
};
declare type Host = {
    ip: string;
    port: number;
    online: boolean;
};
declare namespace IORedis {
    interface Redis extends Redis.Commands {
        findHosts(key: Redis.KeyType): Promise<Host[]>;
    }
}
declare class SZook extends Koa {
    zookRoot: ZookRoot;
    redis: IORedis.Redis;
    config: SConfig;
    constructor(config: SConfig);
    private requestInterceptor;
    private responseInterceptor;
}
declare class ZookRoot extends KoaRouter {
    private app;
    constructor(app: SZook);
    private online;
}
export = SZook;
