const EventEmitter = require("events");
const http = require('http');
let context = require('./context');
let request = require('./request');
let response = require("./response");

class Application extends EventEmitter {
    constructor() {
        super();
        this.middlewares = [];
        this.context = context;
        this.request = request;
        this.response = response;
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    compose() {
        //实现一个middlewares的方法
        return async ctx => {

            function createNext(middleware, oldNext) {
                return async () => {
                    await middleware(ctx, oldNext)
                };
            }

            let len = this.middlewares.length;

            //最初的样子
            let next = async () => {
                return Promise.resolve();
            };

            for (let i = len - 1; i >= 0; i--) {
                let currentMiddleWare = this.middlewares[i];
                next = createNext(currentMiddleWare, next);
            }

            await next();
        }
    }

    createContext(req, res) {
        let ctx = Object.assign(this.context);
        ctx.request = Object.assign(this.request);
        ctx.response = Object.assign(this.response);
        ctx.req = ctx.request.req = req;
        ctx.res = ctx.response.res = res;
        return ctx;
    }

    callback() {
        return (req, res) => {
            let ctx = this.createContext(req, res);
            console.log('callback', ctx);
            let respond = () => this.responseBody(ctx);
            let onerror = err => this.onerror(err, ctx);
            let fn = this.compose();
            return fn(ctx).then(respond).catch(onerror);
        }
    }
    
    responseBody(ctx) {
        let context = ctx.body;
        if (typeof context === 'string' ) {
            ctx.res.end(context);
        }
        else if (typeof context === 'object') {
            ctx.res.end(JSON.stringify(context));
        }
    }

    onerror(err, ctx) {
        if (err.code == 'ENOENT') {
            ctx.status = 404;
        }
        else {
            ctx.status = 500;
        }
        let msg = err.message || "服务器异常";
        ctx.res.end(msg);
        this.emit("error", err);
    }

    listen(...args) {
        let server = http.createServer(this.callback());
        server.listen(...args);
    }
}

module.exports = Application;