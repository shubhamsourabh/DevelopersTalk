const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const auth = require("../../middleware/auth");

// @Route GET api/profile
//  @desc TEST Route
//  @acesss PUBLIC

router.get("/", auth, async (req, res) => {
	res.send("profile Route");
});

module.exports = router;
