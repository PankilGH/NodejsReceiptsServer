var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'); //reference to nodemon
    
//this is our default taks that executes our nodemon plugin
gulp.task('default', function(){
    nodemon(//uses this json object to configure itself
		{
        script: 'app.js', // the sript to run
        ext: 'js', // what to watch for
        env: { // our environments port
            PORT:8000
        },
		ignore: ['./node_modules/**'] //ignore everything under node modules
    })
    .on('restart', function(){ //execute this function when you restart
        console.log('Restarting'); 
    });
});