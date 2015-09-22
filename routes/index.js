var express = require('express');
var router = express.Router();
var multer = require('multer');
var lwip = require('lwip');
var path = require('path');
var imgur = require('imgur-node-api');
var async = require('async');
var fs = require('fs');
var imageUtils = require('../lib/image_utils');

imgur.setClientID(process.env.imgurclientid);

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads');
  	},
  	filename: function (req, file, cb) {
    	cb(null, Date.now() + '-' + file.originalname);
  	}
});

var upload = multer({storage: storage});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/upload', upload.single('image'), function (req, res, next) {
	console.log('File info', req.file);
	var fileName = req.file.filename;
	imageUtils.loadAndCrop(fileName, function (err, data) {			//data will contain the imgur links for the images
		if (err) {
			next(err);
		} else {
			console.log('links', data);
			res.render('images', {links : data});
		}
	});
});

router.use(function (err, req, res, next) {
	if (err) {
		res.render('index', {error : err});
	}
});

module.exports = router;
