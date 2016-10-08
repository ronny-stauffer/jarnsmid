angular.module('tiles', ['ionic'])

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

    activitySpecificationInterpreter.process($scope._activitySpecifications);

//    console.log('Tile Type IDs: ' + tileTypeManager.typeIds);

    var activityPresentationIds = [];
    for (var i = 0; i < $scope._activitySpecifications.length; i++) {
      var activitySpecification = $scope._activitySpecifications[i];
//      console.log('Activity: ' + activitySpecification.label + ', Presentation IDs: ' + activitySpecification.presentationIds);
      for (var j = 0; j < activitySpecification.presentationIds.length; j++) {
        var activityPresentationId = activitySpecification.presentationIds[j];
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

			  return fillTiles(field, activitySpecifications, state);
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

.directive('activityTile', function(templateManager, tileTypeManager) {
	return {
		restrict: 'E',
		//template: '<div class="activity-tile"/>',
		scope: { tile: '=', activity: '=' },
    link: function(scope, element, attributes) { // Called before template is evaluated
      //console.log('Element: ' + element);

      // Set style
      element.addClass(scope.tile.type.styleClass);
      element.css(scope.tile.getStyle());

      // Determine template
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
      var templatePath = templateManager.getTemplatePath(scope.activity.presentationIds, [ scope.tile.type.id, '1x1' ]);
//      console.log('Template to use: ' + templatePath);
      scope.templatePath = templatePath;

      // Set event handlers
      element.on('click', function(event) {
        console.log('Click on ' + scope.activity.label);

        scope.$apply(function() {
          scope.activity.status = !scope.activity.status;
        });

        console.log('Status: ' + scope.activity.status);
      });

      // Initialize activity status
      scope.activity.status = false;
    },
    template: '<div ng-include="templatePath"/>' // Doesn't work? <div ng-show="templateLoadingFailed">Error</div> Error: {{templateLoadingFailed}}
	}
})

.service('activitySpecificationInterpreter', ActivitySpecificationInterpreter)

.service('templateManager', TemplateManager)

.service('tileTypeManager', TileTypeManager);

function ActivitySpecificationInterpreter() {
  this.typeMappings = [
    { from: 'light', to: 'switch' },
    { from: 'domeLight', to: 'light' }
  ];

  this.resolve = function(type) {
    var types = [];

    while (type !== null) {
      types.push(type);
//      var mapping = this.typeMappings.find(function(typeMapping) { return typeMapping.from === type; }); // Only works in ECMAScript 6?
      var mapping = null;
      for (var i = 0; i < this.typeMappings.length; i++) {
        var _mapping = this.typeMappings[i];
        if (_mapping.from === type) {
          mapping = _mapping;
          break;
        }
      }
      if (mapping !== null && mapping.to !== undefined) {
        type = mapping.to;
      } else {
        type = null;
      }
    }

    return types;
  };

  this.process = function(activitySpecifications) {
    for (var i = 0; i < activitySpecifications.length; i++) {
      var activitySpecification = activitySpecifications[i];

      var presentationIds = [], behaviorIds = [];
      var activityType = activitySpecification.type;
      if (activityType !== undefined && typeof(activityType) === 'string' && activityType.length > 0) {
        var presentationId, behaviorId;
        var activityTypeParts = activityType.split('#');
        if (activityTypeParts.length > 1) {
          behaviorId = activityTypeParts[activityTypeParts.length - 1];
          presentationId = activityTypeParts[activityTypeParts.length - 2];
        } else {
          behaviorId = presentationId = activityTypeParts[0];
        }

//        console.log('Presentation ID: ' + presentationId + ', Behavior ID: ' + behaviorId);

        presentationIds = this.resolve(presentationId);
        behaviorIds = this.resolve(behaviorId);
      }

      activitySpecification.presentationIds = presentationIds;
      activitySpecification.behaviorIds = behaviorIds;
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

    console.log('Template Loading Promises Count: ' + templateLoadingPromises.length);

//    return $timeout(function() {
//        console.log('...done.');
//      }, 5000);
    return $q.all(templateLoadingPromises);
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
