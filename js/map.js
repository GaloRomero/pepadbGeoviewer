// Initialize the map
const map = L.map('map', {
    minZoom: 4, // Set your desired minimum zoom level
});

// OSM BASEMAP
// Add an OSM basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// OSM BASEMAP

// Declare the GeoJSON layer globally
let geoJSONLayer;

// DEFINE ATTRIBUTES NAME

// Declare attributeMapping globally
const attributeMapping = {
    'structure': 'Structure',
    'country': 'Country',
    'adm1': 'Administration',
    'millennium': 'Millennium BCE',
    'struc_type': 'Type',
    'amber': 'Amber',
    'bone': 'Bone',
    'ceramic': 'Ceramics',
    'coral': 'Coral',
    'fossil': 'Fossil',
    'ivory': 'Ivory',
    'lignite': 'Lignite',
    'rock': 'Rock',
    'seed': 'Seed',
    'shell': 'Shell',
    'wood': 'Wood',
    'n_items': 'Total items'
    // Add more mappings as needed
};

// DEFINE ATTRIBUTES NAME

// CSV ATTRIBUTES DOWNLOAD

// Function to download CSV
async function downloadCSV(featureId) {
    try {
        // Fetch the GeoJSON data again to ensure it's up-to-date
        const response = await fetch('http://pepadb.us.es:8080/geoserver/pepadbus/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pepadbus%3Astructures_rawmaterial&maxFeatures=1000000&outputFormat=application%2Fjson');
        const data = await response.json();

        // Find the feature by ID
        const feature = data.features.find(feature => feature.id === featureId);

        // Create CSV content
        let csvContent = 'Attribute,Value\n';

        for (const attribute in feature.properties) {
            if (attributeMapping.hasOwnProperty(attribute)) {
                const attributeName = attributeMapping[attribute];
                const attributeValue = feature.properties[attribute];

                // Check if the attribute meets the conditions for inclusion
                if (shouldIncludeAttribute(attribute, attributeValue)) {
                    // Add the attribute and value to the CSV content
                    csvContent += `"${attributeName}","${attributeValue}"\n`;
                }

            }
        }

        // Create a Blob containing the CSV data
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

        // Create a download link and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = 'feature_data.csv';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error downloading CSV:', error);
    }
}

// Function to determine if an attribute should be included based on conditions
function shouldIncludeAttribute(attribute, value) {
    // Add conditions for inclusion based on attribute type and value
    if (typeof value === 'number' && value > 0) {
        // For numeric attributes with value greater than 0
        return true;
    } else if (typeof value === 'string' && value.trim() !== '' && value.trim() !== '0') {
        // For string attributes with non-empty value (excluding '0')
        return true;
    }
    // Add additional conditions as needed for different attribute types or values

    // Default: exclude the attribute
    return false;
}

// CSV ATTRIBUTES DOWNLOAD

// Fetch GeoJSON data from GeoServer WFS using the Fetch API
fetch('https://pepadb.us.es/geoserver/pepadbus/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pepadbus%3Astructures_rawmaterial&maxFeatures=1000000&outputFormat=application%2Fjson')
    .then(response => response.json())
    .then(data => {
        // Create GeoJSON layer with custom popup
        geoJSONLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: '#424949',
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                });
            },
            onEachFeature: function (feature, layer) {
                // Customize the popup content
                const popupContent = createPopupContent(feature);

                // Bind the popup to the layer
                layer.bindPopup(popupContent);
            }
        });

        // Add GeoJSON layer to the map
        geoJSONLayer.addTo(map);

        // MAP SPATIAL EXTENSION

        // Set specific bounds for the map (replace with your desired bounding box)
        const specificBounds = [[35.17939758300781, -9.6222562789917], [59.15874481201172, 28, 332965850830078]];
        map.fitBounds(specificBounds);

        // MAP SPATIAL EXTENSION

        // SEARCH BOX

        // Add search box
        const searchControl = new L.Control.Search({
            layer: geoJSONLayer,
            propertyName: 'structure',
            marker: false,
            moveToLocation: function (latlng, title, map) {
                map.setView(latlng, 15); // Set the zoom level as needed
            },
            // Set a custom placeholder text
            textPlaceholder: 'Search by archaeological structure...',
            filterData: function (text, records) {
                const filteredRecords = {};

                Object.keys(records).forEach(key => {
                    const record = records[key];
                    if (key.toLowerCase().includes(text.toLowerCase())) {
                        filteredRecords[key] = record;
                    }
                });

                return filteredRecords;
            }
        });

        searchControl.on('search:locationfound', function (event) {
            event.layer.openPopup();
        });

        map.addControl(searchControl);


    })
    .catch(error => console.error('Error fetching WFS data:', error));

