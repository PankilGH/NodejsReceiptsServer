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


//CORS
//http://enable-cors.org/server.html
// This is not safe - change the implementation
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/**************************************************/
/** Connecting to Cloudant ************************/
/**************************************************/

//Setup for connecting to Cloudant DBs
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


/**
* Cloudant database connection setup
* This needs some clean up and environment variable set up for local testing
*/
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

/**************************************************/
/**************************************************/
/**************************************************/


/**
* Used to store receipts from QR-EMR
* http://irfhir.mybluemix.net/rest/fhir/receipt/
* localhost:8000/rest/fhir/receipt
*/
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


/**************************************************/
/** IHR Server side cache and search **************/
/**************************************************/

/**
* Search cloudant (cache) only
*/
app.get('/cache/:id/yc', function(req, res){
	console.log('Checking cloudant cache only for hcn: '+req.params.id);
	var db = cloudant.use(dbNames.dbihrfhir2);
	db.get(req.params.id, {revs_info: false}, function(error, doc){
		if (!error){
			doc.status = "success";
			doc.dataFrom = "Cloudant";
			res.json(doc);
			res.end();
		}else{
			//console.log(error);
			res.json({status:"error"});
			res.end();
		}
	});
});

/**
* Search cloudant (cache) if not found check Panorama
*/
app.get('/:id/yc', function(req, res){
	console.log('Checking cloudant cache first if not found in cache then Panorama for hcn: '+req.params.id);
	var db = cloudant.use(dbNames.dbihrfhir2);
	// check the cache first
	db.get(req.params.id, {revs_info: false}, function(error, doc){
		console.log("checking cloudant");
		if (!error){
			console.log("found in cloudant");
			doc.status = "success";
			doc.dataFrom = "Cloudant";
			res.json(doc);
			res.end();
		}else{
			// cache search failed now check Panorama
			
			
			/***Most of this is duplicate code - refactor and fix***/
			
			
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
								
								console.log("cannot find in Cloudant checking Panorama");

								
								console.log("response:"+response.statusCode+ "error"+error)
								if (!error && response.statusCode == 200) {

										console.log("found in Panorama");

										// HCN is used as document ID and to search for documents
										// cloudant cache service
										// assume Panorama contains the most up to date document
										// always replace cloudant copy with the Panorama copy
										db = cloudant.use(dbNames.dbihrfhir2);
										var docSave = JSON.parse(body);

										// get document records _rev if it exists
										db.get(req.params.id, {revs_info: false}, function(error, docbody){
											if (!error){
												docSave._rev = docbody._rev;
												console.log(docSave._rev);
											}else{
												//console.log(error);
											}

											// insert new document or update existing one
											db.insert(docSave, req.params.id, function(err, body) {
											if (!err){
												console.log("updated Cloudant successfully");

												//console.log(body)
											}
											else{
												console.log("Cloudant update failed");

												
												console.log(err)
											}
											})

										});

										if (JSON.parse(body).status == "error"){
											//search error	-- this probably never happens
											res.json({status:"error"});
											res.end();
										}else {
											docSave.status = "success";
											docSave.dataFrom = "Panorama"
											res.json(docSave);
											res.end();
										} 
								}
								else{
								// body = There is no immunization records for the Patient
									console.log("cannot find in Cloudant or Panorama");

									res.json({status:"error"});
									res.end();
								}
							})

		}
	});
});

/**
* Search Panorama only
*/
app.get('/panorama/:id/yc', function (req, res){
	
console.log('panorama/id/yc - Looking in Panorama only for HCN: '+req.params.id);
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
        
			// HCN is used as document ID and to search for documents
			// cloudant cache service
			// assume Panorama contains the most up to date document
			// always replace cloudant copy with the Panorama copy
			db = cloudant.use(dbNames.dbihrfhir2);
			var docSave = JSON.parse(body);
			
			// get document records _rev if it exists
			db.get(req.params.id, {revs_info: false}, function(error, docbody){
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
				docSave.status = "success";
				docSave.dataFrom = "Panorama";
				res.json(docSave);
				res.end();
			} 
    }
	else{
	// body = There is no immunization records for the Patient
		res.json({status:"error"});
		res.end();
	}
})
});


/**
* Clean up db docs
*/
app.get('/cache/clean', function(req, res){
	console.log('Remove most documents from cloudant keep specific ones only');
	var db = cloudant.use(dbNames.dbihrfhir2);
	var result = {status:"error"};
	var count = 0;
	var idsToKeep = ["6025157170", "7703432802", "6337565391", "2484584624"];
	db.list(function(err, body) {
  		if (!err) {
			body.rows.forEach(function(doc) {
				//if this document id is not in the list of ids to keep then delete
			if (idsToKeep.indexOf(doc.id) == -1){
				//delete
				db.destroy(doc.id, doc.value.rev, function(err, body) {
						if (!err){
							count += 1;
							console.log(body)
						}
					})
				}
			})
			result = {status:"success", deleted:count};
			res.json(result);
			res.end();
		}
		else {
			console.log(err);
			res.json(result);
			res.end();
		}
	})
});

app.listen(port, function(){
    console.log('Gulp is running my app on PORT: ' + port);
});