/*
 * greenbus-web-views
 * https://github.com/gec/greenbus-web-views

 * Version: 0.1.0-SNAPSHOT - 2014-12-08
 * License: Apache Version 2.0
 */
angular.module("greenbus.views", ["greenbus.views.tpls", "greenbus.views.authentication","greenbus.views.endpoint","greenbus.views.ess","greenbus.views.event","greenbus.views.measurement","greenbus.views.navigation","greenbus.views.request","greenbus.views.rest","greenbus.views.subscription"]);
angular.module("greenbus.views.tpls", ["template/endpoint/endpoints.html","template/ess/esses.html","template/event/alarms.html","template/event/events.html","template/measurement/measurements.html","template/navigation/navBarTop.html","template/navigation/navList.html"]);
/**
* Copyright 2013-2014 Green Energy Corp.
*
* Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
* contributor license agreements. See the NOTICE file distributed with this
* work for additional information regarding copyright ownership. Green Energy
* Corp licenses this file to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*
* Author: Flint O'Brien
*/

angular.module('greenbus.views.authentication', ['ngCookies', 'ui.bootstrap', 'ui.keypress']).

  factory('authentication', [ '$rootScope', '$timeout', '$http', '$location', '$cookies', '$window', function( $rootScope, $timeout, $http, $location, $cookies, $window){

    var self = this;


    var STATE = {
      NOT_LOGGED_IN: 'Not logged in',
      LOGIN_FAILED: 'Login failed',
      LOGGING_IN: 'Logging in...',
      LOGGED_IN: 'Logged in'
    }

    var status = {
      status: STATE.NOT_LOGGED_IN,
      reinitializing: true,
      message: ''
    }
    console.log( 'status = ' + status.status)

    var httpConfig = {
      cache: false,
      timeout: 10000 // milliseconds
    }


    var authTokenName = 'coralAuthToken'
    var authToken = $cookies[authTokenName];
    if( authToken && authToken.length > 5) {
      console.log( 'found ' + authTokenName + '=' + authToken)
      // Let's assume, for now, that we already logged in and have a valid authToken.
      setStatus( {
        status: STATE.LOGGED_IN,
        reinitializing: false
      })

    } else {
      console.log( 'no ' + authTokenName)
    }


    function setStatus( s) {
      status = s
      console.log( 'setStatus: ' + status.status)
      $rootScope.$broadcast( 'authentication.status', status);
    }

    function getLoginUri( redirectAfterLogin) {
      if( redirectAfterLogin && redirectAfterLogin.length > 1)
        return '/login?redirectAfterLogin=' + encodeURIComponent( redirectAfterLogin)
      else
        return '/login'
    }


    /**
     * Public API
     */
    return {

      STATE: STATE, // publish STATE enum


      getStatus: function() {
        return status;
      },


      login: function( userName, password, redirectLocation, errorListener) {
        //console.log( 'reef.login ' + userName)
        var data = {
          'userName': userName,
          'password': password
        }
        $http.post( '/login', data).
          success(function(json) {
            //console.log( '/login response: ' + json)
            if( json.error) {
              // Shouldn't get here because should have an HTTP error code for error() or 401 interceptor.
              if( errorListener)
                errorListener( json.error)
            } else {
              authToken = json[authTokenName];
              console.log( 'login successful with ' + authTokenName + '=' + authToken)
              setStatus( {
                status: STATE.LOGGED_IN,
                reinitializing: false,
                message: ''
              })
              $cookies[authTokenName] = authToken
              $cookies.userName = userName
              console.log( 'login success, setting cookie, redirectLocation: "/#' + redirectLocation + '"')
              if( redirectLocation)
                $window.location.href = '/#' + redirectLocation
              else
                $window.location.href = '/#/entity'
            }
          }).
          error(function (json, statusCode, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with status
            // code outside of the <200, 400) range
            console.log( 'reef.login error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify( json));
            var message = json && json.error && json.error.description || 'Unknown login failure';
            if( statusCode === 0) {
              message =  'Application server is not responding. Your network connection is down or the application server appears to be down.';
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: message
              });
            } else {
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: message
              });
            }
            if( errorListener)
              errorListener( message)
          });
      },

      logout: function( errorListener) {
        console.log( 'reef.logout')
        httpConfig.headers = {'Authorization': authToken}
        $http['delete']( '/login', httpConfig).  // delete is ECMASCRIPT5
          success(function(json) {
            if( json.error) {
              // Shouldn't get here.
              console.error( 'logout error: ' + json)
              if( errorListener)
                errorListener( json.error)
            } else {
              console.log( 'logout successful')
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: ''
              })
              authToken = null
              delete $cookies[authTokenName]
              $window.location.href = '/login'
            }
          }).
          error(function (json, statusCode, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with status
            // code outside of the <200, 400) range
            console.log( 'reef.logout error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify( json));
            var message = json && json.error && json.error.description || 'Unknown login failure';
            if( statusCode === 0) {
              message =  'Application server is not responding. Your network connection is down or the application server appears to be down.';
              setStatus( {
                status: 'APPLICATION_SERVER_DOWN',
                reinitializing: false,
                message: message
              });
            } else {
              setStatus( {
                status: 'APPLICATION_REQUEST_FAILURE',
                reinitializing: false,
                message: message
              });
            }
            if( errorListener)
              errorListener( message)
          });
      },


      isLoggedIn: function() {
        return !!( authToken && status.status !== STATE.NOT_LOGGED_IN)
      },

      redirectToLoginPage: function( redirectAfterLogin) {
        console.log( 'AuthenticationService.redirectToLoginPage( redirectAfterLogin = ' + redirectAfterLogin + ')')
        authToken = null
        console.log( 'redirectToLoginPage window.location.href = /login')
        $window.location.href = getLoginUri( redirectAfterLogin)
      },

      getHttpHeaders: function() {
        if( authToken)
          return {'Authorization': authToken}
        else
          return {}
      },

      getAuthToken: function() {
        return authToken
      }

    } // return public API




  }] ). // end factory authentication

  // This http interceptor listens for authentication failures
  factory('authenticationInterceptor', ['$location', '$injector', function($location, $injector) {
    return function(promise) {
      // Intercept failed requests
      return promise.then(null, function(originalResponse) {
        if(originalResponse.status === 401) {

          var redirectLocation = $location.path(); // or $location.url() ?
          console.log( 'authenticationInterceptor: redirectLocation 1 =' + redirectLocation)


          // If we're already on the login page, we don't redirect on failed login.
          if( redirectLocation.indexOf( '/login') !== 0){

            var authentication = $injector.get('authentication')
            authentication.redirectToLoginPage( redirectLocation)
          }

          /*
           // The request bounced because it was not authorized - add a new request to the retry queue
           promise = queue.pushRetryFn('unauthorized-server', function retryRequest() {
           // We must use $injector to get the $http service to prevent circular dependency
           return $injector.get('$http')(originalResponse.config);
           });
           */
        }
        return promise;
      });
    };
  }] ).

  // We have to add the interceptor to the queue as a string because the interceptor depends upon service instances that are not available in the config block.
  config(['$httpProvider', function($httpProvider) {
    $httpProvider.responseInterceptors.push('authenticationInterceptor');
  }] ).


  // The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
  // This controller and its template (partials/login.html) are used in a modal dialog box by the authentication service.
  // $modal is from ui-bootstrap
  controller('LoginController', ['$scope', 'authentication', '$modal', function($scope, authentication, $modal) {

    $scope.error = undefined
    $scope.status = authentication.getStatus()
    $scope.userName = ''
    $scope.password = ''
    var mainScope = $scope

    function errorListener( description) {
      $scope.error = description
      openDialog()
    }


    // the dialog is injected in the specified controller
    var ModalController = ['$scope', '$modalInstance', 'userName', 'password', 'error', function($scope, $modalInstance, userName, password, error){
      // private scope just for this controller.
      $scope.userName = userName
      $scope.password = password
      $scope.error = error
      $scope.login = function(){
        // Can only pass one argument.
        // Angular-UI is not right. 'this' is where the scope variables are.
        $modalInstance.close( {userName: this.userName, password: this.password});   // calls then()
      };
    }]


    function openDialog(){
      var modalOptions = {
        backdrop: 'static', // don't close when clicking outside of model.
        keyboard: false, // escape does not close dialog
        templateUrl:  'authentication-login-modal.html',
        controller: ModalController,
        resolve: {
          // Pass these to ModalController
          error: function(){ return angular.copy( $scope.error) },  //TODO: Does this still need copy?
          userName: function(){ return angular.copy( $scope.userName) },
          password: function(){ return angular.copy( $scope.password) }
        }
      };
      var d = $modal.open( modalOptions);
      d.result.then(function( result) {
        // Save the result to the main scope
        mainScope.userName = result.userName
        mainScope.password = result.password
        authentication.login( result.userName, result.password, null, errorListener);
      });
    }

    $scope.openDialog = openDialog
    openDialog()

  }] ).

  controller('LogoutController', ['$scope', 'authentication', function($scope, authentication) {
    authentication.logout();
  }]);

/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 *
 */



angular.module('greenbus.views.endpoint', ['greenbus.views.rest', 'greenbus.views.subscription']).

  controller( 'gbEndpointsController', ['$scope', 'rest', 'subscription', function( $scope, rest, subscription) {
    $scope.endpoints = []

    var CommStatusNames = {
      COMMS_DOWN: 'Down',
      COMMS_UP: 'Up',
      ERROR: 'Error',
      UNKNOWN: 'Unknown'
    }

    function findEndpointIndex( id) {
      var i, endpoint,
          length = $scope.endpoints.length

      for( i = 0; i < length; i++) {
        endpoint = $scope.endpoints[i]
        if( endpoint.id === id)
          return i
      }
      return -1
    }
    function findEndpoint( id) {

      var index = findEndpointIndex( id)
      if( index >= 0)
        return $scope.endpoints[index]
      else
        return null
    }



    function getCommStatus( commStatus) {
      var status = CommStatusNames.UNKNOWN,
          lastHeartbeat = 0
      if( commStatus) {
        var statusValue = commStatus.status || 'UNKNOWN'
        status = CommStatusNames[statusValue]
        lastHeartbeat = commStatus.lastHeartbeat || 0
      }
      return { status: status, lastHeartbeat: lastHeartbeat}
    }
    function updateEndpoint( update) {
      var endpoint = findEndpoint( update.id)
      if( endpoint) {
        if( update.hasOwnProperty( 'name'))
          endpoint.name = update.name
        if( update.hasOwnProperty( 'protocol'))
          endpoint.protocol = update.protocol
        if( update.hasOwnProperty( 'enabled'))
          endpoint.enabled = update.enabled
        if( update.hasOwnProperty( 'commStatus')) {
          endpoint.commStatus = getCommStatus( update.commStatus)
        }
      }
    }
    function removeEndpoint( id) {
      var index = findEndpointIndex( id)
      if( index >= 0)
        return $scope.endpoints.splice(index,1)
    }

    function messageEndpoints( endpoints) {
      endpoints.forEach( function( endpoint) {
        updateEndpoint( endpoint)
      })
    }

    function messageEndpoint( endpointNotification) {
      var ep = endpointNotification.endpoint
      switch( endpointNotification.eventType) {
        case 'ADDED':
          ep.commStatus = getCommStatus( ep.commStatus)
          $scope.endpoints.push( ep)
          break;
        case 'MODIFIED':
          updateEndpoint( endpointNotification.endpoint)
          break;
        case 'REMOVED':
          removeEndpoint( endpointNotification.endpoint)
          break;
      }
    }

    rest.get( '/models/1/endpoints', 'endpoints', $scope, function(data){
      var endpointIds = data.map( function(endpoint){ return endpoint.id})
      $scope.endpoints.forEach( function(endpoint){
        endpoint.commStatus = getCommStatus( endpoint.commStatus)
      })
      subscription.subscribe(
        {subscribeToEndpoints: {'endpointIds': endpointIds}},
        $scope,
        function( subscriptionId, messageType, endpointNotification){
          switch( messageType) {
            case 'endpoints': messageEndpoints( endpointNotification); break; // subscription return.
            case 'endpoint': messageEndpoint( endpointNotification); break;   // subscribe push
            default:
              console.error( 'EndpointController.subscription unknown message type "' + messageType + '"')
          }
          $scope.$digest()
        },
        function( messageError, message){
          console.error( 'EndpointController.subscription error: ' + messageError)
        })

    });
  }]).

  directive( 'gbEndpoints', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/endpoint/endpoints.html',
      controller: 'gbEndpointsController'
    }
  }).
  filter('gbCommStatusIcon', function() {
    function getCss( enabled, statusString) {
      if( enabled)
        return 'gb-comms-enabled-' + statusString
      else
        return 'gb-comms-disabled-' + statusString
    }
    return function(status, enabled) {
      var klass
      switch( status) {
        case 'Up': klass = 'glyphicon glyphicon-arrow-up ' + getCss( enabled, 'up'); break;
        case 'Down': klass = 'glyphicon glyphicon-arrow-down ' + getCss( enabled, 'down'); break;
        case 'Error': klass = 'glyphicon glyphicon-exclamation-sign ' + getCss( enabled, 'error'); break;
        case 'Unknown': klass = 'glyphicon glyphicon-question-sign ' + getCss( enabled, 'unknown'); break;
        default:
          klass = 'glyphicon glyphicon-question-sign ' + getCss( enabled, 'unknown');
      }
      return klass
    };
  });