// SEARCH BOX

// POP UP CONTENT CONDITIONS + DOWNLOAD CSV BUTTON  

// Function to create popup content
function createPopupContent(feature) {
    let popupContent = '<div class="custom-popup">';
    popupContent += '<table class="table popup-table">';

    for (const attribute in attributeMapping) {
        if (attributeMapping.hasOwnProperty(attribute)) {
            // Use the mapping or the original attribute name if not found
            const attributeName = attributeMapping[attribute];

            // Check if the attribute exists in the feature properties
            if (feature.properties.hasOwnProperty(attribute)) {
                const attributeValue = feature.properties[attribute];

                // Visualization condition based on attribute type and value
                if (typeof attributeValue === 'number' && attributeValue > 0) {
                    // For numeric attributes with value greater than 0, display the value
                    popupContent += `<tr><th scope="row">${attributeName}</th><td>${attributeValue}</td></tr>`;
                } else if (typeof attributeValue === 'string' && attributeValue.trim() !== '' && attributeValue.trim() !== '0') {
                    // For string attributes with non-empty value (excluding '0'), display the value
                    popupContent += `<tr><th scope="row">${attributeName}</th><td>${attributeValue}</td></tr>`;
                }
                // Add additional conditions as needed for different attribute types or values
            }
        }
    }

    popupContent += '</table>';

    // Container for centered buttons
    popupContent += '<div class="text-center">';

    // Add a "Download CSV" button
    popupContent += `<button class="btn btn-secondary" onclick="downloadCSV('${feature.id}')">CSV</button>`;

    // Add a space between the buttons
    popupContent += '&nbsp;&nbsp;';

    // Add a "Download GeoJSON" button
    popupContent += `<button class="btn btn-secondary" onclick="downloadGeoJSON('${feature.id}')">GeoJSON</button>`;

    popupContent += '</div>';
    return popupContent;
}

// POP UP CONTENT CONDITIONS + DOWNLOAD CSV BUTTON  

// HOME BUTTON

// Add home button to return to the initial extent
const homeButton = L.easyButton('<i class="fa-solid fa-house fa-lg"></i>', function (btn, map) {
    // Set specific bounds for the map (replace with your desired bounding box)
    const specificBounds = [[35.17939758300781, -9.6222562789917], [59.15874481201172, 28.332965850830078]];
    map.fitBounds(specificBounds);
});

homeButton.addTo(map)

// HOME BUTTON

// SCALE

// Add a scale control
L.control.scale().addTo(map);

// SCALE

// MOUSE POSITION COORDINATES

// Add MousePosition Control to the map
L.control.mousePosition({
    position: 'bottomright', // Set the desired position
    separator: ' | ', // Set the separator between lat and lon
    emptyString: 'Unavailable', // Set the text to display if coordinates are not available
    lngFirst: false, // Set to true if you want to display longitude first
    numDigits: 5, // Set the number of decimal places
    lngFormatter: function (lng) {
        // Customize the longitude format if needed
        return 'Longitude: ' + lng;
    },
    latFormatter: function (lat) {
        // Customize the latitude format if needed
        return 'Latitude: ' + lat;
    }
}).addTo(map);

// MOUSE POSITION COORDINATES

// MAP LEGEND

