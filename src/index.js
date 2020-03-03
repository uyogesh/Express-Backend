// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const fs = require('fs')
const http = require('http')
const https = require('https')
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');
const io = require('./api/socket')
const admin = require('../admin_panel')
// open mongoose connection
mongoose.connect();
// listen to requests
app.use(admin)
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));
const key = fs.readFileSync('ssl-keys/selfsigned.key', 'utf8')
const cert = fs.readFileSync('ssl-keys/selfsigned.crt', 'utf8')

const config = {
    key,
    cert
}
// http.createServer(app).listen(3000, (callback)=> {
//     console.log("HTTP Server Started at port 3000 ", callback)
// })
https.createServer(config, app).listen(3048, (callBack)=>{
    console.log(callBack)
})

/**
* Exports express
* @public
*/
module.exports = app;
