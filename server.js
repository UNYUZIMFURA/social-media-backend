const express = require("express");
const cors = require("cors");
const colors = require('colors')
const app = express();
const dotenv = require("dotenv");
const userRoutes = require("./routes/users.routes");
const postRoutes = require("./routes/posts.routes")
const helmet = require("helmet");
require("dotenv").config();
dotenv.config({ path: "./env" });

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/v1", userRoutes, postRoutes);

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`.cyan.bold);
});