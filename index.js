/**
  * @file index.js
  * Lob.com Customized Postcard Demo Node Program

  * @author Scott Hasbrouck <scott@lob.com>
  * @copyright Lob, Inc. 2017
  * @licence MIT
*/

"use strict";

//  ========== 3rd Party Dependencies ==========
// Command line prompt I/O module
var prompt = require('prompt');

// Module for generating coupon codes
var cc = require('coupon-code');

// Node's file I/O module
var fs = require('fs');
// ========== End 3rd Party dependencies ==========


// ========== Utility module for interacting with Google Maps API ==========
var utils = require('./utils.js');


// ========== Import configuration as JSON ==========
// `config.json` is where we specify:
// - API keys for Lob and Google
// - Templates for front and back of postcard
// - Postcard size and description
// - From address and name
// - Google map dimensions
var CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf8'));


// Lob's Node module
var Lob = require('lob')(CONFIG.lob_api_key);

// Object literal of the origin address in the Lob address object format
// values provided by the CONFIG file
var bobSandwichesAddress = {
	name: CONFIG.from_name,
	address_line1: CONFIG.from_address1,
	address_city: CONFIG.from_address_city,
	address_state: CONFIG.from_address_state,
	address_zip: CONFIG.from_address_zip
};


// Array of all of the inputs we want to collect at the prompt.
// in a real Node application, these values would be provided by an event based trigger
var inputs = [
	'name',
	'address_line1',
	'address_line2',
	'address_city',
	'address_state',
	'address_zip'
];

// Initialize the prompt to collect the inputs required to send a postcard to a customer
prompt.start();
prompt.get(inputs, function(err, customerAddress) {

	// Invoke the utility function to generate the google maps
	// directions between the customer to Bob's Sandwiches
	utils.getDirectionsPath(customerAddress, bobSandwichesAddress)

	// Generate the static image google maps URL and URL shortner
	// (note: we must use a URL shortner, because we'll be passing the google maps URL
	// to Lob's API as a data parameter so we can put the image on the postcard.
	// Lob's API has a 500 character limit on all values passed as data parameters.)
	.then(utils.getMap)

	// Finally, create the Postcard using the Lob Node Library
	/// passing the generated short URL of the static google map image as a data parameter
	.then(function(short_map_url) {

		// All methods in Lob's Node Library return a promise
		return Lob.postcards.create({
		 	description: CONFIG.postcard_description,
		 	to: customerAddress,
		 	from: bobSandwichesAddress,
		 	back: CONFIG.template_back,
		 	front: CONFIG.template_front,
		 	mail_type: 'usps_first_class',
		 	size: CONFIG.postcard_size,

		 	// Data object that will be mapped to the merge variables in the Postcard template
		 	data: {
		 		// genrates a coupon code using the `coupon-code` module.
		 		// in a real-world implementation, this code would likely
		 		// be saved in your customer database
		 		code: cc.generate({ parts: 2 }),
		 		name: customerAddress.name,

		 		// the short URL for the static googe maps image
		 		map_url: short_map_url.data.id
		 	}
		 });
	})
	.then(function() {
		return console.log('Postcard sent to ' + customerAddress.name + '!');
	})
	.catch(function(err) { console.error(err.message); });
});
