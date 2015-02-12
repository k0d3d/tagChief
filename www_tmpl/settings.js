var config_module = angular.module('tcApp.config', []);
var config_data = {
  "app": {
    'app_name': 'TagChief Mobile'
  },
  'api_config': {
    //  @ifdef BUILD_ENV_PRODUCTION'
    'CONSUMER_API_URL': "/* @echo CONSUMER_API_URL */"
    // @endif

    //  @ifdef BUILD_ENV_TEST
    'CONSUMER_API_URL': "/* @echo CONSUMER_API_URL */:3000"
    // @endif
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});