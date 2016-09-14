angular.module('tiles', ['ionic'])

.controller('tilesController', function($scope, $timeout, fieldFactory) {
  // Reference to the image tiles factory
  $scope.fieldFactory = fieldFactory;

  // An array that holds the field with the tiles
  $scope.data = [];

  // A placeholder for some images
//  $scope.images = [];

  // Fucntion to add a new field with tiles
  $scope.createField = function() {
    $scope.data.push($scope.fieldFactory.createFieldOfTiles());
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  // Function to return the styling (with the position) for a tile
  $scope.createTileStyle = function(tile) {
    style = {
      left: tile.anchorX * 25 + '%',
      top: tile.anchorY * 25 + '%'
    }
    return style;
  };

  // Dummy function to add 10 new images
  $scope.loadMoreImages = function() {
    $timeout(function(){
//      for (var i = 0; i < 10; i++) {
//        $scope.images.push($scope.images.length + 1);
//      }
      $scope.createField();
    }, 2000);
  };

  // Function to refresh the list of images
  $scope.refreshImages = function() {
    // Empty the tiles array to re-fill it
    $scope.data = [];
    // Reset the number of totalTiles
    // Reset the images array
//    $scope.images = [];
    $scope.fieldFactory.totalTiles = 0;
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
    // Load 10 new images
    $scope.loadMoreImages();
  };

  // Initially add some products
  $scope.loadMoreImages(); // Executed initially
})

.factory('fieldFactory', function() {
	// Define the possible tile types
	const tileTypes = [
    {
      width: 1,
      height: 1,
      class: 'tile tile-1-1',
      id: 0
    },
    {
      width: 2,
      height: 1,
      class: 'tile tile-2-1',
      id: 1
    },
    {
      width: 1,
      height: 2,
      class: 'tile tile-1-2',
      id: 2
    },
    {
      width: 2,
      height: 2,
      class: 'tile tile-2-2',
      id: 3
    },
    {
      width: 3,
      height: 2,
      class: 'tile tile-3-2',
      id: 4
    },
    {
      width: 2,
      height: 3,
      class: 'tile tile-2-3',
      id: 5
    },
    {
      width: 4,
      height: 2,
      class: 'tile tile-4-2',
      id: 6
    },
    {
      width: 2,
      height: 4,
      class: 'tile tile-2-4',
      id: 7
    },
    {
      width: 4,
      height: 4,
      class: 'tile tile-4-4',
      id: 8
    }
	];

	var fieldFactory = {};

	// Specifies how many tiles are totally available
	fieldFactory.totalTiles = 0;

	// Function to create a field that is filled with tiles
	fieldFactory.createFieldOfTiles = function() {
		// Create an empty field
		var emptyField = [
			[null, null, null, null],
			[null, null, null, null],
			[null, null, null, null],
			[null, null, null, null]
		];

    // Fill tiles into the field
		var filledField = fillTiles(emptyField);
		// Transform the field
		var transformedField = transformField(filledField);

		return transformedField;
	}

	// Function to recursivly fill the field by trying to fit a randomly chosen tile into it
	function fillTiles(field) {
		// Get the anchor for the next tile
		var nextAnchor = getNextAnchor(field);

		// Continue filling the field if it is not filled already
		if (nextAnchor !== null) {
			// Randomly pick a tile
			var randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];

			// Check if the tile will fit into the field
			if (checkFitting(field, randomTile, nextAnchor[1], nextAnchor[0])) {
				placeTile(field, randomTile, nextAnchor[1], nextAnchor[0]);
				// Increase the tileCounter as soon as the tile has been added
				fieldFactory.totalTiles++;
			}

			return fillTiles(field);
		} else {
			return field;
		}
	}

	// Function to get the next anchor point of a field
	function getNextAnchor(field) {
		// Check the field for a free field (from right to left from top to down)
		for (var i=0; i<field.length; i++) {
			for (var j=0; j<field[i].length; j++) {
				if (field[i][j] === null) {
					return [i,j];
				}
			}
		}
		//Return null if no field is free => Field is full
		return null;
	}

	// Function to check whether the tile will fit into the field at the anchor point
	function checkFitting(field, tile, x, y) {
		// Check if the tile will fit into the field
		for (var i = 0; i < tile.width; i++) {
			// Fill the field down the Y-Axis for every field on the X-Axis
			for (var j = 0; j < tile.height; j++) {
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

	// Function to place the tile at the desired anchor point
	function placeTile(field, tile, x, y) {
		// Fill the field on the X-Axis
		for (var i = 0; i < tile.width; i++) {
			// Fill the field down the Y-Axis for every field on the X-Axis
			for (var j = 0; j < tile.height; j++) {
				if (field[y + j][x + i] == null) {
					field[y + j][x + i] = {
						anchorX: x,
						anchorY: y,
						tile: tile,
						count: fieldFactory.totalTiles
					}
				} else {
					return false
				}
			}
		}

		return true;
	}

	// Function to transform the 2 dimensional array of the field
	// into a 1 dimensional array of the fields/tiles
	function transformField(field) {
		var transformedField = [];

		// An internal counter to compare with the tileCounter of a field
		var count = -1;

		// Loop through the field
		for (var i = 0; i < field.length; i++) {
			for (var j = 0; j < field[i].length; j++) {
				// Check if the tile has already been added
				// by comparing the internal counter with the tileCounter of the field
				if (field[i][j].count > count) {
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
		scope: { image: '=' },
		restrict: 'E',
		template: '<div class="inner"></div>',
    link: function(scope, element) {
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
				var img = new Image();
				img.onload = function(){
          element.css({
            'background-image': 'url(' + imageUrls[scope.image] + ')',
            'opacity': '1'
          });
				}

				console.log('scope.image: ' + scope.image + ' imageUrls[...]: ' + imageUrls[scope.image])

				img.src = imageUrls[scope.image];
			}
		}
	}
});
