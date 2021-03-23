![npm version](https://img.shields.io/badge/npm-1.0.0-brightgreen)
 > 简易版的分布式消息服务的中心服务器，用于获取入网许可，觉得小弟写的还行的话，就给个[Star](https://github.com/mytwz/network-node-szook)⭐️吧~

## 食用说明

### [安装启动分布式消息服务](https://github.com/mytwz/network-node-server)

```javascript
var ZookServer = require("network-node-szook");

var app = new ZookServer({
    /**与客户端约定的签名 Key */
    signKey: "signKey",
    /**Redis 链接配置 */
    redis: {
        prefix: 'im',
        host: '17.0.0.1',
        port: '6379',
        password: "40a7ccf0-5af7-45ec-b7de-b2fe1c6ade83"
    },
    /**任务服务的Key */
    jobServerKey: "jobServerKey",
    /**主机上线的Key */
    keepKey: "keepKey",
    /**帐号校验回调 */
    accountVerification: async (username, password) => {
        return username === "summer" && password === "summer";
    }
});

app.listen(8080, function(){
    console.log("启动成功")
})

```