let http = require('http')
let request = require('request')

let path = require('path')
let fs = require('fs')

let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv

let scheme = 'http://'
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
let destinationUrl = scheme  + argv.host + ':' + port

let logPath = argv.log && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    //process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
    //req.pipe(process.stdout)
    req.pipe(logStream, {end: false})

    for (let header in req.headers) {
      res.setHeader(header, req.headers[header])
    }
    req.pipe(res)
}).listen(8000)

http.createServer((req, res) => {
    console.log(`Proxying request to: ${destinationUrl + req.url}`)
    let dUrl = req.headers['x-destination-url']||destinationUrl
    req.pipe(logStream, {end: false})
    // Proxy code
    let options = {
        headers: req.headers,
        url: dUrl,
        method: req.method
    }

    let downstreamResponse = req.pipe(request(options))
    downstreamResponse.pipe(logStream, {end: false})
    downstreamResponse.pipe(res)
}).listen(8001)