/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.ess', ['greenbus.views.measurement', 'greenbus.views.navigation', 'greenbus.views.rest']).
  
  controller( 'gbEssesController', ['$scope', '$filter', 'rest', 'measurement', '$location', function( $scope, $filter, rest, measurement, $location) {
    $scope.ceses = []     // our mappings of data from the server
    $scope.equipment = [] // from the server. TODO this should not be scope, but get assigns to scope.
    $scope.searchText = ''
    $scope.sortColumn = 'name'
    $scope.reverse = false
    var pointIdToInfoMap = {},
        searchArgs = $location.search(),
        sourceUrl = searchArgs.sourceUrl || null

    var number = $filter('number')
    function formatNumberValue( value) {
      if ( typeof value == 'boolean' || isNaN( value) || !isFinite(value) || value === '') {
        return value
      } else {
        return number( value, 0)
      }
    }
    function formatNumberNoDecimal( value) {
      if ( typeof value == 'boolean' || isNaN( value) || !isFinite(value) || value === '')
        return value

//      if( typeof value.indexOf === 'function') {
//        var decimalIndex = value.indexOf('.')
//        value = value.substring( 0, decimalIndex)
//      } else {
//        value = Math.round( parseFloat( value))
//      }
      value = Math.round( parseFloat( value))

      return value
    }

    $scope.findPoint = function( id) {
      $scope.ceses.forEach( function( point) {
        if( id == point.id)
          return point
      })
      return null
    }

    function getValueWithinRange( value, min, max) {
      if( value < min)
        value = min
      else if( value > max)
        value = max
      return value
    }

    function processValue( info, measurement) {
      var value = measurement.value
//        if( measurement.name.indexOf( 'PowerHub') >= 0)
//            console.log( 'gbEssesController.processValue measurement ' + measurement.name + ', value:"'+measurement.value+'"' + ' info.type: ' + info.type)
//        if( measurement.name.indexOf( 'Sunverge') >= 0)
//            console.log( 'gbEssesController.processValue measurement ' + measurement.name + ', value:"'+measurement.value+'"' + ' info.type: ' + info.type)

      switch (info.type) {
        case '%SOC':
          value = formatNumberNoDecimal( value);
          break;
        case 'CapacityEnergy':
        case 'CapacityPower':
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        case 'Charging':
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        default:
      }
      return value
    }

    // Return standby, charging, or discharging
    function getState( ess) {
      if( ess.Standby === 'OffAvailable' || ess.Standby === 'true')
        return 'standby'
      else if( typeof ess.Charging == 'boolean')
        return ess.Charging ? 'charging' : 'discharging';
      else if( typeof ess.Charging.indexOf === 'function' && ess.Charging.indexOf('-') >= 0) // has minus sign, so it's charging
        return 'charging'
      else
        return 'discharging'

    }

    //function makeCes( eq, capacityUnit) {
    function makeCes( eq) {
      return {
        name: eq.name,
        CapacityEnergy: '',
        CapacityPower: '',
        Standby: '',
        Charging: '',
        '%SOC': '',
        percentSocMax100: 0, // Used by batter symbol
        standbyOrOnline: '', // 'Standby', 'Online'
        state: 's'    // 'standby', 'charging', 'discharging'
      }
    }

    var POINT_TYPES =  ['%SOC', 'Charging', 'Standby', 'CapacityEnergy', 'CapacityPower']
    function getInterestingType( types) {
      for( var index = types.length-1; index >= 0; index--) {
        var typ = types[index]
        switch( typ) {
          case '%SOC':
          case 'Charging':
          case 'Standby':
//                case 'Capacity':
          case 'CapacityPower': // kW
          case 'CapacityEnergy': // kWh
            return typ
          default:
        }
      }
      return null
    }
    function getPointByType( points, typ ) {
      for( var index = points.length-1; index >= 0; index-- ) {
        var point = points[index]
        if( point.types.indexOf( typ) >= 0)
          return point
      }
      return null
    }

    function onMeasurement( pm) {
      var info = pointIdToInfoMap[ pm.point.id]
      if( info){
        console.log( 'gbEssController.onMeasurement ' + pm.point.id + ' "' + pm.measurement.value + '"')
        // Map the point.name to the standard types (i.e. capacity, standby, charging)
        var value = processValue( info, pm.measurement)
        if( info.type == 'Standby') {
          if( value === 'OffAvailable' || value === 'true')
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Standby'
          else
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Online'
        } else if( info.type == '%SOC') {
          $scope.ceses[ info.cesIndex].percentSocMax100 = Math.min( value, 100)
        }
        $scope.ceses[ info.cesIndex][info.type] = value
        $scope.ceses[ info.cesIndex].state = getState( $scope.ceses[ info.cesIndex])

      } else {
        console.error( 'gbEssesController.onMeasurement could not find point.id = ' + pm.point.id)
      }
    }

    function onMeasurements( measurements ) {
      measurements.forEach( function( pm){ onMeasurement( pm) })
      $scope.$digest()
    }

    function subscribeToMeasurements( pointIds) {
      measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
    }


    // Called after get sourceUrl is successful
    function getEquipmentListener( ) {
      var cesIndex, pointsUrl,
          pointIds = [],
          pointTypesQueryString = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES),
          equipmentIdMap = {},
          equipmentIds = [],
          equipmentIdsQueryString = ''

      $scope.equipment.forEach( function( eq) {
        equipmentIdMap[eq.id] = eq
        equipmentIds.push( eq.id)
      })
      equipmentIdsQueryString = rest.queryParameterFromArrayOrString( 'equipmentIds', equipmentIds)


      pointsUrl = '/models/1/points?' + equipmentIdsQueryString // TODO: include when fixed! + '&' + pointTypesQueryString
      rest.get( pointsUrl, 'points', $scope, function( data) {
        var sampleData = {
          'e57170fd-2a13-4420-97ab-d1c0921cf60d': [
            {
              'name': 'MG1.CES1.ModeStndby',
              'id': 'fa9bd9a1-5ad1-4c20-b019-261cb69d0a39',
              'types': ['Point', 'Standby']
            },
            {
              'name': 'MG1.CES1.CapacitykWh',
              'id': '585b3e36-1826-4d7b-b538-d2bb71451d76',
              'types': ['CapacityEnergy', 'Point']
            },
            {
              'name': 'MG1.CES1.ChgDischgRate',
              'id': 'ec7d6f06-e627-44d2-9bb9-530541fdcdfd',
              'types': ['Charging', 'Point']
            }
          ]}

        equipmentIds.forEach( function( eqId) {
          var point,
              points = data[eqId],
              cesIndex = $scope.ceses.length

          if( points) {
            POINT_TYPES.forEach( function( typ) {
              point = getPointByType( points, typ)
              if( point) {
                console.log( 'gbEssesController.getEquipmentListener point: name=' + point.name + ', types = ' + point.types)
                pointIdToInfoMap[point.id] = {
                  'cesIndex': cesIndex,
                  'type': getInterestingType( point.types),
                  'unit': point.unit
                }
                pointIds.push( point.id)
              } else {
                console.error( 'gbEssesController.getEquipmentListener  GET /models/n/points entity[' + eqId + '] does not have point with type ' + typ)
              }

            })
            $scope.ceses.push( makeCes( equipmentIdMap[eqId]))
          } else {
            console.error( 'gbEssesController.getEquipmentListener  GET /models/n/points did not return UUID=' + eqId)
          }
        })

        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
      })

    }

    var eqTypes = rest.queryParameterFromArrayOrString( 'eqTypes', ['CES', 'DESS'])
    var pointTypes = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES)
    var url = '/equipmentwithpointsbytype?' + eqTypes + '&' + pointTypes
//    reef.get( url, 'equipment', $scope, $scope.getSuccessListener);
    rest.get( sourceUrl, 'equipment', $scope, getEquipmentListener);
  }]).


  directive( 'gbEsses', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/ess/esses.html',
      controller: 'gbEssesController'
    }
  }).

  filter('essStateIcon', function() {
    return function(state) {
      if( state === 'standby')
        return '/images/essStandby29x16.png'
      else if( state === 'charging')
        return '/images/essCharging29x16.png'
      else if( state === 'discharging')
        return '/images/essDischarging29x16.png'
      else
        return ''
    };
  }).
  filter('essStateDescription', function() {
    return function(state) {
      return state + ' state';
    };
  }).
  filter('essBatterySocChargedClass', function() {
    return function(soc, state) {
      var classes = ( soc > 10 ) ? 'battery-soc charged' : 'battery-soc charged alarmed'
      if( state === 'standby' )
        classes += ' standby'
      return classes
    };
  }).
  filter('essBatterySocUnchargedClass', function() {
    return function(soc, state) {
      var classes = null
      if( soc === null || soc === '' )
        classes = 'battery-soc unknown'
      else if( soc > 10 )
        classes = 'battery-soc uncharged'
      else
        classes = 'battery-soc uncharged alarmed'

      if( state === 'standby')
        classes += ' standby'

      return classes
    };
  })


/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 *
 */



angular.module('greenbus.views.event', ['greenbus.views.subscription']).

  controller('gbAlarmsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
    $scope.loading = true
    $scope.alarms = []
    $scope.limit = Number( $attrs.limit || 20);

    function onAlarm( subscriptionId, type, alarm) {
      if( angular.isArray( alarm)) {
        console.log( 'alarmService onAlarm length=' + alarm.length)
        $scope.alarms = alarm.concat( $scope.alarms)
      } else {
        console.log( 'alarmService onAlarm ' + alarm.id + ' "' + alarm.state + '"' + ' "' + alarm.event.message + '"')
        $scope.alarms.unshift( alarm)
      }
      while( $scope.alarms.length > $scope.limit)
        $scope.alarms.pop()
      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    var request = {
      subscribeToActiveAlarms: {
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, onAlarm, onError)
  }]).

  controller('gbEventsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
    $scope.loading = true
    $scope.events = []
    $scope.limit = Number( $attrs.limit || 20);

    $scope.onEvent = function( subscriptionId, type, event) {
      if( angular.isArray( event)) {
        console.log( 'eventService onEvent length=' + event.length)
        $scope.events = event.concat( $scope.events)
      } else {
        console.log( 'eventService onEvent ' + event.id + ' "' + event.entity + '"' + ' "' + event.message + '"')
        $scope.events.unshift( event)
      }
      while( $scope.events.length > $scope.limit)
        $scope.events.pop()
      $scope.loading = false
      $scope.$digest()
    }

    $scope.onError = function( error, message) {

    }

    var request = {
      subscribeToRecentEvents: {
        eventTypes: [],
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, $scope.onEvent, $scope.onError)
  }]).

  directive( 'gbAlarms', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/alarms.html',
      controller: 'gbAlarmsController',
      link: function(scope, element, attrs) {
        // Title element
        var title = angular.element(element.children()[0]),
        // Opened / closed state
          opened = true;

        // Clicking on title should open/close the alarmBanner
        title.bind('click', toggle);

        // Toggle the closed/opened state
        function toggle() {
          opened = !opened;
          element.removeClass(opened ? 'closed' : 'opened');
          element.addClass(opened ? 'opened' : 'closed');
        }

        // initialize the alarmBanner
        //toggle();
      }

    }
  }).
  directive( 'gbEvents', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/events.html',
      controller: 'gbEventsController'
    }
  });


/**
 * Copyright 2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

var MeasurementHistory_regexTrue = new RegExp('^true$', 'i');  // case insensitive
var MeasurementHistory_murtsAccess = {
  x: function(d) { return d.timeMs; },
  y: function(d) { return d.value; }
}

//TODO: Need to get mapping from Reef
var MeasurementHistory_ValueMap = {

  Normal:   0, Alarm: 1,
  Disabled: 0, Enabled: 1,
  Open:     0, Closed: 1,
  Stop:     0, Automatic: 1, Manual: 2,
  Inactive: 0, Active: 1,
  Charging: 0, Discharging: 1, Standby: 2, Smoothing: 3, VAr: 4, Peak: 5  // 'VAr Control', 'Peak Shaving'
}



/**
 * Manage one subscription for a single point which may have multiple subscribers.
 * Update the subscribers associated with this point when new measurements come in.
 *
 * @param point
 * @constructor
 */
