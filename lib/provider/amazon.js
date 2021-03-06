/**
 * @fileOverview AmazonS3 integration
 * @author Mike Grabowski (@grabbou)
 * @version 0.2
 */

'use strict';

var StorageClient = require('../client'),
	pkgcloud = require('pkgcloud'),
	path = require('path'),
	util = require('util'),
	fs = require('fs'),
	_ = require('underscore');

/**
 * Creates new Amazon S3 constructor
 * @class
 * @classdesc Amazon integration.
 * Provides a base interface for other `pkgcloud` providers, like *Azure* or *Rackspace*.
 * Explanation:
 * - `container` - name of the cloud container
 * - `path` - path to the file relative to the `container`
 * - `url` - full url to the file
 * @augments StorageClient
 * @param {Object} config
 */
var AmazonClient = function AmazonClient(config) {

	/*
	 * Only apply for AmazonClient
	 * Allows to extend that class by other providers that
	 * use pkgcloud (Azure/HP/Rackspace)
	 */
	if (this.constructor === AmazonClient) {

		config = _.extend({
			provider: 'amazon',
			_headers: {
				'x-amz-acl': 'public-read'
			},
			uri: 'http://' + config.container + '.s3.amazonaws.com'
		}, config);

		this._ensureValid(['key', 'keyId', 'container'], config);

	}

	AmazonClient.super_.call(this, config, pkgcloud.storage.createClient(config));

};

util.inherits(AmazonClient, StorageClient);

AmazonClient.prototype.upload = function (localSrc, destSrc, callback) {

	var config = this._config,
		fileName = path.basename(destSrc);

	fs.createReadStream(localSrc).pipe(this._connection.upload({
		container: config.container,
		remote: destSrc,
		headers: config._headers
	}, function (err) {
		if (err) {
			err.message = 'AmazonClient: There was a problem with uploading. Details: ' + err.message;
			callback(err);
		} else {
			callback(null, {
				container: config.container,
				path: destSrc,
				filename: fileName,
				url: config.uri + '/' + fileName
			});
		}
	}));

};

AmazonClient.prototype.remove = function (destSrc, callback) {

	this._connection.removeFile(this._config.container, destSrc, function (err) {
		if (err) err.message = 'AmazonClient: There was a problem with removing. Details: ' + err.message;
		callback(err);
	});

};

AmazonClient.prototype.download = function (destSrc, localSrc, callback) {

	var fileStream = fs.createWriteStream(localSrc);

	this._connection.download({
		container: this._config.container,
		remote: destSrc
	},function (err, results) {
		if (err) err.message = 'AmazonClient: There was a problem with uploading. Details: ' + err.message;
		callback(err, results);
	}).pipe(fileStream);

};

AmazonClient.prototype._init = function (callback) {

	this._connection.createContainer(this._config.container, function (err) {
		if (err) err.message = 'AmazonClient: There was a problem with initialization. Details: ' + err.message;
		callback(err);
	});

};

module.exports = AmazonClient;