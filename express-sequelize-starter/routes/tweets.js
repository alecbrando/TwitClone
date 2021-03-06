const express = require('express');
const router = express.Router();
const db = require("../db/models");
const { check, validationResult} = require('express-validator');
const { Tweet } = db;

const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);

const validateTweets = [
  check('message').exists({checkFalsy: true}).withMessage("message can't be empty"),
  check('message').isLength({max:280, min: 2})
  .withMessage("message can't be longer than 280"),
]
const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);
  if(!validationErrors.isEmpty()) {
    const errors = validationErrors.array().map((error) => error.msg);
    const err = Error("Bad request.");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request.";
    return next(err);
  }
  next();
};

const tweetNotFoundError = (id) => {
  const err = new Error(`A tweet with the specified ${id} couldn't be found.`);
  err.title = "Tweet not found";
  err.status = 404;
  return err;
}

router.get("/", asyncHandler(async (req, res) => {
    const tweets = await Tweet.findAll();
    res.json({ tweets });
}));

router.get("/:id(\\d+)", asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const tweet = await Tweet.findByPk(id);
  if (tweet){
    res.json({ tweet });
  } else {
    next(tweetNotFoundError(id));
  }
}));

router.post("/", validateTweets, handleValidationErrors, asyncHandler( async (req, res) => {
  const { message } = req.body;
  const tweet = await Tweet.create({ message });
  res.status(201).json({tweet});
}));


router.put("/:id(\\d+)", validateTweets, handleValidationErrors, asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  const id = parseInt(req.params.id, 10);
  const tweet = await Tweet.findByPk(id);
  if (tweet){
    await tweet.update({message});
    res.json({ tweet });
  } else {
    next(tweetNotFoundError(id));
  }
}));


router.delete("/:id(\\d+)", asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const tweet = await Tweet.findByPk(id);
  if (tweet){
    await tweet.destroy();
    res.status(204).end();
  } else {
    next(tweetNotFoundError(id));
  }
}));


module.exports = router;
