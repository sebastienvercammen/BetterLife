// ==UserScript==
// @name				BetterLife
// @description		A userscript to improve the quality of your life. (Originally started as a joke for the 1st of April 2016)
// @author				Sébastien Vercammen
// @namespace		http://www.sebastienvercammen.be/
// @supportURL		https://github.com/sebastienvercammen/BetterLife/issues
// @downloadURL	https://raw.githubusercontent.com/sebastienvercammen/BetterLife/master/betterlife.user.js
// @updateURL		https://raw.githubusercontent.com/sebastienvercammen/BetterLife/master/betterlife.user.js
// @match				*://twitch.tv/*
// @match				*://www.twitch.tv/*
// @match				*://*.reddit.com/*
// @grant				none
// @run-at				document-end
// @version			1.0.0
// ==/UserScript==

(function() {
	'use strict';
	
	/** Utility functions **/
	function domainToWebsiteName(hostname) {
		// Remove 'www.' if it's in the hostname
		if(hostname.substr(0, 4) === 'www.') {
			hostname = hostname.substr(4);
		}
		
		// Remove domain extension
		hostname = hostname.split('.');
		hostname.pop();
		hostname = hostname.join('.');
		
		return hostname;
	}
	
	function callAllMethodsForSitePage(site, page) {
		// Do we have something for this page?
		if(page !== false) {
			// Loop over everything we have for this page
			for(let prop in site[page]) {
				if(!site[page].hasOwnProperty(prop)) {
					continue;
				}
				
				// Call method until it returns success (they must all return true, because we know exactly what page we're on)
				callUntilSuccessForSitePage(site, page, prop);
			}
		}
	}
	
	// Some websites run entirely on JS (like Twitch.tv), so we can't rely just on DOM load. We need to call the methods until they tell us they're finished.
	function callUntilSuccessForSitePage(site, page, methodname) {
		// Get method & run it
		var f = site[page][methodname];
		var success = f();
		
		if(!success) {
			setTimeout(callUntilSuccessForSitePage.bind(null, site, page, methodname), 100);
		}
	}
	
	
	/** Websites **/
	var sites = [];
	
	var twitch = sites['twitch'] = {};
	var reddit = sites['reddit'] = {};
	
	
	/** Twitch.tv **/
	// We call our method detectPage so we can implement the different behaviour w/o changing the site calls (site.detectPage()). realDetectPage contains the actual detection.
	twitch.detectPage = function detectPage() {
		let page = twitch.realDetectPage();
		
		// Forward to retryDetectPage, which will call callAllMethodsForSitePage.
		if(!page) {
			setTimeout(twitch.retryDetectPage, 100);
		}
		
		return page;
	};
	
	// Get current page type
	twitch.realDetectPage = function realDetectPage(path) {
		// Try detecting current page by Twitch's JS
		if(window.hasOwnProperty('SitePageType')) {
			return window.SitePageType;
		}
		
		// Are we on a channel page?
		if(document.querySelector('div.channel > a.channel-name')) {
			return 'channel';
		}
		
		return false;
	};
	
	// We need a separate retryDetectPage to call callAllMethodsForSitePage ourselves.
	twitch.retryDetectPage = function retryDetectPage() {
		let page = twitch.realDetectPage();
		
		if(!page) {
			setTimeout(twitch.retryDetectPage, 100);
		} else {
			twitch.ready(page);
		}
	};
	
	/** Twitch.tv channel page **/
	twitch.channel = {};
	
	// Twitch is almost entirely based on JS, so we'll have to use timeouts to handle detection
	twitch.ready = function twitchReady(page) {
		callAllMethodsForSitePage(twitch, page);
	};
	
	// Remove chat from channel page
	twitch.channel.removeChat = function() {
		// If !success, recall the method after a small timeout
		var success = false;
		
		// If it's currently open, close chat to trigger viewer expansion
		var close = document.querySelector('#right_close[class*="open"]');
		
		if(close) {
			close.click();
		}
		
		// Remove entire container from DOM (coincidentally, there's an ad in there as well, so it'll lighten the page)
		var el = document.getElementById('right_col');
		
		if(el) {
			el.parentNode.removeChild(el);
			success = true;
		}
		
		// Remove arrow icon that usually opens chat
		var el = document.getElementById('right_close');
		
		if(el) {
			el.parentNode.removeChild(el);
			success = true;
		}
		
		return success;
	};
	
	
	/** Reddit **/
	// Get current page type
	reddit.detectPage = function(path) {
		// TODO: add thread page
		
		// Use reddit's body classes to detect the page
		var classes = document.getElementsByTagName('body')[0].className;
		
		if(classes.indexOf('comments-page') > -1) {
			return 'thread';
		}
		
		return false;
	};
	
	/** Reddit thread **/
	reddit.thread = {};
	
	// Hide all child comments.
	// TODO: If the user has RES installed, RES will add the "hide child comments" buttons, but everything's already hidden. Add a timer(?) that updates/fixes interference with other extensions.
	reddit.thread.hideAllChildComments = function() {
		// Toggle all comments
		var commentContainers = document.querySelectorAll('div.commentarea > div.sitetable > div.thing');
		
		for (let container of Array.from(commentContainers)) {
			const thisChildren = container.querySelector('div.child > div.sitetable');
			
			if (thisChildren) {
				thisChildren.style.display = 'none';
			}
		}
		
		return true;
	};
	
	
	/** Let's go **/
	var sitename = domainToWebsiteName(window.location.hostname);
	
	// Do we have something for this site?
	if(sites.hasOwnProperty(sitename)) {
		var site = sites[sitename];
		var page = site.detectPage(window.location.pathname);
		
		// Do we have something for this page?
		if(page !== false) {
			callAllMethodsForSitePage(site, page);
		}
	}
})();
