/*
 * greenbus-web-views
 * https://github.com/gec/greenbus-web-views

 * Version: 0.1.0-SNAPSHOT - 2014-12-03
 * License: Apache Version 2.0
 */
angular.module("gec.views", ["gec.views.tpls", "gec.views.authentication","gec.views.event","gec.views.measurement","gec.views.navigation","gec.views.rest","gec.views.subscription"]);
angular.module("gec.views.tpls", ["template/event/alarms.html","template/event/events.html","template/navigation/navBarTop.html","template/navigation/navList.html"]);
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

angular.module('gec.views.authentication', ['ngCookies', 'ui.bootstrap', 'ui.keypress']).

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


angular.module('gec.views.event', ['gec.views.subscription']).

  controller('AlarmsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
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

  controller('EventsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
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

  directive('gecAlarms', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/alarms.html',
      controller: 'AlarmsController',
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
  directive('gecEvents', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/events.html',
      controller: 'EventsController'
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


angular.module('gec.views.measurement', ['gec.views.subscription']).
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
  factory('measurement', ['subscription', 'pointIdToMeasurementHistoryMap', function(subscription, pointIdToMeasurementHistoryMap) {

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
      console.log('measurement.subscribeWithHistory ');

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
      console.log('measurement.unsubscribeWithHistory ');

      var measurementHistory = pointIdToMeasurementHistoryMap[ point.id]
      if( measurementHistory )
        measurementHistory.unsubscribe(subscriber)
      else
        console.error('ERROR: meas.unsubscribe point.id: ' + point.id + ' was never subscribed.')
    }

    /**
     * Public API
     */
    return {
      subscribeWithHistory:   subscribeWithHistory,
      unsubscribeWithHistory: unsubscribeWithHistory
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
 * License for the specific language governing permissions and limitations under
 * the License.
 */

angular.module('gec.views.navigation', ['ui.bootstrap', 'gec.views.rest']).
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



angular.module('gec.views.rest', ['gec.views.authentication']).
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

angular.module('gec.views.subscription', ['gec.views.authentication']).

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

angular.module("template/event/alarms.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/alarms.html",
    "<table class=\"table table-condensed\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th>State</th>\n" +
    "        <th>Type</th>\n" +
    "        <th>Sev</th>\n" +
    "        <th>User</th>\n" +
    "        <th>Message</th>\n" +
    "        <th>Time</th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"alarm in alarms\">\n" +
    "        <td>{{alarm.state}}</td>\n" +
    "        <td>{{alarm.event.eventType}}</td>\n" +
    "        <td>{{alarm.event.severity}}</td>\n" +
    "        <td>{{alarm.event.agent}}</td>\n" +
    "        <td>{{alarm.event.message}}</td>\n" +
    "        <td>{{alarm.event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>");
}]);

angular.module("template/event/events.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/events.html",
    "<table class=\"table table-condensed\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th>Type</th>\n" +
    "        <th>Alarm</th>\n" +
    "        <th>Sev</th>\n" +
    "        <th>User</th>\n" +
    "        <th>Message</th>\n" +
    "        <th>Time</th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr class=\"gec-event\" ng-repeat=\"event in events\">\n" +
    "        <td>{{event.eventType}}</td>\n" +
    "        <td>{{event.alarm}}</td>\n" +
    "        <td>{{event.severity}}</td>\n" +
    "        <td>{{event.agent}}</td>\n" +
    "        <td>{{event.message}}</td>\n" +
    "        <td>{{event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
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
