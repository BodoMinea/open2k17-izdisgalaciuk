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

function datelog(){
	return Date().split(' ')[0]+' '+Date().split(' ')[1]+' '+Date().split(' ')[2]+' '+Date().split(' ')[3]+' '+Date().split(' ')[4];
}

bonjour.publish({ name: 'GALACIUCRECOGNIZER', type: 'http', port: 42522 }) // announce

app.use('/static', express.static('res/public')); // resurse statice

app.get('/', function(req, res){
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