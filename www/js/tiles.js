angular.module('tiles', [ 'mqttAdapter', 'ionic' ])

.controller('tilesController', function($scope, $ionicLoading, $timeout, activitySpecificationInterpreter, templateManager, fieldFactory, tileTypeManager) {
//  var $scope.activitySpecifications = [
//    { binding: 'lichtGarten', type: 'light', label: 'Gartenbeleuchtung', tileSize: '1x1' },
//    { binding: 'lichtWZ', type: 'light', label: 'Licht Wohnzimmer', tileSize: '2x2' },
//  ];

  // Reference to the field factory
  //$scope.fieldFactory = fieldFactory;

  // An array that holds the fields with the tiles (= the model which is bound to the view)
//  $scope.fields = [];
//  $scope.numberOfTiles = 0;

  // A placeholder for some images
//  $scope.images = [];

  $scope.init = function(width, height) {
    $scope._width = width;
    $scope._height = height;

    $scope.refreshLoad();
  }

  $scope.activitySpecifications = function(width, height, activitySpecifications) {
    $scope._width = width;
    $scope._height = height;
    $scope._activitySpecifications = activitySpecifications;

    //TODO Check if activitySpecifications can be used instead of $scope._activitySpecifications
    activitySpecificationInterpreter.process($scope._activitySpecifications);

//    console.log('Tile Type IDs: ' + tileTypeManager.typeIds);

    var activityPresentationIds = [];
    for (var i = 0; i < $scope._activitySpecifications.length; i++) {
      var activitySpecification = $scope._activitySpecifications[i];
      var _activityPresentationIds = activitySpecification.presentationTypes.typeNames;

//      console.log('Activity: ' + activitySpecification.label + ', Presentation IDs: ' + _activityPresentationIds);

      for (var j = 0; j < _activityPresentationIds.length; j++) {
        var activityPresentationId = _activityPresentationIds[j];
        if (activityPresentationIds.indexOf(activityPresentationId) === -1) {
          activityPresentationIds.push(activityPresentationId);
        }
      }
    }

//    console.log('Activity Presentation IDs: ' + activityPresentationIds);

    $ionicLoading.show({
      template: 'Loading...'
    })
    .then(function() {
      return templateManager.init(activityPresentationIds, tileTypeManager.typeIds);
    })
    .then(function() {
      $scope.refreshLoad();

      $ionicLoading.hide();
    });
  };

  // Creates a new field with tiles
  $scope.createField = function() {
    var result = fieldFactory.createFieldOfTiles($scope._width, $scope._height, $scope._activitySpecifications, $scope.numberOfTiles)
    $scope.fields.push(result.field);
    $scope.numberOfTiles = result.numberOfTiles;

    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  // Function to return the styling (with the position) for a tile
//  $scope.getTileStyle = function(tile) {
//    style = {
//      left: tile.anchorX * 100 / 5 + '%',
//      top: tile.anchorY * 100 / 5 + '%',
//      width: tile.type.width * 100 / 5 + '%',
//      height: tile.type.height * 100 / 5 + '%'
//    }
//    return style;
//  };

  // Loads a newly/ an additional field (of the requested size)
  $scope.loadMore = function() {
//    $timeout(function(){
//      for (var i = 0; i < 10; i++) {
//        $scope.images.push($scope.images.length + 1);
//      }
      $scope.createField();
//    }, 0 /* 2000 */);
  };

  // Refreshes
  $scope.refreshLoad = function() {
    // Empty the fields array to re-fill it
    $scope.fields = [];
    $scope.numberOfTiles = 0;
    // Reset the images array
//    $scope.images = [];
    // Reset the number of totalTiles
//    fieldFactory.totalTiles = 0;

    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');

    // Load 10 new images
    $scope.loadMore();
  };

  // Initially load a field
//  console.log('Initially load a field...');
//  $scope.loadMore(); // Executed initially
})

.factory('fieldFactory', function(tileTypeManager) {
	var fieldFactory = {};

	// Specifies how many tiles are totally available
//	fieldFactory.totalTiles = 0;

	// Function to create a field that is filled with tiles
	fieldFactory.createFieldOfTiles = function(width, height, activitySpecifications, numberOfTiles) {
    width *= 2;
    height *= 2;

		// Create an empty field
//		var emptyField = [
//			[null, null, null, null],
//			[null, null, null, null],
//			[null, null, null, null],
//			[null, null, null, null]
//		];
    var emptyField = new Array(height);
    for (var i = 0; i < emptyField.length; i++) {
      emptyField[i] = new Array(width);
      for (var j = 0; j < emptyField[i].length; j++) {
        emptyField[i][j] = null;
      }
    }

    var state = { numberOfTiles: numberOfTiles };

    // Fill tiles into the field
		var filledField = fillTiles(emptyField, activitySpecifications, state);
		// Transform the field
		var transformedField = transformField(filledField);

    transformedField.getStyle = function() {
      style = {
        width: '100%',
        'padding-bottom': 100 / width * height + '%'
      }

      return style;
    };

		return { field: transformedField, numberOfTiles: state.numberOfTiles };
	}

	// Function to recursivly fill the field by trying to fit a randomly chosen tile into it
	function fillTiles(field, activitySpecifications, state) {
	  var abort = false;

		// Get the anchor for the next tile
		var nextAnchor = getNextAnchor(field);

		// Continue filling the field if it is not filled already
		if (nextAnchor !== null) {
		  var tileType;
		  var randomType = false;
      var activitySpecification;
		  //console.log('activitySpecifications: ' + activitySpecifications);
		  if (activitySpecifications !== undefined) {
		    activitySpecification = activitySpecifications[state.numberOfTiles];
		    if (activitySpecification !== undefined) {
		      var tileSize = '1x1';
		      if (activitySpecification.tileSize !== undefined) {
		        tileSize = activitySpecification.tileSize;
		      }
		      //console.log('tileSize: ' + tileSize);
		      if (tileSize !== 'random') {
            //console.log('activitySpecification.tileSize: ' + activitySpecification.tileSize);
            //tileType = tileTypes.find(function(type) { return type.id === '2x2' }); // Only works in ECMAScript 6?
            //TODO Use a map (instead of an array)
//            for (var i = 0; i < tileTypes.length; i++) {
//              //console.log("tileTypes[...].id: " + tileTypes[i].id);
//              if (tileTypes[i].id === tileSize) {
//                tileType = tileTypes[i];
//                //console.log("tileType: " + tileType);
//                break;
//              }
//            }
            tileType = tileTypeManager[tileSize];
            if (tileType === undefined) {
              abort = true;
            }
          }
        } else {
          abort = true;
        }
		  }
		  if (tileType === undefined) {
  			// Randomly pick a tile type
//	  		tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
        tileType = tileTypeManager.types[Math.floor(Math.random() * tileTypeManager.numberOfTypes)];
	  		randomType = true;
	  	}

      if (!abort) {
        // Check if the tile will fit into the field
        if (checkFitting(field, tileType, nextAnchor[1], nextAnchor[0])) {
          placeTile(field, tileType, nextAnchor[1], nextAnchor[0], activitySpecification, state);
          // Increase the tileCounter as soon as the tile has been added
          state.numberOfTiles++;
        } else if (!randomType) {
          abort = true;
        }

        if (!abort) {
			    return fillTiles(field, activitySpecifications, state);
			  } else {
			    return field;
			  }
			} else {
			  return field;
			}
		} else {
			return field;
		}
	}

	// Gets the next free anchor point within a field
	function getNextAnchor(field) {
		// Check the field for a free field (from right to left from top to down)
		for (var i = 0; i < field.length; i++) {
			for (var j = 0; j < field[i].length; j++) {
				if (field[i][j] === null) {
					return [i, j];
				}
			}
		}

		// Return null if no field is free -> Field is full
		return null;
	}

	// Checks whether the tile will fit into the field at the anchor point
	function checkFitting(field, tileType, x, y) {
		// Check if the tile will fit into the field
		for (var i = 0; i < tileType.width; i++) {
			// Fill the field down the Y-Axis for every field on the X-Axis
			for (var j = 0; j < tileType.height; j++) {
				if (field[y + j] === undefined) {
					return false;
				}
				if (field[y + j][x + i] === undefined
					|| field[y + j][x + i] !== null) {
					return false
				}
			}
		}

		return true;
	}

	// Places the tile in the field at the desired anchor point
	function placeTile(field, tileType, x, y, activitySpecification, state) {
	  //console.log('activitySpecification: ' + activitySpecification);

		// Fill the field on the X-Axis
		for (var i = 0; i < tileType.width; i++) {
			// Fill the field down the Y-Axis for every field on the X-Axis
			for (var j = 0; j < tileType.height; j++) {
				if (field[y + j][x + i] == null) {
					var tile = {
						//TODO Rename to 'id'?
						count: state.numberOfTiles,
						type: tileType,
						anchorX: x,
						anchorY: y,
            activity: activitySpecification
					}
          tile.getStyle = function() {
            style = {
              left: this.anchorX * 100 / field[0].length + '%',
              top: this.anchorY * 100 / field.length + '%',
              width: this.type.width * 100 / field[0].length + '%',
              height: this.type.height * 100 / field.length + '%'
            }

            return style;
          };
          field[y + j][x + i] = tile;
				} else {
					return false
				}
			}
		}

		return true;
	}

	// Function to transform the 2 dimensional array of the field
	// into a 1 dimensional array of the tiles
	function transformField(field) {
		var transformedField = [];

		// An internal counter to compare with the tileCounter of a field
		//TODO Rename to 'currentId'?
		var count = -1;

		// Loop through the field
		for (var i = 0; i < field.length; i++) {
			for (var j = 0; j < field[i].length; j++) {
			  // If the field slot is used (i.e. !== null) then
				// check if the tile has already been added
				// by comparing the internal counter with the tileCounter of the field
				if (field[i][j] !== null && field[i][j].count > count) {
					// Add the tile and set the internal counter to the just added tile
					transformedField.push(field[i][j]);
					count = field[i][j].count;
				}
			}
		}

		return transformedField;
	}

	return fieldFactory;
})

.directive('imageTile', function() {
	return {
		restrict: 'E',
		template: '<div/>',
		scope: { tile: '=', imageIndex: '=' },
    link: function(scope, element, attributes) {
      var imageUrls = [
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg',
        'img/11.jpg',
        'img/12.jpg',
        'img/13.jpg',
        'img/14.jpg',
        'img/15.jpg',
        'img/16.jpg',
        'img/17.jpg',
        'img/18.jpg',
        'img/19.jpg',
        'img/20.jpg',
        'img/21.jpg',
        'img/22.jpg',
        'img/23.jpg',
        'img/24.jpg',
        'img/25.jpg',
        'img/26.jpg',
        'img/27.jpg'
      ]

			if (scope.imageIndex !== undefined) { // May be the case if the attribute 'imageIndex' of the 'product-tile' element is not specified
			  //console.log('scope.imageIndex: ' + scope.imageIndex + ' imageUrls[...]: ' + imageUrls[scope.image])

//				var image = new Image(); // Dummy image element to preload the image?
//				image.onload = function() { // This event handler will be called on the image element when the image has finished loading (see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Attribute/image.onload).
                                      // -> Wait with setting the background image of the template Element ('div') after the image has already been loaded completely.
                                      // Otherwise, the fade-in effect would not be visible?
				  // Set style
          element.addClass(scope.tile.type.styleClass);
          element.css(scope.tile.getStyle());
          element.css({
            'background-image': 'url(' + imageUrls[scope.imageIndex] + ')',
            'opacity': '1'
          });
//				}
//				image.src = imageUrls[scope.imageIndex]; // Meaning? Triggers onload()? Yes.

          element.on('click', function(event) {
            console.log('Click on ' + scope.imageIndex);
          });
			}
		}
	}
})

.directive('activityTile', function(templateManager, activityBehaviorRegistry, tileTypeManager, mqttAdapter, $ionicPopup, $compile) {
	return {
		restrict: 'E',
		//template: '<div class="activity-tile"/>',
		scope: { tile: '=', activity: '=' },
    link: function(scope, element, attributes) { // Called before template is evaluated
      //console.log('Element: ' + element);

      // Set style
      element.addClass(scope.tile.type.styleClass);
      element.css(scope.tile.getStyle());

      // Determine template (= activity presentation)
      // 1
//      var templateBasePath = 'activities/';
//      var templatePath = templateBasePath + scope.activity.type + '.html';
//      scope.fallbackTemplatePath = templatePath;
//      if (scope.tile.type.id !== '1x1') {
//        var specificTemplatePath = templateBasePath + scope.activity.type + '_' + scope.tile.type.id + '.html';
//        var flag = false;
////        $http.get(specificTemplatePath).then( // Asynchronous call!
////            function() {
////              templatePath = specificTemplatePath;
////            });
//
//        function exists(url) {
////          var http = new XMLHttpRequest(); // Doesn't work: Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience.
////          http.open('HEAD', url, false);
////          http.send();
////          return http.status != 404;
//          return false;
//        }
//
//        if (exists(specificTemplatePath)) {
//          templatePath = specificTemplatePath;
//        };
//      }
//      scope.templatePath = templatePath;
      // 2
//      var templatePath = scope.activity.presentationIds[0] + '_' + scope.tile.type.id + '.html';
      // 3
      var templatePath = templateManager.getTemplatePath(scope.activity.presentationTypes.typeNames, [ scope.tile.type.id, '1x1' ]);
//      console.log('Template to use: ' + templatePath);
      scope.templatePath = templatePath;

      // Determine activity behaviors
      function getBehaviors(activity, behaviorTypeNames) {
        var behaviorDescriptors = [];

        for (var i = 0; i < behaviorTypeNames.length; i++) {
          var behaviorType = activityBehaviorRegistry[behaviorTypeNames[i]];
          if (behaviorType !== undefined) {
  //          console.log('Activity Label: ' + activity.label);
  //          console.log('Activity Behavior to use: ' + behavior);
            var behaviorInstance = new behaviorType(activity, callBehavior);
  //          console.log('Activity Behavior Instance to use: ' + behaviorInstance);
            var behaviorDescriptor = { id: behaviorTypeNames[i], instance: behaviorInstance };
            behaviorDescriptors.push(behaviorDescriptor);
          }
        }

        return behaviorDescriptors;
      }
      scope.behaviors = getBehaviors(scope.activity, scope.activity.behaviorTypes.typeNames);

      // Utilities
      scope.activity.refreshPresentation = function() {
        scope.$apply();
      };

      // Bind presentation (based on the template) to the behavior
      scope.getState = function(type) {
        return callBehavior('getState', type);
      };

      scope.setState = function(value) {
        callBehavior('setState', value);
      }

      scope.eventHandling = false;

      //TODO Implement as function with a variable number of arguments
      function callBehavior(eventSpecification, argument, argument2) {
        var action;

        // Call event
        var lastCalledBehaviorId = null;
        var lastStateChangingBehaviorId = null;
        var abort = false;
        function callBehaviorForEvent(eventSpecification, argument, argument2) {
          var eventIds;
          if (Array.isArray(eventSpecification)) {
            eventIds = eventSpecification;
          } else {
            eventIds = [ eventSpecification ];
          }

          for (var j = 0; j < scope.behaviors.length; j++) {
            var behaviorId = scope.behaviors[j].id;
            var behaviorInstance = scope.behaviors[j].instance;
            for (var i = 0; i < eventIds.length; i++) {
              var eventId = eventIds[i];
              var stateGetEvent = false;
              if (eventId.startsWith('get')) {
                stateGetEvent = true;
              }
              var behaviorEventHandler = behaviorInstance[eventId];
              if (behaviorEventHandler !== undefined) {
//                console.log('Activity Behavior to use: ' + behaviorId);
//                console.log('Activity Behavior Event Handler to use: ' + behaviorEventHandler);

                lastCalledBehaviorId = behaviorId;
                var _result = behaviorEventHandler.call(behaviorInstance, argument, argument2);
                // Check result
//                if (result !== undefined && !result.continue) {
                if (_result !== undefined) {
                  if (_result.action !== undefined) {
                    var _action = _result.action;
                    if (_result[_action] !== undefined) {
                      action = { type: _action, parameter: _result[_action] };
                    } else {
                      action = _action;
                    }
                  } else {
                    action = _result;
                  }
                  if (!stateGetEvent) {
                    console.log('State changed by [' + behaviorId + '].');
                    lastStateChangingBehaviorId = behaviorId;
                  }
                  if (stateGetEvent || _result.abort) {
                    if (_result.abort) {
                      console.log('Aborting...');
                    }
                    abort = true;
                    break;
                  }
                }
              }
            }
            if (abort) {
              break;
            }
          }
        }
        callBehaviorForEvent(eventSpecification, argument, argument2);

        // Fire 'afterStateChange' event
        if (lastStateChangingBehaviorId !== null && !scope.eventHandling) {
          scope.eventHandling = true;
          try {
            console.log('Firing "afterStateChange" event because state has been changed by [' + lastStateChangingBehaviorId + ']...');

            callBehaviorForEvent('afterStateChange', lastStateChangingBehaviorId);

            console.log('...done (firing event).');
          } finally {
            scope.eventHandling = false;
          }
        }

        return action;
      }

      function processAction(action) {
        if (action === undefined) {
          return;
        }

        if (action === 'parameterize') {
          processAction(callBehavior('parameterize'))
        } else if (action === 'colorChooser') {
          showColorChooser();
        } else if (action.type === 'command') {
          mqttAdapter.sendCommand(scope.activity.binding, action.parameter);
        }
      }

      // (Set) presentation event handlers
//      element.on('click', function(event) {
      scope.tap = function() {
//        console.log('Tap on ' + scope.activity.label);

        processAction(callBehavior('toggle'));
//      });
      };

      scope.hold = function() {
        processAction(callBehavior('parameterize'));
      };

      scope.swipeLeft = function() {
        console.log('Swipe left on activity "' + scope.activity.label + '"');

        $ionicPopup.show({
          title: 'Swipe left on activity "' + scope.activity.label + '"',
          buttons: [ { text: 'Cancel' } ]
        });
      }


      scope.swipeRight = function() {
        console.log('Swipe right on activity "' + scope.activity.label + '"');

        $ionicPopup.show({
          title: 'Swipe right on activity "' + scope.activity.label + '"',
          buttons: [ { text: 'Cancel' } ]
        });
      }

      scope.swipeUp = function() {
//        console.log('Swipe up on activity "' + scope.activity.label + '"');
//
//        $ionicPopup.show({
//          title: 'Swipe up on activity "' + scope.activity.label + '"',
//          buttons: [ { text: 'Cancel' } ]
//        });

        processAction(callBehavior(['increase', 'moveUp']));
      }

      scope.swipeDown = function() {
//        console.log('Swipe down on activity "' + scope.activity.label + '"');
//
//        $ionicPopup.show({
//          title: 'Swipe down on activity "' + scope.activity.label + '"',
//          buttons: [ { text: 'Cancel' } ]
//        });

        processAction(callBehavior(['decrease', 'moveDown']));
      }

      // Generic presentation extensions
      function showColorChooser() {
          var colorPickerElement = angular.element('<div color-picker="" color-mode="hsv" model-mode="rgb" ng-model="color" ng-model-options="{ getterSetter: true }"/>');
//          element.append(colorPickerElement);
          $compile(colorPickerElement)(scope);
          colorPickerElement.triggerHandler('click');
      }

      scope.color = function(value) {
//        console.log('Value: ' + value);

//        return arguments.length ? (scope._value = value) : scope._value;
//         return arguments.length ? scope.setState(value) : scope.getState('rgb');
        if (arguments.length) {
          scope.setState(value);
          callBehavior('colorSet');
        } else {
          return scope.getState('rgb');
        }
      };

      // Bind activity to backend
      function callBehaviorAndRefreshPresentation(eventSpecification, argument, argument2) {
        callBehavior(eventSpecification, argument, argument2);

        scope.activity.refreshPresentation();
      }

//      console.log('Registering activity "' + scope.activity.label + '" at backend');
      mqttAdapter.registerObserver(scope.activity.binding, callBehaviorAndRefreshPresentation);
    },
    template: '<div on-tap="tap()" on-hold="hold()" on-swipe-left="swipeLeft()" on-swipe-right="swipeRight()" on-swipe-up="swipeUp()" on-swipe-down="swipeDown()" ng-include="templatePath"/>' // Doesn't work? <div ng-show="templateLoadingFailed">Error</div> Error: {{templateLoadingFailed}}
	}
})
.directive('circle', function($interval) {
	return {
		restrict: 'E',
		//template: '<div class="activity-tile"/>',
		scope: { value: '=' },
    link: function(scope, element, attributes) { // Called before template is evaluated
//      console.log('Scope: ' + Object.keys(scope));
//      console.log('Grandparent Scope: ' + Object.keys(scope.$parent.$parent));
//      console.log('Attributes: ' + Object.keys(attributes));
//      console.log('Value Attribute: ' + attributes.value);

      var canvas = element.parent()[0];

      var canvasWidth = canvas.width = canvas.clientWidth;
      var canvasHeight = canvas.height = canvas.clientHeight;

      var canvasContext = canvas.getContext('2d');

      var canvasCenterX = canvasWidth / 2;
      var canvasCenterY = canvasHeight / 2;
      var arcWidth = 5;
      var arcRadius = canvasCenterX - (arcWidth / 2);
      var arcStartAngle = 0.75 * Math.PI;

      function draw() {
//        console.log('Value: ' + scope.value);


//        console.log('First Parent: ' + canvas);

//        console.log('Canvas Width: ' + canvas.width);
//        console.log('Canvas Height: ' + canvas.height);

        var arcEndAngle = (0.75 + (1.5 / 100 * scope.value)) * Math.PI;

        canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

        canvasContext.beginPath();
        canvasContext.arc(canvasCenterX, canvasCenterY, arcRadius, 0, 2 * Math.PI);
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = 'white';
        canvasContext.stroke();

        canvasContext.beginPath();
        canvasContext.arc(canvasCenterX, canvasCenterY, arcRadius, arcStartAngle, arcEndAngle);
        canvasContext.lineWidth = arcWidth;
        canvasContext.strokeStyle = 'white';
        canvasContext.stroke();
      }

      //TODO How to omit grandparent scope?
      scope.$parent.$parent.$watch(/* The expression to evaluate by $watch(): */ attributes.value, function(value) {
//        console.log('Update (watched)...');

//        console.log('Value (Argument): ' + value);
//        console.log('Value (Scope): ' + scope.value);

        scope.value = value;

        draw();

//        console.log('...done.');
      });

//      // Start a UI update process (and save the timeout ID for canceling)
//      var timeoutId = $interval(function() {
//        console.log('Update (timed)...');
//
//        console.log('Value: ' + scope.value);
//
//        draw();
//
//        console.log('...done.');
//      }, 1000);
//
//      element.on('$destroy', function() {
//        $interval.cancel(timeoutId);
//      });
    },
    template: ''
    //template: '<div on-tap="tap()" on-hold="hold()" on-swipe-left="swipeLeft()" on-swipe-right="swipeRight()" on-swipe-up="swipeUp()" on-swipe-down="swipeDown()" ng-include="templatePath"/>' // Doesn't work? <div ng-show="templateLoadingFailed">Error</div> Error: {{templateLoadingFailed}}
	}
})


.service('activitySpecificationInterpreter', ActivitySpecificationInterpreter)

.service('templateManager', TemplateManager)

.service('activityBehaviorRegistry', ActivityBehaviorRegistry)

.service('tileTypeManager', TileTypeManager);

function ActivitySpecificationInterpreter() {
  this.typeMappings = [
    { from: 'openClosedContact', to: 'boolean' },
    { from: 'arcGauge', to: 'number' },
    { from: 'light', to: 'switch' },
    { from: 'adjustableSwitch', to: 'adjustable&switch' },
    { from: 'dimmableLight', to: 'adjustableSwitch' },
    { from: 'colorLight', to: 'light' },
    { from: 'domeLight', to: 'light' },
    { from: 'jalousie', to: 'adjustable' },
  ];

  // Builds the type hierarchy (= a tree)
  this.buildTypeHierarchy = function(typeSpecification, selector) {
    var typeDescriptors = [];

    //TODO Check typeSpecification's syntax
    var typeSpecificationParts = typeSpecification.split('#');
    var selectedIndex = Math.max(typeSpecificationParts.length - 1 - selector, 0);
    selectedTypeSpecification = typeSpecificationParts[selectedIndex];

    var selectedTypeSpecificationParts = selectedTypeSpecification.split('&');
    for (var i = 0; i < selectedTypeSpecificationParts.length; i++) {
      var selectedTypeName = selectedTypeSpecificationParts[i];
      var typeDescriptor = { name: selectedTypeName };

      var nextTypeDescriptors = [];
  //    var mapping = this.typeMappings.find(function(typeMapping) { return typeMapping.from === type; }); // Only works in ECMAScript 6?
      var mapping = null;
      for (var j = 0; j < this.typeMappings.length; j++) {
        var _mapping = this.typeMappings[j];
        if (_mapping.from === selectedTypeName) {
          mapping = _mapping;
          break;
        }
      }
      if (mapping !== null && mapping.to !== undefined) {
        nextTypeSpecification = mapping.to;
        nextTypeDescriptors = this.buildTypeHierarchy(nextTypeSpecification, selector);
      }
      typeDescriptor.next = nextTypeDescriptors;

      typeDescriptors.push(typeDescriptor);
    }

    return typeDescriptors;
  };

  // Returns all type names by traversing the type hierarchy (= a tree)
  this.getTypeNames = function(typeDescriptorsHierarchy) {
    var typeNames = [];

    var typeDescriptorsToProcess = typeDescriptorsHierarchy;
    while (typeDescriptorsToProcess.length) {
      var typeDescriptorToProcess = typeDescriptorsToProcess.pop();
      var typeName = typeDescriptorToProcess.name;
      if (typeNames.indexOf(typeName) === -1) {
        typeNames.push(typeName);
      }
      typeDescriptorsToProcess.push.apply(typeDescriptorsToProcess, typeDescriptorToProcess.next);
    }

    return typeNames;
  };

  this.process = function(activitySpecifications) {
    for (var i = 0; i < activitySpecifications.length; i++) {
      var activitySpecification = activitySpecifications[i];

      var presentationTypes = [], behaviorTypes = [];
      var activityType = activitySpecification.type;
      if (activityType !== undefined && typeof(activityType) === 'string' && activityType.length > 0) {
        behaviorTypes = this.buildTypeHierarchy(activityType, 0);
        presentationTypes = this.buildTypeHierarchy(activityType, 1);
      }
      activitySpecification.presentationTypes = presentationTypes;
      activitySpecification.presentationTypes.typeNames = this.getTypeNames(presentationTypes);
      activitySpecification.behaviorTypes = behaviorTypes;
      activitySpecification.behaviorTypes.typeNames = this.getTypeNames(behaviorTypes);
    }
  };
}

function TemplateManager($templateCache, $http, $timeout, $q) {
  this.init = function (templateBaseIds, sizeIds) {
    console.log('Initializing template manager...');

    var templateIds = [];
    for (var i = 0; i < templateBaseIds.length; i++) {
      for (var j = 0; j < sizeIds.length; j++) {
        templateIds.push(templateBaseIds[i] + '_' + sizeIds[j]);
      }
    }

//    console.log('Template IDs: ' + templateIds);

    var templateLoadingPromises = [];
    for (var i = 0; i < templateIds.length; i++) {
      var templateId = templateIds[i];

      var templateBasePath = 'activities/';
      var templatePath = templateBasePath + templateId + '.html';
      var templateLoadingPromise = $http.get(templatePath, { templateId: templateId }).then(function(response) { // Asynchronous call!
        var templateId = response.config.templateId;
        var templatePath = templateId + '.html';
        var templateData = response.data;
//        console.log('Template ID: ' + templateId + ', Path: ' + templatePath + ', Data: ' + templateData);

//        console.log('Template added to template cache: ' + templatePath)
        $templateCache.put(templatePath, templateData);
      }, function(response) {
        var templateId = response.config.templateId;
//        console.log('Cannot find template ' + templateId + '!');
      });
      templateLoadingPromises.push(templateLoadingPromise);
    }

//    return $timeout(function() {
//        console.log('...done.');
//      }, 5000);
    return $q.all(templateLoadingPromises).then(function () {
      console.log('...done.');
    });
  };

  this.getTemplatePath = function(templateBaseIds, sizeIds) {
    var templatePath = null;

    for (var i = 0; i < templateBaseIds.length; i++) {
      for (var j = 0; j < sizeIds.length; j++) {
        var _templatePath = templateBaseIds[i] + '_' + sizeIds[j] + '.html';
        var template = $templateCache.get(_templatePath);
        if (template !== undefined) {
          templatePath = _templatePath;
          break;
        }
      }
      if (templatePath !== null) {
        break;
      }
    }

    return templatePath;
  };
}

function ActivityBehaviorRegistry(mqttAdapter) {
  this['boolean'] = function(activity, callBehavior) {
    this.activity = activity;
    this.state = false;
    this.getState = function(type) {
      if (type == 'boolean') {
        return this.state;
      }
    };
    this.setState = function(state) {
      if (state === true) {
        this.state = true;
      } else if (state === false) {
        this.state = false;
      } else if (typeof(state) === 'number') {
        if (state !== 0) {
          this.state = true;
        } else {
          this.state = false;
        }
      } else if (state === 'true') {
        this.state = true;
      } else if (state === 'false') {
        this.state = false;
      } else if (state === 'CLOSED') {
        this.state = true;
      } else if (state === 'OPEN') {
        this.state = false;
      }
    };
    this.backendStateUpdate = function(itemName, state) {
      var stateAsNumber = parseFloat(state);
      if (!isNaN(stateAsNumber)) {
        this.setState(stateAsNumber);
      } else {
        this.setState(state);
      }
    };
  };
  this['openClosedContact'] = function(activity, callBehavior) {
    this.activity = activity;

    this.getState = function(type) {
      if (type == 'openClosed') {
        return callBehavior('getState', 'boolean') ? 'CLOSED' : 'OPEN';
      }
    };
  };
  this['number'] = function(activity, callBehavior) {
    this.activity = activity;
    this.state = 0;
    this.getState = function(type) {
      if (type == 'number') {
        return this.state;
      }
    };
    this.setState = function(state) {
      if (typeof(state) === 'number') {
        this.state = state;
      }
    };
    this.backendStateUpdate = function(itemName, state) {
      var stateAsNumber = parseFloat(state);
      if (!isNaN(stateAsNumber)) {
        this.setState(stateAsNumber);
      }
    };
  };
  this['switch'] = function(activity, callBehavior) {
    this.activity = activity;
    this.state = false;
    this.getState = function(type) {
      if (type === 'boolean') {
        return this.state;
      } else if (type === 'onOff') {
        return this.state ? 'ON' : 'OFF';
      }
    };
    this.setState = function(state) {
      console.log('[switch] Set state...');

      if (state === true) {
        console.log('[switch] State is "true".');

        this.state = true;

        return 'set';
      } else if (state === false) {
        console.log('[switch] State is "false".');

        this.state = false;

        return 'set';
      } else if (state === 'ON') {
        console.log('[switch] State is ON.');

        this.state = true;

        return 'set';
      } else if (state === 'OFF') {
        console.log('[switch] State is OFF.');

        this.state = false;

        return 'set';
      }
    };
    // Remote state update from backend
    this.backendStateUpdate = function(itemName, state) {
      return this.setState(state);
    };
    this.toggle = function() {
      console.log('[switch] Toggle...');

      this.state = !this.state;

      // Not necessary because this handler runs within the 'on-tap' handler?
//      this.activity.refreshPresentation();

      // Send command to backend
      mqttAdapter.sendCommand(this.activity.binding, this.getState('onOff'));

      return 'set';
    };
  };
  this['adjustable'] = function(activity, callBehavior) {
    this.activity = activity;
    this.callBehavior = callBehavior;
    this.state = 0;
    this.getState = function(type) {
      if (type == 'level') {
        return this.state;
      } else if (type == 'levelIn10Percent') {
        return Math.floor(this.state / 10) * 10;
      }
    };
    this.setState = function(state) {
      console.log('[adjustable] Set state...');

      if (typeof(state) === 'number') {
        console.log('[adjustable] State is ' + state + '.');

        this.state = state;

        return 'set';
      }
    };
    this.backendStateUpdate = function(itemName, state) {
      var stateAsNumber = parseFloat(state);
      if (!isNaN(stateAsNumber)) {
        return this.setState(stateAsNumber);
      }
    };
    this.increase = function() {
      console.log('[adjustable] Increase...');

      if (this.state < 100) {
        this.state += 10;
      }

      mqttAdapter.sendCommand(this.activity.binding, this.getState('level').toString());

      return 'set';
    }
    this.decrease = function() {
      console.log('[adjustable] Decrease...');

      if (this.state > 0) {
        this.state -= 10;
      }

      mqttAdapter.sendCommand(this.activity.binding, this.getState('level').toString());

      return 'set';
    }
  };
  this['adjustableSwitch'] = function(activity, callBehavior) {
    this.activity = activity;
    this.callBehavior = callBehavior;
    this.afterStateChange = function(changingBehaviorId) {
      console.log('[adjustableSwitch] After state has been changed by [' + changingBehaviorId + ']...');

      if (changingBehaviorId === 'adjustable') {
        var level = callBehavior('getState', 'level');
        console.log('[adjustableSwitch] [adjustable] state: ' + level);
        if (level > 0) {
          callBehavior('setState', 'ON');
        } else {
          callBehavior('setState', 'OFF');
        }
      } else if (changingBehaviorId === 'switch') {
        var onOff = callBehavior('getState', 'onOff');
        console.log('[adjustableSwitch] [switch] state: ' + onOff);
        if (onOff === 'ON') {
          callBehavior('setState', 100);
        } else {
          callBehavior('setState', 0);
        }
      }
    };
  };
  this['colorLight'] = function(activity, callBehavior) {
    this.activity = activity;
    this.callBehavior = callBehavior;
    this.state = {
      r: 0,
      g: 0,
      b: 0,
      isDefined: function() {
        return !(this.r === 0 && this.g === 0 && this.b === 0);
      },
      //HACK Logic should not be implemented here?
      getBackgroundColorStyle: function() {
        if (/* this.isDefined() */ callBehavior('getState', 'boolean')) {
          return {
                  'background-color': 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')'
                 };
        }
      },
      toString: function() {
        return JSON.stringify(this);
      }
    };
    this.getState = function(type) {
      if (type === 'rgb') {
//        console.log('Read state: ' + Object.keys(this.state));

        return this.state;
//        return { // Doesn't work? Because the identity of the returned value must not change?
//          r: this.state.r,
//          g: this.state.g,
//          b: this.state.b,
////          getBackgroundColorStyle: function() {
////            if (!(this.r === 0 && this.g === 0 && this.b === 0)) {
////              return {
////                      'background-color': 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')'
////                     };
////            }
////          }
//        }
      }
    };
    this.setState = function(state) {
      console.log('[colorLight] Set state...');

      if (state.r !== undefined && state.g !== undefined && state.b !== undefined) {
        console.log('[colorLight] State is of type "color"');

        this.state.r = state.r;
        this.state.g = state.g;
        this.state.b = state.b;
      }

      console.log('[colorLight] Current State: ' + this.state);
    };
    this.toggle = function() {
      console.log('[colorLight] Toggle...');

      if (!this.callBehavior('getState', 'boolean')) {
        console.log('[colorLight] Switch state is OFF');
        if (!this.state.isDefined()) {
          console.log('[colorLight] Parameter "color" is not yet defined...');
          return { action: 'parameterize', abort: true };
        } else {
          console.log('[colorLight] Switch ON...');
          return this.switchOn();
        }
      }
    };
    this.parameterize = function() {
      return 'colorChooser';
    };
    this.colorSet = function() {
      console.log('[colorLight] Color set.');

      return this.switchOn();
    };
    this.switchOn = function() {
      this.callBehavior('setState', 'ON');

      this.sendCommand();

      return { action: 'command', abort: true };
    };
    this.sendCommand = function() {
      var hsvColor = rgbColor2hsvColor(this.state);
      var command = hsvColor.h + ',' + hsvColor.s + ',' + hsvColor.v;
      // Send command to backend
      mqttAdapter.sendCommand(this.activity.binding, command);
    };
    function rgbColor2hsvColor(rgbColor) {
      var r = rgbColor.r / 255;
      var g = rgbColor.g / 255;
      var b = rgbColor.b / 255;

      var h, s;
      var v = Math.max(r, g, b);

      var diff = v - Math.min(r, g, b);
      var diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };

      if (diff == 0) {
        h = s = 0;
      } else {
        s = diff / v;

        var rr = diffc(r);
        var gg = diffc(g);
        var bb = diffc(b);
        if (r === v) {
          h = bb - gg;
        } else if (g === v) {
          h = (1 / 3) + rr - bb;
        } else if (b === v) {
          h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
      };
    }
  };
  this['jalousie'] = function(activity, callBehavior) {
    this.activity = activity;
    this.callBehavior = callBehavior;
    this.moveUp = function() {
      console.log('[jalousie] Move up...');

      return { action: 'command', command: 'UP', abort: true };
    };
    this.moveDown = function() {
      console.log('[jalousie] Move down...');

      return { action: 'command', command: 'DOWN', abort: true };
    };
    this.toggle = function() {
      return this.stopMove();
    };
    this.stopMove = function() {
      console.log('[jalousie] Stop move...');

      return { action: 'command', command: 'STOP' };
    };
  };
}

function TileTypeManager() {
	// Define the possible tile types
	const typeSpecifications = [
    {
      id: '05x05',
      width: 1,
      height: 1,
      styleClass: 'tile tile-1-1',
    },
    {
      id: '1x05',
      width: 2,
      height: 1,
      styleClass: 'tile tile-2-1',
    },
    {
      id: '05x1',
      width: 1,
      height: 2,
      styleClass: 'tile tile-1-2',
    },
    {
      id: '1x1',
      width: 2,
      height: 2,
      styleClass: 'tile tile-2-2',
      default: true,
    },
    {
      id: '1.5x1',
      width: 3,
      height: 2,
      styleClass: 'tile tile-3-2',
    },
    {
      id: '1x1.5',
      width: 2,
      height: 3,
      styleClass: 'tile tile-2-3',
    },
    {
      id: '2x1',
      width: 4,
      height: 2,
      styleClass: 'tile tile-4-2',
    },
    {
      id: '1x2',
      width: 2,
      height: 4,
      styleClass: 'tile tile-2-4',
    },
    {
      id: '2x2',
      width: 4,
      height: 4,
      styleClass: 'tile tile-4-4',
    }
	];

  this.typeIds = [];
	this.types = [];
	this.numberOfTypes = 0;
	for (var i = 0; i < typeSpecifications.length; i++) {
	  var typeSpecification = typeSpecifications[i];
//  for (var typeSpecification of typeSpecifications.values()) { // Only works in ECMAScript 6
    this[typeSpecification.id] = typeSpecification;
    this.typeIds.push(typeSpecification.id);
    this.types.push(typeSpecification);
    if (typeSpecification.default === true) {
      this.defaultTypeId = typeSpecification.id;
    }
    this.numberOfTypes++;
	}
//	this.typeIds = typeSpecifications.map(function(type) { return type.id; });
//  this.typeIds = typeSpecifications.map(t => t.id); // Only works in ECMAScript 6?
}
