import express from "express";
import path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "../../client/build")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/index.html"));
});

app.get("/")