/***********************************
  Gravity Game por Guilherme Nemeth
************************************/

var solarSystem = document.getElementById('solar_system'),
	ctx = solarSystem.getContext('2d'),
	fps = 50,
	planets = [],
	totalPlanets = 4,
	player = {},
	homePlanet = {},
	goalPlanet = {},
	x = 0,
	radius = 0,
	mouseX = 0,
	mouseY = 0,
	launchPower = 0,
	powerDirection = 0.5,	
	flying = false,
	launching = false,
	maxPower = 25,
	powerRectHeight = 100,
	currentPowerRectHeight = 0,
	playerAngle = 0,
	angleText = 0,
	maps = [],
	map = {};

//create a new game with random positions, when we're out of maps
function newGame() {

	x = 0;

	var homeRadius = 40 + Math.floor(Math.random() * 20),
		homeY = (homeRadius + 20) + Math.floor(Math.random() * (solarSystem.height - homeRadius - 20));
	homePlanet = {
		x: 60,
		y: homeY,
		radius: homeRadius,
		density: getDensity(homeRadius)
	};

	var goalRadius = 40 + Math.floor(Math.random() * 20),
		goalY = (goalRadius + 20) + Math.floor(Math.random() * (solarSystem.height - goalRadius - 20));
	goalPlanet = {
		x: 740,
		y: goalY,
		radius: goalRadius,
		density: getDensity(goalRadius)
	};

	createPlayer();

	var i = 0;
	var r = Math.floor(Math.random() * totalPlanets.length);
	while (i < totalPlanets) {
		var radius = 40 + Math.floor(Math.random() * 40), x, y, invalid;
	
		while (true) {

			x = (homePlanet.x + homeRadius) + Math.floor(Math.random() * 600);
			y = 20 + Math.floor(Math.random() * 500);
			invalid = false;

			if (intersects(x, y, homePlanet.x, homePlanet.y, radius, homePlanet.radius + player.radius + 10))
				invalid = true;

			if (intersects(x, y, goalPlanet.x, goalPlanet.y, radius, goalPlanet.radius + player.radius + 10))
				invalid = true;

			if (i == r) {
				if (!intersects(0, y, 0, goalPlanet.y, radius, goalPlanet.radius)) {
					invalid = true;
				}
			}

			for (var j = 0; j < planets.length; j++) {
				var p = planets[j];
				if (intersects(x, y, p.x, p.y, radius, p.radius + player.radius + 10)) {
					invalid = true;	
				}
			}
			if (!invalid) break;
		}

		var density = getDensity(radius);
		planets.push({
			x: x,
			y: y,
			radius: radius,
			density: density,
		});
		i++;
	}
}

function loadMaps(data) {
	maps = data;	
}

function loadLevel(i) {

	map = maps[i];
	homePlanet = map.homePlanet;
	goalPlanet = map.goalPlanet;
	maxPower = map.maxPower;

	planets = [];
	for (var i = 0; i < map.planets.length; i++) {
		planets.push(map.planets[i]);
	}

	createPlayer();
}

function createPlayer() {

	var playerX = homePlanet.x + homePlanet.radius,
		playerY = homePlanet.y;

	player = {
		x: playerX,
		y: playerY,
		radius: map.playerRadius,
		density: map.playerDensity
	};
}

function getDensity(radius) {

	var assigned = false;
	if (radius < 50) {
		density = 2;
		assigned = true;
	}
	if (radius < 60 && !assigned) {
		density = 3;
		assigned = true;
	}
	if (radius < 70 && !assigned) {
		density = 4;
		assigned = true;
	}
	if (radius < 80 && !assigned) {
		density = 5;
		assigned = true;
	}

	return density;
}

function mouseMove(e) {

	mouseX = e.offsetX || e.layerX;
	mouseY = e.offsetY || e.layerY;
}

//launches the player towards the mouse position
function launch(e) {

	if (!flying && launching) {
		flying = true;
		launching = false;
	
		player.velocityX = Math.cos(playerAngle) * launchPower;
		player.velocityY = Math.sin(playerAngle) * launchPower;
	}
}

