var formatTime = function(value){
	if(value > 60)
		return 'hours';
	else if(value == 60)
		return 'hour';
	else if(value > 1)
		return 'minutes';
	else
		return 'minute';
};

var inputChange = function(){
	var obj = {};
	obj[this.id] = this.checked;
	chrome.storage.sync.set(obj);
};

var valueChange = function(event){
	var value = this;
	chrome.storage.sync.get('interval', function(settings){
		var newValue, oldValue = settings.interval;
		var multiplier = event.shiftKey ? 5 : 1;

		if(event.wheelDelta > 0){
			if(oldValue >= 60)
				newValue = oldValue + 60;
			else
				newValue = Math.min(oldValue + (1 * multiplier), 60);
		} else {
			if(oldValue <= 60)
				newValue = oldValue - (1 * multiplier);
			else
				newValue = oldValue - 60;
		}

		if(newValue < 1)
			newValue = 1;
		else if(newValue > 1440)
			newValue = 1440;

		if(newValue != oldValue){
			value.innerText = newValue >= 60 ? newValue / 60 : newValue;
			value.string.innerText = formatTime(newValue);

			chrome.storage.sync.set({
				interval: newValue
			});
		}
	});
};

document.addEventListener('DOMContentLoaded', function(){
	[].forEach.call(this.querySelectorAll('input'), function(input){
		input.addEventListener('change', inputChange);

		chrome.storage.sync.get(input.id, function(settings){
			input.checked = settings[input.id]
		});
	});

	var type = this.querySelector('.interval .type');
	var value = this.querySelector('.interval .value');
	value.string = type;
	value.addEventListener('mousewheel', valueChange);

	chrome.storage.sync.get('interval', function(settings){
		var interval = settings.interval;
		type.innerText = formatTime(interval);
		value.innerText = interval >= 60 ? interval / 60 : interval;
	});
});