function MeasurementHistory(subscription, point) {
  this.subscription = subscription
  this.point = point
  this.subscriptionId = null
  this.subscribers = [] // {subscriber:, notify:} -- subscribers that display this point
  this.measurements = d3.trait.murts.dataStore()
    .x(MeasurementHistory_murtsAccess.x)
    .y(MeasurementHistory_murtsAccess.y)

  this.measurements.pushPoints([])
  //Debug: this.measurements.pname = this.point.name
}

MeasurementHistory.prototype.subscribe = function(scope, constraints, subscriber, notify) {

  this.measurements.constrainTime(constraints.time)
  this.measurements.constrainSize(constraints.size)
  if( constraints.throttling )
    this.measurements.constrainThrottling(constraints.throttling)

  this.subscribers.push({subscriber: subscriber, notify: notify})

  if( this.subscriptionId )
    return this.measurements

  var self = this,
      now = Date.now(),
      json = {
        subscribeToMeasurementHistory: {
          'pointId':  this.point.id,
          'timeFrom': now - constraints.time,
          'limit':    constraints.size
        }
      }


  this.subscriptionId = this.subscription.subscribe(json, scope,
    function(subscriptionId, type, data) {

      switch( type ) {
        case 'pointWithMeasurements':
          self.onPointWithMeasurements(data);
          break;
        case 'measurements':
          self.onMeasurements(data);
          break;
        default:
          console.error('MeasurementHistory unknown message type: "' + type + '"')
      }
    },
    function(error, message) {
      console.error('MeasurementHistory.subscribe ' + error + ', ' + message)
    }
  )

  return this.measurements
}

MeasurementHistory.prototype.unsubscribe = function(subscriber) {
  this.removeSubscriber(subscriber)

  if( this.subscribers.length === 0 && this.subscriptionId ) {
    try {
      this.subscription.unsubscribe(this.subscriptionId);
    } catch( ex ) {
      console.error('Unsubscribe measurement history for ' + this.point.name + ' exception ' + ex)
    }
    this.subscriptionId = null;
    this.measurements = d3.trait.murts.dataStore()
      .x(MeasurementHistory_murtsAccess.x)
      .y(MeasurementHistory_murtsAccess.y)
    this.measurements.pushPoints([])
  }

}


MeasurementHistory.prototype.onPointWithMeasurements = function(pointWithMeasurements) {
  var measurements,
      self = this

  //console.log( 'onPointWithMeasurements point.name ' + this.point.name + ' measurements.length=' + pointWithMeasurements.measurements.length)
  measurements = pointWithMeasurements.measurements.map(function(m) { return self.convertMeasurement(m) })
  this.measurements.pushPoints(measurements)
  this.notifySubscribers()
}

MeasurementHistory.prototype.onMeasurements = function(pointMeasurements) {
  var measurements,
      self = this

//      console.log( 'onMeasurements point.name ' + this.point.name + ' measurements.length=' + pointMeasurements.length + ' meas[0]: ' + pointMeasurements[0].measurement.value)
  measurements = pointMeasurements.map(function(pm) { return self.convertMeasurement(pm.measurement) })
  this.measurements.pushPoints(measurements)
  this.notifySubscribers()
}

MeasurementHistory.prototype.convertMeasurement = function(measurement) {
  measurement.timeMs = measurement.time
  measurement.time = new Date(measurement.time)
  if( measurement.type === 'BOOL' ) {

    measurement.value = MeasurementHistory_regexTrue.test(measurement.value) ? 1 : 0

  } else if( measurement.type === 'STRING' ) {
    var firstWord = measurement.value.split(' ')[0]
    if( MeasurementHistory_ValueMap.hasOwnProperty(firstWord) )
      measurement.value = MeasurementHistory_ValueMap[firstWord]
  } else {

    var value = parseFloat(measurement.value)
    if( !isNaN(value) ) {
      measurement.value = value
      //console.log( 'convertMeasurement measurements ' + this.point.name + ' ' + measurement.time + ' ' + measurement.value)
    } else {
      console.error('convertMeasurement ' + this.point.name + ' time=' + measurement.time + ' value="' + measurement.value + '" -- value is not a number.')
      return
    }
  }
  return measurement
}

MeasurementHistory.prototype.notifySubscribers = function() {
  this.subscribers.forEach(function(s) {
    if( s.notify )
      s.notify.call(s.subscriber)
  })

//        this.subscribers.forEach( function( subscriber) {
//            subscriber.traits.update( 'trend')
//        })
}

/**'
 * Remove the subscriber. It's possible the subscribe is listed twice with different
 * notifiers. Remove all references to subscriber.
 *
 * @param subscriber
 */
MeasurementHistory.prototype.removeSubscriber = function(subscriber) {

  var s,
      i = this.subscribers.length

  while( i > 0 ) {
    i--
    s = this.subscribers[i]
    if( s.subscriber === subscriber ) {
      this.subscribers.splice(i, 1);
    }
  }
}



/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */


