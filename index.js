const express = require('express'), 
	  app = express(),
	  os = require('os'),
	  bonjour = require('bonjour')(),
	  server = require('http').createServer(app),
	  io = require('socket.io').listen(server),
	  ifaces = os.networkInterfaces,
      bodyParser = require("body-parser"),
      urlencodedParser = bodyParser.urlencoded({ extended: false }),
      resemble = require('node-resemble-v2'),
      images = require('images'),
      busboy = require('connect-busboy'),
      fs = require('fs-extra'),
      path = require('path'),
      async = require('async');

var folder, mode='fast', fselect, finalresp=[], total, pending; // global

function set(x){
	total = x;
}

Array.prototype.max = function() { // extindem array-ul sa aiba max
  return Math.max.apply(null, this);
};

process.argv.forEach(function (val, index, array) { // argumente CLI
  if(index==2){ folder = val; }
  if(index==3&&typeof(val)!='undefined'){ mode = val; }
  if(mode=='fast') { fselect='light'; } else { fselect='init'; }
});

function datelog(){ // procesare format data pentru log
	return Date().split(' ')[0]+' '+Date().split(' ')[1]+' '+Date().split(' ')[2]+' '+Date().split(' ')[3]+' '+Date().split(' ')[4];
}

function randomize(start,stop){ // un fel de randbetween
	return Math.floor(Math.random() * stop) + start;
}

function arrayavg(elmt){ // media unui array cu numere
	var sum = 0;
	for( var i = 0; i < elmt.length; i++ ){
	    sum += parseInt( elmt[i], 10 );
	}
	var avg = sum/elmt.length;
	return avg;
}

function dodiff(input,iname,start,stop,recall,setime){ // functia serioasa care face comparatie
  if (typeof(input)=='string') { var namearr=input.split('.'); // extensie
  if(namearr[namearr.length-1]=='jpg'||namearr[namearr.length-1]=='jpeg'||namearr[namearr.length-1]=='JPG'||namearr[namearr.length-1]=='JPEG'){ // format img
  	console.log('Procesare '+input+' ca imagine JPEG... (+conversie)'); // logging 
  	var get = input;
  	input = images(get).encode("png"); // convertim si luam ca buffer
  } else { console.log('Procesare '+input+' ca imagine PNG...'); } } // ceva logging
  if(!start){ var start=0; stop=3; } // iterare default
  var results=[], iterations=0;
  fs.readdir('./res/'+fselect+'set', (err, files) => {
  	for(i=start;i<=stop;i++){
  	if(!setime){ var stime = Date.now(); } else { stime=setime; }
    var diff = resemble(input).compareTo('./res/'+fselect+'set/'+files[i]).ignoreAntialiasing().onComplete(function(data){
    	iterations++;
		results.push(100-data.misMatchPercentage); // asemanarea ca procent
		console.log(results); // logging again
		console.log('WORKING ('+iname+') -> Nr. Rez.: '+results.length+' Avg: '+arrayavg(results).toFixed(2)+' Max: '+results.max().toFixed(2)); // and again
		if(iterations==stop+1){ var avg = arrayavg(results); if(avg>50) { response((results.max()*3+avg)/4,iname,((Date.now()-stime)/1000).toFixed(2)); } // returnam
		else { var rndx=randomize(iterations,files.length-2); dodiff(input,iname,rndx,rndx+2,true,setime); } } // continuam pe un subset random de sample-uri
		else if(recall&&results.length==2){ response((results.max()*3+arrayavg(results))/4,iname,((Date.now()-stime)/1000).toFixed(2)); } // returnam
		});
	}
})
}

function dodiffreturn(input,callback){ // functia serioasa care face comparatie
  console.log('Procesare imagine de la API headless ca PNG...');
  if(!start){ var start=0; stop=3; } // iterare default
  var results=[], iterations=0;
  fs.readdir('./res/'+fselect+'set', (err, files) => {
  	for(i=start;i<=stop;i++){
  	var stime = Date.now();
    var diff = resemble(input).compareTo('./res/'+fselect+'set/'+files[i]).ignoreAntialiasing().onComplete(function(data){
    	iterations++;
		results.push(100-data.misMatchPercentage); // asemanarea ca procent
		console.log(results); // logging again
		console.log('WORKING (API) -> Nr. Rez.: '+results.length+' Avg: '+arrayavg(results).toFixed(2)+' Max: '+results.max().toFixed(2)); // and again
		if(iterations==stop+1){ 
			pending='{"status":"ok","rezultat":'+(results.max()*3+arrayavg(results))/4+', "timp":'+((Date.now()-stime)/1000).toFixed(2)+'}'; console.log('RASPUNS API: '+pending); callback(); }
		});
	}
})
}

