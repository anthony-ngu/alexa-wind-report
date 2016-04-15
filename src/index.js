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
  var speechOutput = "Welcome to Wind Report, you can can ask for the Wind Report for a destination";
  var repromptText = "You can ask for the Wind Report for a destination";
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
  }
};

function handleGetWindReportIntent(intent, session, response) {
  var location = intent.slots.Location;
  var speechText = "Wind reporting service is currently unavailable. Try again later.";

  var query_url = WUNDERGROUND_BASE_URL + WUNDERGROUND_API_KEY + WUNDERGROUND_QUERY_URL + location.value + RESPONSE_FORMAT;
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
      try {
        speechText = "The current wind report for " + location.value + " is " + jsonObject.current_observation.wind_string;
      } catch (e) {
        speechText = "Wind reporting service is currently unavailable for " + location.value + ". Try again later.";
      }

      var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
      };
      response.tellWithCard(speechOutput, "Wind Report", speechText);
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

