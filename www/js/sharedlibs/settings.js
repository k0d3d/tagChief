var config_module = angular.module('tcApp.config', []);
var config_data = {
  "app": {
    'app_name': 'TagChief Mobile'
  },
  'api_config': {
    // 'CONSUMER_API_URL': "https://stark-cliffs-8842.herokuapp.com"
    // 'CONSUMER_API_URL': "http://192.168.1.5:3000"
    'CONSUMER_API_URL': "http://192.168.43.184:3000"
    // 'CONSUMER_API_URL': "http://192.168.56.1:3000"
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});