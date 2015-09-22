'use strict';
var lwip = require('lwip');
var path = require('path');
var imgur = require('imgur-node-api');
var async = require('async');
var fs = require('fs');

function getImageCategory(fileName) {
	switch (fileName) {
		case 'horizontal.png' :
			return 'horizontal';
		case 'veritcal.png' :
			return 'vertical';
		case 'small_horizontal.png':
			return 'small_horizontal';
		case 'gallery.png':
			return 'gallery';
		default:
			return;
	}
}

function createCroppedImage(originalImage, dimx, dimy, category, callback) {
	originalImage.resize(dimx, dimy, function (err, croppedImage) {
		if (err) {
			callback(err);
		}
		var fileName = category + '.png';
		croppedImage.writeFile(path.resolve(__dirname, '../uploads', fileName), 'png', {params : 'fast'}, function (err) {
			if (err) {
				callback(err);
			}
			callback(null, fileName);
		});
	});
}

var generateCroppedImages = function (originalImage, callback) {
	async.series({
		cropHorizontal : function (callback) {
			createCroppedImage(originalImage, 755, 450, 'horizontal', function (err, fileName) {
				if (err) {
					callback(err);
				}
				callback(null, fileName);
			});
		},
		cropVertical : function (callback) {
			createCroppedImage(originalImage, 365, 450, 'veritcal', function (err, fileName) {
				if (err) {
					callback(err);
				}
				callback(null, fileName);
			});
		},
		cropSmallHorizontal : function (callback) {
			createCroppedImage(originalImage, 365, 212, 'small_horizontal', function (err, fileName) {
				if (err) {
					callback(err);
				}
				callback(null, fileName);
			});
		},
		cropGallery : function (callback) {
			createCroppedImage(originalImage, 380, 380, 'gallery', function (err, fileName) {
				if (err) {
					callback(err);
				}
				callback(null, fileName);
			});
		}
	}, function (err, results) {
		if (err) {
			callback(err);
		} else {
			var fileNames = [];
			fileNames.push(results.cropHorizontal);
			fileNames.push(results.cropVertical);
			fileNames.push(results.cropSmallHorizontal);
			fileNames.push(results.cropGallery);
			console.log('files', fileNames);
			callback(null, fileNames);
		}
	});
};

var loadAndCrop = function (fileName, callback) {
	async.waterfall([
		function loadImage(callback) {
			lwip.open(path.resolve(__dirname, '../uploads', fileName), function (err, originalImage) {
				if (err) {
					callback(err);
				}
				if (originalImage.width() < 1024 || originalImage.height() < 1024) {
					callback(new Error("Images should have a minimum resoulution of 1024 x 1024"));
				} else {
					callback(null, originalImage);
				}
			});
		},
		function cropImage(originalImage, callback) {
			generateCroppedImages(originalImage, function(err, fileNames) {
				if (err) {
					callback(err);
				}
				callback(null, fileNames);
			});
		},
		function uploadImages(fileNames, callback) {
			var links = {};
			async.each(fileNames, function (fileName, cb) {
				imgur.upload(path.resolve(__dirname, '../uploads', fileName), function (err, imgres) {
					if (err) {
						cb(err);
					} else {
						links[getImageCategory(fileName)] = imgres.data.link;
						cb();
					}
				});
			}, function (err) {
				if (err) {
					callback(err);
				} else {
					console.log('links', links);
					callback(null, fileNames, links);
				}
			});
		},
		function deleteFiles(fileNames, links, callback) {
			async.each(fileNames, function deleteFile(fileName, cb) {
				fs.unlink(path.resolve(__dirname, '../uploads', fileName), function (err) {
					if (err) {
						cb(err);
					} else {
						console.log(fileName + ' deleted successfully');
						cb();
					}
				});
			}, function (err) {
				if (err) {
					callback(err);
				}
				fs.unlink(path.resolve(__dirname, '../uploads', fileName), function (err) {
					if (err) {
						callback(err);
					}
					console.log(fileName + ' deleted successfully');
					callback(null, links);
				});
			});
		}
	], function (err, links) {
		if (err) {
			callback(err);
		} else {
			callback(null, links);
		}
	});
};

module.exports.loadAndCrop = loadAndCrop;