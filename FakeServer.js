window.FakeHttpRequest = class {
    open(method){
        this.method = method;
    }

    send(data){
        let response;
        if (this.method === "GET") {
            response = [Math.floor(Math.random() * data * 2)];
            for (let i = 0; i < 5; i++) {
                if (Math.random() > 0.5) response.push(Math.floor(Math.random() * data * 2));
            }
        }
        else if (this.method === "POST") response = data;
        this.onload(response);
    }

    get onload(){ return this._onload; }
    set onload(cb){
        if (typeof cb !== "function") throw "request.onload needs to be function";
        this._onload = (response) => setTimeout(() => {
            cb(response);
        }, Math.floor(Math.random() * 3000));
    }
};