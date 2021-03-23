import Koa from "koa";
import KoaRouter from "koa-router";
import Redis from "ioredis";
import { RedisOptions } from "ioredis";
/**帐号校验回调 */
declare type AccountVerification = (username: string, password: string) => Promise<boolean>;
/**启动配置 */
declare type SConfig = {
    /**与客户端约定的签名 Key */
    signKey: string;
    /**Redis 链接配置 */
    redis: RedisOptions;
    /**任务服务的Key */
    jobServerKey: string;
    /**主机上线的Key */
    keepKey: string;
    /**帐号校验回调 */
    accountVerification: AccountVerification;
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
