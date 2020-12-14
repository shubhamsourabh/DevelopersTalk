const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Posts");
const checkObjectId = require("../../middleware/checkObjectId");
// @Route POST api/posts
//  @desc Create a post
//  @acesss private

router.post(
	"/",
	[auth, [check("text", "Text is Required").notEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});
			const post = await newPost.save();
			res.json(post);
		} catch (err) {
			console.error(err.message);
			res.status(500).send(`Server error`);
		}
	}
);

// @Route GET api/posts
//  @desc get all posts
//  @acesss private

router.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`Server Error`);
	}
});

// @Route GET api/posts/:id
//  @desc get  posts by ID
//  @acesss private

router.get("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: `Post Not Found` });
		}
		res.json(post);
	} catch (err) {
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: `Post Not Found` });
		}
		console.error(err.message);
	}
});

// @Route DELETE api/posts/:id
//  @desc Delete posts by ID
//  @acesss private

router.delete("/:id", [auth, checkObjectId("id")], async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		console.log(post);
		if (!post) {
			return res.status(404).json({ msg: "No Post Found" });
		}
		//check user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User Not Authorized" });
		}

		await post.remove();
		res.json({ msg: `Post Removed` });
	} catch (err) {
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: `Post Not Found` });
		}
		console.error(err.message);

		//res.status(500).send("Server Error");
	}
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put("/like/:id", [auth, checkObjectId("id")], async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Check if the post has already been liked
		if (post.likes.some((like) => like.user.toString() === req.user.id)) {
			return res.status(400).json({ msg: "Post already liked" });
		}

		post.likes.unshift({ user: req.user.id });

		await post.save();

		return res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route    PUT api/posts/dislike/:id
// @desc     disLike a post
// @access   Private
router.put("/dislike/:id", [auth, checkObjectId("id")], async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Check if the post has  been liked
		if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
			return res.status(400).json({ msg: "Post has not yet been liked" });
		}
		//remove the like
		//console.log(({ _id } = post.likes));
		post.likes = post.likes.filter(
			({ user }) => user.toString() !== req.user.id
		);
		await post.save();

		return res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
	"/comment/:id",
	[
		auth,
		checkObjectId("id"),
		[check("text", "Text is required").not().isEmpty()],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};
			console.log(newComment);
			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Pull out comment
		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);
		// Make sure comment exists
		if (!comment) {
			return res.status(404).json({ msg: "Comment does not exist" });
		}
		// Check user
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" });
		}

		post.comments = post.comments.filter(
			({ id }) => id !== req.params.comment_id
		);

		await post.save();

		return res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		return res.status(500).send("Server Error");
	}
});

module.exports = router;
