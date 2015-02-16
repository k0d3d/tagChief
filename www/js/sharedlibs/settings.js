var config_module = angular.module('tcApp.config', []);
var config_data = {
  "app": {
    'app_name': 'TagChief Mobile'
  },
  'api_config': {
    'CONSUMER_API_URL': "https://stark-cliffs-8842.herokuapp.com"
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});