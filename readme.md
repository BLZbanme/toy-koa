# koa的实现



## 洋葱模型原理

koa的use会将中间件存在middlewares数组中

```javascript
class Application extends EventEmitter {
    constructor() {
        super();
        this.middlewares = [];
    }
    
    use(middleware)
}
```

在listen方法中会调用callback，从而调用compose方法组合中间件

```javascript
callback() {
    return (req, res) => {
        let fn = this.compose();
        return fn().then().catch();
    }
}

listen(...args) {
    let server = http.createServer(this.callback());
    server.listen(...args);
}
```

compose方法，先初始化一个next是为了响应最后一次调用next()

```javascript
compose() {
    return async ctx => {
        function createNext(middleware, oldNext) {
            return async () => {
                await middleware(ctx, oldNext);
            }
        }
        
        let len = this.middlewares.length;
        
        let next = async () => {
            return Promise.resolve();
        }
        
        for (let i = len - 1; i >= 0; i--) {
            let currentMiddleWare = this.middleWares[i];
            next = createNext(currentMiddleWare, next);
        }
        
        await next();
    }
}
```

### 整体代码

```javascript
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
```



## 代理模式（即ctx上存取值，可以操作到request和response）

#### request.js

```javascript
const { url } = require('url');
module.exports = {
    get query() {
        return url.parse(this.req.url, true).query;
    }
}
```

#### response.js

```javascript
module.exports = {
    set body(data) {
        this._body = data;
    }
    
    get body() {
        return this._body;
    }

	get status() {
        return this.res.statusCode;
    }

	set status(statusCode) {
        if (typeof statusCode !== 'number') {
            throw new Error('statusCode must be number');
        }
        this.res.statusCode = statusCode;
    }
}
```

#### 最后在context.js中设置代理

```javascript
let context = {};

function delegateSet(property, name) {
    context.__defineSetter__(name, function (val) {
        this[property][name] = val;
    });
}

function delegateGet(property, name) {
    context.__defineGetter__(name, function (val) {
        return this[property][name]
    });
}

let requestSet = [];
let requestGet = ['query'];
let responseSet = ['body', 'status'];
let responseGet = responseSet;

requestSet.forEach(e => {
    delegateSet('request', e)
})

requestGet.forEach(e => {
    delegateGet('request', e)
})

responseSet.forEach(e => {
    delegateSet('response', e)
})

responseGet.forEach(e => {
    delegateGet('response', e)
})

module.exports = context;
```

