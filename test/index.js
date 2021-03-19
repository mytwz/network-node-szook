"use strict";
/*
 * @Author: Summer
 * @LastEditors: Summer
 * @Description:
 * @Date: 2021-03-19 10:27:21 +0800
 * @LastEditTime: 2021-03-19 10:54:06 +0800
 * @FilePath: /network-node-szook/test/index.js
 */
var ZookServer = require("../");

console.log(ZookServer)

var app = new ZookServer({
    signKey: "10.9.16.24",
    redis: {
        prefix: 'im',
        host: '10.7.17.3',
        port: '6379',
        password: "40a7ccf0-5af7-45ec-b7de-b2fe1c6ade83"
    },
    jobServerKey: "10.9.16.24",
    keepKey: "10.9.16.24"
});

app.listen(8080, function(){
    console.log("启动成功")
})

