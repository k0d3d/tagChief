module.exports = function(grunt) {
  var ipAddress =  grunt.option('host') || 'localhost';
  var build_env =  grunt.option('build_env') || 'test';
  var envO = {};
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    preprocess: {
      options: {
        context: {
          BUILD_ENV_PRODUCTION: build_env === 'production',
          BUILD_ENV_TEST: build_env === 'test',
          CONSUMER_API_URL: 'http://' + ipAddress,
        }
      },
      test: {
        files : {
          './www/js/sharedlibs/settings.js': './www_tmpl/settings.js'
        }
      },
      prod: {
        files: {
          './www/js/sharedlibs/settings.js': './www_tmpl/prod-settings.js'
        }
      }
    },
    env: {
      options: {

      },
      test: {
          BUILD_ENV: 'TEST',
          CONSUMER_API_URL: 'http://' + ipAddress + ':3000',
          FILEVAULT_API_URL: 'http://' + ipAddress + ':3001'
      },
      prod : {
          BUILD_ENV: 'PRODUCTION',
          CONSUMER_API_URL: 'http://' + ipAddress,
          FILEVAULT_API_URL: 'http://' + ipAddress
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
  grunt.registerTask('runionic', ['preprocess']);

};