var inputChange = function(){
	localStorage.setItem(this.id, this.checked);
};

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

document.addEventListener('DOMContentLoaded', function(){
	[].forEach.call(this.querySelectorAll('input'), function(input){
		input.addEventListener('change', inputChange);
		input.checked = localStorage.getItem(input.id) === 'true';
	});

	var interval = +localStorage.getItem('interval');
	var type = this.querySelector('.interval .type');
	type.innerText = formatTime(interval);

	var value = this.querySelector('.interval .value');
	value.innerText = interval;
	value.addEventListener('mousewheel', function(event){
		var multiplier = event.shiftKey ? 5 : 1;
		var newValue;

		if(event.wheelDelta > 0){
			if(interval >= 60)
				newValue = interval + 60;
			else
				newValue = Math.min(interval + (1 * multiplier), 60);
		} else {
			if(interval <= 60)
				newValue = interval - (1 * multiplier);
			else
				newValue = interval - 60;
		}

		if(newValue < 1)
			newValue = 1;
		else if(newValue > 1440)
			newValue = 1440;

		console.log(newValue);

		if(newValue != interval){
			interval = newValue;

			if(interval / 60 >= 1)
				this.innerText = interval / 60;
			else
				this.innerText = interval;

			type.innerText = formatTime(interval);

			chrome.runtime.sendMessage({
				interval: interval
			});
		}
	});
});
