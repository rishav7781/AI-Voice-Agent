const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors= require('cors');

const indexRouter = require('./routes/index');
const dbTestRouter = require('./routes/dbTest'); 

const livekitRouter = require('./routes/livekit');
const agentRouter = require('./routes/agent');


const app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use('/', indexRouter);
app.use('/db', dbTestRouter); // route working

app.use('/api', livekitRouter);
app.use('/api/agent', agentRouter);


// error handlers
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  // If this is an API request, return JSON instead of rendering HTML
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.json({ error: err.message });
  }
  res.render('error');
});

module.exports = app;
