let EventEmitter = require("events");
let http = require('http');
const { nextTick } = require("process");

class Application extends EventEmitter {
    constructor() {
        super();
        this.middlewares = [];
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

    callback() {
        return () => {
            let ctx = "我是ctx";
            let respond = "输出到页面";
            let onerror = "处理错误对象";

            let fn = this.compose();
            return fn(ctx).then(respond).catch(onerror);
        }
    }

    listen(...args) {
        let server = http.createServer(this.callback());
        server.listen(...args);
    }
}

module.exports = Application;