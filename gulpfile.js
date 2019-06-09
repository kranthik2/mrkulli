var gulp = require('gulp');

gulp.task('deploy', function() {
  var spawn = require('child_process').spawn;   
  var jekyll = spawn('jekyll.bat', ['build'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) { 
    if(code === 0) {
      require('child_process').spawn('gsutil',  ['-m', 'rsync', '-r', '-d',
'./_site', 'gs://www.mrkulli.com'], {stdio: 'inherit'});
    } else {
       process.stdout.write("Build failed. Exit code: " + code);
    }
  });
});