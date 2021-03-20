//Plain, basic map tiles (URL and attribution from Maptiler)
maptilerUrl = 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=QilaOCumJJ8N6osXC8uS'
maptilerAttribution = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'

//Satellite map tiles (Access token, URL and attribution from Mapbox)
L.mapbox.accessToken = 'pk.eyJ1IjoiYW5kcmVhc2Jyb3duIiwiYSI6ImNrbHJtbTRhZzA1eHQydm8xeG9jOGdtbHUifQ.tyqQ7_Fe9iuoZpTzHcpeHQ'
mapboxUrl = 'https://api.mapbox.com/styles/v1/andreasbrown/ckmh5t3921gtm17p2bvzkqw7b/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken
mapboxAttribution = '&copy <a href="https://apps.mapbox.com/feedback/">Mapbox</a> &copy <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

//Defining base layers to be used in the layer control panel
var plain = L.tileLayer(maptilerUrl, {id: 'map', tileSize: 512, zoomOffset: -1, attribution: maptilerAttribution})
    satellite = L.tileLayer(mapboxUrl, {id: 'map', tileSize: 512, zoomOffset: -1, attribution: mapboxAttribution});

//Create a map centered on Calgary with a zoom level of 11
var map = L.map('map', {
    center: [51.04, -114.07],
    zoom: 11,
    layers: [plain] //Set the default layer that users will see first
});

//Base map object with key/value pairs for layer control panel
var baseMaps = {
    "Map": plain,
    "Satellite": satellite
};

//Create layer control panel and add to map
L.control.layers(baseMaps).addTo(map);

//This is just an empty geoJSON object, blank layer to clear previous search results with every new search
var markers = L.geoJSON().addTo(map);

var oms = new OverlappingMarkerSpiderfier(map); //Create an OverlappingMarkerSpiderfier instance

//URL for cemetery outlines/geometries, geojson endpoint
let boundaries_url = 'https://data.calgary.ca/resource/6ue7-ygzk.geojson';

drawOutlines(); //Call the function defined below

//A function to draw cemetery section boundaries and outlines
async function drawOutlines()
{
    console.log(boundaries_url);
    const boundaries_response = await fetch(boundaries_url); //Fetch a reponse for cemetery boundaries
    const boundaries_results = await boundaries_response.json(); //Convert results to a JSON object
    console.log(boundaries_results);
    var boundaries = boundaries_results; //Save the features to a variable, geojson object

//Plot and style the polygon features
L.geoJSON(boundaries, {
    style: function(feature) {
        return {
            color: "#FF0000", //Stroke colour
            weight: 1, //Stroke weight
            opacity: 1, //Stroke opacity
            fillColor: "FF0000", //Fill colour
            fillOpacity: 0 //Fill opacity
        }
    }
}).addTo(map);
}

//Base URL for Open Calgary burial records API, geojson endpoint
let base_url = 'https://data.calgary.ca/resource/tcwg-fcae.geojson';

//A function to search for graves based on first name and last name as inputs
async function findGraves1()
{
    map.removeLayer(markers); //Remove any existing layers from past searches
    map.setView(new L.LatLng(51.04, -114.07), 11); //Reset map centre and zoom to initial default values
    let firstname = document.querySelector('#fname').value; //Get first name entered by user
    let lastname = document.querySelector('#lname').value; //Get last name entered by user
    let firstname_upper = firstname.toUpperCase(); //Convert to uppercase to search data table
    let lastname_upper = lastname.toUpperCase(); //Convert to uppercase to search data table
    console.log(firstname);
    console.log(lastname);
    let query_url = base_url+'?$where=first_name ==' + '\'' + firstname_upper + '\'' + ' and last_name == '+'\''+ lastname_upper +'\''; //Query for this combination of first name and last name
    console.log(query_url);
    const response = await fetch(query_url); //Fetch a reponse
    const results = await response.json(); //Convert results to a JSON object
    console.log(results);
    console.log(results.features.length)
    if (results.features.length==0) //If no results are found
    {
        alert("No graves found. Please try again.") //Display an error message
    }
    else
    {
        alert(String(results.features.length)+" results were found.") //Otherwise display how many graves were found
    }

    //Add a global listener on the OverlappingMarkerSpiderfier instance
    var popup = new L.Popup();
    oms.addListener('click', function(marker) {
    popup.setContent(marker.desc);
    popup.setLatLng(marker.getLatLng());
    map.openPopup(popup);
    });

    //Add listeners on spiderfy events
    oms.addListener('spiderfy', function(markers) {
        map.closePopup();
  });

//Add and plot the markers
 markers = L.markerClusterGroup(); //Declare a cluster or collection of markers
  for (var i = 0; i < results.features.length; i++) //For all graves returned
  {
      var grave=results.features[i]; //Select the grave
      var graveloc = new L.LatLng(grave.geometry.coordinates[1], grave.geometry.coordinates[0]); //Get its location
      var marker = new L.Marker(graveloc); //Place a marker
      //Use attribute to generate text for a Leaflet popup
      var popuptext = 'First Name: '+grave.properties.first_name+'<br>'+'Last Name: '+grave.properties.last_name+'<br>'+'Interment Year: '+grave.properties.interment_year+'<br>'+'Cemetery Name: '+grave.properties.cemetery_name;
      marker.desc = popuptext; //Add description to marker
      oms.addMarker(marker); //Add marker to OverlappingMarkerSpiderfier instance
      markers.addLayer(marker); //Add marker to cluster of markers
      map.addLayer(markers); //Add cluster of markers to map
  }
}