angular.module('greenbus.views.measurement', ['greenbus.views.subscription', 'greenbus.views.navigation', 'greenbus.views.rest']).
  factory('pointIdToMeasurementHistoryMap', function() {
    return {};
  }).


  /**
   * Multiple clients can subscribe to measurements for the same point using one server subscription.
   *
   * Give a point UUID, get the name and a subscription.
   * Each point may have multiple subscriptions
   *
   * @param subscription
   * @param pointIdToMeasurementHistoryMap - Map of point.id to MeasurementHistory
   * @constructor
   */
  factory('measurement', ['subscription', 'pointIdToMeasurementHistoryMap', '$filter', function( subscription, pointIdToMeasurementHistoryMap, $filter) {
    var number = $filter( 'number' )

    function formatMeasurementValue( value ) {
      if( typeof value === 'boolean' || isNaN( value ) || !isFinite( value ) ) {
        return value
      } else {
        return number( value )
      }
    }

    /**
     *
     * @param scope The scope of the controller requesting the subscription.
     * @param point The Point with id and name
     * @param constraints time: Most recent milliseconds
     *                    size: Maximum number of measurements to query from the server
     *                          Maximum measurements to keep in Murts.dataStore
     * @param subscriber The subscriber object is used to unsubscribe. It is also the 'this' used
     *                   for calls to notify.
     * @param notify Optional function to be called each time measurements are added to array.
     *               The function is called with subscriber as 'this'.
     * @returns An array with measurements. New measurements will be updated as they come in.
     */
    function subscribeWithHistory(scope, point, constraints, subscriber, notify) {
      console.log('measurement.subscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[ point.id]
      if( !measurementHistory ) {
        measurementHistory = new MeasurementHistory(subscription, point)
        pointIdToMeasurementHistoryMap[ point.id] = measurementHistory
      }

      return measurementHistory.subscribe(scope, constraints, subscriber, notify)
    }

    /**
     *
     * @param point
     * @param subscriber
     */
    function unsubscribeWithHistory(point, subscriber) {
      console.log('measurement.unsubscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[ point.id]
      if( measurementHistory )
        measurementHistory.unsubscribe(subscriber)
      else
        console.error('ERROR: meas.unsubscribe point.id: ' + point.id + ' was never subscribed.')
    }

    function onMeasurements( measurements, subscriber, notify) {
      measurements.forEach( function( pm) {
        pm.measurement.value = formatMeasurementValue( pm.measurement.value )
      })
      notify.call( subscriber, measurements)
    }

    /**
     * Subscribe to measurements.
     *
     * @param scope The scope of the controller requesting the subscription.
     * @param pointIds Array of point IDs
     * @param constraints size: Maximum number of measurements to query from the server
     *                          Maximum measurements to keep in Murts.dataStore
     * @param subscriber The subscriber object is used as 'this' for calls to notify.
     * @param notify Optional function to be called each time one measurement is received.
     *               The function is called with subscriber as 'this'.
     * @returns A subscription ID which can be used to unsubscribe.
     */
    function subscribe(scope, pointIds, constraints, subscriber, notify) {
      //console.log('measurement.subscribe')
      return subscription.subscribe(
        {
          subscribeToMeasurements: { 'pointIds': pointIds }
        },
        scope,
        function ( subscriptionId, type, measurements ) {
          if( type === 'measurements')
            onMeasurements( measurements, subscriber, notify)
          else
            console.error( 'measurement.subscribe message of unknown type: "' + type + '"' )
          scope.$digest()
        },
        function ( error, message ) {
          console.error( 'measurement.subscribe ERROR: ' + error + ', message: ' + message)
        }
      )
    }

    function unsubscribe( subscriptionId) {
      subscription.unsubscribe( subscriptionId)
    }



    /**
     * Public API
     */
    return {
      subscribeWithHistory:   subscribeWithHistory,
      unsubscribeWithHistory: unsubscribeWithHistory,
      subscribe: subscribe,
      unsubscribe: unsubscribe
    }
  }]).

  controller( 'gbMeasurementsController', ['$scope', '$window', '$routeParams'/*, '$filter'*/, 'rest', 'navigation', 'subscription', 'measurement', 'request', '$timeout',
    function( $scope, $window, $routeParams,/*$filter,*/ rest, navigation, subscription, measurement, request, $timeout) {
      var self = this
      $scope.points = []
      $scope.pointsFiltered = []
      $scope.checkAllState = CHECKMARK_UNCHECKED
      $scope.checkCount = 0
      $scope.charts = []

      // Search
      $scope.searchText = ''
      $scope.sortColumn = 'name'
      $scope.reverse = false

      var CHECKMARK_UNCHECKED = 0,
          CHECKMARK_CHECKED = 1,
          CHECKMARK_PARTIAL = 2,
          CHECKMARK_NEXT_STATE = [1, 0, 0]

      var navId = $routeParams.navId,
          depth = rest.queryParameterFromArrayOrString( 'depth', $routeParams.depth ),
          equipmentIdsQueryParams = rest.queryParameterFromArrayOrString( 'equipmentIds', $routeParams.equipmentIds)//,
//          number = $filter( 'number' )


//      function formatMeasurementValue( value ) {
//        if( typeof value === 'boolean' || isNaN( value ) || !isFinite( value ) ) {
//          return value
//        } else {
//          return number( value )
//        }
//      }

      function findPoint( id ) {
        var index = findPointIndex( id)
        return index >= 0 ? $scope.points[index] : null
      }

      function findPointIndex( id ) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( point.id === id )
            return i
        }
        return -1
      }

      function findPointBy( testTrue ) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( testTrue( point ) )
            return point
        }
        return null
      }

      $scope.checkUncheck = function ( point ) {
        point.checked = CHECKMARK_NEXT_STATE[ point.checked]
        if( point.checked === CHECKMARK_CHECKED )
          $scope.checkCount++
        else
          $scope.checkCount--

        if( $scope.checkCount === 0 )
          $scope.checkAllState = CHECKMARK_UNCHECKED
        else if( $scope.checkCount >= $scope.points.length - 1 )
          $scope.checkAllState = CHECKMARK_CHECKED
        else
          $scope.checkAllState = CHECKMARK_PARTIAL

      }
      $scope.checkUncheckAll = function () {
        $scope.checkAllState = CHECKMARK_NEXT_STATE[ $scope.checkAllState]
        // if check, check visible. If uncheck, uncheck all.
        var ps = $scope.checkAllState === CHECKMARK_CHECKED ? $scope.pointsFiltered : $scope.points
        var i = ps.length - 1
        $scope.checkCount = $scope.checkAllState === CHECKMARK_CHECKED ? i : 0
        for( ; i >= 0; i-- ) {
          var point = ps[ i]
          point.checked = $scope.checkAllState
        }
      }


      $scope.chartAddPointById = function( id) {
        var point = findPoint( id)

        if( point )
          request.push( 'coral.request.addChart', [point])
        else
          console.error( 'Can\'t find point by id: ' + id)
      }

      $scope.chartAddSelectedPoints = function() {
        // Add all measurements that are checked and visible.
        var points = $scope.pointsFiltered.filter( function ( m ) {
          return m.checked === CHECKMARK_CHECKED
        } )

        if( points.length > 0 ) {
          request.push( 'coral.request.addChart', points)
        }
      }

      var CommandNotSelected = 'NotSelected',   // -> Selecting
          CommandSelecting = 'Selecting',       // -> Selected, NotSelected (unauthorized or failure)
          CommandSelected = 'Selected',         // -> Executing, NotSelected, Deselecting (user or timeout)
          CommandDeselecting = 'Deselecting',   // -> Executing, NotSelected (user or timeout)
          CommandExecuting = 'Executing'        // -> NotSelected (success or failure)
      var CommandIcons = {
        NotSelected: 'fa fa-chevron-right text-primary',
        Selecting: 'fa fa-chevron-right fa-spin text-primary',
        Selected: 'fa fa-chevron-left text-primary',
        Deselecting: 'fa fa-chevron-left fa-spin text-primary',
        Executing: 'fa fa-chevron-left text-primary'
      }
      var ExecuteIcons = {
        NotSelected: '',
        Selecting: '',
        Selected: 'fa fa-sign-in',
        Deselecting: 'fa fa-sign-in',
        Executing: 'fa fa-refresh fa-spin'
      }

      function CommandSet( _point, _commands) {
        // Control & Setpoint States


        this.point = _point
        this.commands = _commands
        this.state = CommandNotSelected
        this.lock = undefined
        this.selectedCommand = undefined
        this.commands.forEach( function( c) {
          c.selectClasses = CommandIcons[ CommandNotSelected]
          c.executeClasses = ExecuteIcons[ CommandNotSelected]
          c.isSetpoint = c.commandType.indexOf('SETPOINT') === 0
          c.blockClasses = 'fa fa-unlock'
          if( c.isSetpoint) {
            c.setpointValue = undefined

            switch( c.commandType) {
              case 'SETPOINT_INT':
                c.pattern = /^[+-]?\d+$/;
                c.placeHolder = 'int'
                break
              case 'SETPOINT_DOUBLE':
                c.pattern = /^[-+]?\d+(\.\d+)?$/;
                c.placeHolder = 'decimal'
                break
              case 'SETPOINT_STRING':
                c.pattern = undefined;
                c.placeHolder = 'text'
                break
              default:
                break
            }

          }

        })
      }

      CommandSet.prototype.selectToggle = function( command) {
        switch( this.state) {
          case CommandNotSelected: this.select( command); break;
          case CommandSelecting:   break;
          case CommandSelected:    this.deselectOptionSelect( command); break;
          case CommandExecuting:   break;
        }
        this.point.ignoreRowClick = true
      }

      CommandSet.prototype.setState = function( state, command) {
        console.log( 'setState from ' + this.state + ' to ' + state)
        this.state = state
        if( command) {
          command.selectClasses = CommandIcons[this.state]
          command.executeClasses = ExecuteIcons[this.state]
          console.log( 'setState ' + this.state + ', command.classes ' + command.classes)
        }
      }

      CommandSet.prototype.select = function( command) {
        var self = this

        if( this.state !== CommandNotSelected) {
          console.error( 'CommandSet.select invalid state: ' + this.state)
          return
        }

        self.setState( CommandSelecting, command)

        var arg = {
          accessMode: 'ALLOWED',
          commandIds: [command.id]
        }
        rest.post( '/models/1/commandlock', arg, null, $scope,
          function( data) {
            self.lock = data
            if( self.lock.expireTime) {
              self.selectedCommand = command
              self.setState( CommandSelected, command)

              var delay = self.lock.expireTime - Date.now()
              console.log( 'commandLock delay: ' + delay)
              // It the clock for client vs server is off, we'll use a minimum delay.
              delay = Math.max( delay, 10)
              self.selectTimeout = $timeout(function () {
                delete self.lock;
                delete self.selectTimeout;
                if( self.state === CommandSelected || self.state === CommandExecuting) {
                  self.setState( CommandNotSelected, self.selectedCommand)
                  self.selectedCommand = undefined
                }
              }, delay)
            } else {
              self.setState( CommandNotSelected, self.selectedCommand)
              self.selectedCommand = undefined
              self.alertDanger( 'Select failed. ' + data)
            }
          },
          function( ex, statusCode, headers, config) {
            console.log( 'CommandSet.select ' + ex)
            self.alertException( ex)
            self.setState( CommandNotSelected, command)
          })
      }

      CommandSet.prototype.deselectModel = function() {
        this.setState( CommandNotSelected, this.selectedCommand)
        this.selectedCommand = undefined
      }


      CommandSet.prototype.deselectOptionSelect = function( command) {
        var self = this

        if( this.state !== CommandSelected) {
          console.error( 'CommandSet.deselect invalid state: ' + this.state)
          return
        }

        self.setState( CommandDeselecting, self.selectedCommand)

        rest.delete( '/models/1/commandlock/' + self.lock.id, null, $scope,
          function( data) {
            delete self.lock;
            var saveCommand = self.selectedCommand
            self.deselectModel()
            if( saveCommand !== command) {
              self.select( command)
            }
          },
          function( ex, statusCode, headers, config) {
            console.log( 'CommandSet.deselect ' + ex)
            self.deselectModel()
            self.alertException( ex)

            var saveCommand = self.selectedCommand
            self.selectedCommand = undefined
            if( saveCommand !== command) {
              self.select( command)
            }
          })
      }

      function getSetpointInt( value) {
        var n = Number( value)

      }
      CommandSet.prototype.execute = function( command, commandIndex) {
        var self = this

        if( this.state !== CommandSelected) {
          console.error( 'CommandSet.execute invalid state: ' + this.state)
          return
        }

        var args = {
          commandLockId: self.lock.id
        }

        if( command.isSetpoint) {
          if( command.pattern && !command.pattern.test( command.setpointValue)) {
            switch( command.commandType) {
              case 'SETPOINT_INT': self.alertDanger( 'Setpoint needs to be an integer value.'); return;
              case 'SETPOINT_DOUBLE': self.alertDanger( 'Setpoint needs to be a floating point value.'); return;
              default:
                console.error( 'Setpoint has unknown error, "' + command.setpointValue + '" for command type ' + command.commandType);
            }
          }

          switch( command.commandType) {
            case 'SETPOINT_INT':
              args.setpoint = { intValue: Number( command.setpointValue)}
              break
            case 'SETPOINT_DOUBLE':
              args.setpoint = { doubleValue: Number( command.setpointValue)}
              break
            case 'SETPOINT_STRING':
              args.setpoint = { stringValue: command.setpointValue}
              break
            default:
              break
          }
        }

        self.setState( CommandExecuting, command)


        rest.post( '/models/1/commands/' + command.id, args, null, $scope,
          function( commandResult) {
            self.alertCommandResult( commandResult)
            self.deselectModel()
          },
          function( ex, statusCode, headers, config) {
            console.log( 'CommandSet.execute ' + ex)
            self.deselectModel()
            self.alertException( ex)
          })

        this.point.ignoreRowClick = true
      }

      CommandSet.prototype.closeAlert = function( index) {
        if( this.alerts)
          this.alerts.splice( index, 1)
        this.point.ignoreRowClick = true
      }

      CommandSet.prototype.alertCommandResult = function( result) {
        var alert = { message: 'Successful'}
        alert.type = result.status === 'SUCCESS' ? 'success' : 'danger'
        if( result.status !== 'SUCCESS') {
          alert.message = 'ERROR: ' + result.status
          if( result.error)
            alert.message += ',  ' + result.error
        }
        this.alerts = [ alert ]
      }

      CommandSet.prototype.alertException = function( ex) {
        var alert = {
          type: 'danger',
          message: ex.exception + ': ' + ex.message
        }
        this.alerts = [ alert ]
      }
      CommandSet.prototype.alertDanger = function( message) {
        var alert = {
          type: 'danger',
          message: message
        }
        this.alerts = [ alert ]
      }

      CommandSet.prototype.getCommandTypes = function() {
        var control = '',
            setpoint = ''

        this.commands.forEach( function( c) {
          if( control.length === 0 && c.commandType === 'CONTROL') {
            control = 'control'
          } else {
            if( setpoint.length === 0 && c.commandType.indexOf( 'SETPOINT') === 0)
              setpoint = 'setpoint'
          }
        })

        return control && setpoint ? control + ',' + setpoint : control + setpoint
      }


      $scope.rowClasses = function( point) {
        return point.rowDetail ? 'gb-row-selected-detail animate-repeat'
          : point.rowSelected ? 'gb-row-selected animate-repeat'
          : point.commandSet ? 'gb-row-selectable animate-repeat'
          : 'animate-repeat'
      }
      $scope.togglePointRowById = function( id) {
        if( !id)
          return  // detail row doesn't have an id.

        var point, pointDetails,
            index = findPointIndex( id)
        if( index < 0)
          return

        point = $scope.points[index]
        if( ! point.commandSet)
          return

        if( point.rowSelected ) {
          $scope.points.splice( index + 1, 1)
          point.rowSelected = false
        } else {

          pointDetails = {
            point: point,
            name: point.name + ' ',
            rowDetail: true,
            commandSet: point.commandSet
          }
          $scope.points.splice( index + 1, 0, pointDetails)
          point.rowSelected = true
        }

      }


      $scope.search = function( point) {
        var s = $scope.searchText
        if( s === undefined || s === null || s.length === 0)
          return true
        s = s.toLowerCase()

        // If it's a rowDetail, we return true if the original row is show. Use the original row as the search filter.
        if( point.rowDetail)
          point = point.point

        var measValue = '' + (point.currentMeasurement ? point.currentMeasurement.value : ''),
            foundCommandTypes = point.commandTypes && point.commandTypes.indexOf(s)!==-1,
            foundName = point.name.toLowerCase().indexOf( s)!==-1

        return foundName || measValue.toLowerCase().indexOf(s)!==-1 || point.unit.toLowerCase().indexOf( s)!==-1 || point.pointType.toLowerCase().indexOf( s)!==-1 || foundCommandTypes
      }


      function onMeasurements( measurements ) {
        measurements.forEach( function( pm){
          var point = findPoint( pm.point.id )
          if( point ) {
            //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
            point.currentMeasurement = pm.measurement
          } else {
            console.error( 'MeasurementsController.onPointMeasurement could not find point.id = ' + pm.point.id )
          }
        })
        $scope.$digest()
      }

      function subscribeToMeasurements( pointIds) {
        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)

//        subscription.subscribe(
//          {
//            subscribeToMeasurements: { 'pointIds': pointIds }
//          },
//          $scope,
//          function ( subscriptionId, type, measurements ) {
//            switch( type ) {
//              case 'measurements': measurements.forEach( onPointMeasurement); break;
//              default:
//                console.error( 'MeasurementsController.subscribeToMeasurements unknown type: "' + type + '"' )
//            }
//            $scope.$digest()
//          },
//          function ( error, message ) {
//          }
//        )
      }


      function nameFromTreeNode( treeNode) {
        if( treeNode)
          return treeNode.label
        else
          return '...'
      }

      function getEquipmentIds( treeNode) {
        var result = []
        treeNode.children.forEach( function( node){
          if( node.containerType && node.containerType !== 'Sourced')
            result.push( node.id)
        })
        return result
      }
      function navIdListener( id, treeNode) {
        $scope.equipmentName = nameFromTreeNode( treeNode) + ' '
        var equipmentIds = getEquipmentIds( treeNode)
        var equipmentIdsQueryParams = rest.queryParameterFromArrayOrString( 'equipmentIds', equipmentIds )

        var delimeter = '?'
        var url = '/models/1/points'
        if( equipmentIdsQueryParams.length > 0) {
          url += delimeter + equipmentIdsQueryParams
          delimeter = '&'
          $scope.equipmentName = nameFromTreeNode( treeNode) + ' '
        }
        if( depth.length > 0)
          url += delimeter + depth

        rest.get( url, 'points', $scope, function(data) {
          // data is either a array of points or a map of equipmentId -> points[]
          // If it's an object, convert it to a list of points.
          if( angular.isObject( data)) {
            $scope.points = []
            for( var equipmentId in data) {
              $scope.points = $scope.points.concat( data[equipmentId])
            }
          }
          var pointIds = processPointsAndReturnPointIds( $scope.points)
          subscribeToMeasurements( pointIds)
          getPointsCommands( pointIds)
        })
      }

      function processPointsAndReturnPointIds( points) {
        var pointIds = [],
            currentMeasurement = {
              value: '-',
              time: null,
              shortQuality: '-',
              longQuality: '-',
              validity: 'NOTLOADED',
              expandRow: false,
              commandSet: undefined
            }
        points.forEach( function ( point ) {
          point.checked = CHECKMARK_UNCHECKED
          point.currentMeasurement = currentMeasurement
          pointIds.push( point.id )
          if( typeof point.pointType !== 'string')
            console.error( '------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.' )
          if( typeof point.unit !== 'string')
            point.unit = ''

        })
        return pointIds
      }



      function notifyWhenEquipmentNamesAreAvailable( equipmentId) {
        $scope.equipmentName = nameFromEquipmentIds( $routeParams.equipmentIds) + ' '
      }

      function nameFromEquipmentIds( equipmentIds) {
        var result = ''
        if( equipmentIds) {

          if( angular.isArray( equipmentIds)) {
            equipmentIds.forEach( function( equipmentId, index) {
              var treeNode = navigation.getTreeNodeByEquipmentId( equipmentId, notifyWhenEquipmentNamesAreAvailable)
              if( index === 0)
                result += nameFromTreeNode( treeNode)
              else
                result += ', ' +nameFromTreeNode( treeNode)
            })
          } else {
            var treeNode = navigation.getTreeNodeByEquipmentId( equipmentIds, notifyWhenEquipmentNamesAreAvailable)
            result = nameFromTreeNode( treeNode)
          }
        }
        return result
      }

      // commandType: CONTROL, SETPOINT_INT, SETPOINT_DOUBLE, SETPOINT_STRING
      var exampleControls = [
        {commandType:  'CONTROL',
          displayName: 'NE_City.PCC_CB.Close',
          endpoint:    'ba01993f-d32c-43d4-9afc-8e5302ae5de8',
          id:          '65840820-aa1c-4215-b063-32affaddd465',
          name:        'NE_City.PCC_CB.Close'
        },
        {
          commandType: 'CONTROL',
          displayName: 'NE_City.PCC_CB.Open',
          endpoint:    'ba01993f-d32c-43d4-9afc-8e5302ae5de8',
          id:          '45673166-b55f-47e5-8f97-d495b7392a7a',
          name:        'NE_City.PCC_CB.Open'
        }
      ]


      /**
       * UUIDs are 36 characters long. The URL max is 2048
       * @param pointIds
       */
      function getPointsCommands( pointIds ) {
        var url = '/models/1/points/commands'

        rest.post( url, pointIds, null, $scope, function( data) {
          var point
          // data is map of pointId -> commands[]
          for( var pointId in data) {
            point = findPoint( pointId)
            if( point) {
              point.commandSet = new CommandSet( point, data[pointId])
              point.commandTypes = point.commandSet.getCommandTypes().toLowerCase()
              console.log( 'commandTypes: ' + point.commandTypes)
            }
          }
        })

      }

      // 'NE_City.Big_Hotel.DR2_cntl'
      // 'NE_City.Big_Hotel.DR3_cntl'

      if( navId) {
        // If treeNode exists, it's returned immediately. If it's still being loaded,
        // navIdListener will be called when it's finally available.
        //
        var treeNode = navigation.getTreeNodeByMenuId( navId, navIdListener)
        if( treeNode)
          navIdListener( navId, treeNode)

      } else {

        var delimeter = '?'
        var url = '/models/1/points'
        if( equipmentIdsQueryParams.length > 0) {
          url += delimeter + equipmentIdsQueryParams
          delimeter = '&'
          $scope.equipmentName = nameFromEquipmentIds( $routeParams.equipmentIds) + ' '
        }
        if( depth.length > 0)
          url += delimeter + depth

        rest.get( url, 'points', $scope, function( data) {
          // data is either a array of points or a map of equipmentId -> points[]
          // If it's an object, convert it to a list of points.
          if( angular.isObject( data)) {
            $scope.points = []
            for( var equipmentId in data) {
              $scope.points = $scope.points.concat( data[equipmentId])
            }
          }

          var pointIds = processPointsAndReturnPointIds( $scope.points)
          subscribeToMeasurements( pointIds)
          getPointsCommands( pointIds)
        })
      }

    }
  ]).

  directive( 'gbMeasurements', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/measurement/measurements.html',
      controller: 'gbMeasurementsController'
    }
  }).

  filter('checkboxClass', function() {
    return function(checked) {
      switch( checked) {
        case 0: return 'fa fa-square-o text-muted'
        case 1: return 'fa fa-check-square-o'
        case 2: return 'fa fa-minus-square-o'
        default: return 'fa fa-square-o'
      }
    };
  }).

  filter('validityIcon', function() {
    return function(validity) {
      switch( validity) {
        case 'GOOD': return 'glyphicon glyphicon-ok validity-good';
        case 'QUESTIONABLE': return 'glyphicon glyphicon-question-sign validity-questionable';
        case 'NOTLOADED': return 'validity-notloaded'
        case 'INVALID':
          return 'glyphicon glyphicon-exclamation-sign validity-invalid';
        default:
          return 'glyphicon glyphicon-exclamation-sign validity-invalid';
      }
    };
  }).
  filter('pointTypeImage', function() {
    return function(type, unit) {
      var image

      if( unit === 'raw') {
        image = '../../images/pointRaw.png'
      } else {
        switch( type) {
          case 'ANALOG': image = '/images/pointAnalog.png'; break;
          case 'STATUS': image = '/images/pointStatus.png'; break;
          default: image = '/images/pointRaw.png';
        }
      }

      return image
    };
  }).
  filter('pointTypeText', function() {
    return function(type, unit) {
      var text

      if( unit === 'raw') {
        text = 'raw point'
      } else {
        switch( type) {
          case 'ANALOG': text = 'analog point'; break;
          case 'STATUS': text = 'status point'; break;
          default: text = 'point with unknown type';
        }
      }

      return text
    };
  })



