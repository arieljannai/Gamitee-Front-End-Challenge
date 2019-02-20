function insertScript(src){
    return new Promise(resolve => {
        let script = document.createElement("script");
        script.src = src;
        document.head.appendChild(script);
        script.onload = resolve;
    });
}

(function(){
    let jqueryLoad = insertScript("https://code.jquery.com/jquery-3.3.1.min.js");
    let fakeServerLoad = insertScript("./FakeServer.js");
})();