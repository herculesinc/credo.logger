'use strict';
// IMPORTS
// ================================================================================================
const gulp = require('gulp');
const del = require('del');
const exec = require('child_process').exec;

// TASKS
// ================================================================================================
// delete bin folder
gulp.task('clean', function(cb) {
  del([ 'bin' ]).then(() => { cb(); });
});

// compile TypeScript files
gulp.task('compile', [ 'clean' ], function (cb) {
  exec('tsc -p .', function (err, stdout, stderr) {
    if (stdout.length > 0) console.log(stdout);
    if (stderr.length > 0) console.error(stderr);
    cb(err);
  });
});

// build the project
gulp.task('build', [ 'compile' ], function (cb) {
  gulp.src('./package.json').pipe(gulp.dest('./bin'));
  gulp.src('./credo-logger.d.ts').pipe(gulp.dest('./bin'));
  gulp.src('./.settings/.npmignore').pipe(gulp.dest('./bin'));
  gulp.src('./README.md').pipe(gulp.dest('./bin'));
  cb();
});

// publish to npm
gulp.task('publish', ['build'], function (cb) {
  exec('npm publish bin --access=public', function (err, stdout, stderr) {
    if (stdout.length > 0) console.log(stdout);
    if (stderr.length > 0) console.error(stderr);
    cb(err);
  });
});

// define default task
gulp.task('default', ['build']);