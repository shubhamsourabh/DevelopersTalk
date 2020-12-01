const express = require("express");
const router = express.Router();

// @Route GET api/posts
//  @desc TEST Route
//  @acesss PUBLIC

router.get("/", (req, res) => res.send("post Route"));

module.exports = router;