//A function to search for graves based on year of burial (interment) as input
async function findGraves2()
{
    map.removeLayer(markers); //Remove any existing layers from past searches
    map.setView(new L.LatLng(51.04, -114.07), 11); //Reset map centre and zoom to initial default values
    let year = document.querySelector('#year').value; //Get year entered by user
    console.log(year);
    let query_url = base_url+'?interment_year='+year; //Query for this year
    console.log(query_url);
    const response = await fetch(query_url); //Fetch a reponse
    const results = await response.json(); //Convert results to a JSON object
    console.log(results);
    console.log(results.features.length)
    if (results.features.length==0) //If no results are found
    {
        alert("No graves found. Please try again.") //Display an error message
    }
    else
    {
        alert(String(results.features.length)+" results were found.") //Otherwise display how many graves were found
    }

    //Add a global listener on the OverlappingMarkerSpiderfier instance
    var popup = new L.Popup();
    oms.addListener('click', function(marker) {
    popup.setContent(marker.desc);
    popup.setLatLng(marker.getLatLng());
    map.openPopup(popup);
    });

    //Add listeners on spiderfy events
    oms.addListener('spiderfy', function(markers) {
        map.closePopup();
  });

//Add and plot the markers
 markers = L.markerClusterGroup(); //Declare a cluster or collection of markers
  for (var i = 0; i < results.features.length; i++) //For all graves returned
  {
      var grave=results.features[i]; //Select the grave
      var graveloc = new L.LatLng(grave.geometry.coordinates[1], grave.geometry.coordinates[0]); //Get its location
      var marker = new L.Marker(graveloc); //Place a marker
      //Use attribute to generate text for a Leaflet popup
      var popuptext = 'First Name: '+grave.properties.first_name+'<br>'+'Last Name: '+grave.properties.last_name+'<br>'+'Interment Year: '+grave.properties.interment_year+'<br>'+'Cemetery Name: '+grave.properties.cemetery_name;
      marker.desc = popuptext; //Add description to marker
      oms.addMarker(marker); //Add marker to OverlappingMarkerSpiderfier instance
      markers.addLayer(marker); //Add marker to cluster of markers
      map.addLayer(markers); //Add cluster of markers to map
  }
}

//A function to search for graves based on cemetery selection as input
async function findGraves3()
{
    map.removeLayer(markers); //Remove any existing layers from past searches
    map.setView(new L.LatLng(51.04, -114.07), 11); //Reset map centre and zoom to initial default values
    let cname = document.querySelector('#cemeteries').value; //Get cemetery name selected by user in dropdown menu
    console.log(cname);
    let query_url = base_url+'?cemetery_name='+cname; //Query for this cemetery
    console.log(query_url);
    const response = await fetch(query_url); //Fetch a reponse
    const results = await response.json(); //Convert results to a JSON object
    console.log(results);
    console.log(results.features.length)
    if (results.features.length==0) //If no results are found
    {
        alert("No graves found. Please try again.") //Display an error message
    }
    else
    {
        alert(String(results.features.length)+" results were found.") //Otherwise display how many graves were found
    }

    //Add a global listener on the OverlappingMarkerSpiderfier instance
    var popup = new L.Popup();
    oms.addListener('click', function(marker) {
    popup.setContent(marker.desc);
    popup.setLatLng(marker.getLatLng());
    map.openPopup(popup);
    });

    //Add listeners on spiderfy events
    oms.addListener('spiderfy', function(markers) {
        map.closePopup();
  });

//Add and plot the markers
 markers = L.markerClusterGroup(); //Declare a cluster or collection of markers
  for (var i = 0; i < results.features.length; i++) //For all graves returned
  {
      var grave=results.features[i]; //Select the grave
      var graveloc = new L.LatLng(grave.geometry.coordinates[1], grave.geometry.coordinates[0]); //Get its location
      var marker = new L.Marker(graveloc); //Place a marker
      //Use attribute to generate text for a Leaflet popup
      var popuptext = 'First Name: '+grave.properties.first_name+'<br>'+'Last Name: '+grave.properties.last_name+'<br>'+'Interment Year: '+grave.properties.interment_year+'<br>'+'Cemetery Name: '+grave.properties.cemetery_name;
      marker.desc = popuptext; //Add description to marker
      oms.addMarker(marker); //Add marker to OverlappingMarkerSpiderfier instance
      markers.addLayer(marker); //Add marker to cluster of markers
      map.addLayer(markers); //Add cluster of markers to map
  }
}
