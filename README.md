# loopback-chat
[![Travis](https://img.shields.io/badge/Build-passing-brightgreen.svg?style=flat-square)](https://github.com/luanxuechao/loopback-chat)
[![node](https://img.shields.io/badge/node-v8.1.4-blue.svg?style=flat-square)](https://github.com/luanxuechao/loopback-chat)
[![socket.io](https://img.shields.io/badge/socket.io-%3E%3D2.0.0-blue.svg?style=flat-square)](https://github.com/luanxuechao/loopback-chat)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)](https://github.com/luanxuechao/loopback-chat)

这是一个运用前端框架VueJS,UI框架Iview的博客项目,后端使用Node框架LoopBack,前端传送门。[这里](https://github.com/luanxuechao/vue-blog)


## 演示
![](https://github.com/luanxuechao/vue-blog/blob/master/demo/demo.gif?raw=true)

## 线上地址
[DEMO](http://www.csails.cn)

## 快速开始

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:3001
node .

```
## docker build / docker-compose

### 本镜像使用了以下基础镜像:
- monogo:3.4.8
- redis:4.0.1

### 本地开发环境下使用前的准备工作

在命令行运行以下命令创建需要的宿主数据卷(Volumes)，并赋予权限：
```
$ sudo mkdir /srv && sudo mkdir /srv/docker
$ sudo mkdir /srv/docker/chat
$ sudo chown yourusername:yourusergroup /srv/docker/
```
本地 MacOs 开发环境下，请至 Docker Preferences 选中 File Sharing 标签页，
添加绑定的本地数据卷 `/srv/docker`

1. mongodb 的数据将会被保存在 /srv/docker/chat/mongo
2. redis 的数据将会被保存在 /srv/docker/chat/redis

###  docker build 镜像
请确保 Docker 监护进程在运行中，至本文件夹目录下，同时在命令行运行以下命令启动：
``` bash
docker build -t chat-node ./
```
###  docker-compose build 镜像
请确保 Docker 监护进程在运行中，至本文件夹目录下，同时在命令行运行以下命令启动：
``` bash
docker-compose build
```

## 运行 docker-compose

请确保 Docker 监护进程在运行中，至本文件夹目录下，同时在命令行运行以下命令启动：
```
$ docker-compose up
```

或运行以下命令结束服务：
```
$ docker-compose down
```

## 技术栈
- socket.io
- loopback
- docker
## 数据库
- mongo
- redis

## 功能列表
- [x] 登录
- [x] 注册
- [x] 根据姓名生成随机头像
- [x] 聊天
- [x] 添加好友
- [x] 实时消息通知
- [x] 根据好友昵称 分组 好友列表
- [x] 登出
- [ ] 用sass 重构css
- [ ] 语音消息、文件消息、图片消息
- [ ] 语音通话、视频通话
- [ ] 个人中心
- [ ] 修改备注

## 联系我
|Author|Chevalier|
|---|---
|E-mail|luanxuechaowd@gmail.com
### 微信
![](https://github.com/luanxuechao/vue-blog/blob/master/demo/weChat.png)

