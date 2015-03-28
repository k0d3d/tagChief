var config_module = angular.module('tcApp.config', []);
var config_data = {
  'app': {
    'app_name': 'TagChief Mobile'
  },
  'api_config': {
    // 'CONSUMER_API_URL': 'https://stark-cliffs-8842.herokuapp.com'
    'CONSUMER_API_URL': 'http://192.168.1.3:3000'
    // 'CONSUMER_API_URL': 'http://192.168.43.27:3000'
    // 'CONSUMER_API_URL': 'http://192.168.43.184:3000'
    // 'CONSUMER_API_URL': 'http://192.168.42.16:3000'
    // 'CONSUMER_API_URL': 'http://localhost:3000'
    // 'CONSUMER_API_URL': 'http://192.168.56.1:3000'
  },
  'pushConfig' : {
    'senderID': '384367763163'
  },
  'feedback': {
    'pollbooth' : [
      {
        question: 'Has inec officials arrived?',
        promptAfter: 300,
        id: 'FPB1'
      },
      {
        question: 'Has election materials arrive?',
        promptAfter: 300,
        id: 'FPB2'
      },
      {
        question: 'Has authentication started?',
        promptAfter: 300,
        id: 'FPB3'
      },
      {
        question: 'Has authentication ended?',
        promptAfter: 300,
        id: 'FPB4'
      },
      {
        question: 'Has voting started?',
        promptAfter: 300,
        id: 'FPB5'
      },
      {
        question: 'Has voting ended?',
        promptAfter: 300,
        id: 'FPB6'
      },
      {
        question: 'Any violence?',
        promptAfter: 300,
        id: 'FPB7'
      },
      {
        question: 'Any suspicious activity?',
        promptAfter: 300,
        id: 'FPB8'
      },
      {
        question: 'Who do you think will win?',
        promptAfter: 300,
        id: 'FPB9'
      },
      {
        question: 'Polls results announced?',
        promptAfter: 300,
        id: 'FPB10'
      }
    ],
    'atm': [
      {
        question: 'is the machine dispensing?',
        promptAfter: 30
      },
      {
        question: 'is the location well lit?',
        promptAfter: 30
      },
      {
        question: 'Is the machine working well?',
        promptAfter: 30
      },
    ],
    'default': [
      {
        question: 'How is the service?',
        promptAfter: '30',
        answer: false
      },
      {
        question: 'Are you having a good time?',
        promptAfter: '60',
        answer: false
      },
      {
        question: 'How is the ambiance?',
        promptAfter: '90',
        answer: false
      }
    ]
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});