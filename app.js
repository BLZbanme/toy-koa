const Koa = require('./toykoa/application');
const app = new Koa();

// logger

app.use(async (ctx, next) => {
    console.log(1);
    await next();
    console.log(5)
});

// x-response-time

app.use(async (ctx, next) => {
    console.log(2);
    await next();
    console.log(4)
});

// response

app.use(async ctx => {
    console.log(3);
    ctx.body = 'Hello World';
});

app.listen(3000);