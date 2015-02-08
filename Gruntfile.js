module.exports = function(grunt) {
  var ipAddress =  grunt.option('host') || 'localhost';
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    preprocess: {
      options: {
        context: {
          // BUILD_ENV: 'TEST'
          CONSUMER_API_URL: 'http://' + ipAddress + ':3000',
          FILEVAULT_API_URL: 'http://' + ipAddress + ':3001'
        }
      },
      test: {
        files : {
          './www/js/sharedlibs/settings.js': './www_tmpl/settings.js'
        }
      },
      prod: {
        files: {
          './www/js/sharedlibs/settings.js': './www_tmpl/settings.js'
        }
      }
    },
    env: {
      options: {

      },
      test: {
          // BUILD_ENV: 'TEST'
          CONSUMER_API_URL: 'http://' + ipAddress + ':3000',
          FILEVAULT_API_URL: 'http://' + ipAddress + ':3001'
      },
      prod : {
          BUILD_ENV: 'TEST',
          CONSUMER_API_URL: 'http://' + ipAddress + ':3000',
          FILEVAULT_API_URL: 'http://' + ipAddress + ':3001'
      }
    },
    exec: {
      build: {
        command: 'ionic run android'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-exec');
  // Default task(s).
  grunt.registerTask('runionic', ['preprocess:test']);

};