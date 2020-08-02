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
