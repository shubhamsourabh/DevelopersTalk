const express = require("express");
const router = express.Router();

// @Route GET api/profile
//  @desc TEST Route
//  @acesss PUBLIC

router.get("/", (req, res) => res.send("profile Route"));

module.exports = router;
