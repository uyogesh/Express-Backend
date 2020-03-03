const express = require('express');
const http = require('http');
const https = require('https');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const routes = require('../api/routes/v1');
const admin = require('../../admin_panel')
const { logs } = require('./vars');
const strategies = require('./passport');
const error = require('../api/middlewares/error');
const categoryRoutes = require('../api/routes/categories/')
/**
* Express instance
* @public
*/
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// enable CORS - Cross Origin Resource Sharing
app.use(cors({
    methods: ['http','https'],
    origin: process.env.CORS_ORIGIN
}));

// Serve Static content
app.use('/avatar', express.static('avatar'))
app.use('/gallery', express.static('gallery'))

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
passport.use('facebook', strategies.facebook);
passport.use('google', strategies.google);

// mount api v1 routes
app.use('/v1', routes);


app.use('/admin', admin);
// api of Category
// app.use('/category', categoryRoutes)

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);


module.exports = app;
