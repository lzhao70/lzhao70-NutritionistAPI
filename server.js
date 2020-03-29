const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

// routes
const nutritionistsRouter = require('./routes/nutritionists');
const authRouter = require('./routes/auth');

// middlewares
const errorMiddleware = require('./middlewares/error');

// connect to db
connectDB();

const app = express();

// middleware
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(mongoSanitize());
app.use(helmet());
app.use(xssClean());
app.use(hpp());
app.use(cors());
app.use(compression());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins 
  max: 100
});
app.use(limiter);

// mount routers
app.use('/api/v1/nutritionist', nutritionistsRouter);
app.use('/api/v1/auth/', authRouter);
app.use(errorMiddleware);

const server = app.listen(process.env.PORT,
  console.log(`Server is running in ${process.env.NODE_ENV}`));

// handle promise rejections, eg. mongo connection
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  //close server, exit process
  server.close(() => process.exit(1));
});