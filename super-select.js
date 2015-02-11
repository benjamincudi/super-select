/**
	The MIT License (MIT)

	Copyright (c) 2015 Benjamin Garfield

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

'use strict';

/**
 * Filterable, styleable, angular replacement for the native <select> elm. Can be used as an elm,
 * or as an attribute (recommended for IE compatibility). Filtering matches on any property in the item
 * object, not just the title.
 *
 * <CONTAINER
 * Required parameters:
 * super-select="CONTROLLER-LIST-VARIABLE"   				Declared as elm and requires a controller-scope list to create from
 * ng-model="CONTROLLER-VARIABLE"						Controller-scope var to bind the value to
 * super-select-key="'key'"								String of the key with desired display value
 *
 * Optional parameters:
 * super-select-params="OBJECT"							JS Object of any optional parameters
 *
 * Available parameters for inclusion:
 * selectValue="'id'"									String of the key with desired form value
 * scopeBind="'scope-id'"						        Scope ID of the parent scope to pass click events through for closing
 * isRequired='CONTROLLER-BOOLEAN'						Controller-scope var for flag display state. Default: false
 * isFilterable='BOOLEAN'								Boolean for if filtering is enabled. Default: false
 * validateFunc='FUNCTION'								Function for validating the selected value (used with required). Returns a boolean.
 * ></CONTAINER>
 *
 *
 * TODO: Add support for flag to add 'onLeft' class to validation icon. CSS for this is already created.
 * TODO: Change SuperSelectKey to allow for static and optional
 * TODO: Accurate default validation for objects instead of strings
 * TODO: Add field restriction option for filtering
 * TODO: Add external filtering variable (e.g another select field value)
 * TODO: Unit test for verifying filtering applies to all fields
 */
