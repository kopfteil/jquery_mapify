// todo:
// use jquery event system?
// this.trigger('eventName, eventData);
// $.on('custom_event', custom_callback) $.trigger('custom_event', {data});


;(function ($) {

		var pluginName = "mapify";

		//example event listeners, turn on for logging:
		// document.addEventListener("onMarkerClick", function(e) {
		// 	console.log(e.detail.marker.title); //e.detail contains the marker
		// })

		// document.addEventListener("onError", function(e) {
		// 	console.log(e.detail.error); //e.detail contains the error
		// })

		// document.addEventListener("onReady", function() {
		// 	console.log("ready"); //no parameters passed
		// })

		var mapDefaults = {
			zoom: 20, // zoom level: 0 - all the way out, 20 - all the way in
			minZoom: 0, //how far autofitbounds is allowed to zoom out 
			autoFitBounds: true, //Map will autofit to drawn markers - overrides zoom
			placeMarkers: false, //marker test mode, place markers by clicking on the map
			action: "drawMap",  //drawMap or addMarkers
			markers: [],
			center: null, //center only gets drawn if the center object is not null, provide position.
			centerIcon: "", //custom center icon only gets used if you provide an image url
			centerTitle: "Center",
			mapTypeId: "roadmap", //roadmap, satellite, hybrid, terrain
			apiKey: ""
		}

		var Plugin = function( element, options) {
			this.element = element;
			this.name = pluginName;
			this.aMarker = [];
			this.bounds = {};

			this.init(options);
		}

		Plugin.prototype.checkGAPIReady = function() {
			var gReady = (typeof google 	 === 'object' &&
						  typeof google.maps === 'object');
			return gReady;
		}

		Plugin.prototype.init = function(options) {
			this.settings = $.extend(mapDefaults, options);

			var _this = this;

			//Prepare the api, but only once
			if(this.checkGAPIReady()) {
				this.checkAction();
			} else {
				this.getApi(function(){
					_this.checkAction();
				});
			}
		}

		Plugin.prototype.checkAction = function() {
			action = this.settings.action;

			if (action == "drawMap") {
				var markers = this.settings.markers;
				this.drawMap();
				this.drawMarkers(markers);
			} else if (action == "addMarkers") {
				var markers = this.settings.markers;
				this.drawMarkers(markers);
			} else {
				onError("invalid action parameter passed");
			}
		}

		Plugin.prototype.getApi = function(callback) {
			_this = this;

			if (this.settings.apiKey.length > 0) {
				var apiUrl = "https://maps.google.com/maps/api/js?key=" + this.settings.apiKey;
			} else {
				var apiUrl = "https://maps.google.com/maps/api/js";
			}
		 	$.getScript(apiUrl, function() {
	 			callback();
		 	}).fail(function(error) {
	 			var sError = "error getting the api script";
	 			onError(sError);
		 	});
		}

		var onError = function(sError) {
			fireEvent("onError",sError,"sError");
		}

		var fireEvent = function(eventname, eventdata, detailname){
			if(eventdata != null && detailname != null) {

				var detailData = { 
					'detail': {}
				};
				detailData.detail[detailname] = eventdata;

				var event = new CustomEvent(eventname, detailData);
			} else {
				var event = new CustomEvent(eventname);
			}

			document.dispatchEvent(event);
		}

		Plugin.prototype.drawMap = function() {
			var _this 	 = this;
			var thissett = this.settings;

			this.map 	 = new google.maps.Map(_this.element, thissett);

			this.bounds  = new google.maps.LatLngBounds();

			//idle means the map is fully there and idling
			//thus being triggered once means it will report when the map
			//has finished loading for the first time.
			google.maps.event.addListenerOnce(_this.map, 'idle', function() {
				fireEvent("onReady");
			});

			if (thissett.placeMarkers) {
				google.maps.event.addListener(_this.map, 'click', function(e) {
					var tmpMarker = {
						position: 	e.latLng,
						map: 		_this.map
					}
					_this.drawMarker(tmpMarker);
				});
			}

			if (thissett.center !== null) {
				var tmpMarker = {
					position: 	thissett.center,
					icon: 		thissett.centerIcon,
					title: 		thissett.centerTitle
				};

				this.drawMarker(tmpMarker);
			}
		}

		Plugin.prototype.drawMarker = function(marker) {
			var _this = this;

			var tmpMarker = new google.maps.Marker({
				position: 	marker.position,
				map: 		this.map,
				title: 		marker.title,
				icon: 		marker.icon,
			});

			tmpMarker.addListener('click', function(){
				fireEvent("onMarkerClick", tmpMarker, "marker");
			});

			tmpMarker.setMap(this.map);
			this.aMarker.push(tmpMarker);

			if(this.settings.autoFitBounds) {
				this.bounds.extend(tmpMarker.getPosition());
				this.map.fitBounds(this.bounds);
			};
		}

		Plugin.prototype.drawMarkers = function(markers) {
			for (var numMarker = 0; numMarker < markers.length; numMarker++) {
				this.drawMarker(markers[numMarker]);
			}
		}

		$.fn[pluginName] = function (options) {
			this.each(function () {
				var pName = "plugin_" + pluginName;
				if (!$.data( this, pName) ) {
					$.data( this, pName, new Plugin( this, options));
				} else {
					_this.init(options);
				}
			})
			return this;
		}
		
}( jQuery ))