function update(dt) {

	//increases launch force when the mouse is pressed
	if (launching) {
		launchPower += powerDirection;
		if (launchPower >= maxPower) powerDirection = -powerDirection;
		if (launchPower <= 0) powerDirection = -powerDirection;

		var powerPercent = launchPower / maxPower * 100;
		currentPowerRectHeight = (powerRectHeight - 20) / 100 * powerPercent;
	}

	//handle physics when player is flying
	if (flying) {

		for (var i = 0; i < planets.length; i++) {
			var p = planets[i],
				angle = Math.atan2(p.y - player.y, p.x - player.x),
				distance = Math.sqrt(Math.pow(p.y - player.y, 2) + Math.pow(p.x - player.x, 2)) - p.density;
				gravity = Math.ceil(Math.pow(p.density * (p.radius / (p.radius + distance)), 2));

			player.velocityX += Math.cos(angle) * (gravity + (player.density / player.radius * dt)) * dt;
			player.velocityY += Math.sin(angle) * (gravity + (player.density / player.radius * dt)) * dt;
		}

		var others = [homePlanet, goalPlanet];
		for (var i = 0; i < others.length; i++) {
			var p = others[i],
				angle = Math.atan2(p.y - player.y, p.x - player.x),
				distance = Math.sqrt(Math.pow(p.y - player.y, 2) + Math.pow(p.x - player.x, 2)) - p.density;
				gravity = Math.ceil(Math.pow(p.density * (p.radius / (p.radius + distance)), 2));

			player.velocityX += Math.cos(angle) * (gravity + (player.density / player.radius * dt)) * dt;
			player.velocityY += Math.sin(angle) * (gravity + (player.density / player.radius * dt)) * dt;
		}

		player.x += player.velocityX * dt;
		player.y += player.velocityY * dt;

		for (var i = 0; i < planets.length; i++) {
			var p = planets[i];

			if (Math.sqrt(Math.pow(p.y - player.y, 2) + Math.pow(p.x - player.x, 2)) < p.radius + player.radius) {
				restart();
			}
		}

		if (Math.sqrt(Math.pow(goalPlanet.y - player.y, 2) + Math.pow(goalPlanet.x - player.x, 2)) < goalPlanet.radius + player.radius) {
			restart();
			level++;
			loadLevel(level);
		}

		if (player.x > solarSystem.width || player.x <= 0 || player.y > solarSystem.height || player.y <= 0) {
			restart();
		}

	} else {
		//update player's position in home planet
		playerAngle = Math.atan2(mouseY - homePlanet.y, mouseX - homePlanet.x);
		if (playerAngle < 0) playerAngle += 360 * Math.PI/180;
		angleText = playerAngle * 180 / Math.PI;
		player.x = Math.cos(playerAngle) * homePlanet.radius + homePlanet.x;
		player.y = Math.sin(playerAngle) * homePlanet.radius + homePlanet.y;
	}

	//update satellite's orbits
	for (var i = 0; i < planets.length; i++) {
		var p = planets[i];

		for (var j = 0; j < p.satellites.length; j++) {
			s = p.satellites[j];

			var radians = s.angle * (Math.PI / 180);
			s.x = Math.cos(radians) * (p.radius + s.distance) + p.x;
			s.y = Math.sin(radians) * (p.radius + s.distance) + p.y;
			s.angle += s.direction;

			if (Math.sqrt(Math.pow(player.y - s.y, 2) + Math.pow(player.x - s.x, 2)) < player.radius + s.radius)
				restart();
		}
	}
}

function draw() {

	ctx.clearRect(0, 0, 800, 600);
	
	ctx.save();
	ctx.beginPath();
	ctx.arc(homePlanet.x, homePlanet.y, homePlanet.radius, 0, 2 * Math.PI);
	ctx.fillStyle = '#000066';
	ctx.fill();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.arc(goalPlanet.x, goalPlanet.y, goalPlanet.radius, 0, 2 * Math.PI);
	ctx.fillStyle = '#006600';
	ctx.fill();
	ctx.font = '20px Arial';
	ctx.strokeStyle = '#ffffff';
	ctx.strokeText(''+ goalPlanet.density / 2, goalPlanet.x - 5, goalPlanet.y + 5);
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
	ctx.fillStyle = '#000000';
	ctx.fill();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.arc(Math.cos(playerAngle) * player.radius + player.x, Math.sin(playerAngle) * player.radius + player.y, player.radius / 4, 0, 2 * Math.PI);
	ctx.fillStyle = '#f3f3f3';
	ctx.fill();
	ctx.restore();

	for (var i = 0; i < planets.length; i++) {
		var p = planets[i];
		var text = (p.density == 2) ? (p.density - 1.5) : (p.density - 2);
		ctx.save();
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
		ctx.fillStyle = '#660000';
		ctx.fill();
		ctx.font = '20px Arial';
		ctx.strokeStyle = '#ffffff';
		ctx.strokeText(''+ text, p.x - 5, p.y + 5);
		ctx.restore();

		for (var j = 0; j < p.satellites.length; j++) {
			var s = p.satellites[j];
			ctx.save();
			ctx.beginPath();
			ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
			ctx.fillStyle = '#000000';
			ctx.fill();
			ctx.restore();
		}
	}

	ctx.save();
	ctx.beginPath();
	ctx.rect(720, 10, 60, powerRectHeight);
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rect(730, 100, 40, -currentPowerRectHeight);
	ctx.fillStyle = '#00cc00';
	ctx.fill();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.font = '20px Arial';
	ctx.fillStyle = '#000000';
	ctx.fillText('Level: '+ (level + 1), 20, 30);
	ctx.fillText('Velocity: '+ parseInt(launchPower), 600, 30);
	ctx.fillText('Angle: '+ parseInt(angleText), 600, 60);
	ctx.fill();
	ctx.restore();
}

function restart() {
	flying = false;
	launchPower = 0;
	currentPowerRectHeight = 0;
	maxPower = map.maxPower;
}

function run() {

	var time = new Date().getTime(),
		previousTime;

	window.setInterval(function() {

		previousTime = time;
		time = new Date().getTime();

		update((time - previousTime) / 100);
		draw();
	}, 1000 / fps);
}

//util functions
function intersects(ax, ay, bx, by, aw, bw) {

	if (Math.sqrt(Math.pow(by - ay, 2) + Math.pow(bx - ax, 2)) < aw + bw)
		return true;

	return false;
}

//load the maps
var level = 0,
	getLevels = $.getJSON("assets/levels/levels.json");
getLevels.done(function(data) {
	loadMaps(data);
	loadLevel(7);
});

solarSystem.addEventListener('mousemove', mouseMove);
solarSystem.addEventListener('mouseup', launch);
solarSystem.addEventListener('mousedown', function(e) {
	if (!flying)
		launching = true;
});

//this would start a random game
//newGame();

//start the game loop
run();


