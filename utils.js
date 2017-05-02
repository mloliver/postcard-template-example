/**
  * @module utils.js
  * Google Maps utility functions for Lob postcard demo
  *
  * @author Scott Hasbrouck <scott@lob.com>
  * @copyright Lob, Inc. 2017
  * @licence MIT
  *
  * @exports utils
  */

//  ========== 3rd Party Dependencies ==========
// Node library for making HTTP requests with Promise support
var axios = require('axios');

// Library for URL encoding strings
var urlencode = require('urlencode');
// ========== End 3rd Party Dependencies ==========

// Node's file I/O module
var fs = require('fs');

// Import configuration as JSON
var CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var utils = {
	/**
	  * @function addressToString - Converts an address object to a string for google maps
	  * @param {Object} addressObject - Lob formatted address object
	  * @returns {String} String of address
	  */
	addressToString: function(addressObject) {
		var oneLineAddress = '';
		for (var key in addressObject) {
			if (key !== 'name' && addressObject[key] && addressObject[key].length > 0) {
				oneLineAddress = oneLineAddress + ' ' + addressObject[key];
			}
		}
		return oneLineAddress;
	},

	/**
	  * @function getDirectionsPath - Executes HTTP request to Google Maps API to
	      generate directions path polyline
	  * @param {Object} origin - Lob formatted address object of origin for driving directions
	  * @param {Object} destination - Lob formatted address object of destination for driving directions
	  * @returns {Promise} result - resolves with urlencoded {String} driving direction path
	  */
	getDirectionsPath: function(origin, destination) {
		return axios.get('https://maps.googleapis.com/maps/api/directions/json?origin='
			+ utils.addressToString(origin)
			+ '&destination='
			+ utils.addressToString(destination)
			+ '&key='
			+ CONFIG.google_maps_api_key)
		.then(function(result) {
			if (result.data.routes.length > 0) {
				return urlencode(result.data.routes[0].overview_polyline.points);
			}
		});
	},

	/**
	  * @function getMap - Accepts path URL encoded string and executes HTTP request to google maps
	      API to geenrate Short URL of static google map image
	  * @param {String} path - URLEncoded string of a polygon path representing driving directions
	  * @returns {Promise} result - resolves with an {Object} containing a Google generated
	  *   short URL of the static google maps image of driving directions
	  */
	getMap: function(path) {
		var map_url = 'https://maps.googleapis.com/maps/api/staticmap?size='
			+ CONFIG.google_map_width
			+ 'x'
			+ CONFIG.google_map_height
			+ '&path=enc%3A'
			+ path
			+ '&key='
			+ CONFIG.google_maps_api_key;

		return axios.post('https://www.googleapis.com/urlshortener/v1/url'
			+ '?key='
			+ CONFIG.google_short_url_api_key, {
		 		longUrl: map_url
			});
	}
};

module.exports = utils;
