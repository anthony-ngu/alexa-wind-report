/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

var http = require('http');

/**
 * App ID for the skill
 */

var APP_ID = "{YOUR_APP_ID_HERE}"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var WUNDERGROUND_API_KEY = "{YOUR_API_KEY_HERE}";
var WUNDERGROUND_BASE_URL = "http://api.wunderground.com/api/";
var WUNDERGROUND_QUERY_URL = "/conditions/q/";
var RESPONSE_FORMAT = ".json";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * WindReport is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var WindReport = function () {
  AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
WindReport.prototype = Object.create(AlexaSkill.prototype);
WindReport.prototype.constructor = WindReport;

WindReport.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("WindReport onSessionStarted requestId: " + sessionStartedRequest.requestId
    + ", sessionId: " + session.sessionId);
  // any initialization logic goes here
};

WindReport.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  console.log("WindReport onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
  var speechOutput = "Welcome to Wind Report, you can ask for the Wind Report for a location";
  var repromptText = "You can ask for the Wind Report for a location";
  response.ask(speechOutput, repromptText);
};

WindReport.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
  console.log("WindReport onSessionEnded requestId: " + sessionEndedRequest.requestId
    + ", sessionId: " + session.sessionId);
  // any cleanup logic goes here
};

WindReport.prototype.intentHandlers = {
  // register custom intent handlers
  "GetWindReport": function (intent, session, response) {
    handleGetWindReportIntent(intent, session, response);
  },

  "AMAZON.HelpIntent": function (intent, session, response) {
    response.ask("You can ask for the Wind Report for a location, or, you can say exit", "You can ask for the Wind Report for a location");
  },

  "AMAZON.StopIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  },

  "AMAZON.CancelIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  }
};

function handleGetWindReportIntent(intent, session, response) {
  var location = intent.slots.Location;
  var web_encoded_location_value = location.value.replace(' ', '_');
  var speechText = "Wind reporting service is currently unavailable. Try again later.";

  var query_url = WUNDERGROUND_BASE_URL + WUNDERGROUND_API_KEY + WUNDERGROUND_QUERY_URL + web_encoded_location_value + RESPONSE_FORMAT;
  var body = '';
  var jsonObject;

  http.get(query_url, (res) => {
    console.log(`Got response: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', () => {
      console.log("RequestBody: " + body)
      jsonObject = JSON.parse(body);
      
      if(jsonObject.response.results != undefined)
      {
        var speechOutput = "Looks like there is more than one location called " + location.value + " please try again but specify the state, province, or country";
        var repromptText = "Please say a location again but specify the state, province, or country";
        response.ask(speechOutput, repromptText);
      }else{
        try {
          var wind_string = jsonObject.current_observation.wind_string;
          // Replace the N, S, E, W, NW, NE. SW, SE, WNW, ENE, WSW, ESE designations
          wind_string = wind_string.replace(' N ', ' North ');
          wind_string = wind_string.replace(' S ', ' South ');
          wind_string = wind_string.replace(' E ', ' East ');
          wind_string = wind_string.replace(' W ', ' West ');
          wind_string = wind_string.replace(' NW ', ' Northwest ');
          wind_string = wind_string.replace(' NE ', ' Northeast ');
          wind_string = wind_string.replace(' SW ', ' Southwest ');
          wind_string = wind_string.replace(' SE ', ' Southeast ');
          wind_string = wind_string.replace(' WNW ', ' West Northwest ');
          wind_string = wind_string.replace(' ENE ', ' East Northeast ');
          wind_string = wind_string.replace(' WSW ', ' West Southwest ');
          wind_string = wind_string.replace(' ESE ', ' East Southeast ');
          wind_string = wind_string.replace(' NNW ', ' North Northwest ');
          wind_string = wind_string.replace(' NNE ', ' North Northeast ');
          wind_string = wind_string.replace(' SSW ', ' South Southwest ');
          wind_string = wind_string.replace(' SSE ', ' South Southeast ');
          speechText = "The current wind report for " + location.value + " is " + wind_string;
        } catch (e) {
          speechText = "Wind reporting service is currently unavailable for " + location.value + ". Try again later.";
        }

        var speechOutput = {
          speech: speechText,
          type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tellWithCard(speechOutput, "Wind Report", speechText);
      }
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  // Create an instance of the WindReport skill.
  var windReport = new WindReport();
  windReport.execute(event, context);
};

