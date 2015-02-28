var MapApp = angular.module('GoogleMapsInitializer', []);


// MapApp.factory('Initializer', function($window, $q){

//     //Google's url for async maps initialization accepting callback function
//     var asyncUrl = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCOt9IYHpYN22m7alw_HKi5y5WBgu57p4s&v=3.exp&sensor=true&callback=',
//         mapsDefer = $q.defer();

//     //Callback function - resolving promise after maps successfully loaded
//     $window.googleMapsInitialized = mapsDefer.resolve; // removed ()

//     //Async loader
//     var asyncLoad = function(asyncUrl, callbackName) {
//       var script = document.createElement('script');
//       //script.type = 'text/javascript';
//       script.src = asyncUrl + callbackName;
//       document.body.appendChild(script);
//     };
//     //Start loading google maps
//     asyncLoad(asyncUrl, 'googleMapsInitialized');

//     //Usage: Initializer.mapsInitialized.then(callback)
//     return {
//         mapsInitialized : mapsDefer.promise,
//         toolTipInit: function (cb) {
//             //Google's url for async maps initialization accepting callback function
//             var asyncUrl = 'js/vendor/gmaps-tooltip.js';
//             //Callback function - resolving promise after maps successfully loaded

//             //Async loader
//             var asyncLoad = function(asyncUrl) {
//               var script = document.createElement('script');
//               //script.type = 'text/javascript';
//               script.src = asyncUrl;
//               document.body.appendChild(script);
//             };
//             //Start loading google maps
//             asyncLoad(asyncUrl);
//             cb();
//         }
//     };
// });

MapApp.factory('Initializer', function($window, $q){

    //Google's url for async maps initialization accepting callback function
    var asyncUrl = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCOt9IYHpYN22m7alw_HKi5y5WBgu57p4s&v=3.exp&sensor=true&callback=googleMapsInitialized',
        mapsDefer = $q.defer();
        gMapsLoader = $.getScript(asyncUrl);
        gMapsLoader.done(function () {

        })
        .fail(function (err) {
          return mapsDefer.reject(err);
        });

    //Callback function - resolving promise after maps successfully loaded
    $window.googleMapsInitialized = mapsDefer.resolve;

    //Usage: Initializer.mapsInitialized.then(callback)
    return {
        mapsInitialized : mapsDefer.promise
    };
});


// formats a number as a latitude (e.g. 40.46... => "40°27'44"N")
MapApp.filter('lat', function () {
    return function (input, decimals) {
        if (!decimals) decimals = 0;
        input = input * 1;
        var ns = input > 0 ? "N" : "S";
        input = Math.abs(input);
        var deg = Math.floor(input);
        var min = Math.floor((input - deg) * 60);
        var sec = ((input - deg - min / 60) * 3600).toFixed(decimals);
        return deg + "°" + min + "'" + sec + '"' + ns;
    };
});

// formats a number as a longitude (e.g. -80.02... => "80°1'24"W")
MapApp.filter('lon', function () {
    return function (input, decimals) {
        if (!decimals) decimals = 0;
        input = input * 1;
        var ew = input > 0 ? "E" : "W";
        input = Math.abs(input);
        var deg = Math.floor(input);
        var min = Math.floor((input - deg) * 60);
        var sec = ((input - deg - min / 60) * 3600).toFixed(decimals);
        return deg + "°" + min + "'" + sec + '"' + ew;
    };
});


MapApp.directive("cityState", ['Initializer', function (Initializer) {
  return {
    template: '<em>{{locationData.formatted_address}}</em>',
    scope: {
      locationData: "=cityState"
    },
    link: function (scope) {
      Initializer.mapsInitialized
      .then(function () {

        var latLng = new google.maps.LatLng(scope.locationData.latitude, scope.locationData.longitude),
          geoCoder = new google.maps.Geocoder();

          geoCoder.geocode({
            "latLng": latLng
          }, function (results, status) {
            var result = results[0];

            scope.locationData.formatted_address = results[0].formatted_address;
            scope.$apply();
        });

      });
    }
  };
}]);

/**
 * Handle Google Maps API V3+
 */
