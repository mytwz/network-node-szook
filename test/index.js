"use strict";
/*
 * @Author: Summer
 * @LastEditors: Summer
 * @Description:
 * @Date: 2021-03-19 10:27:21 +0800
 * @LastEditTime: 2021-03-23 16:12:29 +0800
 * @FilePath: /network-node-szook/test/index.js
 */
var ZookServer = require("../");

var app = new ZookServer({
    signKey: "10.9.16.24",
    redis: {
        prefix: 'im',
        host: '127.0.0.1',
        port: '6379',
        password: "40a7ccf0-5af7-45ec-b7de-b2fe1c6ade83"
    },
    jobServerKey: "jobServerKey",
    keepKey: "10.9.16.24",
    accountVerification: async (username, password) => {
        return username === "summer" && password === "summer";
    }
});

app.listen(8080, function(){
    console.log("启动成功")
})

