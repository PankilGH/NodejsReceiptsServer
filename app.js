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

//needed for dynamic yellow card
var request = require('request');
var fs = require('fs');
var https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //needed for Panorama certificate issue

//receipts
var Receipt = require('./modules/receipts.js');



/**************************************************/
/**************************************************/
/**************************************************/


//TODO: re-implement this to use Node.js cloudant's services

/*
//Yellow Card from Liberty Java's Cloudant
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
			console.log(JSON.parse(body).status);	  
			if (JSON.parse(body).status == "error"){
				//search Panorama		
				res.writeHead(302, {
				'Location': '/error.html'
				//add other headers here...
				})
				res.end();
			}else {
				
				//res.writeHead(302, {
				//'Location': '/yellowcard.html'
				//add other headers here...
				//})
				
				res.end();
			} 
		})
	  }
	})
});
*/





//Yellow Card from Panorama
app.get('/pan/:id/yc', function (req, res){
	
console.log('Pan/id/yc - get - Hey I ran. Looking for HCN: '+req.params.id);
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
// Start the request
request(options, function (error, response, body) {
	console.log("response:"+response.statusCode+ "error"+error)
    if (!error && response.statusCode == 200) {
        // Print out the response body
        //console.log(body)
		if (!error && response.statusCode == 200) {
		  fs.writeFile("./data4.json", body, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was saved!");
			
			// HCN is used as document ID and to search for documents
			// cloudant cache service
			// assume Panorama contains the most up to date document
			// always replace cloudant copy with the Panorama copy
			db = cloudant.use(dbNames.dbihrfhir2);
			var docSave = JSON.parse(body);
			
			// get document records _rev if it exists
			db.get(req.params.id, {revs_info: true}, function(error, docbody){
				if (!error){
					docSave._rev = docbody._rev;
					console.log(docSave._rev);
				}else{
					//console.log(error);
				}
				
				// insert new document or update existing one
				db.insert(docSave, req.params.id, function(err, body) {
				if (!err){
					console.log(body)
				}
				else{
					console.log(err)
				}
				})
				
			});
	  
			  
			//console.log(JSON.parse(body).status);	  
			if (JSON.parse(body).status == "error"){
				//search error	-- this probably never happens
				res.json({status:"error"});
				res.end();
			}else {
				/*
				res.writeHead(302, {
				'Location': '/yellowcard.html'
				//add other headers here...
				})
				*/
				res.json({status:"success"});
				res.end();
			} 
		})
	  }
    }
	else{
	// body = There is no immunization records for the Patient
	
	/*
	res.writeHead(302, {
	'Location': '/error.html'
	//add other headers here...
	})
	*/
	res.json({status:"error"});
	res.end();
	}
	//console.log("body:"+body);
})
});


/**************************************************/
/**************************************************/
/**************************************************/

//Connecting to Cloudant
var db;
var cloudant;
var dbNames = {
	dbOriginalReceipts : 'originalreceipts',
	dbPatient : 'patient',
	dbIHR: 'ihr',
	dbIR: 'ir',
	dbProvider: 'provider',
	dbihrfhir2: 'ihrfhir2'	
}
var dbCredentials = {
	dbName : 'originalreceipts',
	dbPatient : 'patient',
	dbIHR: 'ihr',
	dbIR: 'ir',
	dbProvider: 'provider',
	dbihrfhir2: 'ihrfhir2'
};

function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
	else {
		/** remove db connect info **/

				/*
		
		{
   "cloudantNoSQLDB": [
      {
         "name": "Cloudant NoSQL DB-wd",
         "label": "cloudantNoSQLDB",
         "plan": "Shared",
         "credentials": {
            "username": "2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix",
            "password": "394050f8afc6ea00083f8de2851ab42a1f0d78ee8f6e114dbfac3800c2d3c4d2",
            "host": "2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix.cloudant.com",
            "port": 443,
            "url": "https://2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix:394050f8afc6ea00083f8de2851ab42a1f0d78ee8f6e114dbfac3800c2d3c4d2@2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix.cloudant.com"
         }
      }
   ]
}
		
		
		*/
		
		dbCredentials.host = "2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix";
		dbCredentials.password = "394050f8afc6ea00083f8de2851ab42a1f0d78ee8f6e114dbfac3800c2d3c4d2";
		dbCredentials.url = "https://2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix:394050f8afc6ea00083f8de2851ab42a1f0d78ee8f6e114dbfac3800c2d3c4d2@2579b3e1-c4ab-45cd-82bf-cdb3514b4e23-bluemix.cloudant.com";


		
		/** remove db connect info **/
	}

	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create it
	cloudant.db.list(function (err, all_dbs) {
		for (var dbName in dbNames){
			if (dbNames.hasOwnProperty(dbName)) {
				//console.log(dbNames[dbName]);
				if (all_dbs.indexOf(dbNames[dbName]) == -1){
					cloudant.db.create(dbNames[dbName], function (err, res) {
						if (err) { console.log('could not create db ', err); }
					});
				}				
			}
		}
	})		 
}

initDBConnection();


//http://irfhir.mybluemix.net/rest/fhir/receipt/
//localhost:8000/rest/fhir/receipt
app.post('/rest/fhir/receipt', function(req, res){
	console.log('post - Hey I ran');
	//console.log(req.body);

	/*
  fs.writeFile("./data.json", JSON.stringify(req.body), function(err) {
	if(err) {
		return console.log(err);
			console.log("There was an error saving the file");
	} else {
		console.log("The file was saved!");
	}
  });
	*/
	
	var jsobj = req.body;
	//var jsobj = JSON.parse(req.body);
	//console.log(jsobj);
	//insert receipts into original receipts db
	db = cloudant.use(dbNames.dbOriginalReceipts);
	db.insert(req.body, '', function(err, body) {
	  if (!err){
		console.log(body)
	  }else{
		  console.log(err)
	  }
	})
	
	
	
	//console.log(req.body.entry);
	var r1 = new Receipt.receipt(req.body);
	r1.resourceType;
	r1.readEntry();
	//console.log();
	//r1.resourceType = req.body.id;
	//r1.type = req.body.fhir;
	//console.log(jsobj.id);
	//console.log(jsobj.fhir);
	
	res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(r1));
	
});


app.get('/:id/yc', function(req, res){
	console.log('get - Hey I ran'+req.params.id);
	db = cloudant.use(dbNames.dbihrfhir2);
	// get document records _rev if it exists
	db.get(req.params.id, {revs_info: true}, function(error, doc){
		if (!error){
			fs.writeFile("./data4.json", JSON.stringify(doc), function(err) {
			if(err) {
				res.json({status:"error"});
				return console.log(err);
				res.end();
			}else{
				console.log("The file was saved!"); 
				res.json({status:"success"});
				res.end();
			}
			});
		}else{
			//console.log(error);
			res.json({status:"error"});
			res.end();
		}
	});
});



app.listen(port, function(){
    console.log('Gulp is running my app on PORT: ' + port);
});