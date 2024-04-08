require('dotenv').config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

 
//CORS
app.use(cors());
app.options("*", cors());
 
//Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);
 
//Routing
const categoriesRouter = require("./routes/categories");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const reviewsRouter = require("./routes/reviews");
 
const api = process.env.API_URL;
 
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/reviews`, reviewsRouter);
 
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "toyshub-database",
  })
  .then(() => {
    console.log("Database connection ready!");
  })
  .catch((err) => {
    console.log(err);
  });
 
app.listen(3000, () => {
  console.log(api);
  console.log("Backend server started!");
});