/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * License for the specific language governing permissions and limitations under
 * the License.
 */

angular.module('greenbus.views.navigation', ['ui.bootstrap', 'greenbus.views.rest']).
  factory('navigation', ['rest', function( rest){   // was navigation

    function NotifyCache() {
      this.cache = {}
      this.listeners = {}
    }
    NotifyCache.prototype.put = function( key, value) {
      this.cache[key] = value
      var notifyList = this.listeners[key]
      if( notifyList) {
        notifyList.forEach( function( notify) { notify( key, value)})
        delete this.listeners[key];
      }
    }
    NotifyCache.prototype.addListener = function( key, listener) {
      var listenersForId = this.listeners[ key]
      if( listenersForId)
        listenersForId.push( listener)
      else
        this.listeners[ key] = [listener]
    }
    NotifyCache.prototype.get = function( key, listener) {
      var value = this.cache[ key]
      if( !value && listener)
        this.addListener( key, listener)
      return value
    }



    var self = this,
        ContainerType = {
          MicroGrid: 'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf: 'EquipmentLeaf',
          Sourced: 'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        equipmentIdToTreeNodeCache = new NotifyCache(),
        menuIdToTreeNodeCache = new NotifyCache()


    function getContainerType( entity) {
      if( entity.types.indexOf( ContainerType.MicroGrid) >= 0)
        return ContainerType.MicroGrid;
      else if( entity.types.indexOf( ContainerType.EquipmentGroup) >= 0)
        return ContainerType.EquipmentGroup;
      else
        return ContainerType.EquipmentLeaf
    }

    function stripParentName( childName, parentName) {
      if( parentName && childName.lastIndexOf(parentName, 0) === 0)
        return childName.substr( parentName.length + 1) // plus 1 for the dot delimeter
      else
        return childName
    }

    function entityToTreeNode( entityWithChildren, parent) {
      // Could be a simple entity.
      var entity = entityWithChildren.entity || entityWithChildren

      // Types: (Microgrid, Root), (EquipmentGroup, Equipment), (Equipment, Breaker)
      var containerType = getContainerType( entity)
      var route = null
      switch( containerType) {
        case ContainerType.MicroGrid:
          route = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentGroup:
          route = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentLeaf:
          route = '/measurements?equipmentIds=' + entity.id
          break;
        case ContainerType.Sourced:
          break;
        default:
      }

      var name = entity.name
      if( entity.parentName)
        name = stripParentName( name, entity.parentName)
      else if( parent)
        name = stripParentName( name, parent.parentName)

      return {
        label: name,
        id: entity.id,
        type: 'item',
        types: entity.types,
        containerType: containerType,
        route: route,
        children: entityWithChildren.children ? entityChildrenListToTreeNodes( entityWithChildren.children, entity) : []
      }
    }
    function entityChildrenListToTreeNodes( entityWithChildrenList, parent) {
      var ra = []
      entityWithChildrenList.forEach( function( entityWithChildren) {
        var treeNode = entityToTreeNode( entityWithChildren, parent)
        ra.push( treeNode)
        equipmentIdToTreeNodeCache.put( treeNode.id, treeNode)
      })
      return ra
    }

    function cacheNavItems( items) {
      items.forEach( function( item) {
        if( item.type === 'item')
          menuIdToTreeNodeCache.put( item.id, item)
        if( item.children.length > 0)
          cacheNavItems( item.children)
      })
    }

    /**
     * Public API
     */
    return {

      /**
       * Get the tree node by equipment Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param equipmentId
       * @param notifyWhenAvailable
       * @returns The current value or null if not available yet.
       */
      getTreeNodeByEquipmentId: function( equipmentId, notifyWhenAvailable) { return equipmentIdToTreeNodeCache.get( equipmentId, notifyWhenAvailable)},

      /**
       * Get the tree node by menu Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param menuId The menu id to retrieve
       * @param notifyWhenAvailable function( id, treeNode)
       * @returns TreeNode if available, otherwise null.
       */
      getTreeNodeByMenuId: function( menuId, notifyWhenAvailable) { return menuIdToTreeNodeCache.get( menuId, notifyWhenAvailable)},

      /**
       *
       * @param menuId The menu id to put
       * @param treeNode
       */
      putTreeNodeByMenuId: function( menuId, treeNode) { return menuIdToTreeNodeCache.put( menuId, treeNode)},

      getTreeNodes: function( sourceUrl, scope, parent, successListener) {
        rest.get( sourceUrl, null, scope, function( entityWithChildrenList) {
          var treeNodes = entityChildrenListToTreeNodes( entityWithChildrenList, parent)
          successListener( treeNodes)
        })
      },

      getNavTree: function( url, name, scope, successListener) {
        rest.get( url, name, scope, function(data) {
          // example: [ {type:item, label:Dashboard, id:dashboard, route:#/dashboard, selected:false, children:[]}, ...]
          cacheNavItems( data)
          if( successListener)
            successListener( data)
        })
      }
    } // end return Public API

  }]). // end factory 'navigation'

  controller('NavBarTopController', ['$scope', '$attrs', '$location', '$cookies', 'rest', function( $scope, $attrs, $location, $cookies, rest) {
      $scope.loading = true
      $scope.applicationMenuItems = []
      $scope.sessionMenuItems = []
      $scope.application = {
          label: 'loading...',
          route: ''
      }
      $scope.userName = $cookies.userName

      $scope.getActiveClass = function( item) {
          return ( $location.absUrl().indexOf( item.route) >= 0) ? 'active' : ''
      }

      function onSuccess( json) {
          $scope.application = json[0]
          $scope.applicationMenuItems = json[0].children
          $scope.sessionMenuItems = json[1].children
          console.log( 'navBarTopController onSuccess ' + $scope.application.label)
          $scope.loading = false
      }

      return rest.get( $attrs.href, 'data', $scope, onSuccess)
  }]).
  directive('navBarTop', function(){
    // <nav-bar-top route='/menus/admin'
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/navigation/navBarTop.html',
      controller: 'NavBarTopController'
    }
  }).

  controller('NavListController', ['$scope', '$attrs', 'rest', function( $scope, $attrs, rest) {
        $scope.navItems = [ {type: 'header', label: 'loading...'}]

        $scope.getClass = function( item) {
            switch( item.type) {
                case 'divider': return 'divider'
                case 'header': return 'nav-header'
                case 'item': return ''
            }
        }

        return rest.get( $attrs.href, 'navItems', $scope)
    }]).
  directive('navList', function(){
    // <nav-list href='/coral/menus/admin'>
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/navigation/navList.html',
      controller: 'NavListController'
    }
  }).

  controller('NavTreeController', ['$scope', '$attrs', '$location', '$cookies', 'rest', 'navigation', function( $scope, $attrs, $location, $cookies, rest, navigation) {

    $scope.navTree = [
        {
            label: 'All Equipment',
            children: [],
            data: {
                regex: '^[^/]+',
                count: 0,
                newMessageCount: 1,
                depth: 0
            }
        }
    ]
    // GET /models/1/equipment?depth=3&rootTypes=Root
    var sampleGetResponse = [
        {
            'entity': {
                'name': 'Some Microgrid',
                'id': 'b9e6eac2-be4d-41cf-b82a-423d90515f64',
                'types': ['Root', 'MicroGrid']
            },
            'children': [
                {
                    'entity': {
                        'name': 'MG1',
                        'id': '03c2db16-0f78-4800-adfc-9dff9d4598da',
                        'types': ['Equipment', 'EquipmentGroup']
                    },
                    'children': []
                }
        ]}
    ]

    $scope.menuSelect = function( branch) {
        console.log( 'navTreeController.menuSelect ' + branch.label + ', route=' + branch.route)
        var url = branch.route
        if( branch.sourceUrl)
            url = url + '?sourceUrl=' + encodeURIComponent(branch.sourceUrl)
        $location.url( url)
    }

    function loadTreeNodesFromSource( parentTree, index, child) {
        navigation.getTreeNodes( child.sourceUrl, $scope, child, function( newTreeNodes) {
            switch( child.insertLocation) {
                case 'CHILDREN':
                    // Insert the resultant children before any existing static children.
                    child.children = newTreeNodes.concat( child.children)
                    break;
                case 'REPLACE':
                    replaceTreeNodeAtIndexAndPreserveChildren( parentTree, index, newTreeNodes)
                    break;
                default:
                    console.error( 'navTreeController.getSuccess.get Unknown insertLocation: ' + child.insertLocation)
            }
        })

    }

    function safeCopy( o) {
      var clone = angular.copy( o);
      // Angular adds uid to all objects. uid cannot be a duplicate.
      // Angular will generate a uid for this object on next digest.
      delete clone.uid;
      return clone
    }

    /**
     * Replace parentTree[index] with newTreeNodes, but copy any current children and insert them
     * after the new tree's children.
     *
     * BEFORE:
     *
     *   loading...
     *     All PVs
     *     All Energy Storage
     *
     * AFTER:
     *
     *   Microgrid1
     *     MG1
     *       Equipment1
     *       ...
     *     All PVs
     *     All Energy Storage
     *
     *
     * @param parentTree
     * @param index
     * @param newTreeNodes
     */
    function replaceTreeNodeAtIndexAndPreserveChildren( parentTree, index, newTreeNodes) {
        var i,
            oldChildren = parentTree[index].children
        // Remove the child we're replacing.
        parentTree.splice( index, 1)
        for( i=newTreeNodes.length-1; i >= 0; i-- ) {
            var node = newTreeNodes[i]
            parentTree.splice( index, 0, node)
            // For each new child that we're adding, replicate the old children.
            // Replace $parent in the sourceUrl with its current parent.
            if( oldChildren && oldChildren.length > 0) {
                var i2
                for( i2 = 0; i2 < oldChildren.length; i2++) {
                    var child = safeCopy( oldChildren[i2] ),
                        sourceUrl = child.sourceUrl
                    child.id = child.id + '.' + node.id
                    child.route = child.route + '.' + node.id;
                    child.parentName = node.label
                    // The child is a copy. We need to put it in the cache.
                    // TODO: We need better coordination with navigation. This works, but I think it's a kludge
                    // TODO: We didn't remove the old treeNode from the cache. It might even have a listener that will fire.
                    navigation.putTreeNodeByMenuId( child.id, child)
                    node.children.push( child)
                    if( sourceUrl) {
                        if( sourceUrl.indexOf( '$parent'))
                            child.sourceUrl = sourceUrl.replace( '$parent', node.id)
                        loadTreeNodesFromSource( node.children, node.children.length-1, child)
                    }
                }
            }
        }
    }
    function getSuccess( data) {
        data.forEach( function(node, index) {
            if( node.sourceUrl)
                loadTreeNodesFromSource( data, index, node)
        })
    }

    return navigation.getNavTree( $attrs.href, 'navTree', $scope, getSuccess)
  }]).
  directive('navTree', function(){
    // <nav-tree href='/coral/menus/analysis'>
    return {
      restrict: 'E', // Element name
      scope: true,
      controller: 'NavTreeController',
      list: function(scope, element, $attrs) {}
    }
  } ).

  // If badge count is 0, return empty string.
  filter('badgeCount', function() {
    return function ( count ) {
      if ( count > 0 )
        return count
      else
        return ''
    }
  });

