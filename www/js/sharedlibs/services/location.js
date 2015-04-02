  var app = angular.module('services');
  app.factory('locationsService', [
    '$http',
    '$cordovaGeolocation',
    '$q',
    '$rootScope',
    'appBootStrap',
    'Messaging',
    '$interpolate',
    'feedback',
    function ($http, $cordovaGeolocation, Q, $rootScope, appBootStrap, Messaging, $interpolate, feedback) {
    var geoSrvs = this;
    geoSrvs.myLocation = {
      longitude : 0,
      latitude: 0,
      timeStamp: null,
      hasCheckedIn: false
    };
    var ls_def_pos_option = {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 1000
    };

    return {
      //holds the
      timers: [],
      updateFeedback: function updateFeedback (params, truthy) {
        // find checkinu5
        return appBootStrap.db.get(params.eventId)
        .then(function (doc) {
          //we have found the check in log
          //document,
          //bear in mind the argument, params,
          //is our callNextQ.data
          var indexOfNextQ = params.index || 0;

          //if this question has been answered conclusively,
          //proceed to next,
          if (truthy) {
            doc.nextQuestion = params.index + 1;
          }
          //params.payload contains the question and its current
          //properties. stateful. question, promptAfter, id, [answers]
          var newDocument = {};

          newDocument.timeUpdated = Date.now();
          newDocument.answer = params.payload.answer;
          newDocument.decision = truthy;
          newDocument.dateTriggered = params.dateTriggered;

          //if there is an existing answer array
          if (doc.questions[indexOfNextQ].answers) {
            doc.questions[indexOfNextQ].answers.push(newDocument);
          } else {
            doc.questions[indexOfNextQ].answers = [newDocument];
          }


          return appBootStrap.db.put(doc)
                  .then(function () {
                    $rootScope.$broadcast('appEvent::updateSaved', {
                      message: 'Feedback updated successfully',
                      data: params,
                      doc: doc
                    });
                  });

        });
        // find and update question by index
      },

      pollForFeedback: function pollForFeedback (o) {
        var q = Q.defer();
        //find checkin record,
        appBootStrap.db.get(o.id)
        .then(function (doc) {
          // var indexOfNextQ = (_.firstIndex(doc.questions, 'answer', true) > -1) ? _.firstIndex(doc.questions, 'answer', true) : 0,
          var indexOfNextQ = doc.nextQuestion || 0,
              now = new Date().getTime();
          var callNextQ = {
            id:       parseInt('' + now + indexOfNextQ),
            // at:       new Date(now +  doc.questions[indexOfNextQ].promptAfter * 1000),
            text:     doc.questions[indexOfNextQ].question,
            title:      'tagChief Feedback',
            smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png',
            data:       JSON.stringify({
              'index': indexOfNextQ,
              'eventId': o.id,
              'eventName': 'CHECKINFEEDBACK',
              'payload':  doc.questions[indexOfNextQ]
            }),
          };
          // for (var i = doc.questions.length - 1; i >= 0; i--) {
          //   var theQ = doc.questions[i];
          //   if (!theQ.answer) {
          //     var seconds_from_now = new Date(now +  theQ.promptAfter * 1000);
          //     poll.push({
          //       id:       parseInt('' + now + i),
          //       at:       seconds_from_now,
          //       text:     theQ.question,
          //       title:      'tagChief Feedback',
          //       smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png',
          //       data:       JSON.stringify({
          //         'index': i,
          //         'eventId': o._id,
          //         'eventName': 'CHECKINFEEDBACK',
          //         'payload':  theQ
          //       }),
          //     });
          //     console.log(parseInt('' + now + i));
          //   }
          // }
          cordova.plugins.notification.local.schedule(callNextQ, function () {
            //if its the last question, resolve true else false
            if (doc.questions.length === indexOfNextQ) {
              q.resolve(true);
            } else {
              q.resolve(false);
            }
          });

          //if its the lasy
          //
        });
        return q.promise;

      },
      writeCheckIntoDB: function writeCheckIntoDB (checkInData) {
        var ct = (_.indexOf(_.keys(feedback), checkInData.data.locationId.category) > -1) ?
                  checkInData.data.locationId.category : 'default';
        var i = {
          locationId: checkInData.data.locationId._id || checkInData.data._id,
          checkInId: checkInData.data._id,
          checkInTime: checkInData.data.checkInTime,
          checkOutTime: null,
          questions: feedback[ct]
        };
        return appBootStrap.db.post(i);
      },
      updateCheckIn: function updateCheckIn (data) {
        var locationId = data.locationId;
        return $http({
          url: '/api/v1/locations/' +  locationId +'?action=UPDATECHECKIN',
          data: data,
          method: 'PUT'
        });
      },
      checkIntoLocation: function checkIntoLocation (locationId) {
        var q = Q.defer(),
            self = this,
            locationData = {};

          locationData.lon = self.getMyLocation().longitude;
          locationData.lat = self.getMyLocation().latitude;
          if (locationData.lon && locationData.lat && locationId) {
            return $http.put('/api/v1/locations/' +  locationId +'?action=CHECKIN', {
              deviceId: appBootStrap.thisDevice.uuid
              // deviceId: 'appBootStrap.thisDevice.getUUID'
            });
          } else {
            q.reject(new Error('NoLocationData'));
            return q.promise;
          }

        return q.promise;
      },
      fetchLocationData: function fetchLocationData (locationId) {
        return $http.get('/api/v1/locations/' + locationId);
      },
      watchPosition: function watchPosition (posOption) {
        posOption = posOption || ls_def_pos_option;
        return $cordovaGeolocation.watchPosition(posOption);
      },
      geoLocationInit: function (posOption) {
          var q = Q.defer(), self = this;
          posOption = posOption || ls_def_pos_option;
          $cordovaGeolocation.getCurrentPosition(posOption)
          .then(function (position) {
            self.setMyLocation(position.coords);
            q.resolve(position.coords);
          }, function (err) {
            q.reject(err);
          });

          return q.promise;
      },
      setMyLocation: function setMyLocation (coords){
        geoSrvs.myLocation.latitude = coords.latitude;
        geoSrvs.myLocation.longitude = coords.longitude;
        if (!geoSrvs.myLocation.timeStamp) {
          geoSrvs.myLocation.timeStamp = Date.now();
        }
      },
      getMyLocation: function getMyLocation () {
        return geoSrvs.myLocation;
      },
      pingUserLocation: function (params) {
        params = params || {};
        var q = Q.defer();


        var self = this;
        $http.defaults.headers.common.GCMId =  Messaging.getRegId();
        $http({
            method: 'POST',
            url: '/api/v1/hereiam',
            data: {
              coords: self.getMyLocation(),
              shouldPromptCheckIn: params.shouldPromptCheckIn,
              deviceId: appBootStrap.thisDevice.uuid
            }
        })
        .then(function (l_data) {
          if (l_data.data) {
            //get the id for the location to check into,
            appBootStrap.db.search({
              query: l_data.data._id,
              fields: ['locationId'],
              include_docs: true,
              // build: true
            })
            .then(function (searchedDocs) {
              var timeLimit = moment().subtract(12, 'hours'), foundMatch = false;
              for (var i = 0; i < searchedDocs.rows.length; i++) {
                var doc = searchedDocs.rows[i];

                if (moment(doc.doc.checkInTime).isAfter(timeLimit)) {
                  foundMatch = i;
                  break;
                }
              }

              if (!foundMatch) {

                var seconds_from_now = new Date().getTime();
                //schedule the feedback.
                cordova.plugins.notification.local.schedule({
                  id:         seconds_from_now,
                  date:       new Date(),
                  text:    'You might want to check in',
                  title:      $interpolate('You are in {{name}}')(l_data.data),
                  smallicon: 'file://img/res/android/icon/drawable-mdpi-icon.png',
                  // title:      "Hi Chrp",
                  data:       JSON.stringify({
                    // 'index': i,
                    'eventId': seconds_from_now,
                    'eventName': 'CHECKIN',
                    'payload':  l_data.data
                  })
                }, function () {
                });
              }
            });
          } else {
            return q.reject();
          }
          // $rootScope.$broadcast('appUI::checkInPopOver', l_data.);
        });


        return q.promise;
      },
      addLocation: function (locationData) {
        var self = this;
        locationData.lon = self.getMyLocation().longitude;
        locationData.lat = self.getMyLocation().latitude;
        if (locationData.lon && locationData.lat) {
          return $http.post('/api/v1/locations',  JSON.stringify(locationData));
        } else {
          return false;
        }
      },
      listUserLocation: function listUserLocation (query) {
        return $http.get('/api/v1/locations?' + $.param(query));
      },
      // deleteUserLocation: function (locationData) {
      //   return $http.delete('/api/v1/locations/:locationId');
      // },
      locationProximity: function locationProximity () {
        var q = Q.defer(),
            self = this,
            locationData = {};
        console.log('i get called oh');
        // this.geoLocationInit()
        // .then(function (geoPromise) {
        //   console.log(geoPromise);
          locationData.lon = self.getMyLocation().longitude;
          locationData.lat = self.getMyLocation().latitude;
          if (locationData.lon && locationData.lat) {
            return $http.get('/api/v1/position?' + $.param(locationData));
          } else {

            q.reject(new Error('NoLocationData'));
            return q.promise;
          }
        // }, function (err) {
        // });

      },
      deviceIsSitting: function deviceIsSitting (coords) {
        var self = this;
        var prevLocation = self.getMyLocation();
        //if its equal, for how long has it been equal, if its changed..
        //dont bother
        // console.log(geolib.getDistance({
        //   latitude: prevLocation.latitude,
        //   longitude: prevLocation.longitude
        // }, {
        //   latitude: coords.latitude,
        //   longitude: coords.longitude
        // }));
        var latlngds = geolib.getDistance({
          latitude: prevLocation.latitude,
          longitude: prevLocation.longitude
        }, {
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        // console.log(latlngds);
        if (latlngds <= 2 ) {
          var momentNow = moment();
          var momentThen = moment(prevLocation.timeStamp);
          var diff = momentThen.diff(momentNow, 'seconds');
          //for example now is = -57
          //if the user has been in d same location for the below amount of time.
          //and he hasnt checked into this location.
          //trigger a push
          if ((diff > -61 && diff < -54) && !geoSrvs.myLocation.hasCheckedIn) {
            console.log('TRIGGERED');
            $rootScope.$broadcast('locationsService::userisSitting', prevLocation);
            //reset the timeStamp so we can start comparing
            //from here.
            geoSrvs.myLocation.timeStamp = null;
            geoSrvs.myLocation.hasCheckedIn = true;
            self.pingUserLocation({shouldPromptCheckIn: true});

          }
          // console.log('%s has passed since u sat down', diff);
        } else {
          geoSrvs.myLocation.timeStamp = null;
          geoSrvs.myLocation.hasCheckedIn = false;
          // console.log('You are moving u bastard, sit down');
        }
      }
    };
  }]);