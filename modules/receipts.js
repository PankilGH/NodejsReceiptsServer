module.exports = {

receipt:function(jobj){
	this.resourceType = jobj.resourceType;
	this.type = jobj.type;
	this.entry = jobj.entry;
	this.id = 1;
	this.readEntry = function() {
		for (i = 0; i < this.entry.length; i++)
		{
			console.log(this.entry[i]);
		}
	};
}
	
}