/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */


/**
 * One controller wants to request a service from another controller. The requester
 * pushes a named request with optional data
 *
 * Usage example:
 *
 * Controller One
 *
 * coralRequest.push( 'coral.request.addChart', points)
 *
 * Controller Two
 *
 * $scope.$on('coral.request.addChart', function() { var points = coralRequest.pop( 'coral.request.addChart');
   *
   * @param subscription
 * @param pointMeasurements - Map of point.id to MeasurementHistory
 * @constructor
 */

angular.module('greenbus.views.request', []).

/**
 * Multiple clients can subscribe to measurements for the same point using one server subscription.
 *
 * Give a point UUID, get the name and a subscription.
 * Each point may have multiple subscriptions
 *
 * @param subscription
 * @param pointIdToMeasurementHistoryMap - Map of point.id to MeasurementHistory
 * @constructor
 */
  factory('request', ['$rootScope', function( $rootScope) {
    var requests = {}

    /**
     * Public API
     */
    return {
      push:   function ( requestName, data ) {
        if( requestName && angular.isString( requestName) && requestName.length > 0) {

          if( !requests[requestName])
            requests[requestName] = []

          if( data === undefined)
            data = null

          requests[requestName].push( data)
          $rootScope.$broadcast(requestName);

        } else {

          console.error( 'coralRequest.push: Invalid requestName string "' + requestName +  '".')
        }


      },
      pop: function( requestName) {

        if( requestName && angular.isString( requestName) && requestName.length > 0) {

          if( requests[requestName] )
            return requests[requestName].pop()
          else {
            console.error( 'coralRequest.pop: No requests with requestName "' + requestName +  '" were ever pushed.')
            return undefined
          }
        } else {
          console.error( 'coralRequest.pop: Invalid requestName string "' + requestName +  '".')
        }
      }
    }
  }])

/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



angular.module('greenbus.views.rest', ['greenbus.views.authentication']).
  factory('rest', ['$rootScope', '$timeout', '$http', '$location', 'authentication', function($rootScope, $timeout, $http, $location, authentication) {

    var self = this;
    var retries = {
      initialize: 0,
      get:        0
    }
    var status = {
      status:         'NOT_LOGGED_IN',
      reinitializing: true,
      description:    'loading Reef client...'
    }
    console.log('status = ' + status.status)

    var httpConfig = {
      cache:   false,
      timeout: 10000 // milliseconds
    }
    var redirectLocation = $location.path();
    console.log('CoralRest: redirectLocation 1 =' + redirectLocation)
    if( redirectLocation.length === 0 )
      redirectLocation = '/'
    console.log('CoralRest: redirectLocation 2 =' + redirectLocation)


    if( authentication.isLoggedIn() ) {
      console.log('reef: authentication.isLoggedIn()')
      // Let's assume, for now, that we already logged in and have a valid authToken.
      setStatus({
        status:         'UP',
        reinitializing: false,
        description:    ''
      })

    } else {
      console.log('reef: ! authentication.isLoggedIn()')
    }


    function handleConnectionStatus(json) {
      setStatus(json);

      if( status.status === 'UP' && redirectLocation )
        $location.path(redirectLocation)
    }

    function setStatus(s) {
      status = s
      console.log('setStatus: ' + status.status)
      $rootScope.$broadcast('reef.status', status);
    }


    function isString(obj) {
      return Object.prototype.toString.call(obj) == '[object String]'
    }

    function httpRequestError(json, statusCode, headers, config) {
      //   0 Server down
      // 401 Unauthorized


      console.error('coralRequest error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify(json));
      if( statusCode === 0 ) {
        setStatus({
          status:         'APPLICATION_SERVER_DOWN',
          reinitializing: false,
          description:    'Application server is not responding. Your network connection is down or the application server appears to be down.'
        });
      } else if( statusCode == 401 ) {
        setStatus({
          status:         'NOT_LOGGED_IN',
          reinitializing: true,
          description:    'Not logged in.'
        });
        redirectLocation = $location.url(); // save the current url so we can redirect the user back
        authentication.redirectToLoginPage(redirectLocation)
      } else if( statusCode === 404 || statusCode === 500 || (isString(json) && json.length === 0) ) {
        setStatus({
          status:         'APPLICATION_REQUEST_FAILURE',
          reinitializing: false,
          description:    'Application server responded with status ' + statusCode
        });
      } else {
        setStatus(json);
      }

      // 404 means it's an internal error and the page will never be found so no use retrying.
      if( statusCode != 404 ) {
        console.error('coralRest error if( statusCode != 404)')
      }
    }

    function getStatus() {
      return status
    }

    function get(url, name, $scope, successListener) {
      $scope.loading = true;
      //console.log( 'reef.get ' + url + ' retries:' + retries.get);


      if( !authentication.isLoggedIn() ) {
        console.log('self.get if( !authentication.isLoggedIn())')
        redirectLocation = $location.url() // save the current url so we can redirect the user back
        console.log('CoralRest.get: saving redirectLocation: ' + redirectLocation)
        authentication.redirectToLoginPage(redirectLocation)
        return
      }

      // Register for controller.$destroy event and kill any retry tasks.
      $scope.$on('$destroy', function(event) {
        //console.log( 'reef.get destroy ' + url + ' retries:' + retries.get);
        if( $scope.task ) {
          console.log('reef.get destroy task' + url + ' retries:' + retries.get);
          $timeout.cancel($scope.task);
          $scope.task = null;
          retries.get = 0;
        }
      });

      if( status.status !== 'UP' ) {
        console.log('self.get ( status.status != "UP")')
        retries.get++;
        var delay = retries.get < 5 ? 1000 : 10000

        $scope.task = $timeout(function() {
          self.get(url, name, $scope, successListener);
        }, delay);

        return;
      }

      retries.get = 0;

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.get(encodeURI(url), httpConfig).
        success(function(json) {
          if( name )
            $scope[name] = json;
          $scope.loading = false;
          console.log('reef.get success json.length: ' + json.length + ', url: ' + url);

          if( successListener )
            successListener(json)

          // If the get worked, the service must be up.
          if( status.status != 'UP' ) {
            setStatus({
              status:         'UP',
              reinitializing: false,
              description:    ''
            });
          }
        }).
        error(httpRequestError);
    }

    function post(url, data, name, $scope, successListener, failureListener) {

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.post(url, data, httpConfig).
        success(function(json) {
          if( name )
            $scope[name] = json;
          console.log('reef.post success json.length: ' + json.length + ', url: ' + url);

          if( successListener )
            successListener(json)
        }).
        error(function(json, statusCode, headers, config) {
          //   0 Server down
          // 400 Bad Request - request is malformed or missing required fields.
          // 401 Unauthorized
          // 403 Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
          // 404 Not Found - Server has not found anything matching the Request-URI
          // 408 Request Timeout
          // 500 Internal Server Error
          //
          if( failureListener )
            failureListener(json, statusCode, headers, config)
          if( statusCode === 401 || statusCode === 0 )
            httpRequestError(json, statusCode, headers, config)
        });

    }

    function _delete(url, name, $scope, successListener, failureListener) {

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.delete(url, httpConfig).
        success(function(json) {
          if( name )
            $scope[name] = json;
          console.log('reef.delete success json.length: ' + json.length + ', url: ' + url);

          if( successListener )
            successListener(json)
        }).
        error(function(json, statusCode, headers, config) {
          // 400: Bad Request - request is malformed or missing required fields.
          // 403: Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
          if( statusCode === 400 || statusCode === 403 )
            failureListener(json, statusCode, headers, config)
          else
            httpRequestError(json, statusCode, headers, config)
        });

    }


    function queryParameterFromArrayOrString(parameter, arrayOrString) {
      var parameterEqual = parameter + '='
      var query = ''
      if( angular.isArray(arrayOrString) ) {
        arrayOrString.forEach(function(value, index) {
          if( index === 0 )
            query = parameterEqual + value
          else
            query = query + '&' + parameterEqual + value
        })
      } else {
        if( arrayOrString && arrayOrString.length > 0 )
          query = parameterEqual + arrayOrString
      }
      return query
    }


    /**
     * Public API
     */
    return {

      getStatus: getStatus,
      get: get,
      post: post,
      delete: _delete,
      queryParameterFromArrayOrString: queryParameterFromArrayOrString
    }

  }]).


  config(['$httpProvider', function($httpProvider) {


    // If the application server goes down and a user clicks the left sidebar, Angular will try to load the partial page and get a 404.
    // We need to catch this event to put up a message.
    //

    var interceptor = ['$q', '$injector', '$rootScope', '$location', function($q, $injector, $rootScope, $location) {

      function success(response) {
        return response;
      }

      function error(response) {
        var httpStatus = response.status;
        if( httpStatus == 401 ) {
          // Ignore httpStatus == 401. Let authentication.interceptor pick it up.
          return response
        } else if( (httpStatus === 404 || httpStatus === 0 ) && response.config.url.indexOf('.html') ) {

          var status = {
            status:         'APPLICATION_SERVER_DOWN',
            reinitializing: false,
            description:    'Application server is not responding. Your network connection is down or the application server appears to be down.'
          };

          //var $rootScope = $rootScope || $injector.get('$rootScope');
          $rootScope.$broadcast('reef.status', status);

          return response;
        } else {
          return $q.reject(response);
        }
      }

      return function(promise) {
        return promise.then(success, error);
      }
    }];

    $httpProvider.responseInterceptors.push(interceptor);
  }]);


/**
* Copyright 2013-2014 Green Energy Corp.
*
* Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
* contributor license agreements. See the NOTICE file distributed with this
* work for additional information regarding copyright ownership. Green Energy
* Corp licenses this file to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*
* Author: Flint O'Brien
*/

angular.module('greenbus.views.subscription', ['greenbus.views.authentication']).

  factory('websocketFactory', ['$window', function($window) {
    var WebSocketClass;

    if ('WebSocket' in $window)
    {
      WebSocketClass = WebSocket;
    }
    else if ('MozWebSocket' in $window)
    {
      WebSocketClass = MozWebSocket;
    }

    return WebSocketClass ? function(url) { return new WebSocketClass(url); } : undefined;
  }]).

  factory('subscription', ['$rootScope', '$location', 'authentication', 'websocketFactory', function( $rootScope, $location, authentication, websocketFactory){


    var STATE = {
      NOT_CONNECTED: 'No connection to server',
      CONNECTION_FAILED: 'Connection to server failed. Your network connection is down or the application server appears to be down.',
      CONNECTING: 'Connecting to server...',
      CONNECTED: 'Connected to server'
    }

    var status = {
      state: STATE.NOT_CONNECTED,
      reinitializing: false
    }
    function setStatus( state, reinitializing) {
      status.state = state
      if( reinitializing)
        status.reinitializing = reinitializing
      console.log( 'setStatus: ' + status.state)
      $rootScope.$broadcast( 'subscription.status', status);
    }


    //var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
    var webSocket = null
    var webSocketPendingTasks = []

    var subscription = {
      listeners: {}   // { subscriptionId: { message: listener, error: listener}, ...}
    };

    /* Assign these WebSocket handlers to a newly created WebSocket */
    var wsHanders = {

      onmessage: function (event) {
        var message = JSON.parse(event.data)

        if( message.type === 'ConnectionStatus') {
          console.debug( 'onMessage.ConnectionStatus ' + message.data)
          handleReefConnectionStatus( message.data)
          return
        }

        // Handle errors
        if(message.error) {
          handleError( message)
          return
        }

//                    console.debug( 'onMessage message.subscriptionId=' + message.subscriptionId + ', message.type=' + message.type)

        var listener = getListenerForMessage( message)
        if( listener && listener.message)
          listener.message( message.subscriptionId, message.type, message.data)
      },
      onopen: function(event) {
        console.log( 'webSocket.onopen event: ' + event)
        setStatus( STATE.CONNECTED)

        while( webSocketPendingTasks.length > 0) {
          var data = webSocketPendingTasks.shift()
          console.log( 'onopen: send( ' + data + ')')
          webSocket.send( data)
        }
      },
      onclose: function(event) {
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        console.log( 'webSocket.onclose code: ' + code + ', wasClean: ' + wasClean + ', reason: ' + reason)
        webSocket = null

        setStatus( STATE.CONNECTION_FAILED)
        removeAllSubscriptions( 'WebSocket onclose()')

        // Cannot redirect here because this webSocket thread fights with the get reply 401 thread.
        // Let the get handle the redirect. Might need to coordinate something with get in the future.
      },
      onerror: function(event) {
        var data = event.data;
        var name = event.name;
        var message = event.message;
        console.log( 'webSocket.onerror name: ' + name + ', message: ' + message + ', data: ' + data)
        setStatus( STATE.CONNECTION_FAILED);
        removeAllSubscriptions( 'WebSocket onerror()')
      }
    }

    function getListenerForMessage( message) {
      if( message.subscriptionId)
        return subscription.listeners[ message.subscriptionId]
      else
        return null
    }

    function handleError( message) {
      //webSocket.close()
      console.log( 'webSocket.handleError message.error: ' + message.error)
      if( message.jsError)
        console.error( 'webSocket.handleError message.jsError: ' + message.jsError)

      var listener = getListenerForMessage( message);
      if( listener && listener.error)
        listener.error( message.error, message)
    }

    function handleReefConnectionStatus( json) {
      // TODO! this is a reef status, not connection
      $rootScope.$broadcast( 'reef.status', json)
    }

    function unsubscribe( subscriptionId) {
      webSocket.send(JSON.stringify(
        { unsubscribe: subscriptionId}
      ))
      delete subscription[ subscriptionId]
    }

    function saveSubscriptionOnScope( $scope, subscriptionId) {
      if( ! $scope.subscriptionIds)
        $scope.subscriptionIds = []
      $scope.subscriptionIds.push( subscriptionId)
    }

    function registerSubscriptionOnScope( $scope, subscriptionId) {

      saveSubscriptionOnScope( $scope, subscriptionId);

      // Register for controller.$destroy event and kill any retry tasks.
      // TODO save return value as unregister function. Could have multiples on one $scope.
      $scope.$on( '$destroy', function( event) {
        if( $scope.subscriptionIds) {
          console.log( 'reef.subscribe $destroy ' + $scope.subscriptionIds.length);
          $scope.subscriptionIds.forEach( function( subscriptionId) {
            unsubscribe( subscriptionId)
            delete subscription.listeners[ subscriptionId]
          })
          $scope.subscriptionIds = []
        }
      });

    }

    function removeAllSubscriptions( error) {
      // save in temp in case a listener.error() tries to resubscribe
      var subscriptionId, listener,
        temp = subscription.listeners
      subscription.listeners = {}
      webSocketPendingTasks = []
      for( subscriptionId in temp) {
        listener = temp[subscriptionId]
        if( listener.error)
          listener.error( error, '')
      }
    }

    function generateUUID(){
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
      });
      return uuid;
    }

    function makeSubscriptionId( json) {
      var messageKey = Object.keys( json)[0]
      // add the messageKey just for easier debugging.
      return 'subscription.' + messageKey + '.' + generateUUID();
    }

    function addSubscriptionIdToMessage( json) {
      var subscriptionId = makeSubscriptionId( json)
      var messageKey = Object.keys( json)[0]
      json[messageKey].subscriptionId = subscriptionId
      return subscriptionId
    }

    function makeWebSocket() {
      var wsUri = $location.protocol() === 'https' ? 'wss' : 'ws'
      wsUri += '://' + $location.host() + ':' + $location.port()
      wsUri += '/websocket?authToken=' + authentication.getAuthToken()
      var ws = websocketFactory( wsUri)
      if( ws) {
        ws.onmessage = wsHanders.onmessage
        ws.onopen = wsHanders.onopen
        ws.onclose = wsHanders.onclose
        ws.onerror = wsHanders.onerror
      }
      return ws
    }

    function pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener) {
      // We're good, so save request to wait for WebSocket.onopen().
      console.log( 'subscribe: send pending ( ' + request + ')')
      webSocketPendingTasks.push( request)
      registerSubscriptionOnScope( $scope, subscriptionId);
      subscription.listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    }

    /**
     * Public API
     */
    return {
      STATE: STATE, // publish STATE enum

      getStatus: function() {
        return status;
      },

      subscribe: function( json, $scope, messageListener, errorListener) {

        var subscriptionId = addSubscriptionIdToMessage( json)
        var request = JSON.stringify( json)

        // Lazy init of webSocket
        if( status.state == STATE.CONNECTED) {

          try {
            webSocket.send( request)

            // We're good, so save request for WebSocket.onmessage()
            console.log( 'subscribe: send( ' + request + ')')
            registerSubscriptionOnScope( $scope, subscriptionId);
            subscription.listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
          } catch( ex) {
            if( errorListener)
              errorListener( 'Could not send subscribe request to server. Exception: ' + ex)
            subscriptionId = null
          }

        } else{

          if( status.state != STATE.CONNECTING) {
            setStatus( STATE.CONNECTING)

            try {
              if( ! authentication.isLoggedIn())  // TODO: Should we redirect to login?
                throw 'Not logged in.'
              webSocket = makeWebSocket()
              if( ! webSocket)
                throw 'WebSocket create failed.'

              pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener)

            } catch( ex) {
              setStatus( STATE.CONNECTION_FAILED)
              webSocket = null
              if( errorListener)
                errorListener( 'Could not create connection to server. Exception: ' + ex)
              subscriptionId = null
            }

          } else {
            // Already opening WebSocket, STATE.CONNECTING. Just push pending.
            pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener)
          }

        }

        return subscriptionId
      },

      unsubscribe: unsubscribe


  }




  }]);

