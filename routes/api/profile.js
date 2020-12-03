const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
//const { find, findOneAndDelete } = require("../../models/Profile");
const axios = require("axios");
const config = require("config");
// @Route GET api/profile/me
//  @desc GET Current users profile
//  @acesss Private

router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id,
		}).populate("user", ["name", "avatar"]);
		if (!profile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}
		res.json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server Error");
	}
});

// @Route POST api/profile
//  @desc Create OR Update User Profile
//  @acesss Private

router.post(
	"/",
	[
		auth,
		[
			check("status", "status is required").not().isEmpty(),
			check("skills", "Skills is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			status,
			company,
			location,
			website,
			bio,
			skills,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
			experience,
			// spread the rest of the fields we don't need to check
			...rest
		} = req.body;
		//console.log(req.user.id);
		const profileFields = {
			user: req.user.id,
			status,
			company,
			experience,
			location,
			website: website === " " ? " " : normalize(website, { forceHttps: true }),
			bio,
			skills: Array.isArray(skills)
				? skills
				: skills.split(",").map((skill) => " " + skill.trim()),
			// status,
			// githubusername,
		};
		//Build social object and add to profileFields
		if (youtube && twitter && instagram && linkedin && facebook) {
			const socialfields = { youtube, twitter, instagram, linkedin, facebook };
			for (const [key, value] of Object.entries(socialfields)) {
				if (value.length > 0)
					socialfields[key] = normalize(value, { forceHttps: true });
			}
			profileFields.social = socialfields;
		}
		try {
			// Using upsert option (creates new doc if no match is found):
			let profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true, upsert: true }
			);
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);
// @Route GET api/profile
//  @desc GET All Profiles
//  @acesss Public

router.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ["name", "avatar"]);
		//console.log(profiles);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @Route GET api/profile/user/user_id
//  @desc GET  Profiles by user_id
//  @acesss Public

router.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate("user", ["name", "avatar"]);
		if (!profile) {
			res.status(400).json({ msg: "Profile not Found" });
		}
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		if (err.kind == "ObjectId") {
			res.status(400).json({ msg: "Profile not Found" });
		}
		res.status(500).send("Server Error");
	}
});

// @Route Delete api/profile
//  @desc Delete profile & user
//  @acesss Private

router.delete("/", auth, async (req, res) => {
	try {
		await Profile.findOneAndDelete({ user: req.user.id });
		await User.findOneAndDelete({ _id: req.user.id });
		res.json({ msg: `User Deleted` });
	} catch (err) {
		console.error(err.message);
	}
});

// @Route Put api/profile/experience
//  @desc Update Experience in Profile
//  @acesss Private

router.put(
	"/experience",
	[
		auth,
		[
			check("title", "title is required ").notEmpty(),
			check("company", "Company is required").notEmpty(),
			check("from", "from is required").notEmpty(),
		],
	],

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};
		try {
			const profile = await Profile.findOne({ user: req.user.id });
			//console.log(profile.experience);
			profile.experience.unshift(newExp);

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @Route Delete api/profile/experience/:exp_id
//  @desc delete Profile Experience
//  @acesss Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const foundprofile = await Profile.findOne({ user: req.user.id });
		// filter creates a new array with all elements which pass the test
		foundprofile.experience = foundprofile.experience.filter(
			(exp) => exp._id.toString() !== req.params.exp_id
		);

		await foundprofile.save();
		return res.status(200).json(foundprofile);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ msg: "Server error" });
	}
});

// @Route Put api/profile/education
//  @desc Update education in Profile
//  @acesss Private

router.put(
	"/education",
	[
		auth,
		[
			check("school", "school is required ").notEmpty(),
			check("degree", "degree is required").notEmpty(),
			check("fieldofstudy", "fieldofstudy is required").notEmpty(),
			check("from", "from is required").notEmpty(),
		],
	],

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		} = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};
		try {
			const profile = await Profile.findOne({ user: req.user.id });
			//console.log(profile.experience);
			profile.education.unshift(newEdu);

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @Route Delete api/profile/education/:edu_id
//  @desc delete Profile Education
//  @acesss Private

router.delete("/education/:edu_id", auth, async (req, res) => {
	try {
		const foundprofile = await Profile.findOne({ user: req.user.id });
		// filter creates a new array with all elements which pass the test
		foundprofile.education = foundprofile.education.filter(
			(edu) => edu._id.toString() !== req.params.edu_id
		);

		await foundprofile.save();
		return res.status(200).json(foundprofile);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ msg: "Server error" });
	}
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get("/github/:username", async (req, res) => {
	try {
		const uri = encodeURI(
			`https://api.github.com/users/${req.params.username}/repos?per_page=8&sort=created:asc`
		);
		const headers = {
			"user-agent": "node.js",
			Authorization: `token ${config.get("githubtoken")}`,
		};

		const gitHubResponse = await axios.get(uri, { headers });
		return res.json(gitHubResponse.data);
	} catch (err) {
		console.error(err.message);
		return res.status(404).json({ msg: "No Github profile found" });
	}
});

module.exports = router;
