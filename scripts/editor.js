var solarSystemEditor = document.getElementById('solar_system_preview'),
	ctx = solarSystemEditor.getContext('2d');
	editor = new Editor(),
	levelCount = 0,
	fb = new Firebase('https://gravitygame.firebaseio.com');

function Editor() {

	this.homePlanet = {}
	this.goalPlanet = {}
	this.maxPower = 0;
	this.playerRadius = 0;
	this.playerDensity = 0;
	this.planets = [];

	this.save = function() {

		var level = {
			homePlanet: this.homePlanet,
			goalPlanet: this.goalPlanet,
			maxPower: this.maxPower,
			playerRadius: this.playerRadius,
			playerDensity: this.playerDensity,
			planets: this.planets
		}

		return level;
	}

	this.commit = function(object, property, elem) {

		var obj = this[object];
		obj[property] = parseInt(elem.value);

		preview();
	}

	this.commitSimple = function(property, elem) {

		this[property] = parseInt(elem.value);
	}

	this.commitPlanet = function(index, property, elem) {

		var p = this.planets[index];
		p[property] = parseInt(elem.value);

		preview();
	}

	this.commitSatellite = function(planetIndex, satelliteIndex, property, elem) {

		var s = this.planets[planetIndex].satellites[satelliteIndex];
		s[property] = parseInt(elem.value);

		console.log("commitsat");
		preview();
	}

	this.addPlanet = function() {

		this.planets.push({x: 0, y: 0, radius: 0, density: 0, satellites: []});
		var planetCount = this.planets.length - 1;
		var properties = ['X', 'Y', 'Radius', 'Density'];

		var table = document.getElementById('planets-table'),
			headerRow = document.createElement('tr'),
			inputRow = document.createElement('tr'),
			satelliteRow = document.createElement('tr');

			satelliteRow.id = "satellite-row-"+ planetCount +'-0';
			satelliteRow.innerHTML = '<td><button class="add-satellite" onclick="editor.addSatellite('+ planetCount +')">+ Add Satellite</button></td>';

		for (var i = 0; i < properties.length; i++) {

			var headerColumn = document.createElement('td'),
				headerText = document.createElement('strong');

			headerText.className = 'important';
			headerText.innerHTML = planetCount +' - '+ properties[i];
			headerColumn.appendChild(headerText);
			headerRow.appendChild(headerColumn);

			var inputColumn = document.createElement('td'),
				input = document.createElement('input');

			input.type = 'text';
			input.className = 'input';
			input.setAttribute('onblur', 'editor.commitPlanet('+ planetCount +', "'+ properties[i].toLowerCase() +'", this)');
			inputColumn.appendChild(input);
			inputRow.appendChild(inputColumn);
		}

		table.appendChild(headerRow);
		table.appendChild(inputRow);
		table.appendChild(satelliteRow);
	}

	this.addSatellite = function(planetIndex) {

		this.planets[planetIndex].satellites.push({x: 0, y: 0, radius: 0, distance: 0, angle: 0, direction: 0});
		var satCount = this.planets[planetIndex].satellites.length - 1,
			planetCount = this.planets.length - 1;
			properties = ['Radius', 'Distance', 'Angle', 'Direction'],
			column = document.createElement('td'),
			rowCount = Math.floor((satCount) / 4);
		console.log(rowCount, satCount / 4);

		var row = document.getElementById('satellite-row-'+ planetIndex +'-'+ rowCount), newRow = false;
		if ((satCount + 1) % 4 == 0) {

			row = document.createElement('tr');
			row.id = 'satellite-row-'+ planetIndex +'-'+ (rowCount + 1);
			newRow = true;
		}

			for (var i = 0; i < properties.length; i++) {

				var label = document.createElement('strong');
				label.className = 'important';
				label.innerHTML = planetCount + ' - '+ satCount + ' - '+ properties[i];

				var input = document.createElement('input');
				input.type = 'text';
				input.className = 'input';
				input.setAttribute('onblur', 'editor.commitSatellite('+ planetIndex +', '+ satCount +', "'+ properties[i].toLowerCase() +'", this)');

				column.appendChild(label);
				column.appendChild(document.createElement('br'));
				column.appendChild(input);
				column.appendChild(document.createElement('br'));
				column.appendChild(document.createElement('br'));
			}

		row.appendChild(column);

		if (newRow) {
			document.getElementById('planets-table')
				.appendChild(row);
		}
	}
}

function preview() {

	ctx.clearRect(0, 0, 800, 600);

	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = '#0000dd';
	ctx.strokeStyle = '#ffffff';
	ctx.arc(editor.homePlanet.x, editor.homePlanet.y, editor.homePlanet.radius, 0, 2 * Math.PI);
	ctx.font = '20px Arial';
	ctx.strokeText(""+ editor.homePlanet.density, editor.homePlanet.x / 2, editor.homePlanet.y / 2);
	ctx.fill();
	ctx.stroke();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = '#00dd00';
	ctx.strokeStyle = '#ffffff';
	ctx.arc(editor.goalPlanet.x, editor.goalPlanet.y, editor.goalPlanet.radius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.font = '20px Arial';
	ctx.strokeText(""+ editor.goalPlanet.density, editor.goalPlanet.x / 2, editor.goalPlanet.y / 2);
	ctx.stroke();
	ctx.restore();

	for (var i = 0; i < editor.planets.length; i++) {
		var p = editor.planets[i];
		var text = p.density;
		ctx.save();
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
		ctx.fillStyle = '#dd0000';
		ctx.fill();
		ctx.font = '20px Arial';
		ctx.strokeStyle = '#ffffff';
		ctx.strokeText(''+ text, p.x - 5, p.y + 5);
		ctx.restore();

		for (var j = 0; j < p.satellites.length; j++) {
			var s = p.satellites[j];
			s.x = Math.cos(s.angle * Math.PI/180) * (p.radius + s.distance) + p.x;
			s.y = Math.sin(s.angle * Math.PI/180) * (p.radius + s.distance) + p.y;
			console.log(s.x, s.y);
			ctx.save();
			ctx.beginPath();
			ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
			ctx.fillStyle = '#000000';
			ctx.fill();
			ctx.restore();
		}
	}
}

function save() {

	fb.child('levels').child(levelCount).set(editor.save());
	alert('Saved!');
}

fb.child('levels').on('value', function(snapshot) {

	levelCount = snapshot.val().length;
})