angular.module("template/endpoint/endpoints.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/endpoint/endpoints.html",
    "<div>\n" +
    "    <h3>Endpoints</h3>\n" +
    "\n" +
    "    <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "        <table class=\"table table-condensed\">\n" +
    "            <thead>\n" +
    "            <tr>\n" +
    "                <th>Name</th>\n" +
    "                <th>Protocol</th>\n" +
    "                <th>Enabled</th>\n" +
    "                <th>Comms Status</th>\n" +
    "                <th>Last Heartbeat</th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr class=\"gb-endpoint\" ng-repeat=\"ep in endpoints\">\n" +
    "                <td>{{ep.name}}</td>\n" +
    "                <td>{{ep.protocol}}</td>\n" +
    "                <td>{{ep.enabled}}</td>\n" +
    "                <td><span ng-class=\"ep.commStatus.status | gbCommStatusIcon: ep.enabled\"></span> {{ep.commStatus.status}}</td>\n" +
    "                <td>{{ep.commStatus.lastHeartbeat | date:\"hh:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/ess/esses.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/ess/esses.html",
    "<div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-5\">\n" +
    "            <h3>All Energy Storage</h3>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-7\" style=\"margin-top: 1.2em;\">\n" +
    "            <input type=\"text\" class=\"form-control\" placeholder=\"search any column\" ng-model=\"searchText\" style=\"height: 100%;\">\n" +
    "            <!--<button class=\"btn btn-info\" ng-click=\"search()\" style=\"height: 100%; width: 60px; margin-bottom: 10px;\"><i class=\"glyphicon glyphicon-search icon-white\"></i></button>-->\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "    <div ng-cloak style=\"margin-top: 1.4em\">\n" +
    "        <table class=\"table table-condensed gb-table-2header\" style=\"border-collapse: separate\">\n" +
    "            <thead>\n" +
    "            <tr>\n" +
    "                <th></th>\n" +
    "                <th>Charge / Discharge</th>\n" +
    "                <th colspan=\"3\"></th>\n" +
    "                <th colspan=\"2\" class=\"gb-cell-highlight gb-cell-highlight-top\">Nameplate Capacity</a></th>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <th><a href=\"\" ng-click=\"sortColumn = 'name'; reverse=!reverse\">Device Name</a></th>\n" +
    "                <th>Rate</th>\n" +
    "                <th><a href=\"\" ng-click=\"sortColumn = 'state'; reverse=!reverse\">State</a></th>\n" +
    "                <th title=\"State of Charge %\" style=\"text-align: center\">SOC %</th>\n" +
    "                <th></th>\n" +
    "                <th class=\"gb-cell-highlight gb-cell-highlight-left\"><a href=\"\" ng-click=\"sortColumn = 'CapacityPower'; reverse=!reverse\">Power</a></th>\n" +
    "                <th class=\"gb-cell-highlight gb-cell-highlight-right\"><a href=\"\" ng-click=\"sortColumn = 'CapacityEnergy'; reverse=!reverse\">Energy</a></th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr ng-repeat=\"ces in ceses | filter:searchText | orderBy:sortColumn:reverse\">\n" +
    "                <td>{{ces.name}}</td>\n" +
    "                <td>{{ces.Charging}}</td>\n" +
    "                <td><img class=\"ces-state-icon\" ng-src=\"{{ces.state | essStateIcon}}\" title=\"{{ces.state | essStateDescription}}\" style=\"margin-top:2px\"/></td>\n" +
    "                <td style=\"width: 60px\">\n" +
    "                    <div class=\"battery-wrapper\" title=\"{{ces.state | essStateDescription}}\" >\n" +
    "                        <div class=\"{{ces['%SOC'] | essBatterySocChargedClass: ces.state}}\" style=\"width:{{ces.percentSocMax100}}%\"></div>\n" +
    "                        <div class=\"{{ces['%SOC'] | essBatterySocUnchargedClass: ces.state}}\" style=\"width:{{100-ces.percentSocMax100}}%\"></div>\n" +
    "                        <div class=\"battery-overlay\"></div>\n" +
    "                    </div>\n" +
    "                </td>\n" +
    "                <td>{{ces['%SOC']}}%</td>\n" +
    "                <td class=\"gb-cell-highlight gb-cell-highlight-left\">{{ces.CapacityPower}}</td>\n" +
    "                <td class=\"gb-cell-highlight gb-cell-highlight-right\">{{ces.CapacityEnergy}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/event/alarms.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/alarms.html",
    "<div>\n" +
    "    <h3>Alarms</h3>\n" +
    "    <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "        <table class=\"table table-condensed\">\n" +
    "            <thead>\n" +
    "            <tr>\n" +
    "                <th>State</th>\n" +
    "                <th>Type</th>\n" +
    "                <th>Sev</th>\n" +
    "                <th>User</th>\n" +
    "                <th>Message</th>\n" +
    "                <th>Time</th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr ng-repeat=\"alarm in alarms\">\n" +
    "                <td>{{alarm.state}}</td>\n" +
    "                <td>{{alarm.event.eventType}}</td>\n" +
    "                <td>{{alarm.event.severity}}</td>\n" +
    "                <td>{{alarm.event.agent}}</td>\n" +
    "                <td>{{alarm.event.message}}</td>\n" +
    "                <td>{{alarm.event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/event/events.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/events.html",
    "<div>\n" +
    "    <h3>Events</h3>\n" +
    "    <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "        <table class=\"table table-condensed\">\n" +
    "            <thead>\n" +
    "            <tr>\n" +
    "                <th>Type</th>\n" +
    "                <th>Alarm</th>\n" +
    "                <th>Sev</th>\n" +
    "                <th>User</th>\n" +
    "                <th>Message</th>\n" +
    "                <th>Time</th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr class=\"gb-event\" ng-repeat=\"event in events\">\n" +
    "                <td>{{event.eventType}}</td>\n" +
    "                <td>{{event.alarm}}</td>\n" +
    "                <td>{{event.severity}}</td>\n" +
    "                <td>{{event.agent}}</td>\n" +
    "                <td>{{event.message}}</td>\n" +
    "                <td>{{event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/measurement/measurements.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/measurement/measurements.html",
    "<div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-5\">\n" +
    "            <h3>Measurements</h3>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-7\" style=\"margin-top: 1.2em;\">\n" +
    "            <input type=\"text\"  class=\"form-control\" placeholder=\"search any column\" ng-model=\"searchText\" style=\"height: 100%;\">\n" +
    "            <!--<button class=\"btn btn-info\" ng-click=\"search()\" style=\"height: 100%; width: 60px; margin-bottom: 10px;\"><i class=\"glyphicon glyphicon-search icon-white\"></i></button>-->\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12\">\n" +
    "            <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "                <table class=\"table table-condensed gb-row-radius\" ng-show=\"points.length > 0\">\n" +
    "                    <thead>\n" +
    "                    <tr>\n" +
    "                        <th colspan=\"2\" style=\"padding-bottom: 12px;\">\n" +
    "                            <button class=\"btn btn-default\" ng-click=\"checkUncheckAll()\">\n" +
    "                                <div class=\"gb-checkbox-container\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">\n" +
    "                                    <i ng-class=\"checkAllState | checkboxClass\"></i>\n" +
    "                                    <!--<div ng-class=\"checkAllState | checkboxClass\"></div>-->\n" +
    "                                </div>\n" +
    "                            </button>\n" +
    "                            <button class=\"btn btn-default text-muted\" ng-click=\"chartAddSelectedPoints()\" ng-show=\"checkCount>0\" style=\"width: 60px; margin-left: 14px\"><span class=\"glyphicon glyphicon-stats\"></span></button>\n" +
    "\n" +
    "                        </th>\n" +
    "                        <!--<th>Name</th>-->\n" +
    "                        <th></th>\n" +
    "                        <th style=\"text-align: right\">Value</th>\n" +
    "                        <th>Unit</th>\n" +
    "                        <th>Quality</th>\n" +
    "                        <th>Time</th>\n" +
    "                        <th>type</th>\n" +
    "                    </tr>\n" +
    "                    </thead>\n" +
    "                    <tbody>\n" +
    "                    <tr ng-repeat=\"point in pointsFiltered = (points | filter:search | orderBy:sortColumn)\" ng-class=\"rowClasses(point)\">\n" +
    "                        <td ng-if=\"!point.rowDetail\">\n" +
    "                            <div class=\"gb-checkbox-container\" ng-click=\"checkUncheck(point)\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">\n" +
    "                                <i ng-class=\"point.checked | checkboxClass\"></i>\n" +
    "                                <!--<div ng-class=\"point.checked | checkboxClass\"></div>-->\n" +
    "                            </div>\n" +
    "                            <!--<div id=\":2e\" class=\"oZ-jc T-Jo J-J5-Ji T-Jo-Jp\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">-->\n" +
    "                            <!--<div class=\"T-Jo-auh\"></div>-->\n" +
    "                            <!--</div>-->\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">\n" +
    "                            <div class=\"gb-icon-text draggable\" draggable ident=\"point.id\">\n" +
    "                                <img class=\"gb-icon\" ng-src=\"{{ point.pointType | pointTypeImage: point.unit }}\" width=\"14px\" height=\"14px\" title=\"{{ point.pointType | pointTypeText: point.unit }}\"/>\n" +
    "                                {{point.name}}\n" +
    "                            </div>\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" style=\"text-align: right\">\n" +
    "                            <a href=\"\" ng-click=\"chartAddPointById(point.id)\"><span class=\"glyphicon glyphicon-stats text-muted\" title=\"Graph measurements\"></span></a>\n" +
    "                            <!--<i class=\"fa fa-refresh fa-spin\"></i>-->\n" +
    "                        </td>\n" +
    "                        <td  ng-if=\"!point.rowDetail\" class=\"gb-value\" ng-click=\"togglePointRowById(point.id)\">\n" +
    "                            <span class=\"glyphicon glyphicon-edit pull-left text-muted\" style=\"padding-right: 10px; opacity: {{ point.commandSet ? 1 : 0 }}\" title=\"Control or Setpoint\"></span>\n" +
    "                            {{point.currentMeasurement.value}}\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{point.unit}}</td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\" style=\"padding-bottom: 0\"><span ng-class=\"point.currentMeasurement.validity | validityIcon\" title=\"{{point.currentMeasurement.longQuality}}\"></span></td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{point.currentMeasurement.time | date:'h:mm:ss a, MM-dd-yyyy'}}</td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{ point.pointType }}</td>\n" +
    "\n" +
    "\n" +
    "\n" +
    "                        <td ng-if=\"point.rowDetail\" colspan=\"8\">\n" +
    "\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"col-md-1\">\n" +
    "\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-10\">\n" +
    "\n" +
    "                                    <form class=\"form-horizontal\" role=\"form\" name=\"form\">\n" +
    "                                        <div class=\"form-group\" ng-repeat=\"command in point.commandSet.commands\">\n" +
    "                                            <label class=\"col-sm-5 control-label\">\n" +
    "                                                {{ command.displayName }}\n" +
    "                                            </label>\n" +
    "                                            <div class=\"col-sm-7\">\n" +
    "                                                <div class=\"btn-toolbar\" role=\"toolbar\">\n" +
    "                                                    <div class=\"btn-group\">\n" +
    "                                                        <!--<button type=\"button\" class=\"btn btn-default\"><i ng-class=\"command.blockClasses\"></i> Block</button>-->\n" +
    "                                                        <button type=\"button\" class=\"btn btn-default\" ng-click=\"point.commandSet.selectToggle( command)\">Select <i ng-class=\"command.selectClasses\"></i></button>\n" +
    "                                                    </div>\n" +
    "\n" +
    "                                                    <button ng-if=\"!command.isSetpoint\" type=\"button\" class=\"btn btn-primary\" ng-click=\"point.commandSet.execute( command, $index)\" style=\"opacity: {{point.commandSet.selectedCommand === command ? 1 : 0}};\">\n" +
    "                                                        Execute <span style=\"padding-right: 0.5em;\"> </span><i ng-class=\"command.executeClasses\"></i>\n" +
    "                                                    </button>\n" +
    "\n" +
    "                                                    <div ng-if=\"command.isSetpoint\" class=\"input-group input-group-sm-  {{form.setpoint_value.$error.pattern ? 'has-error' : ''}}\" style=\"opacity: {{point.commandSet.selectedCommand === command ? 1 : 0}};\">\n" +
    "                                                        <input type=\"text\" class=\"form-control\" ng-model=\"command.setpointValue\" name=\"setpoint_value\" ng-pattern=\"command.pattern\" style=\"width:6em;\" placeholder=\"{{ command.placeHolder}}\">\n" +
    "                                                        <button type=\"button\" class=\"btn btn-primary\" ng-click=\"point.commandSet.execute( command, $index)\" style=\"border-top-left-radius: 0; border-bottom-left-radius: 0;\">\n" +
    "                                                            Set\n" +
    "                                                            <span style=\"padding-right: 0.5em;\"> </span><i ng-class=\"command.executeClasses\"></i>\n" +
    "                                                        </button>\n" +
    "                                                    </div>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </form>\n" +
    "\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-1\">\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"col-md-1\">\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-10\">\n" +
    "                                    <alert ng-repeat=\"alert in point.commandSet.alerts\" type=\"alert.type\" close=\"point.commandSet.closeAlert($index)\" style=\"text-align: left; white-space: normal;\">{{alert.message}}</alert>\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-1\">\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                    </tbody>\n" +
    "                </table>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <!--<div ng-include src=\"'/partials/loadingprogress.html'\"></div>-->\n" +
    "\n" +
    "    <!--<div class=\"navbar-fixed-bottom invisible\">-->\n" +
    "        <!--<div class=\"gb-chart\" ng-repeat=\"chart in charts\">-->\n" +
    "            <!--<div class=\"gb-win\" >-->\n" +
    "                <!--<div class=\"gb-win-titlebar clearfix\">-->\n" +
    "                    <!--<p class=\"gb-win-title\"><span class=\"glyphicon glyphicon-stats\" style=\"top: 0; vertical-align: top; margin-right:4px\"></span> <span>{{ chart.name }}</span></p>-->\n" +
    "                    <!--<div class=\"gb-win-actions\">-->\n" +
    "                        <!--<a href=\"\" ng-click=\"\"><i class=\"glyphicon glyphicon-minus icon-white\" style=\"margin-top: 5px\"></i></a>-->\n" +
    "                        <!--<a href=\"\" ng-click=\"chartPopout($index)\"><i class=\"glyphicon glyphicon-share-alt icon-white\"></i></a>-->\n" +
    "                        <!--<a href=\"\" ng-click=\"chartRemove($index)\"><i class=\"glyphicon glyphicon-remove icon-white\"></i></a>-->\n" +
    "                    <!--</div>-->\n" +
    "                <!--</div>-->\n" +
    "                <!--<ul class=\"nav nav-pills\" style=\"margin-bottom: 5px; font-size: 86%\">-->\n" +
    "                    <!--<li class=\"gb-legend\" ng-repeat=\"point in chart.points\">-->\n" +
    "                        <!--<div class=\"gb-icon-text draggable\" draggable ident=\"point.id\" source=\"chart\" on-drag-success=\"onDragSuccess\">-->\n" +
    "                            <!--<span class=\"gb-legend-text\" style=\"border-bottom-color: {{ $parent.chart.traits.color(point) }}\">{{point.name}}</span>-->\n" +
    "                            <!--<a class=\"gb-remove\" href=\"\" ng-click=\"removePoint( chart, point)\"><span class=\"glyphicon glyphicon-remove\"></span></a>-->\n" +
    "                        <!--</div>-->\n" +
    "                    <!--</li>-->\n" +
    "                <!--</ul>-->\n" +
    "                <!--<div class=\"gb-win-container\">-->\n" +
    "                    <!--<div class=\"gb-win-content\" droppable target=\"chart\" on-drop=\"onDropPoint\">-->\n" +
    "                        <!--<div chart=\"chart.traits\" data=\"chart.points\" selection=\"chart.selection\"  style=\"height: 150px\"></div>-->\n" +
    "                    <!--</div>-->\n" +
    "                <!--</div>-->\n" +
    "            <!--</div>-->\n" +
    "        <!--</div>-->\n" +
    "    <!--</div>-->\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/navigation/navBarTop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/navigation/navBarTop.html",
    "<div class=\"navbar navbar-inverse navbar-fixed-top\" role=\"navigation\">\n" +
    "  <div class=\"container\">\n" +
    "\n" +
    "    <div class=\"navbar-header\">\n" +
    "        <button type=\"button\" class=\"navbar-toggle\" ng-click=\"isCollapsed = !isCollapsed\">\n" +
    "            <span class=\"sr-only\">Toggle navigation</span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "        </button>\n" +
    "        <a class=\"navbar-brand\" href=\"{{ application.route }}\">{{ application.label }}</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"collapse navbar-collapse\" collapse=\"isCollapsed\">\n" +
    "        <ul class=\"nav navbar-nav\" ng-hide=\"loading\">\n" +
    "            <li  ng-repeat=\"item in applicationMenuItems\" ng-class=\"getActiveClass( item)\">\n" +
    "                <a href=\"{{ item.route }}\">{{ item.label }}</a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "        <ul class=\"nav navbar-nav navbar-right\" ng-hide=\"loading\">\n" +
    "            <li class=\"dropdown\" dropdown>\n" +
    "                <a class=\"dropdown-toggle\" dropdown-toggle href>Logged in as {{ userName }} <b class=\"caret\"></b></a>\n" +
    "                <ul class=\"dropdown-menu\">\n" +
    "                    <li ng-repeat=\"item in sessionMenuItems\"><a href=\"{{ item.route }}\">{{ item.label }}</a></li>\n" +
    "                </ul>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("template/navigation/navList.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/navigation/navList.html",
    "<ul class=\"nav nav-list\">\n" +
    "    <li ng-repeat=\"item in navItems\" ng-class=\"getClass(item)\" ng-switch=\"item.type\">\n" +
    "        <a ng-switch-when=\"item\" href=\"{{ item.route }}\">{{ item.label }}</a>\n" +
    "        <span ng-switch-when=\"header\">{{ item.label }}</span>\n" +
    "    </li>\n" +
    "</ul>");
}]);
