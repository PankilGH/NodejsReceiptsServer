var express = require('express');


var app = express();

var port = process.env.PORT || 3000;

var bookRouter = express.Router();

//post req
var bodyParser = require('body-parser');
var multer = require('multer'); 

app.use("/", express.static(__dirname));
//app.use(express.static(__dirname + "./index.html"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

//app.use('/api', router);

//for dynamic yellow card
var request = require('request');
var fs = require('fs');
var https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


app.get('/:id/yc', function(req, res){
console.log('get - Hey I ran'+req.params.id);
request.get('http://libertyjavaopal2.mybluemix.net/rest/api/healthrecords/test/query/hcn/fhir2/'+req.params.id, function (error, response, body) {
	console.log(body);
	  if (!error && response.statusCode == 200) {
		  fs.writeFile("./data4.json", body, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was saved!");
			  
			  	res.writeHead(302, {
  'Location': '/index.html'
  //add other headers here...
})
res	.end();
			  
		})
	  }
	})
});


app.get('/pan/:id/yc', function(req, res){
console.log('Pan/id/yc - get - Hey I ran'+req.params.id);
// Set the headers
var headers = {
    'dateTime':       '2015-05-30T09:30:10Z',
    'network.identifier':     '192.168.0.1',
	'Practitioner.organization.name': 'cSWO',
	'Practitioner.name.text' : 'Dr. Smith',
	'Practitioner.identifier.value' : '123456',
	'Content-Type': 'application/x-www-form-urlencoded',
}

// Configure the request
var options = {
    url: 'https://76.75.162.34:9080/cswo-dstu2/cswo/immunization/query',
    method: 'POST',
    headers: headers,
    form: {'Patient.name.family':'Tao', 'Patient.name.given':'Frank', 
		   'Patient.identifier.value':req.params.id, 'Patient.birthdate':'2000-01-01', 
		  'Patient.gender':'M', '_format': 'application/json'}
}

options.agent = new https.Agent(options);

console.log("before response:")
// Start the request
request(options, function (error, response, body) {
	console.log("response:"+ "error"+error)
    if (!error && response.statusCode == 200) {
        // Print out the response body
        console.log(body)
		if (!error && response.statusCode == 200) {
		  fs.writeFile("./data4.json", body, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was saved!");
			
			  res.writeHead(302, {
			  'Location': '/index.html'
			  //add other headers here...
				})
				res	.end();
		})
	  }
    }
	        console.log("body:"+body)

})

console.log("after response:")

});


app.post('/', function(req, res){
	console.log('post - Hey I ran');
	console.log(req.body);
	var jsobj = req.body;
	//var jsobj = JSON.parse(req.body);
	console.log(jsobj);
	
	var Receipts = require('./modules/receipts.js');
	//var r1 = new Receipts();
	//r1.resourceType = req.body.id;
	//r1.type = req.body.fhir;
	console.log(jsobj.id);
	console.log(jsobj.fhir);
	
	res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jsobj));
	
});

app.listen(port, function(){
    console.log('Gulp is running my app on PORT: ' + port);
});