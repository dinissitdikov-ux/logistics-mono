const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) =>
  res.json({ status: "healthy", timestamp: new Date().toISOString() }),
);

app.use("/api", require("./routes/index"));

module.exports = app;