// Add Legend
var legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend');

    // Add "Symbology" title
    div.innerHTML += '<div class="legend-title">Symbology</div>';

    // Add "Structures" title
    div.innerHTML += '<div class="legend-title-1">Structures</div>';
    div.innerHTML += '<div class="legend-item"><i class="legend-point"></i></div>';

    return div;
};

legend.addTo(map);

// MAP LEGEND


//Function to download GeoJSON with attributes greater than 0
async function downloadGeoJSON(featureId) {
    try {
        // Fetch the GeoJSON data again to ensure it's up-to-date
        const response = await fetch('http://pepadb.us.es:8080/geoserver/pepadbus/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pepadbus%3Astructures_rawmaterial&maxFeatures=1000000&outputFormat=application%2Fjson');
        const data = await response.json();

        // Find the feature by ID
        const feature = data.features.find(feature => feature.id === featureId);

        // Filter attributes based on conditions
        const filteredAttributes = {};
        for (const attribute in feature.properties) {
            if (shouldIncludeAttribute(attribute, feature.properties[attribute])) {
                filteredAttributes[attribute] = feature.properties[attribute];
            }
        }

        // Create a Blob containing the filtered GeoJSON data
        const filteredGeoJSON = {
            type: 'Feature',
            properties: filteredAttributes,
            geometry: feature.geometry
        };

        const geoJSONBlob = new Blob([JSON.stringify(filteredGeoJSON)], { type: 'application/json;charset=utf-8' });

        // Create a download link and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(geoJSONBlob);
        downloadLink.download = 'feature_data.geojson';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error downloading GeoJSON:', error);
    }
}

// Locate control

var lc = L.control.locate().addTo(map); // Add locate control to the map

// Locate control

// Add print control to the map
L.easyPrint({
    title: 'Print Map',
    position: 'bottomright',
    sizeModes: ['A4Portrait', 'A4Landscape']
}).addTo(map);
// Add print control to the map

// UPLOAD LAYERS

// Upload GeoJSON layers to the map 

// Event listener for file input change event
document.getElementById('fileInput').addEventListener('change', handleFileInputChange);

// Event listener for upload button click event
document.getElementById('uploadButton').addEventListener('click', function () {
    document.getElementById('fileInput').click(); // Trigger click event on file input element
});

// Function to handle file input change event
function handleFileInputChange(event) {
    var file = event.target.files[0]; // Get the uploaded file
    addGeoJSONLayerFromFile(file); // Add GeoJSON layer from the uploaded file
}

// Function to add GeoJSON layer from file
function addGeoJSONLayerFromFile(file) {
    if (!file) {
        console.error('No file provided.');
        return;
    }

    var reader = new FileReader(); // Create a new FileReader to read the file content
    reader.onload = function (event) { // Define what to do when the file is loaded
        try {
            var geojson = JSON.parse(event.target.result); // Parse the GeoJSON content
            L.geoJSON(geojson).addTo(map); // Add the GeoJSON layer to the map

            // Optionally fit the map bounds to the GeoJSON layer
            map.fitBounds(L.geoJSON(geojson).getBounds());
        } catch (error) {
            console.error('Error parsing GeoJSON:', error);
        }
    };

    reader.readAsText(file); // Read the file as text
}

// Upload GeoJSON layers to the map  

// UPLOAD LAYERS

//MATERIAL FILTER

// JavaScript code for handling the filter panel and map logic
document.getElementById('filterIcon').addEventListener('click', function () {
    var filterPanel = document.getElementById('filterPanel');
    if (filterPanel.style.display === 'none' || filterPanel.style.display === '') {
        filterPanel.style.display = 'block';
    } else {
        filterPanel.style.display = 'none';
    }
});

document.getElementById('applyFilterBtn').addEventListener('click', applyFilter);
document.getElementById('removeFilterBtn').addEventListener('click', removeFilter);
document.getElementById('downloadGeoJsonBtn').addEventListener('click', downloadGeoJson);


