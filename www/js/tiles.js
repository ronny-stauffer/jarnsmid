angular.module('tiles', ['ionic'])

.controller('tilesController', function($scope, $timeout, fieldFactory) {
//  var $scope.itemSpecifications = [
//    { name: 'lichtGarten', type: 'light', label: 'Gartenbeleuchtung', tileSize: '1x1' },
//    { name: 'lichtWZ', type: 'light', label: 'Licht Wohnzimmer', tileSize: '2x2' },
//  ];

  // Reference to the field factory
  $scope.fieldFactory = fieldFactory;

  // An array that holds the fields with the tiles (= the model which is bound to the view)
  $scope.fields = [];

  // A placeholder for some images
//  $scope.images = [];

  $scope.itemSpecifications = function(itemSpecifications) {
    $scope._itemSpecifications = itemSpecifications;
  };

  // Creates a new field with tiles
  $scope.createField = function() {
    $scope.fields.push($scope.fieldFactory.createFieldOfTiles(5, 10, $scope._itemSpecifications));
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

  // Loads a newly/ an additional field with the size of 4 x 4 slots
  $scope.loadMore = function() {
    $timeout(function(){
//      for (var i = 0; i < 10; i++) {
//        $scope.images.push($scope.images.length + 1);
//      }
      $scope.createField();
    }, 2000);
  };

  // Refreshes
  $scope.refresh = function() {
    // Empty the fields array to re-fill it
    $scope.fields = [];
    // Reset the images array
//    $scope.images = [];
    // Reset the number of totalTiles
    $scope.fieldFactory.totalTiles = 0;
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
    // Load 10 new images
    $scope.loadMore();
  };

  // Initially add some products
  $scope.loadMore(); // Executed initially
})

.factory('fieldFactory', function() {
	var fieldFactory = {};

	// Specifies how many tiles are totally available
	fieldFactory.totalTiles = 0;

	// Function to create a field that is filled with tiles
	fieldFactory.createFieldOfTiles = function(width, height, itemSpecifications) {
	  console.log('itemSpecifications: ' + itemSpecifications);

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

    // Fill tiles into the field
		var filledField = fillTiles(emptyField, itemSpecifications);
		// Transform the field
		var transformedField = transformField(filledField);

    transformedField.getStyle = function() {
      style = {
        width: '100%',
        'padding-bottom': 100 / width * height + '%'
      }

      return style;
    };

		return transformedField;
	}

	// Function to recursivly fill the field by trying to fit a randomly chosen tile into it
	function fillTiles(field, itemSpecifications) {
	  var abort = false;

		// Get the anchor for the next tile
		var nextAnchor = getNextAnchor(field);

		// Continue filling the field if it is not filled already
		if (nextAnchor !== null) {
		  var tileType;
		  var randomType = false;
		  //console.log('itemSpecifications: ' + itemSpecifications);
		  if (itemSpecifications !== undefined) {
		    var itemSpecification = itemSpecifications[fieldFactory.totalTiles];
		    if (itemSpecification !== undefined) {
		      if (itemSpecification.tileSize !== undefined) {
            //console.log('itemSpecification.tileSize: ' + itemSpecification.tileSize);
            //tileType = tileTypes.find(function(type) { return type.id === '2x2' });
            for (var i = 0; i < tileTypes.length; i++) {
              console.log("tileTypes[...].id: " + tileTypes[i].id);
              if (tileTypes[i].id === itemSpecification.tileSize) {
                tileType = tileTypes[i];
                console.log("tileType: " + tileType);
                break;
              }
            }
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
	  		tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
	  		randomType = true;
	  	}

      if (!abort) {
        // Check if the tile will fit into the field
        if (checkFitting(field, tileType, nextAnchor[1], nextAnchor[0])) {
          placeTile(field, tileType, nextAnchor[1], nextAnchor[0]);
          // Increase the tileCounter as soon as the tile has been added
          fieldFactory.totalTiles++;
        } else if (!randomType) {
          abort = true;
        }

			  return fillTiles(field, itemSpecifications);
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

		// Return null if no field is free => Field is full
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
	function placeTile(field, tileType, x, y) {
		// Fill the field on the X-Axis
		for (var i = 0; i < tileType.width; i++) {
			// Fill the field down the Y-Axis for every field on the X-Axis
			for (var j = 0; j < tileType.height; j++) {
				if (field[y + j][x + i] == null) {
					var tile = {
						anchorX: x,
						anchorY: y,
						type: tileType,
						//TODO Rename to 'id'?
						count: fieldFactory.totalTiles
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

	// Define the possible tile types
	const tileTypes = [
    {
      id: '1x1',
      width: 1,
      height: 1,
      styleClass: 'tile tile-1-1',
    },
    {
      id: '2x1',
      width: 2,
      height: 1,
      styleClass: 'tile tile-2-1',
    },
    {
      id: '1x2',
      width: 1,
      height: 2,
      styleClass: 'tile tile-1-2',
    },
    {
      id: '2x2',
      width: 2,
      height: 2,
      styleClass: 'tile tile-2-2',
    },
    {
      id: '3x2',
      width: 3,
      height: 2,
      styleClass: 'tile tile-3-2',
    },
    {
      id: '2x3',
      width: 2,
      height: 3,
      styleClass: 'tile tile-2-3',
    },
    {
      id: '4x2',
      width: 4,
      height: 2,
      styleClass: 'tile tile-4-2',
    },
    {
      id: '2x4',
      width: 2,
      height: 4,
      styleClass: 'tile tile-2-4',
    },
    {
      id: '4x4',
      width: 4,
      height: 4,
      styleClass: 'tile tile-4-4',
    }
	];

	return fieldFactory;
})

.directive('imageTile', function() {
	return {
		restrict: 'E',
		template: '<div class="inner"></div>',
		scope: { image: '=' },
    link: function(scope, element, attributes) {
//      var images = [
//        'http://lorempixel.com/g/400/400/sports/1/',
//        'http://lorempixel.com/g/400/400/sports/2/',
//        'http://lorempixel.com/g/400/400/sports/3/',
//        'http://lorempixel.com/g/400/400/sports/4/',
//        'http://lorempixel.com/g/400/400/sports/5/',
//        'http://lorempixel.com/g/400/400/sports/6/',
//        'http://lorempixel.com/g/400/400/sports/7/',
//        'http://lorempixel.com/g/400/400/sports/8/',
//        'http://lorempixel.com/g/400/400/sports/9/',
//        'http://lorempixel.com/g/400/400/cats/1/',
//        'http://lorempixel.com/g/400/400/cats/2/',
//        'http://lorempixel.com/g/400/400/cats/3/',
//        'http://lorempixel.com/g/400/400/cats/4/',
//        'http://lorempixel.com/g/400/400/cats/5/',
//        'http://lorempixel.com/g/400/400/cats/6/',
//        'http://lorempixel.com/g/400/400/cats/7/',
//        'http://lorempixel.com/g/400/400/cats/8/',
//        'http://lorempixel.com/g/400/400/cats/9/',
//        'http://lorempixel.com/g/400/400/fashion/1/',
//        'http://lorempixel.com/g/400/400/fashion/2/',
//        'http://lorempixel.com/g/400/400/fashion/3/',
//        'http://lorempixel.com/g/400/400/fashion/4/',
//        'http://lorempixel.com/g/400/400/fashion/5/',
//        'http://lorempixel.com/g/400/400/fashion/6/',
//        'http://lorempixel.com/g/400/400/fashion/7/',
//        'http://lorempixel.com/g/400/400/fashion/8/',
//        'http://lorempixel.com/g/400/400/fashion/9/'
//      ];
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

			if (scope.image !== undefined) { // May be the case if the attribute 'image' of the 'product-tile' element is not specified
//				console.log('scope.image: ' + scope.image + ' imageUrls[...]: ' + imageUrls[scope.image])

				var image = new Image();
				image.onload = function() {
          element.css({
            'background-image': 'url(' + imageUrls[scope.image] + ')',
            'opacity': '1'
          });
				}
				image.src = imageUrls[scope.image]; // Meaning? Triggers onload()?

				attributes.$set('ngClick', 'onImageClick()');

        scope.onImageClick = function() { // Doesn't work right now?!
          console.log("Click!");
        };
			}
		}
	}
});
