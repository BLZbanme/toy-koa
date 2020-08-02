module.exports = {
    set body(data) {
        this._body = data;
    },

    get body() {
        return this._body;
    },

    get status() {
        //外部传来的
        return this.res.statusCode;
    },

    set status(statusCode) {
        if (typeof statusCode !== 'number') {
            throw new Error("statusCode must be number");
        }
        this.res.statusCode = statusCode;
    }
}