// Function to apply filter
function applyFilter() {
    // Check if any checkbox is selected
    var anyCheckboxSelected = false;
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            anyCheckboxSelected = true;
            return;
        }
    });

    // If no checkbox is selected, return without applying the filter
    if (!anyCheckboxSelected) {
        return;
    }

    // Reset styles of all points
    geoJSONLayer.eachLayer(function (layer) {
        layer.setStyle({ fillColor: '#424949' });
    });

    // Apply filter
    geoJSONLayer.eachLayer(function (layer) {
        var properties = layer.feature.properties;
        var amberChecked = document.getElementById('amberCheckbox').checked;
        var boneChecked = document.getElementById('boneCheckbox').checked;
        var ceramicChecked = document.getElementById('ceramicCheckbox').checked;
        var coralChecked = document.getElementById('coralCheckbox').checked;
        var fossilChecked = document.getElementById('fossilCheckbox').checked;
        var ivoryChecked = document.getElementById('ivoryCheckbox').checked;
        var ligniteChecked = document.getElementById('ligniteCheckbox').checked;
        var rockChecked = document.getElementById('rockCheckbox').checked;
        var seedChecked = document.getElementById('seedCheckbox').checked;
        var shellChecked = document.getElementById('shellCheckbox').checked;
        var woodChecked = document.getElementById('woodCheckbox').checked;

        // Check if the feature meets the filtering criteria
        var filtered = true;
        if (amberChecked && properties.amber <= 0) {
            filtered = false;
        }
        if (boneChecked && properties.bone <= 0) {
            filtered = false;
        }
        if (ceramicChecked && properties.ceramic <= 0) {
            filtered = false;
        }
        if (coralChecked && properties.coral <= 0) {
            filtered = false;
        }
        if (fossilChecked && properties.fossil <= 0) {
            filtered = false;
        }
        if (ivoryChecked && properties.ivory <= 0) {
            filtered = false;
        }
        if (ligniteChecked && properties.lignite <= 0) {
            filtered = false;
        }
        if (rockChecked && properties.rock <= 0) {
            filtered = false;
        }
        if (seedChecked && properties.seed <= 0) {
            filtered = false;
        }
        if (shellChecked && properties.shell <= 0) {
            filtered = false;
        }
        if (woodChecked && properties.wood <= 0) {
            filtered = false;
        }

        // Apply style based on filtered status
        if (filtered) {
            layer.setStyle({ fillColor: '#00FEF2' });
        } else {
            layer.setStyle({ fillColor: '#424949' });
        }
    });
}

// Function to remove filter
function removeFilter() {
    geoJSONLayer.eachLayer(function (layer) {
        // Reset layer style to original color
        layer.setStyle({ fillColor: '#424949' });
    });

    // Uncheck all checkboxes
    document.getElementById('amberCheckbox').checked = false;
    document.getElementById('boneCheckbox').checked = false;
    document.getElementById('ceramicCheckbox').checked = false;
    document.getElementById('coralCheckbox').checked = false;
    document.getElementById('fossilCheckbox').checked = false;
    document.getElementById('ivoryCheckbox').checked = false;
    document.getElementById('ligniteCheckbox').checked = false;
    document.getElementById('rockCheckbox').checked = false;
    document.getElementById('seedCheckbox').checked = false;
    document.getElementById('shellCheckbox').checked = false;
    document.getElementById('woodCheckbox').checked = false;
}

// Function to download GeoJSON
function downloadGeoJson() {
    var selectedFeatures = [];

    // Collect selected features from the map
    geoJSONLayer.eachLayer(function (layer) {
        if (layer.options.fillColor === '#00FEF2') { // Check if the feature is selected on the map
            selectedFeatures.push(layer.feature);
        }
    });

    // Convert selected features to GeoJSON format
    var selectedGeoJson = {
        type: "FeatureCollection",
        features: selectedFeatures
    };

    // Download GeoJSON
    var blob = new Blob([JSON.stringify(selectedGeoJson)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'selected_data.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

//MATERIAL FILTER   

// FILTER ICON

// Function to update the position of the filterIcon div
function updateFilterIconPosition() {
    var filterIcon = document.getElementById('filterIcon');
    filterIcon.style.left = '100px'; // Set left position
    filterIcon.style.top = '270px'; // Set top position
}

// FILTER ICON