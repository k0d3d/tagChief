var config_module = angular.module('tcApp.config', []);
var config_data = {
  "app": {
    'app_name': 'TagChief Mobile'
  },
  'api_config': {
    // 'url': 'http://drugstoc.ng'
    // 'url': 'http://192.168.1.3:3000'
    'CONSUMER_API_URL': "http://192.168.43.184:3000",
    'FILEVAULT_API_URL': "http://192.168.43.184:3001"
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});