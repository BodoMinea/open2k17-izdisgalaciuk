const express = require('express'),
	  app = express(),
	  os = require('os'),
	  bonjour = require('bonjour')(),
	  http = require('http').Server(app),
	  io = require('socket.io')(http),
	  ifaces = os.networkInterfaces,
      bodyParser = require("body-parser"),
      fs = require('fs'),
      resemble = require('node-resemble-js');

var folder, mode='fast';

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

process.argv.forEach(function (val, index, array) {
  if(index==2){ folder = val; }
  if(index==3){ mode = val; }
});

function datelog(){
	return Date().split(' ')[0]+' '+Date().split(' ')[1]+' '+Date().split(' ')[2]+' '+Date().split(' ')[3]+' '+Date().split(' ')[4];
}

function arrayavg(elmt){
	var sum = 0;
	for( var i = 0; i < elmt.length; i++ ){
	    sum += parseInt( elmt[i], 10 );
	}
	var avg = sum/elmt.length;
	return avg;
}

var input = fs.readFileSync('./res/lightset/20170803_102228.png');

function dodiff(input,start,stop){
  if(!start){ var start=0; stop=5;}
  var results=[], iterations=0,running=1;
  fs.readdir('./res/lightset', (err, files) => {
  	for(i=start,i<=stop,i++){
    var diff = resemble(input).compareTo('./res/lightset/'+files[i]).ignoreAntialiasing().onComplete(function(data){
		results.push(100-data.misMatchPercentage);
		console.log(results);
		console.log('Nr. Rez.: '+results.length+' Avg: '+arrayavg(results)+' Max: '+results.max());
		console.log(results.length>=5);
		if(results.length>=5){ var avg = arrayavg(results); if(avg>50) response((results.max()*3+avg)/4); }
		else if(i>files.length-files.length/3) { response((results.max()*3+arrayavg(results))/4); }
		else if(i>=) { dodiff(input,i,files.length-1) }
		});
	}
})
}

dodiff(input);

if(!folder){ // mod app server API daca nu avem cmd line

	bonjour.publish({ name: 'GALACIUCRECOGNIZER', type: 'http', port: 42522 }) // announce

	app.use('/static', express.static('res/public')); // resurse statice

	app.get('/', function(req, res){ // interfata online
	  res.sendFile(__dirname + '/app/');
	  console.log('Webapp accessed -> '+datelog());
	});

	app.get('/picmatch', function (req, res) { // API-ul, creierul, aka Shakespeare
	   console.log('Almighty API called -> '+datelog());
	   res.send('');
	})

	app.listen(42522, function () {
	  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
	  		console.log('API Listening on - '+add+':42522 -> '+datelog());
		})
	})

}