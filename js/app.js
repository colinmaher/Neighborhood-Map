var ViewModel = function () {
    var self = this;
    self.locations = ko.observableArray([]);
    self.filteredLocations = ko.observableArray([]);
    self.map = null;
    self.latlong = null;
    self.locationTypes = ko.observableArray(['all', 'bar', 'food', 'restaurant', 'store', 'grocery_or_supermarket']);
    self.chosenLocation = ko.observable('all');


    self.initMap = function () {
        self.latlong = new google.maps.LatLng(37.8914270, -122.1229410);
        var mapOptions = {
            center: self.latlong,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        self.initMarkers();
    };

    self.initMarkers = function () {
        var request = {
            location: self.latlong,
            radius: '500',
            types: self.chosenLocation
        };
        var service = new google.maps.places.PlacesService(self.map);
        service.nearbySearch(request, self.searchCallback);

    };
    self.searchCallback = function (results, status) {
        var marker;
        var location;
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                marker = self.getMarker(results[i]);
                location = new Location(results[i], marker);
                self.locations.push(location);
            }
        }
    };
    self.getMarker = function (result) {
        var marker = new google.maps.Marker({
            map: self.map,
            position: result.geometry.location
        });
        google.maps.event.addListener(marker, 'click', function () {
            var content = self.getContent(result);
            var infowindow = new google.maps.InfoWindow({
                content: content
            });
            infowindow.open(self.map, marker);
        });
        return marker;
    };

    self.changeMarkers = function () {
        console.log("changeMarkers called");
        var location;
        self.filteredLocations.removeAll();
        for (var i = 0; i < self.locations().length; i++) {
            location = self.locations()[i];
            if ((location.types.indexOf(self.chosenLocation()) === -1) && (self.chosenLocation() !== "all")) {
                location.marker.setMap(null);
            } else {
                self.filteredLocations.push(location);
                if (location.marker.map === null) {
                    location.marker.setMap(self.map);
                }
            }
        }
    };

    self.getContent = function (location) {
        var content = "<div><h2>" + location.name + "</h2></div>";
        return content;
    };
 
    self.chosenLocation.subscribe(function () {
        self.changeMarkers();
    });
    self.initMap();
};
var Location = function (result, marker) {
    this.place_id = result.place_id;
    this.name = result.name;
    this.vicinity = result.vicinity;
    this.types = result.types;
    this.marker = marker;
    this.phone = "";
    this.address = "";
    this.website = "";
};

ko.applyBindings(new ViewModel());