angular.module('superSelect').directive('superSelect', function() {
	function link(scope, elm, attrs, ctrls) {
		var ngModel = ctrls[0],
			destroyer, initializer, listener, modelWatcher, parent, parentListener, watcher; // Subscriptions

		scope.selectModel = {
			filter: "",
			isOpen: false,
			isValid: false,
			selectedItem: {
				fullItem: '',
				title: '',
				val: ''
			},
			useFullObject: angular.isUndefined(scope.superSelectParams) || angular.isUndefined(scope.superSelectParams.selectValue)
		};

		function init() {
			// Handle ngModel delay in initial value availability
			initializer = scope.$watch(function(){
				return ngModel.$modelValue;
			},initValue);
			function initValue(value){
				scope.selectModel.selectedItem = value;
				ngModel.$setViewValue(value);
				initializer();
			}

			// Parse optional parameters
			if (angular.isDefined(scope.superSelectParams)) {
				if (angular.isString(scope.superSelectParams)) {
					try {
						scope.superSelectParams = JSON.parse(scope.superSelectParams);
					} catch (e) {
						console.error(e);
					}
				}
				if (angular.isUndefined(scope.superSelectParams.isRequired)) {
					scope.superSelectParams['isRequired'] = false;
				} else if (typeof(scope.superSelectParams.isRequired) === 'string') {
					// Interpret strings as boolean
					scope.superSelectParams.isRequired = (scope.superSelectParams.isRequired == 'true');
				}
				if (angular.isUndefined(scope.superSelectParams.isFilterable)) {
					scope.superSelectParams['isFilterable'] = false;
				} else if (typeof(scope.superSelectParams.isFilterable) === 'string') {
					// Interpret strings as boolean
					scope.superSelectParams.isFilterable = (scope.superSelectParams.isFilterable == 'true');
				}
				if (scope.superSelectParams.isRequired && (angular.isUndefined(scope.superSelectParams.validateFunc) || typeof(scope.superSelectParams.validateFunc) != 'function')) {
					scope.superSelectParams['validateFunc'] = function(){ return (scope.selectModel.selectedItem.val != ''); }
				}
			}

			// Register subscriptions
			destroyer = scope.$on('$destroy', cleanUp),
			watcher = scope.$watch('selectModel.selectedItem.val', selectValue),
			modelWatcher = scope.$watch(function(){return ngModel.$viewValue}, selectValue);

			if (angular.isDefined(scope.superSelectParams) && angular.isDefined(scope.superSelectParams.scopeBind)) {
				elm[0].addEventListener('click', clickControl);
				angular.forEach(angular.elm(document.getElementsByClassName('ng-scope')),function(v,k) {
					if (angular.elm(v).scope()['$id'] == scope.superSelectParams.scopeBind) {
						parent = v;
						parent.addEventListener('click', broadcaster);
						parentListener = angular.elm(parent).scope().$on('emittedClick', broadcaster);
					}
				});
				// TODO: Handle isolate scopes
				listener = scope.$on('broadcastedClick', clickHandler);
			}
		}

		scope.select = function(i) {
			scope.selectModel.selectedItem.fullItem = i;
			scope.selectModel.selectedItem.title = i[scope.superSelectKey];
			scope.selectModel.selectedItem.val = (scope.selectModel.useFullObject ? i : i[scope.superSelectParams.selectValue]);

			scope.expand();
		};
		scope.expand = function() {
			scope.selectModel.isOpen = !scope.selectModel.isOpen;
		};

		// Listener functions
        function selectValue(newVal, oldVal, scope) {
			if (newVal !== oldVal) {
				if (newVal !== scope.selectModel.selectedItem.val) {
					scope.selectModel.selectedItem.val = newVal;
				} else {
					ngModel.$setViewValue(newVal);
				}
			}
			if (angular.isDefined(scope.superSelectParams) && scope.superSelectParams.isRequired) {
				scope.selectModel.isValid = scope.superSelectParams.validateFunc();
			}
        }

		function clickControl(event) {
			event.stopPropagation(); // Contain the event to the select being interacted with
			var args = {scopeID: scope.$id};
			scope.$emit('emittedClick', args);
		}
		function broadcaster(event, args) {
			event.stopPropagation();
			var newArgs = {scopeID : event.currentScope ? event.currentScope.$id : angular.elm(parent).scope().$id};
			if (event.currentScope) { // Catching an emitted angular event
				if (args) {
					if (args.scopeID && args.scopeID != newArgs.scopeID) {
						angular.extend(newArgs, args);
					}
				}
				event.currentScope.$broadcast('broadcastedClick', newArgs);
			} else { // Catching a native JavaScript event
				if (args) {
					if (args.scopeID && args.scopeID != newArgs.scopeID) {
						angular.extend(newArgs, args);
					}
				}
				angular.elm(parent).scope().$broadcast('broadcastedClick', newArgs);
			}
		}
		function clickHandler(event, args) {
			if (args.scopeID
				&& args.scopeID != event.currentScope.$id
				&& event.currentScope.selectModel.isOpen) {
				event.currentScope.$apply(event.currentScope.selectModel.isOpen = false);
			}
		}
		// TODO: Handle modal's early destroy, which is preventing cleanup
		function cleanUp(){
			// Remove up all listeners
			if (angular.isDefined(scope.superSelectParams) && scope.superSelectParams.scopeBind) {
				elm[0].removeEventListener('click', clickControl);
				if (angular.isDefined(parent)) {
					parent.removeEventListener('click', broadcaster);
				}
				listener();
				parentListener();
			}
			watcher();
			destroyer();
		}

		init();
	}
	return {
		link: link,
		require: ['^ngModel'],
		restrict: 'AE',
		scope: {
			'superSelect': '=',
			'superSelectKey' : '=',
			'superSelectParams': '=?'
		},
	 	templateUrl: 'templates/superSelect/select.html'
	}
}).run(['$templateCache', function ($templateCache) {
	$templateCache.put('templates/superSelect/select.html',
		'<div class="superSelect">'
			+'<label ng-click="expand()"><span>{{selectModel.selectedItem.title}}</span><i class="fa" ng-class="{'+"'fa-caret-up'"+':selectModel.isOpen,'+"'fa-caret-down'"+':!selectModel.isOpen}"></i></label>'
			+'<div class="superSelectPanel" ng-show="selectModel.isOpen">'
				+'<div class="superSelectPanelWrapper">'
					+'<input type="text" class="superSelectFilter" ng-model="selectModel.filter" ng-show="superSelectParams.isFilterable" placeholder="Filter Choices..."/>'
					+'<ul class="superSelectOptions">'
						+'<li class="superSelectOpt" ng-repeat="item in superSelect | filter:selectModel.filter" ng-click="select(item)" ng-class="{selected:(selectModel.selectedItem.fullItem==item)}"><i class="fa fa-check"></i><p class="title">{{item[superSelectKey]}}</p></li>'
					+'</ul>'
				+'</div>'
			+'</div>'
		+'</div>'
		+'<i class="superSelectIsValid fa" ng-show="superSelectParams.isRequired" ng-class="{'+"'fa-check'"+':selectModel.isValid,'+"'fa-exclamation'"+':!selectModel.isValid}" title="Required Field"></i>'
		);
}]);
