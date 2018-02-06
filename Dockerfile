FROM node:8-alpine

RUN apk update
RUN apk add tzdata

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /home/app

COPY package.json /home/app/package.json
COPY package-lock.json /home/app/package-lock.json
COPY client /home/app/client
COPY common /home/app/common
COPY server /home/app/server

RUN npm config set registry=https://registry.npm.taobao.org
RUN cd /home/app && \
    npm install

WORKDIR /home/app


CMD node .
