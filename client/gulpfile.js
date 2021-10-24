const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const ghPages = require('gulp-gh-pages');
const rimraf = require('rimraf');

function build(cb) {
    rimraf.sync('./build');

    var processors = [
        autoprefixer
    ];

    gulp.src("./src/static/*.css")
        .pipe(sourcemaps.init())
        .pipe(postcss(processors))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./build/static"));

    gulp.src(["./src/**/*.*", "!./src/**/*.css"])
        .pipe(gulp.dest("./build"));

    cb();
}

exports.default = build;