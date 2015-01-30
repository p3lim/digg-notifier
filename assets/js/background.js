var path = 'https://digg.com/';
var defaults = {
	'interval': 15,
	'notifications': true,
	'upgrade': 1
};

var context;
var createIcon = function(callback){
	var canvas = document.createElement('canvas');
	canvas.height = canvas.width = 19;

	context = canvas.getContext('2d');
	context.image = new Image();
	context.image.src = 'assets/images/icon_enabled.png';
	context.image.onload = callback;
};

var updateNotifications = function(count){
	if(localStorage.getItem('notifications') === 'true'){
		chrome.tabs.query({
			currentWindow: true,
			active: true,
			url: path + 'reader*'
		}, function(tabs){
			if(!tabs.length){
				chrome.notifications.clear('digg-notifier', function(){
					chrome.notifications.create('digg-notifier', {
						type: 'basic',
						iconUrl: 'assets/images/icon128.png',
						title: 'Digg Reader',
						message: count + ' unread article' + (count > 1 ? 's' : '')
					}, function(){});
				});
			}
		});
	}
};

var lastCount;
var updateBadge = function(count){
	if(typeof(count) === 'number'){
		chrome.browserAction.setIcon({path: 'assets/images/icon_enabled.png'});

		if(count > 0){
			chrome.browserAction.setBadgeBackgroundColor({color: '#D00018'});
			chrome.browserAction.setBadgeText({text: count.toString()});
		} else
			chrome.browserAction.setBadgeText({text: ''});

		if(lastCount !== count){
			if(count > lastCount && count > 0)
				updateNotifications(count);

			lastCount = count;
		}
	} else {
		chrome.browserAction.setIcon({path: 'assets/images/icon_disabled.png'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#BBB'});
		chrome.browserAction.setBadgeText({text: '?'});
	}
};

var getUnreadResponse = function(){
	if(this.readyState === 4){
		if(this.status === 200){
			var response = JSON.parse(this.response);
			updateBadge(response.data.subscriptions['digg.com/all'].unread);
		} else if(this.status === 403)
			updateBadge();
	}
};

var getUnread = function(){
	// TODO: We don't need authentication? I don't berive! Must be eatin' cookies
	var xhr = new XMLHttpRequest();
	xhr.open('GET', path + 'api/subscription/list.json');
	xhr.onreadystatechange = getUnreadResponse;
	xhr.send();
};

var markCallback = function(details){
	var formData = details.requestBody.formData;
	if(formData.content_id !== undefined)
		updateBadge(--lastCount);
	else if(formData.folder === undefined && formData.feed_url === undefined)
		updateBadge(0);
	else
		setTimeout(getUnread, 2000); // TODO: replace this with proper network tracking
};

var listCallback = function(details){
	var data = details.requestBody.data;
}

var onInitialize = function(){
	if(!localStorage.getItem('upgrade')){
		localStorage.clear();

		for(var key in defaults){
			if(key !== null)
				localStorage.setItem(key, defaults[key]);
		}
	} else if(localStorage.getItem('upgrade') < defaults.upgrade){
		for(var index = 0; index < localStorage.length; index++){
			var key = localStorage.key(index);
			if(defaults[key] === undefined)
				localStorage.removeItem(key);
		}

		for(var key in defaults){
			if(localStorage.getItem(key) === null)
				localStorage.setItem(key, defaults[key]);
		}

		localStorage.setItem('upgrade', defaults.upgrade);
	}

	chrome.alarms.create('digg-notifier', {
		periodInMinutes: +localStorage.getItem('interval')
	});

	chrome.webRequest.onBeforeRequest.addListener(markCallback, {
		urls: [path + 'api/reader/markasread*'],
		types: ['xmlhttprequest']
	}, ['requestBody']);

	createIcon(getUnread);
};

chrome.runtime.onStartup.addListener(onInitialize);
chrome.runtime.onInstalled.addListener(onInitialize);

var refresh = '\
	var refresh = document.querySelector("#nav-notif");\
	if(refresh){\
		refresh.click();\
		document.querySelector("#dr-nav-all .dr-label").click();\
	}';

var openTab = function(){
	getUnread();

	chrome.tabs.query({
		currentWindow: true,
		url: path + 'reader*'
	}, function(tabs){
		var tab = tabs[0];
		if(tab){
			chrome.tabs.update(tab.id, {active: true});
			chrome.tabs.executeScript(tab.id, {code: refresh});
		} else
			chrome.tabs.create({url: path + 'reader'});
	});
};

chrome.notifications.onClicked.addListener(function(id){
	if(id === 'digg-notifier')
		openTab();
});

chrome.browserAction.onClicked.addListener(openTab);

chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name === 'digg-notifier')
		getUnread();
});

chrome.runtime.onMessage.addListener(function(message, sender){
	if(message.interval){
		localStorage.setItem('interval', message.interval);

		chrome.alarms.clear('digg-notifier');
		chrome.alarms.create('digg-notifier', {
			periodInMinutes: +message.interval
		});
	}
});