// - Documentation: https://developers.google.com/maps/documentation/
MapApp.directive("appMap", [
    '$window',
    '$timeout',
    'Initializer',
    '$interval',
    'locationsService',
    function ($window, $timeout, Initializer, $interval, locationsService) {
    return {
        restrict: "E",
        replace: true,
        templateUrl: "templates/inc/maps-holder.html",
        scope: {
            // center: "=",        // Center point on the map (e.g. <code>{ latitude: 10, longitude: 10 }</code>).
            markers: "=",       // Array of map markers (e.g. <code>[{ lat: 10, lon: 10, name: "hello" }]</code>).
            // width: "@",         // Map width in pixels.
            // height: "@",        // Map height in pixels.
            // mapTypeId: "@",     // Type of tile to show on the map (roadmap, satellite, hybrid, terrain).
            // panControl: "@",    // Whether to show a pan control on the map.
            // zoomControl: "@",   // Whether to show a zoom control on the map.
            // scaleControl: "@"   // Whether to show scale control on the map.
            isLoadingGmaps: "=isGmapsLoaded",
            errorLoadingGmaps: "="
        },
        controller: 'HomeCtrl',
        link: function (scope, element, attrs) {
            scope.center = {};
            scope.isLoadingGmaps = true;

            scope.createMap = function createMap() {
              Initializer.mapsInitialized
              .then(function(){
                  var myLatLng = new google.maps.LatLng(scope.center.lat, scope.center.lon);
                  var mapOptions = {
                    zoom: 17,
                    center: myLatLng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    panControl: true,
                    zoomControl: true,
                    mapTypeControl: true,
                    scaleControl: false,
                    streetViewControl: false,
                    navigationControl: true,
                    disableDefaultUI: true,
                    overviewMapControl: true
                  };
                  scope.map = new google.maps.Map(element[0], mapOptions);
                  scope.myLocation = new google.maps.Marker({
                      position: myLatLng,
                      map: scope.map,
                      title: "My Location",
                      icon: 'img/icon-marker.png'
                  });

                  google.maps.event.addDomListener($('div.map-container'), 'mousedown', function(e) {
                    e.preventDefault();
                    return false;
                  });
                  var infowindow = new google.maps.InfoWindow({
                    content: '<button class="button button-positive open-tag-dialog-btn button-clear button-small" ng-click="tagPopOver()">You are here</button>'
                  });

                  infowindow.open(scope.map, scope.myLocation);

                  scope.isLoadingGmaps = false;
                  scope.errorLoadingGmaps = false;

                  $(document).on('click', '.open-tag-dialog-btn', function(e) {
                    scope.tagPopOver();
                  });
              }, function (err) {
                scope.errorLoadingGmaps = true;
              });
            };

            function refreshMeMarker () {
              if (scope.myLocation) {
                scope.myLocation.setMap( scope.map );
                //delayed so you can see it move
                var resetMapMarker = $timeout( function(){
                    // console.log("na here sure pass");
                    scope.myLocation.setPosition( new google.maps.LatLng(scope.center.lat, scope.center.lon) );
                    scope.map.panTo( new google.maps.LatLng( scope.center.lat, scope.center.lon ) );

                }, 1500 );
                scope.$on('$destroy', function () {
                  resetMapMarker.cancel();
                });
              }
            }

            var mapRefresh = $interval(function () {
                    scope.center.lat = locationsService.getMyLocation().latitude;
                    scope.center.lon = locationsService.getMyLocation().longitude;
                    refreshMeMarker();
            }, 10000);

            // angular.element(document).ready(createMap());
            // var mapRefresh = scope.$watch(locationsService.getMyLocation,
            //     function (coords, oldValue) {
            //         console.log('coords');
            //         // console.log(oldValue);
            //     }

            // );



            scope.$on('$destroy', function () {
              mapRefresh.cancel();
            });

            var i = locationsService.geoLocationInit();
            i.then(
                function(position) {
                    scope.center.lat = locationsService.getMyLocation().latitude;
                    scope.center.lon = locationsService.getMyLocation().longitude;
                    scope.createMap();
                },
                function(e) {
                  scope.errorLoadingGmaps = true;
                  console.log("Error retrieving position " + e.code + " " + e.message);
                }
            );


            // Info window trigger function
            // function onItemClick(pin, label, datum, url) {
            //   // Create content
            //   var contentString = "Name: " + label + "<br />Time: " + datum;
            //   // Replace our Info Window's content and position
            //   infowindow.setContent(contentString);
            //   infowindow.setPosition(pin.position);
            //   infowindow.open(map);
            //   google.maps.event.addListener(infowindow, 'closeclick', function() {
            //     //console.log("map: info windows close listener triggered ");
            //     infowindow.close();
            //     });
            // }

            // function markerCb(marker, member, location) {
            //     return function() {
            //     //console.log("map: marker listener for " + member.name);
            //     var href="http://maps.apple.com/?q="+member.lat+","+member.lon;
            //     map.setCenter(location);
            //     onItemClick(marker, member.name, member.date, href);
            //     };
            //   }

            // update map markers to match scope marker collection
            // function updateMarkers() {
            //   if (scope.map) {
            //     // create new markers
            //     //console.log("map: make markers ");
            //     currentMarkers = [];
            //     // var markers = scope.markers;
            //     // if (angular.isString(markers)){
            //     //   markers = scope.$eval(scope.markers);
            //     // }
            //     for (var i = 0; i < scope.markers.length; i++) {
            //       var m = scope.markers[i];

            //       var loc = new google.maps.LatLng(m.lat, m.lon);

            //       var mm = new google.maps.Marker({
            //         position: loc,
            //         map: map,
            //         title: m.name
            //       });
            //       //console.log("map: make marker for " + m.name);
            //       google.maps.event.addListener(mm, 'click', markerCb(mm, m, loc));
            //       currentMarkers.push(mm);
            //       }
            //     }
            //   }

            // convert current location to Google maps location
            // function getLocation(loc) {
            //   if (loc == null) return new google.maps.LatLng(40, -73);
            //   if (angular.isString(loc)) loc = scope.$eval(loc);
            //   return new google.maps.LatLng(loc.lat, loc.lon);
            //   }

      } // end of link:
    }; // end of return
}]);
