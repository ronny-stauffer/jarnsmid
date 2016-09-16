// Ionic Starter App

angular.module('mqttAdapter', [ 'angularPaho' ])

.controller('mqttController', [ '$scope', 'MqttClient', function($scope, mqttClient) {
    var mqttBrokerIpAddress = "127.0.0.1";
    var mqttBrokerPort = "8000";
    var mqttClientId = "jarnsmid";

    mqttClient.init(mqttBrokerIpAddress, mqttBrokerPort, mqttClientId);
    mqttClient._client.onMessageArrived = mqttInboundMessageCallback; // HACK
    mqttClient.connect({ onSuccess: mqttConnectionSuccessCallback });

    function mqttConnectionSuccessCallback() {
      mqttClient.subscribe('jarnsmid_inbound');

      console.log('Sending initial message to MQTT broker...');

      message = new Paho.MQTT.Message("jarnsmid connected.");
      message.destinationName = "jarnsmid_outbound";
      mqttClient.send(message);

      console.log('...done.');
    }

    function mqttInboundMessageCallback(message) {
      console.log("Received update message from MQTT broker: " + message.payloadString);

      console.log("Processing update message...");

      $scope.$apply(function() {
        //console.log("Item count: " + $scope.items.count);
        $scope.items[0].value = message.payloadString;
      });

      console.log("...done.");
    }

    $scope.items =
      [
        { name: "First", value: "-" },
        { name: "Second", value: "-" },
        { name: "Third", value: "-" },
      ];

    $scope.sendCommand = function() {
      console.log("Sending command message to MQTT broker...");

      message = new Paho.MQTT.Message("command");
      message.destinationName = "jarnsmid_outbound";
      mqttClient.send(message);

      console.log('...done.');
    };
}]);

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', [ 'ionic', 'mqttAdapter', 'tiles' ])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    //angular.element('item').title = 'Test'; // Doesn't work!
  });
})
