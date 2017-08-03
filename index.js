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

var folder, mode='fast', fselect;

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

process.argv.forEach(function (val, index, array) {
  if(index==2){ folder = val; }
  if(index==3&&typeof(val)!='undefined'){ mode = val; }
  if(mode=='fast') { fselect='light'; } else { fselect='init'; }
});

function datelog(){
	return Date().split(' ')[0]+' '+Date().split(' ')[1]+' '+Date().split(' ')[2]+' '+Date().split(' ')[3]+' '+Date().split(' ')[4];
}

function randomize(start,stop){
	return Math.floor(Math.random() * stop) + start;
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

function dodiff(input,start,stop,recall){
  if(!start){ var start=0; stop=3; }
  var results=[], iterations=0,running=1;
  fs.readdir('./res/'+fselect+'set', (err, files) => {
  	for(i=start;i<=stop;i++){
    var diff = resemble(input).compareTo('./res/'+fselect+'set/'+files[i]).ignoreAntialiasing().onComplete(function(data){
    	iterations++;
		results.push(100-data.misMatchPercentage);
		console.log(results);
		console.log('WORKING -> Nr. Rez.: '+results.length+' Avg: '+arrayavg(results)+' Max: '+results.max());
		if(iterations==stop+1){ var avg = arrayavg(results); if(avg>50) { response((results.max()*3+avg)/4); }
		else { var rndx=randomize(iterations,files.length-2); dodiff(input,rndx,rndx+2,true); } }
		else if(recall&&results.length==2){ response((results.max()*3+avg)/4); }
		});
	}
})
}

function response(resp){
	if(folder){ 
		console.log('FINAL: '+resp);
		process.exit();
	}
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