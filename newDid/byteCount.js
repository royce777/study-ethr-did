function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

console.log(byteCount('ciao'));