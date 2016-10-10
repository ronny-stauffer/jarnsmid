angular.module('mqttAdapter', [ 'angularPaho' ])

.service('mqttAdapter', ['MqttClient', MqttAdapter]);

function MqttAdapter(mqttClient) {
    var mqttBrokerIpAddress = '127.0.0.1';
    var mqttBrokerPort = '8000';
    var mqttClientId = 'jarnsmid';

    mqttClient.init(mqttBrokerIpAddress, mqttBrokerPort, mqttClientId);
    mqttClient._client.onMessageArrived = mqttInboundMessageCallback; // HACK
    mqttClient.connect({ onSuccess: mqttConnectionSuccessCallback });

    function mqttConnectionSuccessCallback() {
      mqttClient.subscribe('jarnsmid_inbound/update/#');

      console.log('Sending initial message to MQTT broker...');

      message = new Paho.MQTT.Message('jarnsmid connected.');
      message.destinationName = 'jarnsmid_outbound';
      mqttClient.send(message);

      console.log('...done.');
    }

    mqttClient.observerRegistry = {};

    this.registerObserver = function(itemName, observer) {
      if (mqttClient.observerRegistry[itemName] === undefined) {
        mqttClient.observerRegistry[itemName] = [];
      }
      mqttClient.observerRegistry[itemName].push(observer);
    }

    function mqttInboundMessageCallback(message) {
//      console.log('Received update message from MQTT broker: ' + message.payloadString);

      var itemName;
      var destinationNameSeparatorIndex = message.destinationName.lastIndexOf('/');
      if (destinationNameSeparatorIndex !== -1) {
        itemName = message.destinationName.substring(destinationNameSeparatorIndex + 1);
      } else {
        itemName = message.destinationName;
      }
      var updatedState = message.payloadString;

      console.log("Processing received update message '" + itemName + ": " + updatedState + "' from MQTT broker...");

//      console.log('Observer Registry: ' + mqttClient.observerRegistry);

      var registeredObservers = mqttClient.observerRegistry[itemName];
//      console.log('Registered Observers: ' + registeredObservers);
      if (registeredObservers !== undefined) {
        for (var i = 0; i < registeredObservers.length; i++) {
          var registeredObserver = registeredObservers[i];
            registeredObserver['mqttUpdate'].call(registeredObserver, itemName, updatedState);
        }
      }

      console.log('...done.');
    }

    this.sendCommand = function(itemName, command) {
      console.log("Sending command message '" + itemName + ": " + command + "' to MQTT broker...");

      message = new Paho.MQTT.Message(command);
      message.destinationName = 'jarnsmid_outbound/command/' + itemName;
      mqttClient.send(message);

      console.log('...done.');
    };
}