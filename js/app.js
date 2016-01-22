
var ViewModel = function () {
    var self = this;
    self.query = ko.observable('');
    self.locations = ko.observableArray([]);
    self.filteredLocations = ko.observableArray([]);
    self.map = null;
    self.latlong = null;
    self.openWindow = null;
    self.infowindow = null;
    var service;

    //initializes map and activates Google Place Services
    self.initMap = function () {
        self.latlong = new google.maps.LatLng(37.8717, -122.2728);
        var mapOptions = {
            center: self.latlong,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        service = new google.maps.places.PlacesService(self.map);
        self.initMarkers();
    };
    //Uses Google Place Search API to find business locations nearby
    self.initMarkers = function () {
        var request = {
            location: self.latlong,
            radius: '500',
            types: ['restaurant']
        };
        service.nearbySearch(request, self.searchCallback);
    };

    //Adds markers to map and keeps track of all existing locations 
    self.searchCallback = function (results, status) {
        var marker;
        var location;

        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {

                location = new Location(results[i]);
                marker = self.getMarker(location);
                location.marker = marker;
                self.locations.push(location);
                self.filteredLocations.push(location);

            }
        }

    };

    //function that initializes each marker and populates infowindow with business data
    self.getPhone = function (request, location, marker) {
        service.getDetails(request, function (result, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                location.phone = result.formatted_phone_number;
            }
            self.getYelpReviews(location, marker);
        });
    };
    self.createWindow = function (location, marker) {
        self.infowindow = new google.maps.InfoWindow({
            content: location.content,
            maxWidth: 300
        });
        location.infowindow = self.infowindow;
        location.infowindow.open(self.map, marker);
        self.openWindow = location.infowindow;
    };
//creates marker and calls functions that load yelp data on click
    self.getMarker = function (location) {
        var request = {placeId: location.place_id};
        var marker = new google.maps.Marker({
            map: self.map,
            animation: google.maps.Animation.DROP,
            position: location.location
        });

        google.maps.event.addListener(marker, 'click', function () {
            if (self.openWindow !== null) {
                self.openWindow.close();
            }

            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            }

            setTimeout(function () {
                marker.setAnimation(null);
            }, 750);

            if (location.infowindow === null) {
                self.getPhone(request, location, marker);

            } else {
                self.createWindow(location, marker);
            }
        });
        return marker;
    };

    function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    }

    self.yelpCallback = function (results, location, marker) {
        var content = "<div><img src = " + results.businesses[0].image_url + " style ='float: right'><h3>" + location.name + "</h3>";
        content += "<img src = " + results.businesses[0].rating_img_url + "><br>";
        content += "<span>" + results.businesses[0].location.display_address + "</span><br>";
        content += "<p>" + results.businesses[0].snippet_text + "</p></div>";
        location.content = content;
        self.createWindow(location, marker);

    };
//function that makes the ajax request to yelp and deals with oauth
    self.getYelpReviews = function (location, marker) {
        var yelp_url = 'https://api.yelp.com/v2/phone_search';
        var parameters = {
            oauth_consumer_key: '8adqtZAFILD_FbvKCKDx8A',
            oauth_token: '9B-tUp8F8gtSmCVRM4vMR0xdYn2FK_sB',
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            callback: 'cb',
            phone: ((location.phone).toString()).replace(/\D/g, '')
        };

        var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, 'N8AHVg1nWklbXeOi-llodT7Vgco', 'J_xzioZbL5guY0d0l8uv56bCflM');
        parameters.oauth_signature = encodedSignature;

        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true,
            dataType: 'jsonp',
            success: function (results) {
                self.yelpCallback(results, location, marker);
            }
        };

        $.ajax(settings).fail(function(){
            alert('Error getting Yelp data');
        });

    };

    self.changeMarkers = function () {
        if (self.openWindow !== null) {
            self.openWindow.close();
        }

        //clears all markers from the map 
        for (var i = 0; i < self.filteredLocations().length; i++) {
            self.filteredLocations()[i].marker.setMap(null);
        }

        //empties working array
        self.filteredLocations.removeAll();

        //searches all available locations for ones whose names match the query and adds them to the working array
        for (var x = 0; x < self.locations().length; x++) {

            if (self.locations()[x].name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {
                self.filteredLocations.push(self.locations()[x]);
            }
        }
        //adds new filtered markers to the map
        for (var i = 0; i < self.filteredLocations().length; i++) {
            if (self.filteredLocations()[i].marker.map === null) {
                self.filteredLocations()[i].marker.setMap(self.map);
            }
        }
    };
    //centers map and opens infowindow when list element is clicked
    self.centerMap = function (location) {
        self.map.setCenter(location.location);
        google.maps.event.trigger(location.marker, 'click');
    };
    google.maps.event.addDomListener(window, 'resize', function () {
        self.map.setCenter(self.latlong);
    });

    self.initMap();
};

var Location = function (result) {
    this.location = result.geometry.location;
    this.place_id = result.place_id;
    this.marker = null;
    this.name = result.name;
    this.vicinity = result.vicinity;
    this.types = result.types;
    this.phone = null;
    this.infowindow = null;
    this.content = null;
};

function initialize(){
    ko.applyBindings(new ViewModel());
}
