// Transport cost calculation script

// Check if input is coordinates
function isCoordinate(input) {
  return /^-?\d+\.\d+,-?\d+\.\d+$/.test(input);
}

// Google Maps Geocoding API
function geocodeAddressGoogle(address) {
  var apiKey = "AIzaSyA9MMQ5DWCE7_4Ey4B2AFqZSWyuLO51E3c";
  var apiUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(address) + "&region=kr&key=" + apiKey;

  try {
    var response = UrlFetchApp.fetch(apiUrl);
    var json = JSON.parse(response.getContentText());

    if (json.status === "OK" && json.results.length > 0) {
      var loc = json.results[0].geometry.location;
      return loc.lng + "," + loc.lat; // lng,lat
    } else {
      Logger.log("Google Maps Geocoding failed: " + json.status + " - " + JSON.stringify(json));
    }
  } catch (e) {
    Logger.log("Google Maps Error: " + e.toString());
  }
  return null;
}

// Naver Directions API
function getDirectionInfoNaver(start, goal, fuelEfficiency, fuelPrice) {
  var clientId = "1di0jcyhpq";
  var clientSecret = "1ce7WUjgN8cs7Yk3mexppNb3YLCN82QpSsb15luQ";
  var apiUrl = "https://maps.apigw.ntruss.com/map-direction/v1/driving";

  var options = {
    "method": "get",
    "headers": {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret
    },
    "muteHttpExceptions": true
  };

  apiUrl += "?start=" + encodeURIComponent(start) + "&goal=" + encodeURIComponent(goal);

  try {
    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseCode = response.getResponseCode();
    var contentText = response.getContentText();
    Logger.log("Naver Direction URL: " + apiUrl + ", Response Code: " + responseCode + ", Response: " + contentText);

    if (responseCode === 200) {
      var json = JSON.parse(contentText);
      if (json.route && json.route.traoptimal && json.route.traoptimal.length > 0) {
        var summary = json.route.traoptimal[0].summary;
        var distanceKm = summary.distance / 1000;
        var fuelCost = summary.fuelCost !== undefined && summary.fuelCost !== null ?
          summary.fuelCost : Math.round((distanceKm / fuelEfficiency) * fuelPrice);
        var durationMin = Math.round(summary.duration / 60);
        var toll = summary.tollFare;
        var total = toll + fuelCost;
        return {
          start: start,
          goal: goal,
          distance: distanceKm.toFixed(1) + " km",
          duration: durationMin + " 분",
          tollFare: toll + " 원",
          fuelCost: fuelCost + " 원",
          totalCost: total + " 원"
        };
      } else {
        return { error: "No routes found", details: contentText };
      }
    } else {
      return { error: "HTTP Error " + responseCode, details: contentText };
    }
  } catch (e) {
    return { error: e.toString() };
  }
}

function doGetRoute(e) {
  var startInput = e.parameter.start || "대구역";
  var region = e.parameter.region;
  var school = e.parameter.school;
  var goalInput = (region && school) ? school + ", " + region + ", 대한민국" : (e.parameter.goal || "함안중학교");

  var startCoords = isCoordinate(startInput) ? startInput : geocodeAddressGoogle(startInput);
  var goalCoords = isCoordinate(goalInput) ? goalInput : geocodeAddressGoogle(goalInput);

  if (!startCoords || !goalCoords) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Geocoding failed",
      details: { startInput: startInput, goalInput: goalInput, startCoords: startCoords, goalCoords: goalCoords }
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var fuelEfficiency = parseFloat(e.parameter.fuelEfficiency) || 14; // km/L
  var fuelPrice = parseInt(e.parameter.fuelPrice, 10) || 1700; // KRW per liter

  var result = getDirectionInfoNaver(startCoords, goalCoords, fuelEfficiency, fuelPrice);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