function writeCSV () { // raport csv					
    var file = './raport.csv';
    var text = '';
    for(var i=0;i<finalresp.length;i++) { // append nume fisiere
    	if(i!=finalresp.length-1) { text+=finalresp[i].split('     ')[1]+','; } else { text+=finalresp[i].split('     ')[1]; }
    }
    text+='\r\n';
    for(var i=0;i<finalresp.length;i++) { // append procentaje
    	if(i!=finalresp.length-1) { text+=finalresp[i].split('     ')[0]+','; } else { text+=finalresp[i].split('     ')[0]; }
    }
    text+='\r\n';
    for(var i=0;i<finalresp.length;i++) { // append 
    	if(i!=finalresp.length-1) { text+=finalresp[i].split('     ')[2]+','; } else { text+=finalresp[i].split('     ')[2]; }
    }
    fs.writeFileSync(file, text) // scriem si asteptam operatiunea
}

function response(resp,iname,stime){ // raspuns
	if(folder){ // cli
		console.log('FINAL ('+iname+'): '+resp.toFixed(2)+'% - '+stime+' sec');
		finalresp.push(resp.toFixed(2)+'%     '+iname+'     '+stime+' sec'); 
		if(finalresp.length==total){ // gata
			console.log(); // break
			console.log('------------- [ RAPORT FINAL FOLDER ] -------------'); // un kindof header
			console.log('_____________ (procent,  path fisier) _____________');
			for(var i=0;i<finalresp.length;i++) { console.log(finalresp[i].split('     ')[0]+'     '+folder+'/'+finalresp[i].split('     ')[1]); }
			console.log(); // break
			writeCSV(); // scriem CSV
			console.log('Rezultatele impreuna cu timpii de procesare au fost salvate si in raport.csv'); // notice
			process.exit(); // iesire graceful din script
		}
	}else{ // web, emitem pe socket catre client html+js
		var str = resp.toFixed(2)+'% potrivire cu Gălăciuc -> '+iname+' | Procesat în '+stime+' sec.'; // procesare string
		io.emit('done', str); // emitem
		console.log('Servit către client: '+str) // log
	}
}

if(!folder){ // mod app server API daca nu avem cmd line

	bonjour.publish({ name: 'GALACIUCRECOGNIZER', type: 'http', port: 42522 }) // announce

	app.use('/public', express.static('res/public')); // resurse statice

	app.use(busboy());

	app.get('/', function(req, res){ // interfata online
	  res.sendFile(__dirname + '/app/gui.html');
	  console.log('Webapp accesat -> '+datelog());
	});

	app.route('/upload') // upload pentru Dropzone AJAX
    .post(function (req, res, next) {
	var fstream;
        req.pipe(req.busboy); // pipe din middleware
        req.busboy.on('file', function (fieldname, file, filename) {
        	console.log('Apel API POST -> '+datelog());
            console.log("Incarcare: " + filename);
            fstream = fs.createWriteStream(__dirname + '/res/upl/' + filename);
            file.pipe(fstream);
            fstream.on('close', function () {    
                console.log("Incarcare terminata " + filename + ' ' + datelog());              
                dodiff('./res/upl/'+filename,filename); // lansam procesarea
            });
        });
    });

	app.post('/api/compare', urlencodedParser, function (req, res) {
	  if (!req.body) return res.sendStatus(400)
	  console.log('Apel API headless -> '+datelog());
	  base64Data = req.body.img.replace(/^data:image\/png;base64,/, "");
	  require("fs").writeFile("outemp.png", base64Data, 'base64', function(err) {
			console.log('Imagine Base64 salvata ca PNG');
			async.series([
				function(callback){ dodiffreturn('./outemp.png',callback) }
			  ],
			  function(err, results) {
			    res.send(pending);
			  });
		});
	})

	server.listen(42522, function () {
	  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
	  		console.log('API Listening on - '+add+':42522 -> '+datelog()); // log IP masina
		})
	})

}else{
	finalresp=[]; // init blank pentru array rezultate
	fs.readdir(folder, (err, files) => { // iteram prin lista cu fisiere
  		for(var i=0; i<files.length; i++){ 
  			dodiff(folder+'/'+files[i],files[i]);
  			set(files.length);
  		}
	})
}