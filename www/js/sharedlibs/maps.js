var MapApp = angular.module('GoogleMapsInitializer', []);


MapApp.factory('Initializer', function($window, $q){

    //Google's url for async maps initialization accepting callback function
    var asyncUrl = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCOt9IYHpYN22m7alw_HKi5y5WBgu57p4s&v=3.exp&sensor=true&callback=',
        mapsDefer = $q.defer();

    //Callback function - resolving promise after maps successfully loaded
    $window.googleMapsInitialized = mapsDefer.resolve; // removed ()

    //Async loader
    var asyncLoad = function(asyncUrl, callbackName) {
      var script = document.createElement('script');
      //script.type = 'text/javascript';
      script.src = asyncUrl + callbackName;
      document.body.appendChild(script);
    };
    //Start loading google maps
    asyncLoad(asyncUrl, 'googleMapsInitialized');

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


/**
 * Handle Google Maps API V3+
 */
// - Documentation: https://developers.google.com/maps/documentation/
MapApp.directive("appMap", function ($window, $timeout, Initializer) {
    return {
        restrict: "E",
        replace: true,
        template: "<div></div>",
        scope: {
            center: "=",        // Center point on the map (e.g. <code>{ latitude: 10, longitude: 10 }</code>).
            markers: "=",       // Array of map markers (e.g. <code>[{ lat: 10, lon: 10, name: "hello" }]</code>).
            width: "@",         // Map width in pixels.
            height: "@",        // Map height in pixels.
            zoom: "@",          // Zoom level (one is totally zoomed out, 25 is very much zoomed in).
            mapTypeId: "@",     // Type of tile to show on the map (roadmap, satellite, hybrid, terrain).
            panControl: "@",    // Whether to show a pan control on the map.
            zoomControl: "@",   // Whether to show a zoom control on the map.
            scaleControl: "@"   // Whether to show scale control on the map.
        },
        link: function (scope, element, attrs) {
            var toResize, toCenter;
            var infowindow;
            var currentMarkers;
            var callbackName = 'InitMapCb';
            //default map, pending when location is detected.
            scope.center = {
              lat: 6.5243793,
              lon: 3.3792057
            };

              // callback when google maps is loaded
            $window[callbackName] = function() {
              // console.log("map: init callback");
              // createMap();
              // updateMarkers();
            };


            function createMap() {
              // console.log("map: create map start");

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
                  var myLocation = new google.maps.Marker({
                      position: myLatLng,
                      map: scope.map,
                      title: "My Location"
                  });
                  google.maps.event.addDomListener(element[0], 'mousedown', function(e) {
                    e.preventDefault();
                    return false;
                  });
                  infowindow = new google.maps.InfoWindow();
              });
            }



            // scope.$watch('markers', function() {
            //   // updateMarkers();
            // });

            // Info window trigger function
            function onItemClick(pin, label, datum, url) {
              // Create content
              var contentString = "Name: " + label + "<br />Time: " + datum;
              // Replace our Info Window's content and position
              infowindow.setContent(contentString);
              infowindow.setPosition(pin.position);
              infowindow.open(map);
              google.maps.event.addListener(infowindow, 'closeclick', function() {
                //console.log("map: info windows close listener triggered ");
                infowindow.close();
                });
            }

            function markerCb(marker, member, location) {
                return function() {
                //console.log("map: marker listener for " + member.name);
                var href="http://maps.apple.com/?q="+member.lat+","+member.lon;
                map.setCenter(location);
                onItemClick(marker, member.name, member.date, href);
                };
              }

            // update map markers to match scope marker collection
            function updateMarkers() {
              if (scope.map) {
                // create new markers
                //console.log("map: make markers ");
                currentMarkers = [];
                // var markers = scope.markers;
                // if (angular.isString(markers)){
                //   markers = scope.$eval(scope.markers);
                // }
                for (var i = 0; i < scope.markers.length; i++) {
                  var m = scope.markers[i];

                  var loc = new google.maps.LatLng(m.lat, m.lon);

                  var mm = new google.maps.Marker({
                    position: loc,
                    map: map,
                    title: m.name
                  });
                  //console.log("map: make marker for " + m.name);
                  google.maps.event.addListener(mm, 'click', markerCb(mm, m, loc));
                  currentMarkers.push(mm);
                  }
                }
              }

            // convert current location to Google maps location
            function getLocation(loc) {
              if (loc == null) return new google.maps.LatLng(40, -73);
              if (angular.isString(loc)) loc = scope.$eval(loc);
              return new google.maps.LatLng(loc.lat, loc.lon);
              }

            createMap();
            // $timeout(createMap(), 0);

      } // end of link:
    }; // end of return
});
