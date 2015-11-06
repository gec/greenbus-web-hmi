/*
 * greenbus-web-views
 * https://github.com/gec/greenbus-web-views

 * Version: 0.1.0-SNAPSHOT - 2015-11-06
 * License: Apache-2.0
 */
angular.module("greenbus.views", ["greenbus.views.tpls", "greenbus.views.assert","greenbus.views.authentication","greenbus.views.chart","greenbus.views.command","greenbus.views.endpoint","greenbus.views.equipment","greenbus.views.ess","greenbus.views.event","greenbus.views.measurement","greenbus.views.measurementValue","greenbus.views.navigation","greenbus.views.notification","greenbus.views.point","greenbus.views.property","greenbus.views.request","greenbus.views.rest","greenbus.views.schematic","greenbus.views.selection","greenbus.views.subscription"]);
angular.module("greenbus.views.tpls", ["greenbus.views.template/chart/chart.html","greenbus.views.template/chart/charts.html","greenbus.views.template/command/command.html","greenbus.views.template/endpoint/endpoints.html","greenbus.views.template/equipment/equipment.html","greenbus.views.template/ess/esses.html","greenbus.views.template/event/alarms.html","greenbus.views.template/event/alarmsAndEvents.html","greenbus.views.template/event/events.html","greenbus.views.template/measurement/measurements.html","greenbus.views.template/measurementValue/measurementValue.html","greenbus.views.template/navigation/navBarTop.html","greenbus.views.template/navigation/navList.html","greenbus.views.template/notification/notification.html","greenbus.views.template/point/pointsTable.html","greenbus.views.template/property/propertiesTable.html","greenbus.views.template/selection/selectAll.html"]);
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

angular.module('greenbus.views.assert', []).

  factory('assert', [ function(){

    var exports = {}  // public API


    exports.stringNotEmpty = function( s, message) {
      if( typeof s !== 'string' || s === '' || s === undefined || s === null) {
        message = message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( s) + ' is empty or undefined or not a string'
        console.error( messageFull)
        throw messageFull
      }
    }

    exports.stringEmpty = function( s, message) {
      if( typeof s !== 'string' || s !== '') {
        message =  message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( s) + ' is not empty or undefined or not a string'
        console.error( messageFull)
        throw messageFull
      }
    }

    exports.equals = function( a, b, message) {
      if( a !== b) {
        message =  message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( a) + ' is not equal to ' + JSON.stringify( a)
        console.error( messageFull)
        throw messageFull
      }
    }

    /**
     * Public API
     */
    return exports

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

          var redirectLocation = $location.path() // or $location.url() ?
          var absUrl = $location.absUrl()
          console.log( 'authenticationInterceptor: redirectLocation 1 =' + redirectLocation)


          // If we're already on the login page, we don't redirect on failed login.
          if( absUrl.indexOf('/login') < 0 && redirectLocation.indexOf( '/login') !== 0){

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
 * Copyright 2014-2015 Green Energy Corp.
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
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.chart', ['greenbus.views.measurement', 'greenbus.views.rest', 'greenbus.views.request']).

  /**
   * Control multiple charts. This is the controller for the charts at the bottom of the application window.
   *
   * Any controller that would like a new chart makes a request to this controller
   * via request.push( 'gb-chart.addChart', points).
   *
   */
  controller( 'gbChartsController', [ '$scope', '$window', 'measurement', 'rest', 'request',
    function( $scope, $window, measurement, rest, request) {

      var REQUEST_ADD_CHART = 'gb-chart.addChart',
          historyConstraints ={
            time: 1000 * 60 * 60 * 2, // 2 hours
            size: 60 * 60 * 2 * 10, // 2 hours of 10 measurements per second data
            throttling: 5000
          },
          trend = {
            track:  'current-time',
            domain: {
              interval: d3.time.hour,
              count: 2
            }
          }

      $scope.charts = []


      function subscribeToMeasurementHistory( chart, point ) {
        var firstNotify = true

        function notify() {
          if( firstNotify) {
            firstNotify = false
            chart.trendStart( 300)
          }
        }

        point.measurements = measurement.subscribeWithHistory( $scope, point, historyConstraints, chart, notify )
      }

      function unsubscribeToMeasurementHistory( chart, point ) {
        measurement.unsubscribeWithHistory( point, chart )
      }

      $scope.onDropPoint = function ( pointId, chart ) {
        console.log( 'onDropPoint chart=' + chart.name + ' pointId=' + pointId )
        if( ! chart.pointExists( pointId)) {
          var url = '/models/1/points/' + pointId
          rest.get( url, null, $scope, function(point) {
            chart.addPoint( point)
            subscribeToMeasurementHistory( chart, point )
          });
        }

      }

      $scope.onDragSuccess = function ( id, chart ) {
        console.log( 'onDragSuccess chart=' + chart.name + ' id=' + id )

        $scope.$apply( function () {
          var point = chart.getPointByid( id)
          $scope.removePoint( chart, point, true )
        } )
      }

      $scope.removePoint = function ( chart, point, keepSubscription ) {

        chart.removePoint( point)
        // if( ! keepSubscription)
        unsubscribeToMeasurementHistory( chart, point );

        if( chart.isEmpty()) {
          var index = $scope.charts.indexOf( chart )
          $scope.chartRemove( index )
        }

      }

      $scope.chartRemove = function ( index ) {

        var chart = $scope.charts[index]
        chart.trendStop()

        chart.points.forEach( function ( point ) {
          unsubscribeToMeasurementHistory( chart, point )
        } )
        $scope.charts.splice( index, 1 )
      }

      // Pop the chart out into a new browser window.
      // The new window can access the intended chart via $window.opener.coralChart;
      $scope.chartPopout = function ( index ) {

        var chart = $scope.charts[index],
            pointIds = chart.points.map( function( p) { return p.id}),
            queryString = rest.queryParameterFromArrayOrString( 'pids', pointIds)
        $window.open(
          '/apps/chart/popout#/?' + queryString,
          '_blank',
          'resizeable,top=100,left=100,height=400,width=600,location=no,toolbar=no'
        )

        $scope.chartRemove( index)
      }


      /**
       * Some controller requested that we add a new chart with the specified points.
       */
      $scope.$on( REQUEST_ADD_CHART, function() {
        var points = request.pop( REQUEST_ADD_CHART);
        while( points) {
          var chart = new GBChart( points, trend),
              i = chart.points.length
          $scope.charts.push( chart )
          while( --i >= 0) {
            subscribeToMeasurementHistory( chart, chart.points[i] )
          }

          // Is there another chart request?
          points = request.pop( REQUEST_ADD_CHART)
        }
      });

    }]).


  /**
   * Controller for a single chart (like inside the pop-out window).
   */
  controller( 'gbChartController', ['$scope', '$window', '$location', 'measurement', 'rest', function( $scope, $window, $location, measurement, rest) {

    var queryObject = $location.search()

    var pointIds = ! queryObject.hasOwnProperty( 'pids') ? []
          : angular.isArray( queryObject.pids) ? queryObject.pids
          : [queryObject.pids],
        documentElement = $window.document.documentElement,
        firstPointLoaded = false,
        historyConstraints ={
          time: 1000 * 60 * 60 * 4, // 4 hours
          size: 60 * 60 * 4 * 10, // 4 hours of 10 measurements per second data
          throttling: 5000
        },
        trend = {
          track:  'current-time',
          domain: {
            interval: d3.time.hour,
            count: 4
          }
        }


    documentElement.style.overflow = 'hidden';  // firefox, chrome
    $window.document.body.scroll = 'no'; // ie only

    $scope.loading = true
    $scope.chart = new GBChart( [], trend, true)  // t: zoomSlider
    console.log( 'gbChartController query params: ' + pointIds)

    if( pointIds.length > 0) {
      var url = '/models/1/points?' + rest.queryParameterFromArrayOrString( 'pids', pointIds)
      rest.get( url, 'points', $scope, function( data) {
        data.forEach( function( point) {
          $scope.chart.addPoint( point)
          subscribeToMeasurementHistory( $scope.chart, point )
        })
        $scope.invalidateWindow()
      })
    }

    function notifyMeasurements() {
      if( !firstPointLoaded) {
        firstPointLoaded = true
        $scope.loading = false
        $scope.$digest()
        $scope.chart.traits.invalidate( 'resize', 0)
        $scope.chart.brushTraits.invalidate( 'resize', 0)
        $scope.chart.trendStart( 300)
      }
    }

    function subscribeToMeasurementHistory( chart, point) {
      point.measurements = measurement.subscribeWithHistory( $scope, point, historyConstraints, chart, notifyMeasurements)
    }

    function unsubscribeToMeasurementHistory( chart, point) {
      measurement.unsubscribeWithHistory( point, chart)
    }

    /**
     * A new point was dropped on us. Add it to the chart.
     * @param uuid
     */
    $scope.onDropPoint = function( pointId) {
      console.log( 'dropPoint uuid=' + pointId)
      // Don't add a point that we're already charting.
      if( ! $scope.chart.pointExists( pointId)) {
        var url = '/models/1/points/' + pointId
        rest.get( url, null, $scope, function(point) {
          $scope.chart.addPoint( point)
          subscribeToMeasurementHistory( $scope.chart, point )
        });
        $scope.invalidateWindow()
      }
    }

    /**
     * One of our points was dragged away from us.
     * @param uuid
     * @param chart
     */
    $scope.onDragSuccess = function( uuid, chart) {
      console.log( 'onDragSuccess chart=' + chart.name + ' uuid=' + uuid)

      $scope.$apply(function () {
        var point =  $scope.chart.getPointByid( uuid)
        $scope.removePoint( point, true)
      })
    }

    $scope.removePoint = function( point, keepSubscription) {
      var chart = $scope.chart,
          index = chart.points.indexOf( point);
      chart.removePoint(point);
      if( ! keepSubscription)
        unsubscribeToMeasurementHistory( chart, point);

      if( chart.points.length <= 0) {
        $scope.chartRemove()
      }
      $scope.invalidateWindow()
    }

    $scope.chartRemove = function() {
      $scope.chart.trendStop()
      $scope.chart.points.forEach( function( point) {
        unsubscribeToMeasurementHistory( $scope.chart, point)
      });
      delete $scope.chart;
    }

    $window.addEventListener( 'unload', function( event) {
      $scope.chartRemove()
    })

  }]).

  directive( 'gbCharts', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/chart/charts.html',
      controller: 'gbChartsController'
    }
  }).
  directive( 'gbChart', [ '$window', '$timeout', 'gbChartDivSize', function($window, $timeout, gbChartDivSize){

    function getDivs( element) {
      var gbWinChilren = element.children().eq(0).children(),
          titlebar = gbWinChilren.eq(0),
          labels = gbWinChilren.eq(1),
          chartContainer = gbWinChilren.eq(2),
          gbWinContent = chartContainer.children().eq(0),
          gbWinContentChildren = gbWinContent.children()

      return {
        titlebar: titlebar,
        labels: labels,
        chartContainer: chartContainer,
        gbWinContent: gbWinContent,
        chartMain: gbWinContentChildren.eq(0),
        chartBrush: gbWinContentChildren.eq(1)
      }
    }


    function gbChartLink(scope, element, attrs) {

      var w = angular.element($window),
          windowSize = new d3.trait.Size( gbChartDivSize.width(), gbChartDivSize.height()),
          divs = getDivs( element),
          sizes = {
            container: new d3.trait.Size(),
            main: new d3.trait.Size(),
            brush: new d3.trait.Size()
          }

      scope.getSize = function () {
        windowSize.width = gbChartDivSize.width()    //documentElement.clientWidth
        windowSize.height = gbChartDivSize.height()  //documentElement.clientHeight

        var size = '' + windowSize.width + ' ' + windowSize.height
        return size
      };

      function invalidateDo() {
        var top = divs.chartContainer.prop('offsetTop'),
            left = divs.chartContainer.prop('offsetLeft'),
            newSize = new d3.trait.Size( windowSize.width - left, windowSize.height - top)

        if( sizes.container.width !== newSize.width || sizes.container.height !== newSize.height) {
          sizes.container.width = newSize.width
          sizes.container.height = newSize.height
          sizes.main.width = newSize.width
          sizes.brush.width = newSize.width

          if( sizes.container.height <= 150) {
            sizes.main.height = Math.max( sizes.container.height, 20)
            sizes.brush.width = 0
            sizes.brush.height = 0
          } else {
            sizes.brush.height = Math.floor( sizes.container.height * 0.18)
            if( sizes.brush.height < 60)
              sizes.brush.height = 60
            else if( sizes.brush.height > 100)
              sizes.brush.height = 100
            sizes.main.height = sizes.container.height - sizes.brush.height
          }

          //console.log( 'gbChart scope.watch size change main=' + sizes.main.height + ' brush=' + sizes.brush.height + ' ********************')

          scope.styleMain = function () {
            return {
              'height': sizes.main.height + 'px',
              'width': '100%'
            };
          }

          scope.styleBrush = function () {
            return {
              'height': sizes.brush.height + 'px',
              'width': '100%'
            };
          }

          scope.$digest()
          scope.chart.traits.size( sizes.main)
          scope.chart.brushTraits.size( sizes.brush)

        } else {
          //console.log( 'gbChart scope.watch size change none')
        }

      }
      scope.invalidateWindow = function() {
        $timeout( invalidateDo)
      }
      scope.$watch(scope.getSize, function (newValue, oldValue) {
        scope.invalidateWindow()
      }, false)

      w.bind('resize', function () {
        scope.$apply();
      });
    }

    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/chart/chart.html',
      controller: 'gbChartController',
      link: gbChartLink
    }
  }]).
  directive('chart', function() {
    return {
      restrict: 'A',
      scope: {
        chart: '=',  // chart traits
        data: '=',    // binding to data in controller
        selection: '='    // give controller binding to d3 selection
      },
      link: function (scope, elem, attrs) {
        var chartEl

        chartEl = d3.select(elem[0])
        scope.selection = chartEl.datum( scope.data)
        scope.chart.call( scope.selection)
        if( scope.data && scope.data.length > 0)
          console.log( 'directive.chart chart.call scope.data[0].measurements.length=' + scope.data[0].measurements.length)
        else
          console.log( 'directive.chart chart.call scope.data null or length=0')

        scope.update = function() {
          //console.log( 'ReefAdmin.directives chart update')
          scope.chart.update( 'trend')
        }

      }
    };
  }).
  directive('draggable', function() {
    // from http://blog.parkji.co.uk/2013/08/11/native-drag-and-drop-in-angularjs.html
    return {
      restrict: 'A',
      scope: {
        ident: '=',
        source: '=?',
        onDragSuccess: '=?'
      },
      link: function (scope, elem, attrs) {

        var el = elem[0]
        el.draggable = true

        el.addEventListener(
          'dragstart',
          function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('Text', scope.ident);
            this.classList.add('drag');
            return false;
          },
          false
        );

        el.addEventListener(
          'dragend',
          function(e) {
            this.classList.remove('drag');

            if(e.dataTransfer.dropEffect !== 'none' && scope.onDragSuccess) {
              scope.onDragSuccess( scope.ident, scope.source)
            }

            return false;
          },
          false
        );

      }
    };
  }).
  directive('droppable', function() {
    return {
      scope: {
        onDrop: '=',
        target: '=?'
      },
      replace: false,
      link: function(scope, element) {
        // again we need the native object
        var el = element[0];
        el.addEventListener(
          'dragover',
          function(e) {
            e.dataTransfer.dropEffect = 'move';
            // allows us to drop
            if (e.preventDefault) e.preventDefault();
            this.classList.add('over');
            return false;
          },
          false
        )
        el.addEventListener(
          'dragenter',
          function(e) {
            this.classList.add('over');
            return false;
          },
          false
        )

        el.addEventListener(
          'dragleave',
          function(e) {
            this.classList.remove('over');
            return false;
          },
          false
        )
        el.addEventListener(
          'drop',
          function(e) {
            // Stops some browsers from redirecting.
            if (e.stopPropagation) e.stopPropagation();

            this.classList.remove('over');

            var ident = e.dataTransfer.getData('Text');
            scope.onDrop( ident, scope.target)

            return false;
          },
          false
        );
      }
    }
  }).

  factory('gbChartDivSize', ['$window', function( $window) {
    var w = angular.element($window),
        getWidth =  (typeof w.width === 'function') ?
          function() { return w.width()}
          : function() { return w.prop('innerWidth')},
        getHeight =  (typeof w.height === 'function') ?
          function() { return w.height() }
          : function() { return w.prop('innerHeight')}
    /**
     * Public API
     */
    return {
      width: function () { return getWidth()},
      height: function () { return getHeight()}
    }
  }])



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

/**
 *
 * @param _points  Array of points
 * @param _brushChart Boolean True if brush chart should be created
 */
function GBChart( _points, trend, _brushChart) {

  var self = this
  self.points = copyPoints( _points)
  self.trend = angular.copy( trend) // deep copy
  self.unitMap = getChartUnits( self.points )
  self.name = makeNameFromPoints( self.points )
  self.traits = makeChartTraits( self.unitMap )
  self.selection = null
  self.brushChart = _brushChart
  self.brushTraits = _brushChart ? makeBrushTraits() : undefined
  self.brushSelection = null
  self.trendTimer = null


  self.isEmpty = function() {
    return self.points.length <= 0
  }

  function copyPoints( points) {
    var newPoints = []
    points.forEach( function( p) {
      newPoints.push( angular.extend( {}, p))
    })
    return newPoints
  }

  function makeNameFromPoints( points) {
    switch( points.length) {
      case 0: return '...'
      case 1: return points[0].name
      default: return points[0].name + ', ...'
    }
  }

  function makeChartConfig( unitMapKeys, size ) {
    var axis,
        config = {
          x1: function ( d ) { return d.time; },
          seriesData: function ( s ) { return s.measurements },
          seriesLabel: function ( s ) { return s.uniqueName }
        }

    if( size)
      config.size = {
        width: size.width,
        height: size.height
      }

    unitMapKeys.forEach( function ( key, index ) {
      axis = 'y' + (index + 1)
//          if( key === 'raw')
//            config[axis] = function ( d ) { return d.value ? 1 : 0; }
//          else
      config[axis] = function ( d ) { return d.value; }
    })
    return config
  }

  function getChartUnits( points ) {
    var units = {}

    points.forEach( function ( point ) {
      if( !units.hasOwnProperty( point.unit ) )
        units[point.unit] = [ point]
      else
        units[point.unit].push( point )
    })
    return units
  }

  function makeChartConfigScaleX1() {
    // If we have a brush chart, then we'll be manually controlled by brush.
    return self.brushChart ? { axis: 'x1', domain: 'manual' }
      : { axis: 'x1', trend: self.trend }
  }

  function makeChartTraits( unitMap, size ) {
    var gridLines = true,
        unitMapKeys = Object.keys( unitMap ),
        config = makeChartConfig( unitMapKeys, size ),
        chartTraits = d3.trait( d3.trait.chart.base, config )
          .trait( d3.trait.scale.time, makeChartConfigScaleX1())

    console.log( 'makeChartTraits unitMapKeys ' + unitMapKeys)
    unitMapKeys.forEach( function ( unit, index ) {
      var axis = 'y' + (index + 1),
          filter = function ( s ) {
            return s.unit === unit
          },
          orient = index === 0 ? 'left' : 'right'

      var interpolate = 'step-after',
          scaleConfig = { axis: axis, seriesFilter: filter, unit: unit }

      if( unit === 'raw' || unit === 'status' || unit === '') {
        interpolate = 'step-after'
        scaleConfig.domain = [0, 5]
      } else {
        scaleConfig.domainPadding = 0.05
      }

      chartTraits = chartTraits.trait( d3.trait.scale.linear, scaleConfig )
        .trait( d3.trait.chart.line, {
          interpolate: interpolate,
          trend: true,
          seriesFilter: filter,
          yAxis: axis,
          focus: {distance: 1000, axis: 'x'}
        } )
        .trait( d3.trait.axis.linear, { axis: axis, orient: orient, ticks: undefined, label: unit, gridLines: gridLines} )
      gridLines = false
    })

    var xAxisTicks = self.brushChart ? 10 : 4
    chartTraits = chartTraits.trait( d3.trait.axis.time.month, { axis: 'x1', ticks: xAxisTicks, gridLines: true} )
      .trait(d3.trait.focus.crosshair, {})
      .trait( d3.trait.focus.tooltip.unified, {
        formatY: d3.format('.2f'),
        formatHeader: function( d) { return 'Time: ' + moment(d).format( 'HH:mm:ss') }
      })

    self.config = config
    return chartTraits
  }

  function makeBrushTraits( size) {
    var brushTraits

    var config = angular.extend( {}, self.config)
    if( size)
      config.size = {
        width: size.width,
        height: size.height
      }


    brushTraits = d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, { axis: 'x1', trend: self.trend})
      .trait( d3.trait.scale.linear, { axis: 'y1' })
      .trait( d3.trait.chart.line, { interpolate: 'step-after' })
      .trait( d3.trait.control.brush, { axis: 'x1', target: self.traits, targetAxis: 'x1'})
      .trait( d3.trait.axis.time.month, { axis: 'x1', ticks: 3})
      .trait( d3.trait.axis.linear, { axis: 'y1', extentTicks: true})

    return brushTraits
  }

  self.getPointByid = function( pointId) {
    var i, point,
        length = self.points.length

    for( i = 0; i < length; i++ ) {
      point = self.points[i]
      if( point.id === pointId )
        return point
    }
    return null
  }

  self.pointExists = function( pointId) {
    return self.getPointByid( pointId) != null
  }

  self.callTraits = function( ) {
//    if( $timeout) {
//      // Use timeout so the digest cycle can update the css width/height
//      $timeout( function() {
//        self.traits.call( self.selection )
//        if( self.brushTraits)
//          self.brushTraits.call( self.brushSelection )
//      })
//    } else {
      self.traits.call( self.selection )
      if( self.brushTraits)
        self.brushTraits.call( self.brushSelection )
//    }
  }

  self.addPoint = function( point) {
    if( !point.measurements )
      point.measurements = []

    self.points.push( point );
    delete point.__color__;
    self.uniqueNames()

    if( self.unitMap.hasOwnProperty( point.unit ) ) {
      self.unitMap[point.unit].push( point )
    } else {
      self.unitMap[point.unit] = [point]
    }

    var size = self.traits.size()
    self.traits.remove()
    self.traits = makeChartTraits( self.unitMap, size )

    if( self.brushChart) {
      size = self.brushTraits.size()
      self.brushTraits.remove()
      self.brushTraits = makeBrushTraits( size)
    }

    self.callTraits()
  }

  self.removePoint = function( point) {
    if( ! point)
      return

    var index = self.points.indexOf( point );
    self.points.splice( index, 1 );

    if( self.points.length > 0 ) {
      var pointsForUnit = self.unitMap[ point.unit]
      index = pointsForUnit.indexOf( point )
      pointsForUnit.splice( index, 1 )

      if( pointsForUnit.length <= 0 ) {
        delete self.unitMap[point.unit];
        self.traits.remove()
        self.traits = makeChartTraits( self.unitMap )
      }

      self.callTraits()
    }

    self.uniqueNames()
  }

  self.trendStart = function( interval, duration) {
    if( duration === undefined)
      duration = interval * 0.95

    var traits = self.brushChart ? self.brushTraits : self.traits
    traits.update( 'trend', duration)

    self.trendTimer = setInterval( function() {
      traits.update( 'trend', duration)
    }, interval)
  }

  self.trendStop = function( ) {
    if( self.trendTimer) {
      clearInterval( self.trendTimer)
      self.trendTimer = null
    }
  }

  // typ is usually 'trend'
  self.invalidate = function( typ, duration) {
    if( self.brushChart)
      self.brushTraits.invalidate( typ, duration)
    else
      self.traits.invalidate( typ, duration)
  }

  // typ is usually 'trend'
  self.update = function( typ, duration) {
    if( self.brushChart)
      self.brushTraits.update( typ, duration)
    else
      self.traits.update( typ, duration)
  }

  function isSamePrefix( index, points) {
    var prefix = points[0].name.substr( 0, index),
        i = points.length - 1
    while( i >= 1){
      if( points[i].name.substr( 0, index) !== prefix)
        return false
      i--
    }
    return true
  }

  function assignUniqueName( index, points) {
    var p,
        i = points.length - 1

    while( i >= 0){
      p = points[i]
      p.uniqueName = p.name.substr( index)
      i--
    }
  }

  self.uniqueNames = function() {
    if( self.points.length === 0)
      return
    var pre,
        n = self.points[0].name,
        l = n.length,
        i = n.indexOf( '.') + 1

    // if not '.' or dot is too near end, return.
    if( i < 0 || i > l - 6) {
      assignUniqueName( 0, self.points)  // give up. Just use the whole name.
      return
    }

    if( isSamePrefix( i, self.points))
      assignUniqueName( i, self.points)

  }

  // TODO: Still see a NaN error when displaying chart before we have data back from subscription
  self.points.forEach( function ( point ) {
    if( !point.measurements )
      point.measurements = [ /*{time: new Date(), value: 0}*/]
  })

  self.uniqueNames()

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


angular.module('greenbus.views.command', []).

  factory('gbCommandRest', ['rest', function( rest) {

    var exports = {}

    exports.select = function(accessMode, commandIds, success, failure) {
      var arg = {
        accessMode: accessMode,
        commandIds: commandIds
      }
      return rest.post('/models/1/commandlock', arg, null, null, success, failure)
    }

    exports.deselect = function(lockId, success, failure) {
      return rest.delete('/models/1/commandlock/' + lockId, null, null, success, failure)
    }

    exports.execute = function(commandId, args, success, failure) {
      return rest.post('/models/1/commands/' + commandId, args, null, null, success, failure)
    }

    return exports
  }]).

  factory('gbCommandEnums', function() {

    return {
      States: {
        NotSelected: 'NotSelected',   // -> Selecting
        Selecting: 'Selecting',       // -> Selected, NotSelected (unauthorized or failure)
        Selected: 'Selected',         // -> Executing, NotSelected, Deselecting (user or timeout)
        Deselecting: 'Deselecting',   // -> Executing, NotSelected (user or timeout)
        Executing: 'Executing'        // -> NotSelected (success or failure)
      },
      CommandIcons: {
        NotSelected: 'fa fa-chevron-right text-primary',
        Selecting:   'fa fa-chevron-right text-primary fa-spin',
        Selected:    'fa fa-chevron-left text-primary',
        Deselecting: 'fa fa-chevron-left text-primary fa-spin',
        Executing:   'fa fa-chevron-left text-primary'
      },
      ExecuteIcons: {
        NotSelected: '',
        Selecting:   '',
        Selected:    'fa fa-sign-in',
        Deselecting: 'fa fa-sign-in',
        Executing:   'fa fa-refresh fa-spin'
      }

    }
  }).

  controller( 'gbCommandController', ['$scope', 'gbCommandRest', 'gbCommandEnums', '$timeout', function( $scope, gbCommandRest, gbCommandEnums, $timeout) {
    var selectTimer, lock,
        States = gbCommandEnums.States,
        CommandIcons = gbCommandEnums.CommandIcons,
        ExecuteIcons = gbCommandEnums.ExecuteIcons

    // $scope.model holds the command as returned from the server.
    $scope.replyError = undefined
    $scope.state = States.NotSelected
    $scope.isSelected = false

    $scope.selectClasses = CommandIcons[ States.NotSelected]
    $scope.executeClasses = ExecuteIcons[ States.NotSelected]
    $scope.isSetpointType = $scope.model.commandType.indexOf('SETPOINT') === 0
    if( $scope.isSetpointType) {
      $scope.setpoint = { value: ''} // MUST be an object for input text for 2-way binding with <input/>!!!

      switch( $scope.model.commandType) {
        case 'SETPOINT_INT':
          $scope.pattern = /^[+-]?\d+$/;
          $scope.placeHolder = 'int'
          break
        case 'SETPOINT_DOUBLE':
          $scope.pattern = /^[-+]?\d+(\.\d+)?$/;
          $scope.placeHolder = 'decimal'
          break
        case 'SETPOINT_STRING':
          $scope.pattern = undefined;
          $scope.placeHolder = 'text'
          break
        default:
          break
      }

    }

    /**
     * Called by onClick in template
     * @param command
     */
    $scope.selectToggle = function( ) {
      $scope.replyError = undefined
      switch( $scope.state) {
        case States.NotSelected: $scope.select(); break;
        case States.Selecting:   break;
        case States.Selected:    $scope.deselect(); break;
        case States.Executing:   break;
      }
    }

    function setState( state) {
      console.log( 'setState from ' + $scope.state + ' to ' + state)
      $scope.state = state
      $scope.isSelected = state === States.Selected || state === States.Deselecting || state === States.Executing
      $scope.selectClasses = CommandIcons[$scope.state]
      $scope.executeClasses = ExecuteIcons[$scope.state]
      console.log( 'gbCommandController.setState ' + $scope.model.name + ' ' + $scope.state + ', selectClasses ' + $scope.selectClasses + ', executeClasses ' + $scope.executeClasses)

      if( state === States.NotSelected && $scope.isSetpointType && $scope.pattern && !$scope.pattern.test( $scope.setpoint.value)) {
        // If the setpoint value is not visible, but is invalid, there will be a red box around the whole form
        // and the operator won't see anything wrong. Clear the setpoint value to prevent this.
        $scope.setpoint.value = ''
      }
    }
    
    function cancelSelectTimer() {
      if( selectTimer) {
        $timeout.cancel( selectTimer)
        selectTimer = undefined
      }
    }

    $scope.select = function() {

      if( $scope.state !== States.NotSelected) {
        console.error( 'gbCommandController.select invalid state: ' + $scope.state)
        return
      }

      setState( States.Selecting)

      gbCommandRest.select( 'ALLOWED', [$scope.model.id],
        function( data) {
          lock = data
          if( lock.expireTime) {
            setState( States.Selected)

            var delay = lock.expireTime - Date.now()
            console.log( 'commandLock delay: ' + delay)
            // It the clock for client vs server is off, we'll use a minimum delay.
            delay = Math.max( delay, 10)
            selectTimer = $timeout(function () {
              lock = undefined
              selectTimer = undefined
              if( $scope.state === States.Selected || $scope.state === States.Deselecting || $scope.state === States.Executing)
                setState( States.NotSelected)
            }, delay)
          } else {
            lock = undefined
            deselected()
            alertDanger( 'Select failed. ' + data)
          }
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbCommandController.select ' + JSON.stringify( ex))
          alertException( ex)
          deselected()
        })
    }

    function deselected() {
      setState( States.NotSelected)
    }


    $scope.deselect = function() {

      if( $scope.state !== States.Selected) {
        console.error( 'gbCommandController.deselect invalid state: ' + $scope.state)
        return
      }

      setState( States.Deselecting)

      gbCommandRest.deselect( lock.id,
        function( data) {
          lock = undefined
          cancelSelectTimer()
          if( $scope.state === States.Deselecting)
            setState( States.NotSelected)
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbCommandController.deselect ' + JSON.stringify( ex))
          if( $scope.state === States.Deselecting)
            setState( States.Selected)
          alertException( ex)
        })
    }

    $scope.execute = function() {
      console.log( 'gbCommandController.execute state: ' + $scope.state)
      $scope.replyError = undefined

      if( $scope.state !== States.Selected) {
        console.error( 'gbCommandController.execute invalid state: ' + $scope.state)
        return
      }

      var args = {
        commandLockId: lock.id
      }

      if( $scope.isSetpointType) {

        if ($scope.setpoint.value === undefined || ($scope.pattern && !$scope.pattern.test($scope.setpoint.value))) {
          console.log('gbCommandController.execute ERROR: setpoint value is invalid "' + $scope.setpoint.value + '"')
          switch ($scope.model.commandType) {
            case 'SETPOINT_INT':
              alertDanger('Setpoint needs to be an integer value.');
              return;
            case 'SETPOINT_DOUBLE':
              alertDanger('Setpoint needs to be a decimal value.');
              return;
            case 'SETPOINT_STRING':
              alertDanger('Setpoint needs to have a text value.');
              return;
            default:
              alertDanger('Setpoint value "' + $scope.setpoint.value + '" is invalid. Unknown setpoint command type: "' + $scope.model.commandType + '".')
              console.error('Setpoint has unknown error, "' + $scope.setpoint.value + '" for command type ' + $scope.model.commandType)
              return
          }
        }

        switch ($scope.model.commandType) {
          case 'SETPOINT_INT':
            args.setpoint = {intValue: Number($scope.setpoint.value)}
            break
          case 'SETPOINT_DOUBLE':
            args.setpoint = {doubleValue: Number($scope.setpoint.value)}
            break
          case 'SETPOINT_STRING':
            args.setpoint = {stringValue: $scope.setpoint.value}
            break
          default:
            console.error('Setpoint has unknown type, "' + $scope.setpoint.value + '" for command type ' + $scope.model.commandType);
            break
        }
      }

      setState(States.Executing)

      gbCommandRest.execute($scope.model.id, args,
        function (commandResult) {
          cancelSelectTimer()
          alertCommandResult(commandResult)
          deselected()
        },
        function (ex, statusCode, headers, config) {
          console.log('gbCommandController.execute ' + JSON.stringify(ex))
          cancelSelectTimer()
          deselected()
          alertException(ex)
        })
    }

    function alertCommandResult( result) {
      console.log( 'alertCommandResult: result.status "' + result.status + '"')
      if( result.status !== 'SUCCESS') {
        console.log( 'alertCommandResult: result.error "' + result.error + '"')
        var message = result.status
        if( result.error)
          message += ':  ' + result.error
        $scope.replyError = message
      }
    }

    function alertException( ex) {
      console.log( 'gbCommandController.alertException ' + JSON.stringify( ex))
      var message = ex.message
      if( message === undefined || message === '')
        message = ex.exception
      $scope.replyError = message
    }

    function alertDanger( message) {
      console.log( 'alertDanger message: ' + JSON.stringify( message))
      $scope.replyError = message
    }


    $scope.$on( '$destroy', function( event ) {
      cancelSelectTimer()
    })

  }]).

  directive( 'gbCommand', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      scope: {
             model : '='
      },
      templateUrl: 'greenbus.views.template/command/command.html',
      controller: 'gbCommandController'
    }
  })

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
        { name: 'SubscribeToEndpoints', 'endpointIds': endpointIds},
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
      templateUrl: 'greenbus.views.template/endpoint/endpoints.html',
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


/**
 * A piece of equipment may have multiple tabs including: Measurements, Properties (aka. key/value), Schematic, etc.
 */
angular.module('greenbus.views.equipment', [ 'ui.router', 'greenbus.views.rest']).

  factory('equipment', [ '$stateParams', '$q', 'rest', function( $stateParams, $q, rest) {

    var pointsCache = {
      url: undefined,
      data: undefined
    }

    function getEquipmentIdsQueryParams( navigationElement) {
      if( ! navigationElement)
        return ''

      var equipmentIds, equipmentIdsQueryParams

      if( navigationElement.equipmentChildren.length > 0 ) {
        equipmentIds = navigationElement.equipmentChildren.map( function( child) { return child.id })
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)
      } else {
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', navigationElement.id)
      }
      return equipmentIdsQueryParams
    }

    /**
     *
     * @param collapsePointsToArray If true, poinrs will always be returned as a list.
     * @returns {Promise}
     */
    function getCurrentPoints( collapsePointsToArray) {
      var navigationElement = $stateParams.navigationElement

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return $q.when( [])

      var equipmentIdsQueryParams = getEquipmentIdsQueryParams( navigationElement),
          depth = rest.queryParameterFromArrayOrString('depth', '9999')


      var delimeter = '?'
      var url = '/models/1/points'

      if( equipmentIdsQueryParams.length > 0 ) {
        url += delimeter + equipmentIdsQueryParams
        delimeter = '&'
      }
      if( depth.length > 0 )
        url += delimeter + depth

      return rest.get(url).then(
        function( response) {
          var points = [],
              data = response.data

          // data is either a array of points or a map of equipmentId -> points[]
          // If it's an object, convert it to a list of points.
          if( collapsePointsToArray && angular.isObject(data) ) {
            for( var equipmentId in data ) {
              points = points.concat(data[equipmentId])
            }
          } else {
            points = data
          }
          return {data: points}
        },
        function( error) {
          return error
        }

      )

    }


    /**
     * Public API
     */
    return {
      getCurrentPoints: getCurrentPoints
    }
  }]).

  controller('gbEquipmentController', ['$scope', '$state', '$stateParams', 'equipment',
    function($scope, $state, $stateParams, equipment) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.shortName = 'loading...'
      $scope.tabs = {
        measurements: false,
        properties: false
      }

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      $scope.name = navigationElement.name || navigationElement.shortName

      var onePieceOfEquipment = navigationElement.equipmentChildren.length === 0
      $scope.tabs = {
        overview: $state.is( 'microgrids.dashboard'),
        measurements: true,
        properties: onePieceOfEquipment,
        points: true
      }

      $scope.pointsPromise = equipment.getCurrentPoints( true)
    }
  ]).

  directive('gbEquipment', function() {
    return {
      restrict:    'E', // Element name
      scope:       true,
      templateUrl: 'greenbus.views.template/equipment/equipment.html',
      controller:  'gbEquipmentController'
    }
  })



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
  
  controller( 'gbEssesController', ['$scope', '$filter', '$stateParams', 'rest', 'measurement', '$location', function( $scope, $filter, $stateParams, rest, measurement, $location) {
    var PT = {
          Point: 'Point',
          Power: 'OutputPower',
          EnergyCapacity: 'EnergyCapacity',
          PowerCapacity: 'PowerCapacity',
          PercentSoc: '%SOC',
          Standby: 'Standby'
        },
        TypeToVarMap = {
          OutputPower: 'power',
          EnergyCapacity: 'energyCapacity',
          PowerCapacity: 'powerCapacity',
          '%SOC': 'percentSoc',
          Standby: 'standby'
        }

    $scope.ceses = []     // our mappings of data from the server
    $scope.searchText = ''
    $scope.sortColumn = 'name'
    $scope.reverse = false
    var pointIdToInfoMap = {},
        searchArgs = $location.search(),
        sourceUrl = searchArgs.sourceUrl || null

    var microgridId       = $stateParams.microgridId,
        navigationElement = $stateParams.navigationElement

    // Initialized from URL or menu click or both
    //
    if( ! navigationElement)
      return

    var equipment = navigationElement.equipmentChildren,
        equipmentIds = [],
        equipmentIdMap = {}
    equipment.forEach( function( eq) {
      equipmentIdMap[eq.id] = eq
      equipmentIds.push( eq.id)
    })


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

    function processValue( info, pointMeasurement) {
      var value = pointMeasurement.value

      switch (info.type) {
        case PT.PercentSoc:
          value = formatNumberNoDecimal( value);
          break;
        case PT.EnergyCapacity:
        case PT.PowerCapacity:
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        case PT.Power:
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        default:
      }
      return value
    }

    // Return standby, charging, or discharging
    function getState( ess) {
      if( ess.standby === 'OffAvailable' || ess.standby === 'true')
        return 'standby';
      else if( typeof ess.power == 'boolean')
        return ess.power ? 'charging' : 'discharging';
      else if( typeof ess.power.indexOf === 'function') {
        // It's a string value + space + unit.
        if( ess.power.indexOf('-') === 0) // has minus sign, so it's charging
          return 'charging';
        else if( ess.power.indexOf('0 ') === 0)
          return 'standby';
        else
          return 'discharging'
      }

      return ''
    }

    //function makeCes( eq, capacityUnit) {
    function makeCes( eq) {
      return {
        name: eq.name,
        energyCapacity: '',
        powerCapacity: '',
        standby: '',
        power: '',
        percentSoc: '',
        percentSocMax100: 0, // Used by batter symbol
        standbyOrOnline: '', // 'Standby', 'Online'
        state: 's'    // 'standby', 'charging', 'discharging'
      }
    }

    var POINT_TYPES =  [PT.PercentSoc, PT.Power, PT.Standby, PT.EnergyCapacity, PT.PowerCapacity]
    function getInterestingType( types) {
      for( var index = types.length-1; index >= 0; index--) {
        var typ = types[index]
        switch( typ) {
          case PT.PercentSoc:
          case PT.Power:
          case PT.Standby:
          case PT.PowerCapacity: // kW
          case PT.EnergyCapacity: // kWh
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
        if( info.type == PT.Standby) {
          if( value === 'OffAvailable' || value === 'true')
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Standby'
          else
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Online'
        } else if( info.type == PT.PercentSoc) {
          $scope.ceses[ info.cesIndex].percentSocMax100 = Math.min( value, 100)
        }
        $scope.ceses[ info.cesIndex][ TypeToVarMap[info.type]] = value
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
    function getPointsForEquipmentAndSubscribeToMeasurements( ) {
      var cesIndex, pointsUrl,
          pointIds = [],
          pointTypesQueryParams = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES),
          equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)


      pointsUrl = '/models/1/points?' + equipmentIdsQueryParams + '&' + pointTypesQueryParams
      rest.get( pointsUrl, 'points', $scope, function( data) {
        var sampleData = {
          'e57170fd-2a13-4420-97ab-d1c0921cf60d': [
            {
              'name': 'MG1.CES1.ModeStndby',
              'id': 'fa9bd9a1-5ad1-4c20-b019-261cb69d0a39',
              'types': [PT.Point, PT.Standby]
            },
            {
              'name': 'MG1.CES1.CapacitykWh',
              'id': '585b3e36-1826-4d7b-b538-d2bb71451d76',
              'types': [PT.EnergyCapacity, PT.Point]
            },
            {
              'name': 'MG1.CES1.ChgDischgRate',
              'id': 'ec7d6f06-e627-44d2-9bb9-530541fdcdfd',
              'types': [PT.Power, PT.Point]
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
                console.log( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements point: name=' + point.name + ', types = ' + point.types)
                pointIdToInfoMap[point.id] = {
                  'cesIndex': cesIndex,
                  'type': getInterestingType( point.types),
                  'unit': point.unit
                }
                pointIds.push( point.id)
              } else {
                console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points entity[' + eqId + '] does not have point with type ' + typ)
              }

            })
            $scope.ceses.push( makeCes( equipmentIdMap[eqId]))
          } else {
            console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points did not return UUID=' + eqId)
          }
        })

        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
      })

    }

    //var eqTypes = rest.queryParameterFromArrayOrString( 'eqTypes', ['ESS'])
    //var pointTypes = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES)
    //var url = '/equipmentwithpointsbytype?' + eqTypes + '&' + pointTypes
    //rest.get( sourceUrl, 'equipment', $scope, getPointsForEquipmentAndSubscribeToMeasurements);

    getPointsForEquipmentAndSubscribeToMeasurements()
  }]).


  directive( 'gbEsses', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/ess/esses.html',
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
 * Manage a set of alarms as subscription messages come in.
 *
 * @param _limit - Maximum number of alarms
 * @param _alarms - if supplied, this array will be update and sorted with onMessage calls.
 * @constructor
 */
function GBAlarms( _limit, _alarms) {
  var self = this

  if( !_alarms)
    _alarms = []

  self.alarmIdMap = {}
  self.limit = _limit

  self.alarms = _alarms // copyAlarms( _alarms.slice( 0, _limit))

  // trim to limit
  if( this.alarms.length > this.limit)
    this.alarms.splice( this.limit, this.alarms.length - this.limit)

  // setup alarmIdMap
  self.alarms.forEach( function( a) { self.alarmIdMap[a.id] = a})


  //function copyAlarms( alarms) {
  //  var copies = []
  //  alarms.forEach( function( a) {
  //    copies.push( angular.extend( {}, a))
  //  })
  //  return copies
  //}

}

GBAlarms.prototype.onMessage = function( alarm) {
  var self = this,
      removedAlarms = []

  if( angular.isArray( alarm)) {
    console.log( 'GBAlarms onAlarmOrAlarms length=' + alarm.length)
    alarm.forEach( function( a) {
      if( self.onEach( a)) // if was removed
        removedAlarms[ removedAlarms.length] = a
    })
  } else {
    this.onEach( alarm)
  }

  this.sortByTime()

  if( this.alarms.length > this.limit) {
    removedAlarms = this.alarms.splice( this.limit, this.alarms.length - this.limit)
    removedAlarms.forEach( function( a) { delete self.alarmIdMap[a.id]})
  }

  return removedAlarms
}

GBAlarms.prototype.onUpdateFailure = function( ids, newState) {
  var self = this
  ids.forEach( function( id) {
    var a = self.alarmIdMap[id]
    if( a)
      a._updateState = 'none'
  })
}

/**
 *
 * @param alarm
 * @return boolean true if removed
 */
GBAlarms.prototype.onEach = function( alarm) {
  var existingAlarm,
      removed = false

  // NOTE: We get duplicate notifications with alarmWorkflow. One from the subscription
  // and one from the POST reply.
  //
  console.log( 'GBAlarms onEach ' + alarm.id + ' "' + alarm.state + '"' + ' "' + alarm.message + '"')
  existingAlarm = this.alarmIdMap[alarm.id]
  if( existingAlarm)
    removed = this.onUpdate( existingAlarm, alarm)
  else if( alarm.state !== 'REMOVED') {
    alarm._updateState = 'none'
    this.alarms.unshift( alarm)
    this.alarmIdMap[alarm.id] = alarm
  }

  return removed
}

/**
 * Update from regular subscription stream or from update state request.
 *
 *   if( wasRemoved && alarm._checked)
 *     $scope.selectItem( alarm, 0) // selection needs to update its select count.
 *
 * @param alarm Existing alarm
 * @param update Updated properties for alarm
 * @return boolean true if the alarm was removed
 */
GBAlarms.prototype.onUpdate = function( alarm, update) {
  var wasRemoved = false

  if( ! alarm)
    return wasRemoved

  angular.extend( alarm, update)
  alarm._updateState = 'none'

  if( update.state === 'REMOVED') {
    var i = this.alarms.indexOf( alarm)
    if( i >= 0)
      this.alarms.splice( i, 1);
    wasRemoved = true
    delete this.alarmIdMap[alarm.id];
  }

  return wasRemoved
}

GBAlarms.prototype.sortByTime = function() {
  this.alarms.sort( function( a, b) { return b.time - a.time})
}

GBAlarms.prototype.filter = function( theFilter) {
  return this.alarms.filter( theFilter)
}


/**
 * Manage a set of events as subscription messages come in.
 *
 * @param _limit - Maximum number of alarms
 * @param _events - if supplied, this array will be update and sorted with onMessage calls.
 * @constructor
 */
function GBEvents( _limit, _events) {
  var self = this

  if( !_events)
    _events = []

  self.limit = _limit
  self.events = _events // _events.slice( 0, _limit) // shallow copy

  // trim to limit
  if( this.events.length > this.limit)
    this.events.splice( this.limit, this.events.length - this.limit)
}

GBEvents.prototype.onMessage = function( event) {
  var removedEvents = []

  if( angular.isArray( event)) {
    var self = this
    console.log( 'GBEvents onEventOrEvents length=' + event.length)
    event.forEach( function( e) {
      self.events.unshift( e)
    })
  } else {
    this.events.unshift( event)
  }

  this.sortByTime()

  if( this.events.length > this.limit)
    removedEvents = this.events.splice( this.limit, this.events.length - this.limit)

  return removedEvents
}


GBEvents.prototype.sortByTime = function() {
  this.events.sort( function( a, b) { return b.time - a.time})
}


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



angular.module('greenbus.views.event', ['greenbus.views.rest', 'greenbus.views.subscription']).

  factory('alarmRest', ['rest', function( rest) {

    /**
     *
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function update( ids, newState, callee, success, failure) {
      if( ! ids || ids.length === 0)
        return false

      var arg = {
        state: newState,
        ids: ids
      }

      rest.post( '/models/1/alarms', arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'alarmRest ERROR updating alarms with ids: ' + ids.join() + ' to state "' + newState + '". Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, ids, newState, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the next page is going backwards in time.
     *
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function pageNext( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, true)
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the previous page is going forwards in time.
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     */
    function pagePrevious( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, false)
    }

    /**
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     * @param latest boolean T: paging backwards in time, F: paging forwards in time.
     */
    function pageDo( startAfterId, limit, success, failure, latest) {

      var url = '/models/1/alarms?startAfterId=' + startAfterId + '&limit=' + limit
      if( latest === false)
        url +=  '&latest=false'

      rest.get( url, null, null,
        function( data) {
          success( data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'alarmRest ERROR pageNext with URL: "' + url + '". Status: ' + statusCode + 'Exception: ' + ex.exception + ' - ' + ex.message)
          failure( startAfterId, limit, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Public API
     */
    return {
      update: update,
      pageNext: pageNext,
      pagePrevious: pagePrevious
    }
  }]).

  factory('eventRest', ['rest', function( rest) {

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the next page is going backwards in time. 
     *  
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function pageNext( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, true)
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the previous page is going forwards in time.
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     */
    function pagePrevious( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, false)
    }
    
    /**
     *
     * @param startAfterId 
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     * @param latest boolean T: paging backwards in time, F: paging forwards in time.
     */
    function pageDo( startAfterId, limit, success, failure, latest) {

      var url = '/models/1/events?startAfterId=' + startAfterId + '&limit=' + limit
      if( latest === false)
        url +=  '&latest=false'
      
      rest.get( url, null, null,
        function( data) {
          success( data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'eventRest ERROR pageNext with URL: "' + url + '". Status: ' + statusCode + 'Exception: ' + ex.exception + ' - ' + ex.message)
          failure( startAfterId, limit, ex, statusCode)
        }
      )

      return true
    }


    /**
     * Public API
     */
    return {
      pageNext: pageNext,
      pagePrevious: pagePrevious
    }
  }]).

  /**
   * Adds _updateState to events
   *   'updating' - Waiting on reply from POST request.
   *   'removing' - Waiting on reply from POST REMOVED request.
   *   'none' - Not waiting on anything
   */
  factory('alarmWorkflow', ['alarmRest', function( alarmRest) {
    var serviceName = 'alarmWorkflow.updateRequest'

    /**
     * Operator is updating one or more alarm states
     * @param ids Alarm IDs
     * @param newState
     * @param subscriptionView
     */
    function updateRequest( subscriptionView, ids, newState) {
      if( ! ids || ids.length === 0)
        return false

      return alarmRest.update( ids, newState, subscriptionView, subscriptionView.onMessage, subscriptionView.onUpdateFailure)
    }

    function silence( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'UNACK_AUDIBLE') {
        if( updateRequest( subscriptionView, [alarm.id], 'UNACK_SILENT')) {
          alarm._updateState = 'updating' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }

    function acknowledge( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') {
        if( updateRequest( subscriptionView, [alarm.id], 'ACKNOWLEDGED')) {
          alarm._updateState = 'updating' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }

    function remove( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'ACKNOWLEDGED' && alarm._updateState !== 'removing') {
        if( updateRequest( subscriptionView, [alarm.id], 'REMOVED')) {
          alarm._updateState = 'removing' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }



    var filters = {
      isSelected: function( alarm) {
        return alarm._checked === 1
      },
      isSelectedAndUnackAudible: function( alarm) {
        return alarm._checked === 1 && alarm.state === 'UNACK_AUDIBLE' && alarm._updateState !== 'updating'
      },
      isSelectedAndUnack: function( alarm) {
        return alarm._checked === 1 && ( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') && alarm._updateState !== 'updating'
      },
      isSelectedAndRemovable: function( alarm) {
        return alarm._checked === 1 && alarm.state === 'ACKNOWLEDGED' && alarm._updateState !== 'removing'
      }
    }
    function getId( alarm) { return alarm.id }


    function updateSelected( subscriptionView, notification, filter, newState, newUpdateState, allSelectedAreNotValidMessage, someSelectedAreNotValidMessage) {
      var requestSucceeded = false,
          selectedAndValid = subscriptionView.filter( filter)

      if( selectedAndValid.length > 0) {
        var ids = selectedAndValid.map( getId)
        selectedAndValid.forEach( function( a) { a._updateState = newUpdateState})
        if( someSelectedAreNotValidMessage) {
          var selected = subscriptionView.filter( filters.isSelected)
          if( selected.length > selectedAndValid.length)
            notification( 'info', someSelectedAreNotValidMessage, 5000)
        }
        requestSucceeded = updateRequest( subscriptionView, ids, newState)
      } else {
        notification( 'info', allSelectedAreNotValidMessage, 5000)
      }
      return requestSucceeded
    }

    function silenceSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndUnackAudible, 'UNACK_SILENT', 'updating', 'No audible alarms are selected.') }
    function acknowledgeSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndUnack, 'ACKNOWLEDGED', 'updating', 'No unacknowledged alarms are selected.') }
    function removeSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndRemovable, 'REMOVED', 'removing', 'No acknowledged alarms are selected.', 'Unacknowledged alarms were not removed.') }


    /**
     * Public API
     */
    return {
      silence: silence,
      acknowledge: acknowledge,
      remove: remove,
      silenceSelected: silenceSelected,
      acknowledgeSelected: acknowledgeSelected,
      removeSelected: removeSelected
    }
  }]).

  controller('gbAlarmsController', ['$scope', '$attrs', 'rest', 'subscription', 'alarmWorkflow', 'alarmRest', '$timeout', function( $scope, $attrs, rest, subscription, alarmWorkflow, alarmRest, $timeout) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    var subscriptionView = new AlarmSubscriptionView( $scope.limit, $scope.limit * 4)
    $scope.alarms = subscriptionView.items
    // Paging
    $scope.pageState = SubscriptionViewState.CURRENT
    $scope.lastPage = false
    $scope.newItems = undefined
    // Alarm workflow
    $scope.selectAllState = 0
    $scope.searchText = ''
    $scope.notification = undefined // {type: 'danger', message: ''}  types: success, info, warning, danger
    $scope.notificationTask = undefined // $timeout task

    // Paging functions
    //
    function updatePageState( state) {
      $scope.pageState = state
      if( state === SubscriptionViewState.CURRENT)
        $scope.newItems = undefined
    }
    function pageNotify( state, pageCacheOffset, lastPage, oldItems) {
      updatePageState( state)
      $scope.lastPage = lastPage
      oldItems.forEach( function( i) {
        if( i._checked)
          $scope.selectItem( i, 0) // 0: unchecked. Selection needs to decrement its select count.
      })
    }
    $scope.pageFirst = function() {
      var state = subscriptionView.pageFirst()
      updatePageState( state)
      $scope.lastPage = false // TODO: what if there is only one page?
    }
    $scope.pageNext = function() {
      var state = subscriptionView.pageNext( alarmRest, pageNotify)
      updatePageState( state)
    }
    $scope.pagePrevious = function() {
      var state = subscriptionView.pagePrevious( alarmRest, pageNotify)
      updatePageState( state)
      // TODO: We're assuming that if previous was successful, there must be a next page. This may not always be true, especially with search!
      if( state !== SubscriptionViewState.PAGING_PREVIOUS && $scope.lastPage)
        $scope.lastPage = false
    }


    function setNotification( typ, message, timeout) {
      if( $scope.notificationTask) {
        $timeout.cancel( $scope.notificationTask)
        $scope.notificationTask = undefined
      }

      $scope.notification = {type: typ, message: message}

      if( timeout) {
        $scope.notificationTask = $timeout(function() {
          $scope.notification = undefined
          $scope.notificationTask = undefined
        }, timeout);
      }
    }


    $scope.silence = function( alarm) { alarmWorkflow.silence( subscriptionView, alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( subscriptionView, alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( subscriptionView, alarm) }

    $scope.silenceSelected = function() { alarmWorkflow.silenceSelected( subscriptionView, setNotification) }
    $scope.acknowledgeSelected = function() { alarmWorkflow.acknowledgeSelected( subscriptionView, setNotification) }
    $scope.removeSelected = function() { alarmWorkflow.removeSelected( subscriptionView, setNotification) }

    // Called by selection
    $scope.selectAllChanged = function( state) {
      $scope.selectAllState = state
      return state
    }

    function onMessage( subscriptionId, type, alarms) {
      var removedAlarms = subscriptionView.onMessage( alarms)
      removedAlarms.forEach( function( a) {
        if( a._checked)
          $scope.selectItem( a, 0) // 0: unchecked. Selection needs to decrement its select count.
      })

      if( $scope.pageState !== SubscriptionViewState.CURRENT)
        $scope.newItems = 'New alarms'

      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    var subscribeToAlarms = {
      name: 'SubscribeToAlarms',
      limit: $scope.limit
    }

    // Id is accessed by demo script to push alarms.
    $scope._subscribeToAlarmsId = subscription.subscribe( subscribeToAlarms, $scope, onMessage, onError)
  }]).

  controller('gbEventsController', ['$scope', '$attrs', 'subscription', 'eventRest', function( $scope, $attrs, subscription, eventRest) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    var subscriptionView = new SubscriptionView( $scope.limit, $scope.limit * 4)
    $scope.events = subscriptionView.items
    $scope.pageState = SubscriptionViewState.CURRENT
    $scope.lastPage = false
    $scope.newItems = undefined

    // Paging functions
    //
    function updatePageState( state) {
      $scope.pageState = state
      if( state === SubscriptionViewState.CURRENT)
        $scope.newItems = undefined
    }
    function pageNotify( state, pageCacheOffset, lastPage, oldItems) {
      updatePageState( state)
      $scope.lastPage = lastPage
    }
    $scope.pageFirst = function() {
      var state = subscriptionView.pageFirst()
      updatePageState( state)
      $scope.lastPage = false // TODO: what if there is only one page?
    }
    $scope.pageNext = function() {
      var state = subscriptionView.pageNext( eventRest, pageNotify)
      updatePageState( state)
    }
    $scope.pagePrevious = function() {
      var state = subscriptionView.pagePrevious( eventRest, pageNotify)
      updatePageState( state)
      // TODO: We're assuming that if previous was successful, there must be a next page. This may not always be true, especially with search!
      if( state !== SubscriptionViewState.PAGING_PREVIOUS && $scope.lastPage)
        $scope.lastPage = false
    }


    $scope.onEvent = function( subscriptionId, type, event) {
      subscriptionView.onMessage( event)
      if( $scope.pageState !== SubscriptionViewState.CURRENT)
        $scope.newItems = 'New events'
      $scope.loading = false
      $scope.$digest()
    }

    $scope.onError = function( error, message) {

    }

    var subscribeToEvents = {
      name: 'SubscribeToEvents',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push events.
    $scope._subscribeToEventsId = subscription.subscribe( subscribeToEvents, $scope, $scope.onEvent, $scope.onError)

  }]).

  controller('gbAlarmsAndEventsController', ['$scope', '$attrs', 'subscription', 'alarmWorkflow', function( $scope, $attrs, subscription, alarmWorkflow) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    $scope.alarms = []
    $scope.events = []
    var gbAlarms = new GBAlarms( $scope.limit, $scope.alarms),
        gbEvents = new GBEvents( $scope.limit, $scope.events),
        tab = 'alarms',
        newCounts = {
          alarms: -1,
          events: 0
        }


    $scope.newCounts = {
      alarms: '',
      events: ''
    }
    $scope.tabAlarms = function() {
      if( tab !== 'alarms') {
        tab = 'alarms'
        newCounts.alarms = -1
        newCounts.events = 0
        $scope.newCounts.alarms = ''
        $scope.newCounts.events = ''
      }
    }
    $scope.tabEvents = function() {
      if( tab !== 'events') {
        tab = 'events'
        newCounts.events = -1
        newCounts.alarms = 0
        $scope.newCounts.alarms = ''
        $scope.newCounts.events = ''
      }
    }

    $scope.silence = function( alarm) { alarmWorkflow.silence( gbAlarms, alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( gbAlarms, alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( gbAlarms, alarm) }

    function countUpdates( objOrArray) {
      if( angular.isArray( objOrArray))
        return objOrArray.length
      else
        return 1
    }
    function onAlarm( subscriptionId, type, alarms) {
      var updateCount = countUpdates( alarms)

      gbAlarms.onMessage( alarms)
      $scope.loading = false

      if( tab === 'events') {
        newCounts.alarms += updateCount
        $scope.newCounts.alarms = newCounts.alarms.toString()
      }

      $scope.$digest()
    }
    function onAlarmError( error, message) {
      console.error( 'gbAlarmsAndEventsController onAlarmError ' + error + ', ' + message)
    }

    function onEvent( subscriptionId, type, events) {
      var updateCount = countUpdates( events)

      gbEvents.onMessage( events)
      $scope.loading = false

      if( tab === 'alarms') {
        newCounts.events += updateCount
        $scope.newCounts.events = newCounts.events.toString()
      }

      $scope.$digest()
    }
    function onEventError( error, message) {
      console.error( 'gbAlarmsAndEventsController onEventError ' + error + ', ' + message)
    }

    var subscribeToAlarms = {
      name: 'SubscribeToAlarms',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push alarms.
    $scope._subscribeToAlarmsId = subscription.subscribe( subscribeToAlarms, $scope, onAlarm, onAlarmError)

    var subscribeToEvents = {
      name: 'SubscribeToEvents',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push events.
    $scope._subscribeToEventsId = subscription.subscribe( subscribeToEvents, $scope, onEvent, onEventError)

  }]).

  directive( 'gbAlarms', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/event/alarms.html',
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
      templateUrl: 'greenbus.views.template/event/events.html',
      controller: 'gbEventsController'
    }
  }).
  directive( 'gbAlarmsAndEvents', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/event/alarmsAndEvents.html',
      controller: 'gbAlarmsAndEventsController'
    }
  }).

  filter('pagePreviousClass', function() {
    return function(pageState) {
      return pageState !== SubscriptionViewState.PAGED && pageState !== SubscriptionViewState.NO_ITEMS ? 'btn btn-default disabled' : 'btn btn-default'
    };
  }).
  filter('pageNextClass', function() {
    return function(pageState, lastPage) {
      return lastPage || pageState === SubscriptionViewState.PAGING_NEXT || pageState === SubscriptionViewState.NO_ITEMS ? 'btn btn-default disabled' : 'btn btn-default'
    };
  }).
  filter('pagingIcon', function() {
    return function(pageState, direction) {
      var spin = (direction === 'right' && pageState === SubscriptionViewState.PAGING_NEXT) || (direction === 'left' && pageState === SubscriptionViewState.PAGING_PREVIOUS)
      return spin ? 'fa fa-spin fa-chevron-' + direction : 'fa fa-chevron-' + direction
    };
  }).
  filter('alarmAckClass', function() {
    return function(state, updateState) {
      var s
      switch( state) {
        case 'UNACK_AUDIBLE': s = 'fa fa-bell gb-alarm-unack'; break;
        case 'UNACK_SILENT': s = 'fa fa-bell gb-alarm-unack'; break;
        case 'ACKNOWLEDGED': s = 'fa fa-bell-slash-o  gb-alarm-ack'; break;
        case 'REMOVED': s = 'fa fa-trash-o  gb-alarm-ack'; break;
        default: s = 'fa fa-question-circle gb-alarm-unack'; break;
      }

      if( updateState === 'updating')
        s += ' fa-spin'
      return s
    };
  }).
  filter('alarmRemoveClass', function() {
    return function(state, updateState) {
      var s
      switch( state) {
        case 'ACKNOWLEDGED': s = 'fa fa-trash gb-alarm-remove'; break;
        case 'REMOVED': s = 'fa fa-trash-o  gb-alarm-ack'; break;
        default: s = 'fa'; break;
      }

      if( updateState === 'removing')
        s += ' fa-spin'
      return s
    };
  }).
  filter('alarmRemoveButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'ACKNOWLEDGED': return 'btn btn-default btn-xs'
        default: return '';
      }
    };
  }).
  filter('alarmAckButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'btn btn-default btn-xs'
        case 'UNACK_SILENT': return 'btn btn-default btn-xs'
        default: return '';
      }
    };
  }).
  filter('alarmAckTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Acknowledge alarm'
        case 'UNACK_SILENT': return 'Acknowledge alarm'
        case 'ACKNOWLEDGED': return 'Acknowledged alarm'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  }).
  filter('alarmRemoveTitle', function() {
    return function(state) {
      switch( state) {
        case 'ACKNOWLEDGED': return 'Remove alarm'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  }).

  filter('alarmAudibleClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'fa fa-volume-up gb-alarm-unack'
        default: return 'fa'
      }
    };
  }).
  filter('alarmAudibleButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'btn btn-default btn-xs'
        default: return ''
      }
    };
  }).
  filter('alarmAudibleTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Silence alarm'
        default: return ''
      }
    };
  })
;


var SubscriptionCache, SubscriptionCacheAction;

SubscriptionCacheAction = {
  NONE: 0,
  UPDATE: 1,
  INSERT: 2,
  REMOVE: 3,
  MOVE: 4,
  TRIM: 5
};

SubscriptionCache = (function() {

  /*
    @param cacheSize -   
    @param items -
   */
  function SubscriptionCache(cacheSize, items) {
    var item, j, len, ref;
    this.cacheSize = cacheSize;
    this.itemStore = [];
    this.itemIdMap = {};
    if (items) {
      this.itemStore = items.slice(0);
      this.itemStore.sort(function(a, b) {
        return b.time - a.time;
      });
      if (this.itemStore.length > this.cacheSize) {
        this.itemStore = this.itemStore.slice(0, this.cacheSize);
      }
      ref = this.itemStore;
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        this.itemIdMap[item.id] = item;
      }
    }
  }

  SubscriptionCache.prototype.onMessage = function(item) {
    var action, actions, count, i, isArray, j, len, trimmed;
    actions = [];
    if (!item) {
      return actions;
    }
    isArray = angular.isArray(item);
    if (isArray) {
      switch (item.length) {
        case 0:
          return actions;
        case 1:
          isArray = false;
          item = item[0];
      }
    }
    if (isArray) {
      console.log('SubscriptionCache onMessage length=' + item.length);
      actions = (function() {
        var j, results;
        results = [];
        for (j = item.length - 1; j >= 0; j += -1) {
          i = item[j];
          results.push(this.updateOrInsert(i));
        }
        return results;
      }).call(this);
    } else {
      action = this.updateOrInsert(item);
      if (action.type !== SubscriptionCacheAction.NONE) {
        actions[actions.length] = action;
      }
    }
    if (this.itemStore.length > this.cacheSize) {
      count = this.itemStore.length - this.cacheSize;
      trimmed = this.itemStore.splice(this.cacheSize, count);
      actions[actions.length] = {
        type: SubscriptionCacheAction.TRIM,
        at: this.cacheSize,
        count: count,
        items: trimmed
      };
      for (j = 0, len = trimmed.length; j < len; j++) {
        item = trimmed[j];
        delete this.itemIdMap[item.id];
      }
    }
    return actions;
  };

  SubscriptionCache.prototype.updateOrInsert = function(item) {
    var existing;
    existing = this.itemIdMap[item.id];
    if (existing) {
      return this.update(existing, item);
    } else {
      return this.insert(item);
    }
  };

  SubscriptionCache.prototype.itemAboveIsEarlier = function(item, index) {
    return index > 0 && this.itemStore[index - 1].time < item.time;
  };

  SubscriptionCache.prototype.itemBelowIsLater = function(item, index) {
    return index < this.itemStore.length - 1 && this.itemStore[index + 1].time > item.time;
  };

  SubscriptionCache.prototype.itemIsOutOfOrder = function(item, index) {
    return this.itemAboveIsEarlier(item, index) || this.itemBelowIsLater(item, index);
  };

  SubscriptionCache.prototype.shouldRemoveItemOnUpdate = function(item) {
    return false;
  };

  SubscriptionCache.prototype.convertInsertActionToIncludeRemove = function(item, index, action) {
    if (action.type === SubscriptionCacheAction.INSERT) {
      return {
        type: SubscriptionCacheAction.MOVE,
        from: index,
        to: action.at,
        item: item
      };
    } else {
      return {
        type: SubscriptionCacheAction.REMOVE,
        from: index,
        item: item
      };
    }
  };

  SubscriptionCache.prototype.update = function(item, update) {
    var action, index;
    angular.extend(item, update);
    index = this.itemStore.indexOf(item);
    if (index >= 0) {
      if (this.shouldRemoveItemOnUpdate(item)) {
        this.itemStore.splice(index, 1);
        return {
          type: SubscriptionCacheAction.REMOVE,
          from: index,
          item: item
        };
      } else if (this.itemIsOutOfOrder(item, index)) {
        this.itemStore.splice(index, 1);
        action = this.insert(item);
        return this.convertInsertActionToIncludeRemove(item, index, action);
      } else {
        return {
          type: SubscriptionCacheAction.UPDATE,
          at: index,
          item: item
        };
      }
    } else {
      return {
        type: SubscriptionCacheAction.NONE,
        item: item
      };
    }
  };

  SubscriptionCache.prototype.insert = function(item) {
    var i, insertAt;
    insertAt = -1;
    if (this.itemStore.length === 0 || item.time >= this.itemStore[0].time) {
      this.itemStore.unshift(item);
      insertAt = 0;
    } else {
      i = 1;
      while (true) {
        if (i >= this.itemStore.length) {
          if (this.itemStore.length < this.cacheSize) {
            this.itemStore[this.itemStore.length] = item;
            insertAt = this.itemStore.length - 1;
          }
          break;
        } else if (item.time >= this.itemStore[i].time) {
          this.itemStore.splice(i, 0, item);
          insertAt = i;
          break;
        } else {
          i++;
        }
      }
    }
    if (insertAt >= 0) {
      this.itemIdMap[item.id] = item;
      return {
        type: SubscriptionCacheAction.INSERT,
        at: insertAt,
        item: item
      };
    } else {
      return {
        type: SubscriptionCacheAction.NONE,
        item: item
      };
    }
  };

  SubscriptionCache.prototype.indexOfId = function(id) {
    var index, item, j, len, ref;
    ref = this.itemStore;
    for (index = j = 0, len = ref.length; j < len; index = ++j) {
      item = ref[index];
      if (item.id === id) {
        return index;
      }
    }
    return -1;
  };

  SubscriptionCache.prototype.getItemById = function(id) {
    return this.itemIdMap[id];
  };

  return SubscriptionCache;

})();

//# sourceMappingURL=SubscriptionCache.js.map

var AlarmSubscriptionView, SubscriptionView, SubscriptionViewState,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

SubscriptionViewState = {
  CURRENT: 0,
  PAGING_NEXT: 1,
  PAGING_PREVIOUS: 2,
  PAGED: 3,
  NO_ITEMS: 4
};


/*

  Manage a set of items as subscription messages come in.

  For paging, we could be paging inside the cache or past the end of the cache.

  View  Cache
  3     3
  2     2
        1

  @param _limit - Maximum number of alarms
  @param _items - if supplied, this array will be update and sorted with onMessage calls.
                  Each item needs a 'time' property which holds a Javascript Date.
  @constructor
 */

SubscriptionView = (function(superClass) {
  extend(SubscriptionView, superClass);

  function SubscriptionView(viewSize, cacheSize, items) {
    this.viewSize = viewSize;
    this.cacheSize = cacheSize;
    this.pageFailure = bind(this.pageFailure, this);
    this.pageSuccess = bind(this.pageSuccess, this);
    if (this.cacheSize == null) {
      this.cacheSize = this.viewSize;
    }
    SubscriptionView.__super__.constructor.call(this, this.cacheSize, items);
    this.items = this.itemStore.slice(0, this.viewSize);
    if (this.items.length > this.viewSize) {
      this.items.splice(this.viewSize, this.items.length - this.viewSize);
    }
    this.state = SubscriptionViewState.CURRENT;
    this.pageCacheOffset = 0;
    this.backgrounded = false;
    this.pagePending = void 0;
    this.previousPageCache = void 0;
  }

  SubscriptionView.prototype.onMessage = function(item) {
    var action, actions, acts, removed, removedItems;
    removedItems = [];
    actions = SubscriptionView.__super__.onMessage.call(this, item);
    if (this.pageCacheOffset >= 0) {
      acts = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = actions.length; i < len; i++) {
          action = actions[i];
          results.push(this.act(action));
        }
        return results;
      }).call(this);
      removedItems = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = acts.length; i < len; i++) {
          removed = acts[i];
          if (removed) {
            results.push(removed);
          }
        }
        return results;
      })();
      if (this.items.length > this.viewSize) {
        removedItems = removedItems.concat(this.items.splice(this.viewSize, this.items.length - this.viewSize));
      }
    }
    return removedItems;
  };

  SubscriptionView.prototype.act = function(action) {
    switch (action.type) {
      case SubscriptionCacheAction.UPDATE:
        return this.actionUpdate(action);
      case SubscriptionCacheAction.INSERT:
        return this.actionInsert(action.item, action.at);
      case SubscriptionCacheAction.REMOVE:
        return this.actionRemove(action.item, action.from);
      case SubscriptionCacheAction.MOVE:
        return this.actionMove(action);
      case SubscriptionCacheAction.TRIM:
        return this.actionTrim(action);
    }
  };

  SubscriptionView.prototype.actionUpdate = function(action) {};

  SubscriptionView.prototype.actionMove = function(action) {
    this.actionRemove(action.item, action.from);
    return this.actionInsert(action.item, action.to);
  };

  SubscriptionView.prototype.actionTrim = function(action) {
    var trimAt;
    trimAt = action.at - this.pageCacheOffset;
    if (trimAt <= 0) {
      return this.pageCacheOffset = -1;
    }
  };

  SubscriptionView.prototype.actionRemove = function(item, from) {
    var removeAt, removed;
    removed = void 0;
    removeAt = from - this.pageCacheOffset;
    if (removeAt >= 0 && removeAt < this.viewSize) {
      removed = this.items[removeAt];
      this.items.splice(removeAt, 1);
    } else if (removeAt < 0) {
      this.pageCacheOffset -= 1;
    }
    return removed;
  };

  SubscriptionView.prototype.actionInsert = function(item, insertAt) {
    insertAt = insertAt - this.pageCacheOffset;
    if ((this.pageCacheOffset === 0 && insertAt === 0) || (insertAt > 0 && insertAt < this.viewSize)) {
      this.items.splice(insertAt, 0, item);
    } else if (insertAt <= 0) {
      this.pageCacheOffset += 1;
    }
    return void 0;
  };

  SubscriptionView.prototype.background = function() {
    if (!this.backgrounded) {
      this.backgrounded = true;
      return this.items.splice(0, this.items.length);
    }
  };

  SubscriptionView.prototype.foreground = function() {
    if (this.backgrounded) {
      this.replaceItems(this.itemStore.slice(0, this.viewSize));
      return this.backgrounded = false;
    }
  };

  SubscriptionView.prototype.updateState = function() {
    return this.state = (function() {
      switch (false) {
        case this.items.length !== 0:
          return SubscriptionViewState.NO_ITEMS;
        case this.pageCacheOffset === 0:
          return SubscriptionViewState.PAGED;
        default:
          return SubscriptionViewState.CURRENT;
      }
    }).call(this);
  };

  SubscriptionView.prototype.pageSuccess = function(items) {
    var oldItems, ref, ref1, ref2, ref3;
    switch ((ref = this.pagePending) != null ? ref.direction : void 0) {
      case 'next':
        if (this.pagePending.cache) {
          items = this.pagePending.cache.concat(items);
        }
        this.previousPageCache = this.items.slice(0);
        this.replaceItems(items);
        this.items.sort(function(a, b) {
          return b.time - a.time;
        });
        this.pageCacheOffset = -1;
        this.onMessage(items);
        this.updateState();
        if ((ref1 = this.pagePending) != null ? ref1.notify : void 0) {
          this.pagePending.notify(this.state, this.pageCacheOffset, items.length < this.viewSize, this.previousPageCache);
        }
        return this.pagePending = void 0;
      case 'previous':
        oldItems = this.items.slice(0);
        this.replaceItems(items);
        this.items.sort(function(a, b) {
          return b.time - a.time;
        });
        this.onMessage(items);
        this.pageCacheOffset = this.indexOfId(this.items[0].id);
        this.updateState();
        if ((ref2 = this.pagePending) != null ? ref2.notify : void 0) {
          this.pagePending.notify(this.state, this.pageCacheOffset, false, oldItems);
        }
        return this.pagePending = void 0;
      default:
        return console.log('SubscriptionView.pageSuccess but pagePending is ' + ((ref3 = this.pagePending) != null ? ref3.direction : void 0));
    }
  };

  SubscriptionView.prototype.pageFailure = function(items) {};

  SubscriptionView.prototype.pageNext = function(pageRest, notify) {
    var limit, nextPageOffset;
    if (this.pagePending) {
      return 'pastPending';
    }
    switch (false) {
      case !(this.pageCacheOffset < 0):
        this.pagePending = {
          direction: 'next',
          notify: notify
        };
        pageRest.pageNext(this.items[this.items.length - 1].id, this.viewSize, this.pageSuccess, this.pageFailure);
        return this.state = SubscriptionViewState.PAGING_NEXT;
      case !(this.pageCacheOffset + 2 * this.viewSize <= this.itemStore.length):
        this.pageCacheOffset += this.viewSize;
        this.replaceItems(this.itemStore.slice(this.pageCacheOffset, this.pageCacheOffset + this.viewSize));
        return this.state = SubscriptionViewState.PAGED;
      default:
        nextPageOffset = this.pageCacheOffset + this.viewSize;
        this.pagePending = {
          direction: 'next',
          notify: notify,
          cache: this.itemStore.slice(nextPageOffset, nextPageOffset + this.viewSize)
        };
        limit = this.viewSize - this.pagePending.cache.length;
        pageRest.pageNext(this.items[this.items.length - 1].id, limit, this.pageSuccess, this.pageFailure);
        return this.state = SubscriptionViewState.PAGING_NEXT;
    }
  };

  SubscriptionView.prototype.pagePrevious = function(pageRest, notify) {
    if (this.pagePending) {
      return 'pastPending';
    }
    switch (false) {
      case !(this.pageCacheOffset < 0 && this.items.length === 0):
        this.replaceItems(this.previousPageCache);
        this.previousPageCache = void 0;
        this.pageCacheOffset = this.indexOfId(this.items[0].id);
        return this.updateState();
      case !(this.pageCacheOffset < 0):
        this.pagePending = {
          direction: 'previous',
          notify: notify
        };
        pageRest.pagePrevious(this.items[0].id, this.viewSize, this.pageSuccess, this.pageFailure);
        return this.state = SubscriptionViewState.PAGING_PREVIOUS;
      case this.pageCacheOffset !== 0:
        return this.state = SubscriptionViewState.CURRENT;
      default:
        this.pageCacheOffset -= this.viewSize;
        if (this.pageCacheOffset < 0) {
          this.pageCacheOffset = 0;
        }
        this.replaceItems(this.itemStore.slice(this.pageCacheOffset, this.pageCacheOffset + this.viewSize));
        return this.state = this.pageCacheOffset > 0 ? SubscriptionViewState.PAGED : SubscriptionViewState.CURRENT;
    }
  };

  SubscriptionView.prototype.pageFirst = function() {
    this.pagePending = void 0;
    this.pageCacheOffset = 0;
    this.replaceItems(this.itemStore.slice(this.pageCacheOffset, this.pageCacheOffset + this.viewSize));
    return this.updateState();
  };

  SubscriptionView.prototype.replaceItems = function(source) {
    var args;
    this.items.splice(0, this.items.length);
    args = [0, 0].concat(source);
    return Array.prototype.splice.apply(this.items, args);
  };

  return SubscriptionView;

})(SubscriptionCache);

AlarmSubscriptionView = (function(superClass) {
  extend(AlarmSubscriptionView, superClass);

  function AlarmSubscriptionView() {
    return AlarmSubscriptionView.__super__.constructor.apply(this, arguments);
  }

  AlarmSubscriptionView.prototype.shouldRemoveItemOnUpdate = function(item) {
    item._updateState = 'none';
    return item.state === 'REMOVED';
  };

  AlarmSubscriptionView.prototype.onUpdateFailure = function(ids, newState) {
    var alarm, i, id, len, results;
    results = [];
    for (i = 0, len = ids.length; i < len; i++) {
      id = ids[i];
      alarm = this.getItemById(id);
      if (alarm) {
        results.push(alarm._updateState = 'none');
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  AlarmSubscriptionView.prototype.filter = function(theFilter) {
    return this.items.filter(theFilter);
  };

  return AlarmSubscriptionView;

})(SubscriptionView);

//# sourceMappingURL=SubscriptionView.js.map

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
        name: 'SubscribeToMeasurementHistory',
        'pointId':  this.point.id,
        'timeFrom': now - constraints.time,
        'limit':    constraints.size
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


angular.module( 'greenbus.views.measurement',
  [
    'ui.router',
    'greenbus.views.subscription',
    'greenbus.views.navigation',
    'greenbus.views.equipment',
    'greenbus.views.rest',
    'greenbus.views.request',
    'greenbus.views.selection'
  ]).

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
  factory('measurement', [ 'rest', 'subscription', 'pointIdToMeasurementHistoryMap', '$filter', '$timeout', function( rest, subscription, pointIdToMeasurementHistoryMap, $filter, $timeout) {
    var number = $filter('number')

    function formatMeasurementValue(value) {
      if( typeof value === 'boolean' || isNaN(value) || !isFinite(value) ) {
        return value
      } else {
        return number(value)
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

      var measurementHistory = pointIdToMeasurementHistoryMap[point.id]
      if( !measurementHistory ) {
        measurementHistory = new MeasurementHistory(subscription, point)
        pointIdToMeasurementHistoryMap[point.id] = measurementHistory
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

      var measurementHistory = pointIdToMeasurementHistoryMap[point.id]
      if( measurementHistory )
        measurementHistory.unsubscribe(subscriber)
      else
        console.error('ERROR: meas.unsubscribe point.id: ' + point.id + ' was never subscribed.')
    }

    function onMeasurements(measurements, subscriber, notify) {
      measurements.forEach(function(pm) {
        pm.measurement.value = formatMeasurementValue(pm.measurement.value)
      })
      if( notify )
        notify.call(subscriber, measurements)
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
          name: 'SubscribeToMeasurements',
          pointIds: pointIds,
        },
        scope,
        function(subscriptionId, type, measurements) {
          if( type === 'measurements' )
            onMeasurements(measurements, subscriber, notify)
          else
            console.error('measurement.subscribe message of unknown type: "' + type + '"')
          scope.$digest()
        },
        function(error, message) {
          console.error('measurement.subscribe ERROR: ' + error + ', message: ' + message)
        }
      )
    }

    function unsubscribe(subscriptionId) {
      subscription.unsubscribe(subscriptionId)
    }

    function getCommandsForPoints(pointIds) {
      return rest.post('/models/1/points/commands', pointIds)
    }


    /**
     * Public API
     */
    return {
      subscribeWithHistory:   subscribeWithHistory,
      unsubscribeWithHistory: unsubscribeWithHistory,
      subscribe:              subscribe,
      unsubscribe:            unsubscribe,
      getCommandsForPoints:   getCommandsForPoints
    }
  }]).

  controller('gbMeasurementsController', ['$scope', '$stateParams', 'rest', 'navigation', 'subscription', 'measurement', 'equipment', 'request', '$timeout',
    function($scope, $stateParams, rest, navigation, subscription, measurement, equipment, request, $timeout) {
      var self = this
      $scope.points = []
      $scope.pointsFiltered = []
      $scope.selectAllState = 0

      // Search
      $scope.searchText = ''
      $scope.sortColumn = 'name'
      $scope.reverse = false




      var depth, equipmentIds, equipmentIdsQueryParams,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      if( navigationElement.equipmentChildren.length > 0 ) {
        equipmentIds = navigationElement.equipmentChildren.map( function( child) { return child.id })
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)
      } else {
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', navigationElement.id)
      }
      // Rest API /models/1/points?equipmentIds=... depth defaults to 1. If equipment is microgrid, we need deeper.
      depth = rest.queryParameterFromArrayOrString('depth', '9999')

      function findPoint(id) {
        var index = findPointIndex(id)
        return index >= 0 ? $scope.points[index] : null
      }

      function findPointIndex(id) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( point.id === id )
            return i
        }
        return -1
      }

      function findPointBy(testTrue) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( testTrue(point) )
            return point
        }
        return null
      }

      $scope.selectAllChanged = function(state) {
        $scope.selectAllState = state
      }

      $scope.chartAddPointById = function(id) {
        var point = findPoint(id)

        if( point )
          request.push('gb-chart.addChart', [point])
        else
          console.error('Can\'t find point by id: ' + id)
      }

      $scope.chartAddSelectedPoints = function() {
        // Add all measurements that are checked and visible.
        var points = $scope.pointsFiltered.filter(function(m) {
          return m._checked === 1
        })

        if( points.length > 0 ) {
          request.push('gb-chart.addChart', points)
        }
      }


      $scope.rowClasses = function(point) {
        return point.rowDetail ? 'gb-row-selected-detail animate-repeat'
          : point.rowSelected ? 'gb-point gb-row-selected animate-repeat'
          : point.commands ? 'gb-point gb-row-selectable animate-repeat'
          : 'gb-point animate-repeat'
      }
      $scope.togglePointRowById = function(id) {
        if( !id )
          return  // detail row doesn't have an id.

        var point, pointDetails,
            index = findPointIndex(id)
        if( index < 0 )
          return

        point = $scope.points[index]
        if( !point.commands )
          return

        if( point.rowSelected ) {
          $scope.points.splice(index + 1, 1)
          point.rowSelected = false
        } else {

          pointDetails = {
            point:      point,
            name:       point.name + ' ',
            rowDetail:  true,
            commands: point.commands
          }
          $scope.points.splice(index + 1, 0, pointDetails)
          point.rowSelected = true
        }

      }


      $scope.search = function(point) {
        var s = $scope.searchText
        if( s === undefined || s === null || s.length === 0 )
          return true
        s = s.toLowerCase()

        // If it's a rowDetail, we return true if the original row is show. Use the original row as the search filter.
        if( point.rowDetail )
          point = point.point

        var measValue         = '' + (point.currentMeasurement ? point.currentMeasurement.value : ''),
            foundCommandTypes = point.commandTypes && point.commandTypes.indexOf(s) !== -1,
            foundName         = point.name.toLowerCase().indexOf(s) !== -1

        return foundName || measValue.toLowerCase().indexOf(s) !== -1 || point.unit.toLowerCase().indexOf(s) !== -1 || point.pointType.toLowerCase().indexOf(s) !== -1 || foundCommandTypes
      }


      function onMeasurements(measurements) {
        measurements.forEach(function(pm) {
          var point = findPoint(pm.point.id)
          if( point ) {
            //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
            point.currentMeasurement = pm.measurement
          } else {
            console.error('MeasurementsController.onMeasurements could not find point.id = ' + pm.point.id)
          }
        })
        $scope.$digest()
      }

      function subscribeToMeasurements(pointIds) {
        measurement.subscribe($scope, pointIds, {}, self, onMeasurements)
      }


      function nameFromTreeNode(treeNode) {
        if( treeNode )
          return treeNode.label
        else
          return '...'
      }

      //function getEquipmentIds(treeNode) {
      //  var result = []
      //  treeNode.children.forEach(function(node) {
      //    if( node.containerType && node.containerType !== 'Sourced' )
      //      result.push(node.id)
      //  })
      //  return result
      //}
      //
      //function navIdListener(id, treeNode) {
      //  $scope.equipmentName = nameFromTreeNode(treeNode) + ' '
      //  var equipmentIds = getEquipmentIds(treeNode)
      //  var equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)
      //
      //  var delimeter = '?'
      //  var url = '/models/1/points'
      //  if( equipmentIdsQueryParams.length > 0 ) {
      //    url += delimeter + equipmentIdsQueryParams
      //    delimeter = '&'
      //    $scope.equipmentName = nameFromTreeNode(treeNode) + ' '
      //  }
      //  if( depth.length > 0 )
      //    url += delimeter + depth
      //
      //  rest.get(url, 'points', $scope, function(data) {
      //    // data is either a array of points or a map of equipmentId -> points[]
      //    // If it's an object, convert it to a list of points.
      //    if( angular.isObject(data) ) {
      //      $scope.points = []
      //      for( var equipmentId in data ) {
      //        $scope.points = $scope.points.concat(data[equipmentId])
      //      }
      //    }
      //    var pointIds = processPointsAndReturnPointIds($scope.points)
      //    subscribeToMeasurements(pointIds)
      //    getPointsCommands(pointIds)
      //  })
      //}

      function processPointsAndReturnPointIds(points) {
        var pointIds           = [],
            currentMeasurement = {
              value:        '-',
              time:         null,
              shortQuality: '',
              longQuality:  '',
              validity:     'NOTLOADED',
              expandRow:    false,
              commands:   undefined
            }
        points.forEach(function(point) {
          point.currentMeasurement = angular.extend({}, currentMeasurement)
          pointIds.push(point.id)
          if( typeof point.pointType !== 'string' )
            console.error('------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.')
          if( typeof point.unit !== 'string' )
            point.unit = ''

        })
        return pointIds
      }

      // Now getting name from NavTreeController.menuSelect and menuSelect waits until the name is loaded before calling us.
      //
      //function notifyWhenEquipmentNamesAreAvailable(equipmentId) {
      //  $scope.equipmentName = nameFromEquipmentIds($stateParams.equipmentIds) + ' '
      //}
      //
      //function nameFromEquipmentIds(equipmentIds) {
      //  var result = ''
      //  if( equipmentIds ) {
      //
      //    if( angular.isArray(equipmentIds) ) {
      //      equipmentIds.forEach(function(equipmentId, index) {
      //        var treeNode = navigation.getTreeNodeByEquipmentId(equipmentId, notifyWhenEquipmentNamesAreAvailable)
      //        if( index === 0 )
      //          result += nameFromTreeNode(treeNode)
      //        else
      //          result += ', ' + nameFromTreeNode(treeNode)
      //      })
      //    } else {
      //      var treeNode = navigation.getTreeNodeByEquipmentId(equipmentIds, notifyWhenEquipmentNamesAreAvailable)
      //      result = nameFromTreeNode(treeNode)
      //    }
      //  }
      //  return result
      //}

      // commandType: CONTROL, SETPOINT_INT, SETPOINT_DOUBLE, SETPOINT_STRING
      var exampleControls = [
        {
          commandType: 'CONTROL',
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
      function getCommandsForPoints(pointIds) {
        measurement.getCommandsForPoints( pointIds).then(
          function( response) {
            var point,
                data = response.data
            // data is map of pointId -> commands[]
            for( var pointId in data ) {
              point = findPoint(pointId)
              if( point ) {
                point.commands = data[pointId]
                point.commandTypes = getCommandTypes( point.commands).toLowerCase()
                console.log('commandTypes: ' + point.commandTypes)
              }
            }

          }
        )

      }

      function getCommandTypes( commands) {
        var control = '',
            setpoint = ''

        commands.forEach( function( c) {
          if( c.commandType.indexOf('SETPOINT') === 0) {
            if (setpoint.length === 0)
              setpoint = 'setpoint'
          } else {
            if( control.length === 0)
              control = 'control'
          }
        })

        return control && setpoint ? control + ',' + setpoint : control + setpoint
      }

      function getPointsAndSubscribeToMeasurements() {

        var promise = $scope.pointsPromise || equipment.getCurrentPoints( true)
        promise.then(
          function( response) {
            $scope.points = response.data
            var pointIds = processPointsAndReturnPointIds($scope.points)
            subscribeToMeasurements(pointIds)
            getCommandsForPoints(pointIds)
            return response // for the then() chain
          },
          function( error) {
            return error
          }
        )
      }

      getPointsAndSubscribeToMeasurements()
    }
  ]).

  directive('gbMeasurements', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope:       {
        pointsPromise: '=?'
      },
      templateUrl: 'greenbus.views.template/measurement/measurements.html',
      controller:  'gbMeasurementsController'
    }
  }).

  filter('validityIcon', function() {
    return function(validity) {
      switch( validity ) {
        case 'GOOD':
          return 'glyphicon glyphicon-ok validity-good';
        case 'QUESTIONABLE':
          return 'glyphicon glyphicon-question-sign validity-questionable';
        case 'NOTLOADED':
          return 'validity-notloaded'
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

      if( unit === 'raw' ) {
        image = '../../images/pointRaw.png'
      } else {
        switch( type ) {
          case 'ANALOG':
            image = '/images/pointAnalog.png';
            break;
          case 'STATUS':
            image = '/images/pointStatus.png';
            break;
          default:
            image = '/images/pointRaw.png';
        }
      }

      return image
    };
  }).
  filter('pointTypeText', function() {
    return function(type, unit) {
      var text

      if( unit === 'raw' ) {
        text = 'raw point'
      } else {
        switch( type ) {
          case 'ANALOG':
            text = 'analog point';
            break;
          case 'STATUS':
            text = 'status point';
            break;
          default:
            text = 'point with unknown type';
        }
      }

      return text
    };
  })



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


angular.module('greenbus.views.measurementValue', []).

  factory('gbMeasurementValueRest', ['rest', function( rest) {

    /**
     * Override measurements for a point.
     *
     * @param pointId Point ID to be overridden
     * @param value The new value as a string
     * @param valueType The type of the value to override. BOOL, INT, DOUBLE, STRING
     * @param success Success callback
     * @param failure Failure callback
     */
    function override( pointId, value, valueType, callee, success, failure) {

      var arg = {
            value: value,
            valueType: valueType
          },
          url = '/models/1/points/' + pointId + '/override'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR overriding point with ID: ' + pointId + ' to value "' + value + '" with type: "' + valueType + '". Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Put a point NIS (Not In Service)
     *
     * @param pointId Point ID to be overridden
     */
    function nis( pointId, callee, success, failure) {

      var arg,
          url = '/models/1/points/' + pointId + '/nis'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR setting NIS point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Remove a point's override or NIS (Not In Service)
     *
     * @param pointId Point ID to remove the override or NIS.
     */
    function remove( pointId, callee, success, failure, nisOrOverride) {

      var url = '/models/1/points/' + pointId + '/' + nisOrOverride

      rest.delete( url, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR removing ' + nisOrOverride + ' on point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    function removeNis( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'nis')}
    function removeOverride( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'override')}


    /**
     * Public API
     */
    return {
      override: override,
      nis: nis,
      removeNis: removeNis,
      removeOverride: removeOverride
    }
  }]).

  controller( 'gbMeasurementValueController', ['$scope', 'gbMeasurementValueRest', '$timeout', function( $scope, gbMeasurementValueRest, $timeout) {
    var self = this
    
    // When editing === undefined, we are not editing the value. The value is a view only span.
    // When editing === {value: '', valueType: ''}, we are editing.
    //
    $scope.editing = undefined
    
    $scope.removeTooltip = undefined // Remove NIS, Remove Replace
    $scope.placeHolder = ''
    $scope.requestPending = undefined
    $scope.replyError = undefined

    function getValueTypeFromPointType() {
      if( ! $scope.model.pointType)
        return 'DOUBLE'

      switch( $scope.model.pointType) {
        case 'ANALOG': return 'DOUBLE'
        case 'STATUS': return 'BOOL'
        case 'COUNTER': return 'INT'
        default:
          return 'DOUBLE'
      }
    }
    function getValueType() {
      if( ! $scope.model.currentMeasurement)
        return getValueTypeFromPointType()

      var m = $scope.model.currentMeasurement
      if( ! m.type)
        return getValueTypeFromPointType()

      switch( m.type) {
        case 'DOUBLE': return m.type
        case 'INT': return m.type
        case 'STRING': return m.type
        case 'BOOL': return m.type
        default:
          return getValueTypeFromPointType()
      }
    }
    
    $scope.editStart = function() {
      if( $scope.editing)
        return

      $scope.editing = {
        value: $scope.model.currentMeasurement.value,
        valueType: getValueType()
      }
      $scope.removeTooltip = self.getRemoveTooltip()
    }
    
    function editEnd() {
      $scope.editing = undefined
      pendingEditEndCancel() // just in case
    }



    //self.configureInput = function() {
    //  var m = $scope.model.currentMeasurement
    //  switch( m.shortQuality) {
    //    case 'R':
    //      $scope.canRemove = true
    //      $scope.canNis = true
    //      $scope.removeTooltip = 'Remove replace'
    //      break
    //    case 'N':
    //      $scope.canRemove = true
    //      $scope.canNis = false
    //      $scope.removeTooltip = 'Remove NIS'
    //      break
    //    default:
    //      $scope.canRemove = false
    //      $scope.canNis = true
    //      $scope.removeTooltip = undefined
    //      break
    //  }
    //
    //  // set focus and select text
    //}

    self.getRemoveTooltip = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R': return $scope.removeTooltip = 'Remove replace'
        case 'N': return $scope.removeTooltip = 'Remove NIS'
        default: return $scope.removeTooltip = undefined
      }
    }

    function beforeRequest( requestType ) {
      $scope.replyError = undefined
      $scope.requestPending = requestType
    }
    function afterRequestSuccessful( requestType ) {
      $scope.replyError = undefined
      $scope.requestPending = undefined
      editEnd()
    }
    function afterRequestFailure( pointId, ex, statusCode ) {
      $scope.replyError = '"Exception: ' + ex.exception + ' - ' + ex.message
      $scope.requestPending = undefined
    }

    // If user clicks one of our buttons (NIS, Override, or Remove), then the input gets a blur event.
    // We don't want to end the edit mode in this case. We set a timeout to see if someone
    // did, in fact, click a button (or tab and a button got focus). If not, then we go ahead with
    // ending edit mode.
    //
    function pendingEditEndStart() {
      if( ! $scope.editing)
        return
      $scope.pendingEditEndTimer = $timeout( function() {
        $scope.editing = undefined
        $scope.pendingEditEndTimer = undefined
      }, 300)
    }
    function pendingEditEndCancel() {
      if( $scope.pendingEditEndTimer) {
        $timeout.cancel( $scope.pendingEditEndTimer)
        $scope.pendingEditEndTimer = undefined
      }
    }

    $scope.nis = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      if( m.shortQuality !== 'R' && m.shortQuality !== 'N') {
        beforeRequest( 'nis')
        gbMeasurementValueRest.nis($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      }
    }
    $scope.override = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'override')
      gbMeasurementValueRest.override($scope.model.id, $scope.editing.value, $scope.editing.valueType, this, afterRequestSuccessful, afterRequestFailure)
    }
    $scope.remove = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'remove')
      if( m.shortQuality === 'R')
        gbMeasurementValueRest.removeOverride($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      else if( m.shortQuality === 'N')
        gbMeasurementValueRest.removeNis($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      else {
        $scope.requestPending = undefined
        console.error( 'gbMeasurementValueController.remove measurement shortQuality must be R or N; but it is: "' + m.shortQuality + '"')
      }
    }
    $scope.inputKeyDown = function($event) {
      if( $event.keyCode === 27) // escape key
        editEnd()
    }
    $scope.inputOnFocus = function() {
      pendingEditEndCancel()
    }
    $scope.buttonOnFocus = function() {
      pendingEditEndCancel()
    }

    $scope.inputOnBlur = function() {
      pendingEditEndStart()
    }
    $scope.buttonOnBlur = function() {
      pendingEditEndStart()
    }

  }]).

  directive( 'gbMeasurementValue', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      scope: {
             model  : '=',
             notify: '&'
      },
      templateUrl: 'greenbus.views.template/measurementValue/measurementValue.html',
      controller: 'gbMeasurementValueController',
      link: function(scope, element, attrs, controller) {
        var focusedElement
        element.on('click', function () {
          console.log( 'gbMeasurementValue onClick')
          if ( ! scope.editing) {
            scope.editStart()
            scope.$digest()
            console.log( 'gbMeasurementValue onClick selecting input')
            var input = element.find( 'input')
            if( input && input.length > 0) {
              input[0].select()
              //if( input[0].selectionStart !== 0)
              //  input[0].setSelectionRange( 0, 9999)
              //if( input[0].hasOwnProperty('selectionStart')) {
              //  if( input[0].selectionStart !== 0)
              //    input[0].selectionStart = 0
              //}
              focusedElement = input[0];
            }
          }
        })
        element.on('blur', function () {
          focusedElement = null;
        })

        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        scope.$parent.uncheckItem = controller.uncheckItem
        controller.notifyParent = function( state) {
          scope.notify( {state: state})
        }
      }
    }
  }).

  filter('buttonDisabled', function() {
    return function(disabled, classes) {
      return disabled ? classes + ' disabled' : classes
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

angular.module('greenbus.views.navigation', ['ui.bootstrap', 'ui.router', 'greenbus.views.rest']).

/**
 * Service for getting NavigationElements from server and populating NavTree menu items.
 * Each level of the NavTree is loaded incrementally based on the NavigationElements and the
 * current model.
 *
 * Goals:
 *
 * The view controller waits for the menu items to be loaded before being initialized. The
 * NavigationElement, in turn, calls menuSelect when items are finished loading (to initialize
 * the controller).
 *
 * When menu item is selected, the NavTreeController needs to pass some information to the target controller.
 *
 * Params:
 *
 * microgridId - If we're coming from the 'loading' state, there is no microgridId specified in the URL, so we need to
 *               supply it. Once we have a nested state, the microgridId will be propagated by ui.router; unless,
 *               of course, we are selecting a menu item under a different microgrid or no microgrid (ex: alarms).
 * navigationElement: {
 *   class:             NavigationElement class name or entity type. Examples: NavigationItem, MicroGrid, EquipmentLeaf
 *   id:                Entity UUID or undefined
 *   name:              Full entity name
 *   shortName:         Visible menu tree label
 *   equipmentChildren: Array of immediate children that are Equipment or EquipmentGroup.
  *                     Each element is {id, name, shortName}
 * }
 *
 * Usage Scenarios:
 *
 * navigation.getNavTree($attrs.href, 'navTree', $scope, $scope.menuSelect)
 *
 */
  factory('navigation', ['rest', function(rest) {   // was navigation

    function NotifyCache() {
      this.cache = {}
      this.listeners = {}
    }

    NotifyCache.prototype.put = function(key, value) {
      this.cache[key] = value
      var notifyList = this.listeners[key]
      if( notifyList ) {
        notifyList.forEach(function(notify) { notify(key, value)})
        delete this.listeners[key];
      }
    }
    NotifyCache.prototype.addListener = function(key, listener) {
      var listenersForId = this.listeners[key]
      if( listenersForId )
        listenersForId.push(listener)
      else
        this.listeners[key] = [listener]
    }
    NotifyCache.prototype.get = function(key, listener) {
      var value = this.cache[key]
      if( !value && listener )
        this.addListener(key, listener)
      return value
    }


    var self                       = this,
        NavigationClass              = {
          MicroGrid:      'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf:  'EquipmentLeaf',
          Sourced:        'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        equipmentIdToTreeNodeCache = new NotifyCache()


    function getNavigationClass(entity) {
      if( entity.types.indexOf(NavigationClass.MicroGrid) >= 0 )
        return NavigationClass.MicroGrid;
      else if( entity.types.indexOf(NavigationClass.EquipmentGroup) >= 0 )
        return NavigationClass.EquipmentGroup;
      else
        return NavigationClass.EquipmentLeaf
    }

    function stripParentName(childName, parentName) {
      if( parentName && childName.lastIndexOf(parentName, 0) === 0 )
        return childName.substr(parentName.length + 1) // plus 1 for the dot delimeter
      else
        return childName
    }

    // Make a copy of the children that are equipment (as apposed to other menu items).
    //
    // Need a copy of entities to pass to state transition target. If it's just the branch children,
    // the AngularJS digest consumes all the CPU
    //
    function shallowCopyEquipmentChildren( branch) {
      var equipmentChildren = []

      if(  !branch.children)
        return equipmentChildren

      branch.children.forEach( function( child) {
        if( child.class === NavigationClass.EquipmentLeaf || child.class === NavigationClass.EquipmentGroup) {
          equipmentChildren.push( {
            id: child.id,
            name: child.name,
            shortName: child.shortName
          })
        }
      })

      return equipmentChildren
    }

    function entityToTreeNode(entityWithChildren, parent) {
      // Could be a simple entity.
      var entity = entityWithChildren.entity || entityWithChildren

      var microgridId, state,
          shortName = entity.name,
          name      = entity.name

      // Types: (Microgrid, Root), (EquipmentGroup, Equipment), (Equipment, Breaker)
      var containerType = getNavigationClass(entity)
      if( entity.class)
        console.error( 'entityToTreeNode entity.class=' + entity.class)
      if( entity.state)
        console.error( 'entityToTreeNode entity.state=' + entity.state)

      switch( containerType ) {
        case NavigationClass.MicroGrid:
          microgridId = entity.id
          break;
        case NavigationClass.EquipmentGroup:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Id')
          }
          break;
        case NavigationClass.EquipmentLeaf:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Id')
          }
          break;
        case NavigationClass.Sourced:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Sourced')
          }
          break;
        default:
      }


      if( entity.parentName )
        shortName = stripParentName(name, entity.parentName)
      else if( parent )
        shortName = stripParentName(name, parent.parentName)

      return {
        microgridId:   microgridId,
        name:          name,
        label:         shortName,
        id:            entity.id,
        type:          'item',
        types:         entity.types,
        class:         containerType,
        state:         state,
        equipmentChildren: shallowCopyEquipmentChildren(entity),
        children:      entityWithChildren.children ? entityChildrenListToTreeNodes(entityWithChildren.children, entity) : []
      }
    }

    function entityChildrenListToTreeNodes(entityWithChildrenList, parent) {
      var ra = []
      entityWithChildrenList.forEach(function(entityWithChildren) {
        var treeNode = entityToTreeNode(entityWithChildren, parent)
        ra.push(treeNode)
        equipmentIdToTreeNodeCache.put(treeNode.id, treeNode)
      })
      return ra
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements(navigationElements) {
      navigationElements.forEach(function(element, index) {
        var data = element.data;
        delete element.data;
        angular.extend(element, data)
        flattenNavigationElements(element.children)
      })
    }

    /**
     * Breadth-first search of first menu item where selected = true.
     * If none found, return undefined. This means the designer doesn't want a menu item selected at
     * startup.
     *
     * @param navigationElements The array of Navigation Elements.
     * @returns The first NavigationElement where selected is true; otherwise return undefined.
     */
    function findFirstSelected(navigationElements) {
      var i, node, selected

      if( !navigationElements || navigationElements.children === 0 )
        return undefined

      // Breadth first search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.selected ) {
          return node
        }
      }

      // Deep search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.children && node.children.length > 0 ) {
          selected = findFirstSelected(node.children)
          if( selected )
            return selected
        }
      }

      return undefined
    }

    function callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, menuSelect) {
      var selected = findFirstSelected(navigationElements)
      if( selected) {
        if( selected.sourceUrl) {
          // @param menuItem  The selected item. The original (current scoped variable 'selected') could have been replaced.
          selected.selectWhenLoaded = function( menuItem) {
            menuSelect.call( scope, menuItem)
          }
        } else {
          menuSelect.call( scope, selected)
        }
      }
    }

    function safeCopy(o) {
      var clone = angular.copy(o);
      // Angular adds uid to all objects. uid cannot be a duplicate.
      // Angular will generate a uid for this object on next digest.
      delete clone.uid;
      return clone
    }

    function insertTreeNodeChildren(parent, newChildren) {
      // Append to any existing children
      parent.children = parent.children.concat(newChildren)
      parent.equipmentChildren = shallowCopyEquipmentChildren( parent)

      parent.loading = false
      if( parent.selectWhenLoaded) {
        parent.selectWhenLoaded( parent);
        delete parent.selectWhenLoaded;
      }

    }

    function getParentStatePrefix( parentState) {
      var prefix = parentState,
          index = parentState.indexOf( '.dashboard')
      if( index >=0)
        prefix = parentState.substr( 0, index) // index, length
      return prefix
    }

    // If child state start with '.', append it to the parentStatePrefix; otherwise,
    // the child state is absolute and just return it.
    //
    function getNestedChildState( parentStatePrefix, childState) {
      if( childState.indexOf( '.') === 0)
        return parentStatePrefix + childState
      else
        return childState
    }

    /**
     * Generate newTreeNodes using parentTree[index] as a template.
     * - Remove parentTree[index]
     * - For each newTreeNode, insert at index and copy the removed templates children as childrent for newTreeNode.
     *
     * BEFORE:
     *
     *   loading...
     *     Equipment
     *     Solar
     *     Energy Storage
     *
     * AFTER:
     *
     *   Microgrid1
     *     Equipment1
     *       Brkr1
     *       PV1
     *       ...
     *     Solar
     *       PV1
     *       ...
     *     Energy Storage
     *       ...
     *   Microgrid2
     *     ...
     *
     * @param parentTree
     * @param index
     * @param newTreeNodes
     */
    function generateNewTreeNodesAtIndexAndPreserveChildren(parentTree, index, newTreeNodes, scope) {
      var i,
          oldParent   = parentTree[index],
          oldChildren = oldParent.children
      // Remove the child we're replacing.
      parentTree.splice(index, 1)

      for( i = newTreeNodes.length - 1; i >= 0; i-- ) {
        var newParentStatePrefix,
            newParent = newTreeNodes[i]
        newParent.state = oldParent.state
        newParentStatePrefix = getParentStatePrefix( newParent.state)
        parentTree.splice(index, 0, newParent)

        // For each new child that we're adding, replicate the old children.
        // Replace $parent in the sourceUrl with its current parent.
        if( oldChildren && oldChildren.length > 0 ) {
          var i2
          for( i2 = 0; i2 < oldChildren.length; i2++ ) {
            var child     = safeCopy(oldChildren[i2]),
                sourceUrl = child.sourceUrl
            //child.state = child.state + '.' + node.id
            child.parentName = newParent.label
            child.parentId = newParent.id
            child.microgridId = newParent.microgridId
            child.state = getNestedChildState( newParentStatePrefix, child.state)
            // The child is a copy. We need to put it in the cache.
            // TODO: We need better coordination with  This works, but I think it's a kludge
            // TODO: We didn't remove the old treeNode from the cache. It might even have a listener that will fire.
            //putTreeNodeByMenuId(child.state, child)
            newParent.children.push(child)
            if( sourceUrl ) {
              if( sourceUrl.indexOf('$parent') )
                child.sourceUrl = sourceUrl.replace('$parent', newParent.id)
              loadTreeNodesFromSource(newParent.children, newParent.children.length - 1, child, scope)
            }
          }
        }

        // If the oldParent was marked selected and waiting until it was loaded; now we're loaded and we
        // need to select one of these new menu items. We'll pick the first one (which is i === 0).
        //
        if( i === 0 && oldParent.selectWhenLoaded) {
          oldParent.selectWhenLoaded( newParent);
          delete oldParent.selectWhenLoaded; // just in case
        }

      }
    }

    function loadTreeNodesFromSource(parentTree, index, child, scope) {
      parentTree[index].loading = true
      getTreeNodes(child.sourceUrl, scope, child, function(newTreeNodes) {
        switch( child.insertLocation ) {
          case 'CHILDREN':
            // Insert the resultant children before any existing static children.
            insertTreeNodeChildren(child, newTreeNodes)
            break;
          case 'REPLACE':
            generateNewTreeNodesAtIndexAndPreserveChildren(parentTree, index, newTreeNodes, scope)
            // original child was replaced.
            child = parentTree[index]
            break;
          default:
            console.error('navTreeController.loadTreeNodesFromSource.getTreeNodes Unknown insertLocation: ' + child.insertLocation)
        }

        //child.loading = false
        //if( child.selectWhenLoaded) {
        //  child.selectWhenLoaded( child);
        //  delete child.selectWhenLoaded;
        //}
      })

    }

    function compareEntityByName( a, b) { return a.name.localeCompare(b.name)}
    function compareEntityWithChildrenByName( a, b) { return a.entity.name.localeCompare( b.entity.name)}

    function sortEntityWithChildrenByName( entityWithChildrenList) {
      if( entityWithChildrenList.length === 0)
        return
      if( entityWithChildrenList[0].hasOwnProperty( 'name'))
        entityWithChildrenList.sort( compareEntityByName)
      else
        entityWithChildrenList.sort( compareEntityWithChildrenByName)
    }

    function getTreeNodes(sourceUrl, scope, parent, successListener) {
      rest.get(sourceUrl, null, scope, function(entityWithChildrenList) {
        sortEntityWithChildrenByName( entityWithChildrenList)
        var treeNodes = entityChildrenListToTreeNodes(entityWithChildrenList, parent)
        successListener(treeNodes)
      })
    }

    /**
     * Public API
     */
    return {

      NavigationClass: NavigationClass,

      /**
       * Get the tree node by equipment Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param equipmentId
       * @param notifyWhenAvailable
       * @returns The current value or null if not available yet.
       */
      getTreeNodeByEquipmentId: function(equipmentId, notifyWhenAvailable) { return equipmentIdToTreeNodeCache.get(equipmentId, notifyWhenAvailable)},

      getTreeNodes: getTreeNodes,

      /**
       * Main call to get NavigationElements and populate the navTree menu. After retieving the NavigationElements,
       * start retrieving the model entities referenced by NavigationElements (via sourceUrl).
       *
       * @param url URL for retrieving the NavigationElements.
       * @param name Store the navTree on scope.name
       * @param scope The controller scope
       * @param menuSelect Notify method to call when the NavigationElement marked as selected is finished loading.
       */
      getNavTree: function(url, name, scope, menuSelect) {
        rest.get(url, name, scope, function(navigationElements) {
          // example: [ {class:'NavigationItem', data: {label:Dashboard, state:dashboard, url:#/dashboard, selected:false, children:[]}}, ...]
          flattenNavigationElements(navigationElements)

          callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, menuSelect)

          navigationElements.forEach(function(node, index) {
            if( node.sourceUrl )
              loadTreeNodesFromSource(navigationElements, index, node, scope)
          })

        })
      }
    } // end return Public API

  }]). // end factory 'navigation'

  controller('NavBarTopController', ['$scope', '$attrs', '$location', '$cookies', 'rest', function($scope, $attrs, $location, $cookies, rest) {
    $scope.loading = true
    $scope.applicationMenuItems = []
    $scope.sessionMenuItems = []
    $scope.application = {
      label: 'loading...',
      url:   ''
    }
    $scope.userName = $cookies.userName

    $scope.getActiveClass = function(item) {
      return ( $location.absUrl().indexOf(item.url) >= 0) ? 'active' : ''
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements(navigationElements) {
      navigationElements.forEach(function(element, index) {
        var data = element.data;
        delete element.data;
        angular.extend(element, data)
        flattenNavigationElements(element.children)
      })
    }

    function onSuccess(json) {
      flattenNavigationElements(json)
      $scope.application = json[0]
      $scope.applicationMenuItems = json[0].children
      $scope.sessionMenuItems = json[1].children
      console.log('navBarTopController onSuccess ' + $scope.application.label)
      $scope.loading = false
    }

    return rest.get($attrs.href, 'data', $scope, onSuccess)
  }]).
  directive('navBarTop', function() {
    // <nav-bar-top url='/menus/admin'
    return {
      restrict:    'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace:     true,
      transclude:  true,
      scope:       true,
      templateUrl: 'greenbus.views.template/navigation/navBarTop.html',
      controller:  'NavBarTopController'
    }
  }).

  controller('NavListController', ['$scope', '$attrs', 'rest', function($scope, $attrs, rest) {
    $scope.navItems = [{'class': 'NavigationHeader', label: 'loading...'}]

    $scope.getClass = function(item) {
      switch( item.class ) {
        case 'NavigationDivider':
          return 'divider'
        case 'NavigationHeader':
          return 'nav-header'
        case 'NavigationItemToPage':
          return ''
        case 'NavigationItem':
          return ''
        case 'NavigationItemSource':
          return ''
        default:
          return ''
      }
    }

    return rest.get($attrs.href, 'navItems', $scope)
  }]).
  directive('navList', function() {
    // <nav-list href='/coral/menus/admin'>
    return {
      restrict:    'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace:     true,
      transclude:  true,
      scope:       true,
      templateUrl: 'greenbus.views.template/navigation/navList.html',
      controller:  'NavListController'
    }
  }).

  controller('NavTreeController', ['$scope', '$attrs', '$location', '$state', '$cookies', 'rest', 'navigation', function($scope, $attrs, $location, $state, $cookies, rest, navigation) {

    $scope.navTree = [
      {
        class:    'Loading',
        state:    'loading',
        loading:  true,
        label:    'loading..',
        children: [],
        data:     {
          regex:           '^[^/]+',
          count:           0,
          newMessageCount: 1,
          depth:           0
        }
      }
    ]
    // GET /models/1/equipment?depth=3&rootTypes=Root
    var sampleGetResponse = [
      {
        'entity':   {
          'name':  'Some Microgrid',
          'id':    'b9e6eac2-be4d-41cf-b82a-423d90515f64',
          'types': ['Root', 'MicroGrid']
        },
        'children': [
          {
            'entity':   {
              'name':  'MG1',
              'id':    '03c2db16-0f78-4800-adfc-9dff9d4598da',
              'types': ['Equipment', 'EquipmentGroup']
            },
            'children': []
          }
        ]
      }
    ]

    $scope.menuSelect = function(branch) {
      console.log('NavTreeController.menuSelect ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)

      if( branch.loading ) {
        console.errror('NavTreeController.menuSelect LOADING! ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)
        $state.go('loading')
        return
      }

      // For now, we always supply microgridId. This is needed with we're coming from the 'loading' (or 'alarms')
      // state . It's not needed when we're going from one nested state to another (in the same microgrid).
      // TODO: Perhaps we should check if the microgridId is already known and isn't changing and not supply it. This might help with microgrid view reloads.
      //
      //
      // NOTE: These params are only passed to the controller if each parameter is defined in
      // the target state's URL params or non-URL params. Ex: params: {navigationElement: null}
      //
      var params = {
        microgridId:       branch.microgridId,
        id: branch.id,
        navigationElement: {
          class:     branch.class,
          id:        branch.id,
          types:     branch.types,
          name:      branch.name,      // full entity name
          shortName: branch.label,
          equipmentChildren: branch.equipmentChildren // children that are equipment
        }
        }

      if( branch.sourceUrl )
        params.sourceUrl = branch.sourceUrl

      $state.go(branch.state, params)
    }


    return navigation.getNavTree($attrs.href, 'navTree', $scope, $scope.menuSelect)
  }]).
  directive('navTree', function() {
    // <nav-tree href='/coral/menus/analysis'>
    return {
      restrict:   'E', // Element name
      scope:      true,
      controller: 'NavTreeController',
      list:       function(scope, element, $attrs) {}
    }
  }).

  // If badge count is 0, return empty string.
  filter('badgeCount', function() {
    return function(count) {
      if( count > 0 )
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
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.notification', ['greenbus.views.rest', 'greenbus.views.subscription']).

/**
 * Control notification messages on top of screen. The current notifications are a reflection of the rest service (HTTP requests)
 * and subscription service (WebSocket).
 *
 *
 * rest      | subscription      | message
 * ------------------------------------------------------------------
 * INIT      | INIT              | Initializing services... (rest, subscription)
 * UP        | INIT              | Initializing services... (subscription)
 * UP        | UP                | -
 *
 *
 * Initializing services... (rest, subscription)
 * Initializing services... (rest)
 * Not logged in. Redirecting to login page...
 * Application server is not responding.  (rest, subscription)
 * Service failure... (subscription
 */
  controller( 'gbNotificationController', [ '$scope', 'rest', 'subscription',
    function( $scope, rest, subscription) {

      var restStatus = rest.getStatus(),
          subscriptionStatus = subscription.getStatus(),
          greenbusStatus = {
            status: 'AMQP_UP', // let's assume AMQP_UP until we hear otherwise.
            reinitializing: false,
            description: ''
          }

      $scope.notifications = []

      function makeNotifications() {
        $scope.notifications = []
        if( restStatus.status !== rest.STATUS.UP)
          $scope.notifications.push( restStatus.description)
        if( subscriptionStatus.status !== subscription.STATUS.UP && subscriptionStatus.status !== subscription.STATUS.UNOPENED)
          $scope.notifications.push( subscriptionStatus.description)
        if( greenbusStatus.status !== 'AMQP_UP')
          $scope.notifications.push( greenbusStatus.description)
      }

      $scope.$on( 'rest.status', function( event, status) {
        restStatus = status;
        //if( restStatus.status !== 'UP')
        makeNotifications()
      })

      $scope.$on( 'subscription.status', function( event, status) {
        subscriptionStatus = status;
        //if( subscriptionStatus.status !== 'UP')
        makeNotifications()
      })

      $scope.$on( 'greenbus.status', function( event, status) {
        greenbusStatus = status;
        //if( greenbusStatus.status !== 'UP')
        makeNotifications()
      })

    }]).

  directive( 'gbNotification', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/notification/notification.html',
      controller: 'gbNotificationController'
    }
  })



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
 * A table of points for the current equipment in $stateParams.
 */
angular.module('greenbus.views.point', [ 'ui.router', 'greenbus.views.equipment']).

  controller('gbPointsTableController', ['$scope', '$stateParams', 'equipment',
    function($scope, $stateParams, equipment) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.points = []

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return
      var promise = $scope.pointsPromise || equipment.getCurrentPoints( true)
      $scope.points = promise.then(
        function( response) {
          $scope.points = response.data
          return response // for the then() chain
        },
        function( error) {
          return error
        }
      )

    }
  ]).

  directive('gbPointsTable', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope: {
        pointsPromise: '=?'
      },
      templateUrl: 'greenbus.views.template/point/pointsTable.html',
      controller:  'gbPointsTableController'
    }
  })



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
 * A table of key/value properties for one piece of equipment.
 */
angular.module('greenbus.views.property', [ 'ui.router', 'greenbus.views.rest', 'greenbus.views.subscription']).

  controller('gbPropertiesTableController', ['$scope', '$stateParams', 'rest', 'subscription',
    function($scope, $stateParams, rest, subscription) {
      var equipmentId, subscriptionId,
          self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.properties = []

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      addTypesToPropertiesList()

      var onePieceOfEquipment = navigationElement.equipmentChildren.length === 0
      if( !onePieceOfEquipment) {
        console.error( 'gbPropertiesTableController: more than one child: navigationElement.equipmentChildren.length = ' + navigationElement.equipmentChildren.length)
        return
      }

      equipmentId = navigationElement.id

      function addTypesToPropertiesList() {
        if( navigationElement.types)
          $scope.properties.push( {
            key: 'types',
            value: navigationElement.types.join( ', ')
          })
      }

      function findPropertyIndex( key) {
        var i
        for( i = 0; i < $scope.properties.length; i++) {
          var prop = $scope.properties[i]
          if( key === prop.key)
            return i
        }
        return -1
      }

      function findProperty( key) {

        var i = findPropertyIndex( key)
        return i >= 0 ? $scope.properties[i] : undefined
      }

      function compare(a,b) {
        if (a.key < b.key)
          return -1;
        if (a.key > b.key)
          return 1;
        return 0;
      }

      function applyIsObject( property) {
        property.isObject = angular.isObject( property.value)
      }

      function addProperty( property) {
        $scope.properties.push( property)
        $scope.properties.sort( compare)
      }

      function notifyProperty( notificationProperty) {
        var i,
            property = notificationProperty.value

        switch( notificationProperty.operation) {
          case 'ADDED':
            addProperty( property)
            break;
          case 'MODIFIED':
            var currentProperty = findProperty( property.key)
            if( currentProperty) {
              currentProperty.value = property.value
              applyIsObject( currentProperty)
            } else {
              console.error( 'gbPropertiesTableController: notify MODIFIED, but can\'t find existing property key: "' + property.key + '"')
              addProperty( property)
            }
            break;
          case 'REMOVED':
            i = findPropertyIndex( property.key)
            if( i >= 0)
              $scope.properties.splice(i,1)
            else
              console.error( 'gbPropertiesTableController: notify REMOVED, but can\'t find existing property key: "' + property.key + '"')
        }
      }

      function subscribeToProperties() {

        var json = {
          name: 'SubscribeToProperties',
          entityId:  equipmentId
        }

        subscriptionId = subscription.subscribe( json, $scope,
          function( subscriptionId, type, data) {

            switch( type) {
              case 'notification.property':
                notifyProperty( data)
                break
              case 'properties':
                $scope.properties = data.slice()
                addTypesToPropertiesList()
                $scope.properties.forEach( applyIsObject)
                $scope.properties.sort( compare)
                break
              default:
                console.error( 'gbPropertiesTableController: unknown type "' + type + '" from subscription notification')
            }
            $scope.$digest()
          },
          function(error, message) {
            console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
          }
        )
      }

      subscribeToProperties()
    }
  ]).

  directive('gbPropertiesTable', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope:       true,
      templateUrl: 'greenbus.views.template/property/propertiesTable.html',
      controller:  'gbPropertiesTableController'
    }
  })



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
  factory('rest', ['$rootScope', '$timeout', '$http', '$q', '$location', 'authentication', function($rootScope, $timeout, $http, $q, $location, authentication) {

    var self = this;
    var retries = {
      initialize: 0,
      get:        0
    }

    var STATUS = {
      NOT_LOGGED_IN: 'NOT_LOGGED_IN',
      APPLICATION_SERVER_DOWN: 'APPLICATION_SERVER_DOWN',
      APPLICATION_REQUEST_FAILURE: 'APPLICATION_REQUEST_FAILURE',
      UP: 'UP'
    }
    var status = {
      status:         STATUS.NOT_LOGGED_IN,
      reinitializing: true,
      description:    'Initializing connection to server...'
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
      console.log('rest: authentication.isLoggedIn()')
      // Let's assume, for now, that we already logged in and have a valid authToken.
      setStatus({
        status:         STATUS.UP,
        reinitializing: false,
        description:    ''
      })

    } else {
      console.log('rest: ! authentication.isLoggedIn()')
    }


    function handleConnectionStatus(json) {
      setStatus(json);

      if( status.status === STATUS.UP && redirectLocation )
        $location.path(redirectLocation)
    }

    function setStatus(s) {
      if( status.status !== s.status || status.description !== s.description ||  status.reinitializing !== s.reinitializing) {
        status = s
        console.log('rest.setStatus: ' + status.status + ' - ' + status.description)
        $rootScope.$broadcast('rest.status', status);
      }
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
          status:         STATUS.APPLICATION_SERVER_DOWN,
          reinitializing: false,
          description:    'Application server is not responding. Your network connection is down or the application server appears to be down.'
        });
      } else if( statusCode == 401 ) {
        setStatus({
          status:         STATUS.NOT_LOGGED_IN,
          reinitializing: true,
          description:    'Not logged in.'
        });
        redirectLocation = $location.url(); // save the current url so we can redirect the user back
        authentication.redirectToLoginPage(redirectLocation)
      } else if( statusCode === 404 || statusCode === 500 || (isString(json) && json.length === 0) ) {
        setStatus({
          status:         STATUS.APPLICATION_REQUEST_FAILURE,
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

    function get(url, name, $scope, successListener, failureListener) {
      return getDo(url, name, $scope, successListener, failureListener, $q.defer())
    }
    function getDo(url, name, $scope, successListener, failureListener, deferred) {

      if( $scope)
        $scope.loading = true;
      //console.log( 'rest.get ' + url + ' retries:' + retries.get);


      if( !authentication.isLoggedIn() ) {
        console.log('self.get if( !authentication.isLoggedIn())')
        redirectLocation = $location.url() // save the current url so we can redirect the user back
        console.log('CoralRest.get: saving redirectLocation: ' + redirectLocation)
        authentication.redirectToLoginPage(redirectLocation)
        deferred.reject( {data: undefined, status: 'Not logged in. Redirecting to login'})
        return deferred.promise
      }

      // Register for controller.$destroy event and kill any retry tasks.
      if( $scope)
        $scope.$on('$destroy', function(event) {
          //console.log( 'rest.get destroy ' + url + ' retries:' + retries.get);
          if( $scope.task ) {
            console.log('rest.get destroy task' + url + ' retries:' + retries.get);
            $timeout.cancel($scope.task);
            $scope.task = null;
            retries.get = 0;
          }
        });

      if( status.status !== STATUS.UP ) {
        console.log('self.get ( status.status != "UP")')
        retries.get++;
        var delay = retries.get < 5 ? 1000 : 10000

        if( $scope) {
          $scope.task = $timeout(function() {
            self.getDo(url, name, $scope, successListener, failureListener, deferred);
          }, delay);
          deferred.notify( 'Status is ' + status.status + '. Retrying in ' + (delay / 1000) + ' seconds')
        } else
          deferred.reject( {data: undefined, status: status.status})

        return deferred.promise;
      }

      retries.get = 0;

      httpConfig.headers = authentication.getHttpHeaders()


      // encodeURI because objects like point names can have percents in them.
      $http.get(encodeURI(url), httpConfig).then(
        function( response) {
          var json = response.data
          if( $scope) {
            if( name)
              $scope[name] = json;
            $scope.loading = false;
          }
          console.log('rest.get success json.length: ' + json.length + ', url: ' + url);

          // If the get worked, the service must be up.
          if( status.status != STATUS.UP ) {
            setStatus({
              status:         STATUS.UP,
              reinitializing: false,
              description:    ''
            });
          }

          if( successListener )
            successListener(json)

          deferred.resolve( {data: json})
        },
        function( error) {
          // error.status
          //   0 Server down
          // 400 Bad Request - request is malformed or missing required fields.
          // 401 Unauthorized
          // 403 Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
          // 404 Not Found - Server has not found anything matching the Request-URI
          // 408 Request Timeout
          // 500 Internal Server Error
          //
          if( failureListener )
            failureListener(error.data, error.status, error.headers, error.config)

          if( error.status === 401 || error.status === 0 )
            httpRequestError(error.data, error.status, error.headers, error.config)

          deferred.reject( error)
        }
      )

      return deferred.promise

    }

    function post(url, data, name, $scope, successListener, failureListener) {
      var deferred = $q.defer()

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.post(url, data, httpConfig).then(
        function( response) {
          var json = response.data
          if( name && $scope)
            $scope[name] = json;
          console.log('rest.post success json.length: ' + json.length + ', url: ' + url);

          if( successListener )
            successListener(json)
          deferred.resolve( {data: json})
        },
        function( error) {
          // error.status
          //   0 Server down
          // 400 Bad Request - request is malformed or missing required fields.
          // 401 Unauthorized
          // 403 Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
          // 404 Not Found - Server has not found anything matching the Request-URI
          // 408 Request Timeout
          // 500 Internal Server Error
          //
          if( failureListener )
            failureListener(error.data, error.status, error.headers, error.config)

          if( error.status === 401 || error.status === 0 )
            httpRequestError(error.data, error.status, error.headers, error.config)

          deferred.reject( error)
        }
      )

      return deferred.promise
    }

    function _delete(url, name, $scope, successListener, failureListener) {
      var deferred = $q.defer()

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.delete(url, httpConfig).then(
        function( response) {
          var json = response.data
          if( name && $scope)
            $scope[name] = json;
          console.log('rest.delete success json.length: ' + json.length + ', url: ' + url);

          if( successListener )
            successListener(json)
          deferred.resolve( {data: json})
        },
        function(error) {
          // error.status
          //   0 Server down
          // 400 Bad Request - request is malformed or missing required fields.
          // 401 Unauthorized
          // 403 Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
          // 404 Not Found - Server has not found anything matching the Request-URI
          // 408 Request Timeout
          // 500 Internal Server Error
          //
          if( error.status === 400 || error.status === 403 )
            failureListener(error.data, error.status, error.headers, error.config)
          else
            httpRequestError(json, statusCode, headers, config)

          deferred.reject( error)
        }

      )

      return deferred.promise
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
      STATUS: STATUS,
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
            description:    'Application server is not responding. Your network connection is down or the application server appears to be down. HTTP Status: ' + httpStatus
          };

          //var $rootScope = $rootScope || $injector.get('$rootScope');
          $rootScope.$broadcast('rest.status', status);

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
 * Copyright 2014-2015 Green Energy Corp.
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
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.schematic', ['greenbus.views.measurement', 'greenbus.views.rest', 'greenbus.views.request']).

  /**
   * Schematic services.
   *
   *   controller: schematic.subscribe( notify)
   *   link: scope.$watch('svgSource', )
   *     insert
   *     use jQuery to get points
   *     store points on scope for controller.
   *     use jQuery to transform to Angular directives
   *     $compile
   *   controller: watch points list and subscribe to points
   */
  factory('schematic', [ 'rest', 'subscription', 'assert', '$q', function( rest, subscription, assert, $q) {

    // public API
    var exports = {
      KEY_SCHEMATIC: 'schematic'
    }


    Array.prototype.unique = [].unique || function(){
      var u = {}, a = [];
      for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
          continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
      }
      return a;
    }

    exports.subscribe = function( equipmentId, scope, notify) {

      var subscriptionId,
          json = {
            name: 'SubscribeToProperties',
            entityId:  equipmentId,
            keys: [exports.KEY_SCHEMATIC]
          }

      subscriptionId = subscription.subscribe( json, scope,
        function( subscriptionId, type, data) {

          switch( type) {
            case 'notification.property':
              assert.equals( data.value.key, exports.KEY_SCHEMATIC, 'schematic.subscribe notification.property: ')
              notify( subscriptionId, data.value.value, data.operation)
              break
            case 'properties':
              if( data.length > 0) {
                assert.equals( data[0].key, exports.KEY_SCHEMATIC, 'schematic.subscribe properties: ')
                notify( subscriptionId, data[0].value, 'CURRENT')
              } else {
                console.log( 'schematic.subscribe to schematic - no schematic property')
              }
              break
            default:
              console.error( 'schematic.subscribe: unknown type "' + type + '" from subscription notification')
          }
          scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
        }
      )

      return subscriptionId
    }


    exports.getPointsByName = function( pointNames) {
      if( ! pointNames || pointNames.length === 0)
        return $q.when( [])

      var pnamesQueryParams = rest.queryParameterFromArrayOrString('pnames', pointNames),
          url = '/models/1/points?' + pnamesQueryParams

      return rest.get(url)

    }


    /**
     *
     *  <g schematic-type="point" name="LV.Line.kW_tot" tgs:point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  <svg schematic-type="equipment-symbol"  symbol-type=“circuitbreaker" tgs:point-name="LV.CB_Main.Status"  class="symbol"  preserveAspectRatio=“xMaxYMax" id="svg_462" x="364" y="104">
     *    <g state="open" display="none" id="svg_465">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_466"></rect>
     *    </g>
     *    <g state="closed" id="svg_463" style="display:inherit;">
     *      <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_464"></rect>
     *    </g>
     *  </svg>
     *
     *  <rect schematic-type="navigation-area" class="navigation-area clickable" uri="ModelNodeDetailPlace:?model_node_name=LV;tab=schematic" fill="#FFFFFF" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="210" y="10" width="460" height="480" id="svg_349"></rect>
     *
     *  @param rootElement
     */
    exports.parseElements = function( rootElement) {
      var symbols = {},
          elements = rootElement.find( '[tgs\\:schematic-type]')

      symbols.measurements = elements.filter( '[tgs\\:schematic-type=point]')
      symbols.equipment = elements.filter( '[tgs\\:schematic-type=equipment-symbol]')
      symbols.navigationAreas = elements.filter( '[tgs\\:schematic-type=navigation-area]')
      symbols.navigationLabels = elements.filter( '[tgs\\:schematic-type=navigation-label]')

      return symbols
    }

    exports.transformSymbols = function( symbols) {
      var measurementPointNames, equipmentPointNames, pointNames, t
      // Convert jQuery object to array of strings.
      measurementPointNames  = symbols.measurements.map( exports.transformMeasurementAndReturnPointName).get()
      equipmentPointNames  = symbols.equipment.map( exports.transformEquipmentAndReturnPointName).get()

      pointNames = measurementPointNames.concat( equipmentPointNames).unique()

      return pointNames
    }

    /**
     *
     *  <g tgs:schematic-type="point" name="LV.Line.kW_tot" tgs:point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  @param rootElement
     */
    exports.transformMeasurementAndReturnPointName = function( ) {
      var element = $(this),
          pointName = element.attr( 'tgs:point-name'),
          useQuality = element.find( 'use'),
          text = element.find( 'text')

      text.html( '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.value }} {{ pointNameMap[\'' + pointName + '\'].unit }}')
      useQuality.attr( 'xlink:href', '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.validity | schematicValidityDef }} ')

      element.attr( 'ng-click', 'equipmentClicked( pointNameMap[\'' + pointName + '\'])')

      return pointName
    }

    /**
     *
     *  <svg preserveAspectRatio="xMaxYMax" class="symbol" tgs:schematic-type="equipment-symbol" id="svg_619" x="484" y="404" tgs:point-name="Zone1.PCC_cbr_cust.Status" tgs:symbol-type="circuitbreaker">
     *    <g tgs:state="open" display="none" id="svg_622">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_623"/>
     *    </g>
     *    <g tgs:state="closed" id="svg_620">
     *     <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_621"/>
     *    </g>
     *  </svg>
     *
     *  @param rootElement
     */
    exports.transformEquipmentAndReturnPointName = function( ) {
      var element = $(this),
          states = element.find( '[tgs\\:state]'),
          pointName = element.attr( 'tgs:point-name')

      if( pointName && pointName.length > 0) {
        states.map( function() {
          var stateElement = $(this),
              stateName = stateElement.attr( 'tgs:state')
          stateElement.attr( 'ng-show', 'pointNameMap[\'' + pointName + '\'].currentMeasurement.value === \'' + stateName + '\'')
          stateElement.removeAttr( 'display')
          return stateName
        })
      }

      return pointName
    }


    function filterPoints( elem) {
      return elem.attr('tgs\\:schematic-type') === 'point'
    }
    function filterEquipment( elem) { return elem.attr('tgs\\:schematic-type') === 'equipment-symbol'}
    function filterNavigationAreas( elem) { return elem.attr('tgs\\:schematic-type') === 'navigation-area'}
    function filterNavigationLabels( elem) { return elem.attr('tgs\\:schematic-type') === 'navigation-label'}

    return exports

  }]).




  /**
   * Controller for a single schematic (like inside the pop-out window).
   */
  controller( 'gbSchematicController', ['$scope', '$window', '$state', '$stateParams', 'measurement', 'rest', 'schematic', function( $scope, $window, $state, $stateParams, measurement, rest, schematic) {

    var  self = this,
         microgridId       = $stateParams.microgridId,
         equipmentId       = $stateParams.id,// id string if equipment navigation element, else undefined
         navigationElement = $stateParams.navigationElement,  // {id:, name:, shortName:, types:, equipmentChildren:, class:}
         pointIdMap = {} // points by point id. {id, name:, currentMeasurement:}

    if( !equipmentId && $state.is( 'microgrids.dashboard') )
      equipmentId = microgridId

    $scope.loading = true
    $scope.svgSource = undefined
    $scope.symbols = undefined
    $scope.pointNames = []
    $scope.pointNameMap = {} // points by point name. {id, name:, currentMeasurement:}


    //if( pointIds.length > 0) {
    //  var url = '/models/1/points?' + rest.queryParameterFromArrayOrString( 'pids', pointIds)
    //  rest.get( url, 'points', $scope, function( data) {
    //    data.forEach( function( point) {
    //      $scope.schematic.addPoint( point)
    //      subscribeToMeasurementHistory( $scope.schematic, point )
    //    })
    //    $scope.invalidateWindow()
    //  })
    //}

    $scope.equipmentClicked = function( point) {

    }

    /**
     * One of our points was dragged away from us.
     * @param uuid
     * @param schematic
     */
    $scope.onDragSuccess = function( uuid, schematic) {
      console.log( 'onDragSuccess schematic=' + schematic.name + ' uuid=' + uuid)
    }

    $window.addEventListener( 'unload', function( event) {
    })

    $scope.$watch('symbols', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got symbols pointNames.length: ' + $scope.symbols.pointNames.length)
      }
    })

    // Directive sets pointNames after getting SVG content.
    //
    $scope.$watch('pointNames', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got pointNames.length: ' + $scope.pointNames.length)
        // TODO: unsubscribe from previous schematic's points. Could optimize for large overlaps in points when schematic changes.
        if( $scope.pointNames.length > 0)
          schematic.getPointsByName( $scope.pointNames).then(
            function( response) {
              $scope.points = response.data
              pointIdMap = processPointsAndReturnPointIdMap($scope.points)
              // TODO: what about the old names in the map?
              $scope.points.forEach( function( p) { $scope.pointNameMap[p.name] = p})
              var pointIds = Object.keys(pointIdMap)

              measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
              getCommandsForPoints( pointIds)

              return response // for the then() chain
            },
            function( error) {
              return error
            }
          )
      }
    })

    function onMeasurements(measurements) {
      measurements.forEach(function(pm) {
        var point = pointIdMap[pm.point.id]
        if( point ) {
          //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
          point.currentMeasurement = pm.measurement
        } else {
          console.error('gbSchematicController.onMeasurements could not find point.id = ' + pm.point.id)
        }
      })
      $scope.$digest()
    }

    function processPointsAndReturnPointIdMap(points) {
      var idMap           = {},
          currentMeasurement = {
            value:        '-',
            time:         null,
            shortQuality: '',
            longQuality:  '',
            validity:     'NOTLOADED',
            expandRow:    false,
            commandSet:   undefined
          }
      points.forEach(function(point) {
        point.currentMeasurement = angular.extend({}, currentMeasurement)
        idMap[point.id] = point
        if( typeof point.pointType !== 'string' )
          console.error('------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.')
        if( typeof point.unit !== 'string' )
          point.unit = ''

      })
      return idMap
    }

    function getCommandsForPoints(pointIds) {
      measurement.getCommandsForPoints( pointIds).then(
        function( response) {
          var point,
              data = response.data
          // data is map of pointId -> commands[]
          for( var pointId in data ) {
            point = pointIdMap[pointId]
            if( point )
              point.commandSet =  measurement.getCommandSet(point, data[pointId])
            else
              console.error( 'Unknown point ID ' + pointId)
          }

        }
      )
    }


    function subscribe() {
      if( !equipmentId)
        return

      return schematic.subscribe( equipmentId, $scope, onSchematic)
    }
    function onSchematic( subscriptionId, content, eventType) {
      $scope.svgSource = content  // directive is watching this and will parse SVG and set $scope.pointNames.
      $scope.$digest()
    }

    subscribe()


  }]).

  directive('gbEquipmentSchematic', [ '$compile', 'schematic', function( $compile, schematic) {
    return {
      restrict: 'E',
      scope: {
        //equipmentId: '='
      },
      controller: 'gbSchematicController',
      link: function (scope, elem, attrs) {
        var symbols
        //var chartEl = d3.select(elem[0])

        scope.$watch('svgSource', function(newValue) {
          if( newValue !== undefined) {

            elem.html(newValue);
            symbols = schematic.parseElements( elem)
            symbols.pointNames = schematic.transformSymbols( symbols)

            $compile(elem.contents())(scope);
            scope.symbols = symbols
            scope.pointNames = symbols.pointNames
          }
        })

      }
    };
  }]).

  filter('schematicValidityDef', function() {
    return function(validity) {
      switch( validity ) {
        case 'GOOD':         return '#quality_good';
        case 'QUESTIONABLE': return '#quality_questionable';
        case 'NOTLOADED':    return '#quality_questionable'
        case 'INVALID':      return '#quality_invalid';
        default:
          return '#quality_questionable';
      }
    };
  })



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


angular.module('greenbus.views.selection', []).

  controller( 'gbSelectAllController', ['$scope', function( $scope) {
    var self = this
    var SELECT_UNCHECKED = 0,
        SELECT_CHECKED = 1,
        SELECT_PARTIAL = 2,
        SELECT_NEXT_STATE = [1, 0, 0]
    $scope.selectAllState = SELECT_UNCHECKED
    $scope.selectCount = 0

    self.updateSelectAllState = function() {
      var oldSelectAllState = $scope.selectAllState
      if( $scope.selectCount === 0 )
        $scope.selectAllState = SELECT_UNCHECKED
      else if( $scope.model && $scope.selectCount >= $scope.model.length )
        $scope.selectAllState = SELECT_CHECKED
      else
        $scope.selectAllState = SELECT_PARTIAL

      if( $scope.selectAllState !== oldSelectAllState)
        self.notifyParent( $scope.selectAllState)
    }

    /**
     * Check or uncheck item.
     * @param item  The item to check or uncheck
     * @param newState If undefined, toggle selection. If defined set to that state.
     */
    self.selectItem = function(item, newState) {
      var currentState = item._checked || SELECT_UNCHECKED

      if( newState === undefined)
        newState = SELECT_NEXT_STATE[ currentState]

      if( currentState !== newState) {

        item._checked = newState
        if( item._checked === SELECT_CHECKED )
          $scope.selectCount++
        else
          $scope.selectCount--

        // Just in case
        if( $scope.selectCount < 0)
          $scope.selectCount = 0

        self.updateSelectAllState()
      }

    }

    self.uncheckItem = function(item) {
      if( item._checked) {
        if( $scope.selectCount > 0 )
          $scope.selectCount--
        item._checked = 0

        self.updateSelectAllState()
      }
    }

    $scope.selectAll = function() {
      if( !$scope.model || $scope.model.length === 0)
        return

      $scope.selectAllState = SELECT_NEXT_STATE[ $scope.selectAllState]
      // if check, check visible. If uncheck, uncheck all.
//      var ps = $scope.selectAllState === SELECT_CHECKED ? $scope.pointsFiltered : $scope.model
      var ps =$scope.model

      $scope.selectCount = $scope.selectAllState === SELECT_CHECKED ? ps.length : 0
      for( var i = ps.length - 1; i >= 0; i-- ) {
        var item = ps[ i]
        item._checked = $scope.selectAllState
      }
      self.notifyParent( $scope.selectAllState)
    }

  }]).

  directive( 'gbSelectAll', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: {
             model  : '=',
             notify: '&'
      },
      templateUrl: 'greenbus.views.template/selection/selectAll.html',
      controller: 'gbSelectAllController',
      link: function(scope, element, attrs, controller) {
        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        scope.$parent.uncheckItem = controller.uncheckItem
        controller.notifyParent = function( state) {
          scope.notify( {state: state})
        }
      }
    }
  }).

  filter('selectItemClass', function() {
    return function(_checked) {
      switch( _checked) {
        case 0: return 'fa fa-square-o text-muted'
        case 1: return 'fa fa-check-square-o'
        case 2: return 'fa fa-minus-square-o'
        default: return 'fa fa-square-o'
      }
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


    var STATUS = {
          UNOPENED: 'UNOPENED',
          OPENING: 'OPENING',
          CLOSED: 'CLOSED',
          UP: 'UP'
        },
        DIGEST = {
          NONE: 0,   // No current Angular digest cycle
          CURRENT: 1 // Currently within a Angular digest cycle
        }
        
        

    var status = {
      status: STATUS.UNOPENED,
      reinitializing: false,
      description: 'WebSocket unopened'
    }
    function setStatus( digestState, theStatus, description, reinitializing) {

      if( status.status !== theStatus || status.description !== description ||  status.reinitializing !== reinitializing) {
        status.status = theStatus
        status.description = description
        if( reinitializing)
          status.reinitializing = reinitializing
        console.log( 'subscription.setStatus: ' + status.status + ' - ' + description)
        if( digestState === DIGEST.CURRENT) {
          $rootScope.$broadcast( 'subscription.status', status);
        } else {
          $rootScope.$apply( function() {
            $rootScope.$broadcast( 'subscription.status', status);
          })
        }
      }
    }


    //var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
    var webSocket = null,
        webSocketPendingTasks = [],
        subscriptionIdMap = {} // { subscriptionId: { message: listener, error: listener}, ...}

    /* Assign these WebSocket handlers to a newly created WebSocket */
    var wsHanders = {

      onmessage: function (event) {
        var message = JSON.parse(event.data)

        switch( message.type) {
          case 'ConnectionStatus':
            console.debug( 'onMessage.ConnectionStatus ' + message.data)
            handleGreenBusConnectionStatus( message.data)
            break;
          case 'ExceptionMessage':
            console.error( 'ExceptionMessage: ' + JSON.stringify( message.data))
            break;
          case 'SubscriptionExceptionMessage':
            console.error( 'SubscriptionExceptionMessage: ' + JSON.stringify( message.data))
            break;

          default:
            // console.debug( 'onMessage message.subscriptionId=' + message.subscriptionId + ', message.type=' + message.type)
            var listener = getListenerForMessage( message)
            if( listener)
              handleMessageWithListener( message, listener)
        }
      },
      onopen: function(event) {
        console.log( 'webSocket.onopen event: ' + event)
        setStatus( DIGEST.NONE, STATUS.UP, '')

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

        setStatus( DIGEST.NONE, STATUS.CLOSED, 'WebSocket closed. Your network connection is down or the application server appears to be down.')
        removeAllSubscriptions( 'WebSocket onclose()')

        // Cannot redirect here because this webSocket thread fights with the get reply 401 thread.
        // Let the get handle the redirect. Might need to coordinate something with get in the future.
      },
      onerror: function(event) {
        var data = event.data;
        var name = event.name;
        var message = event.message;
        console.log( 'webSocket.onerror name: ' + name + ', message: ' + message + ', data: ' + data)
        setStatus( DIGEST.NONE, STATUS.CLOSED, 'WebSocket closed with error. Your network connection is down or the application server appears to be down.');
        removeAllSubscriptions( 'WebSocket onerror()')
      }
    }

    function getListenerForMessage( message) {
      if( message.subscriptionId)
        return subscriptionIdMap[ message.subscriptionId]
      else
        return null
    }

    function handleMessageWithListener( message, listener) {
      if( ! message.error) {

        if( listener.message)
          listener.message( message.subscriptionId, message.type, message.data)

      } else {

        console.log( 'webSocket.handleError message.error: ' + message.error)
        if( message.jsError)
          console.error( 'webSocket.handleError message.jsError: ' + message.jsError)

        if( listener.error)
          listener.error( message.error, message)

      }
    }

    function handleGreenBusConnectionStatus( json) {
      $rootScope.$apply( function() {
        $rootScope.$broadcast( 'greenbus.status', json)
      })

    }

    function saveSubscriptionOnScope( scope, subscriptionId) {
      if( ! scope.__subscriptionIds)
        scope.__subscriptionIds = []
      scope.__subscriptionIds.push( subscriptionId)
    }

    function registerSubscriptionOnScope( scope, subscriptionId) {

      saveSubscriptionOnScope( scope, subscriptionId);

      // Register for controller.$destroy event and kill any retry tasks.
      // TODO save return value as unregister function. Could have multiples on one scope.
      scope.$on( '$destroy', function( event) {
        if( scope.__subscriptionIds) {
          console.log( 'subscription $destroy ' + scope.__subscriptionIds.length);
          scope.__subscriptionIds.forEach( function( subscriptionId) {
            unsubscribe( subscriptionId)
            if( subscriptionIdMap.hasOwnProperty( subscriptionId))
              delete subscriptionIdMap[ subscriptionId];
          })
          scope.__subscriptionIds = []
        }
      });

    }

    function removeAllSubscriptions( error) {
      // save in temp in case a listener.error() tries to resubscribe
      var subscriptionId, listener,
          temp = subscriptionIdMap
      subscriptionIdMap = {}
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
      //var messageKey = Object.keys( json)[0]
      // add the messageKey just for easier debugging.
      return 'subscription.' + json.name + '.' + generateUUID();
    }

    function addSubscriptionIdToMessage( json) {
      var subscriptionId = makeSubscriptionId( json)
      json.subscriptionId = subscriptionId
      json.authToken = authentication.getAuthToken()
      return subscriptionId
    }

    function makeWebSocket() {
      var wsUri = $location.protocol() === 'https' ? 'wss' : 'ws'
      wsUri += '://' + $location.host() + ':' + $location.port()
      // Note: The WebSocket API doesn't have a way to add headers like 'Authorization', so we put in on the URL
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

    function pushPendingSubscription( subscriptionId, scope, request, messageListener, errorListener) {
      // We're good, so save request to wait for WebSocket.onopen().
      console.log( 'subscribe: send pending ( ' + request + ')')
      webSocketPendingTasks.push( request)
      registerSubscriptionOnScope( scope, subscriptionId);
      subscriptionIdMap[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    }


    function subscribe( json, scope, messageListener, errorListener) {

      var subscriptionId = addSubscriptionIdToMessage( json)
      var request = JSON.stringify( json)

      // Lazy init of webSocket
      if( status.status == STATUS.UP) {

        try {
          webSocket.send( request)

          // We're good, so save request for WebSocket.onmessage()
          console.log( 'subscribe: send( ' + request + ')')
          registerSubscriptionOnScope( scope, subscriptionId);
          subscriptionIdMap[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
        } catch( ex) {
          if( errorListener)
            errorListener( 'Could not send subscribe request to server. Exception: ' + ex)
          subscriptionId = null
        }

      } else{

        if( status.status != STATUS.OPENING) {
          setStatus( DIGEST.CURRENT, STATUS.OPENING, 'Initializing WebSocket for subscription services.')

          try {
            if( ! authentication.isLoggedIn())  // TODO: Should we redirect to login?
              throw 'Not logged in.'
            webSocket = makeWebSocket()
            if( ! webSocket)
              throw 'WebSocket create failed.'

            pushPendingSubscription( subscriptionId, scope, request, messageListener, errorListener)

          } catch( ex) {
            var description = 'Unable to open WebSocket connection to server. Exception: ' + ex
            // TODO: not logged in!
            setStatus( DIGEST.CURRENT, STATUS.CLOSED, description)
            webSocket = null
            if( errorListener)
              errorListener( description)
            subscriptionId = null
          }

        } else {
          // Already opening WebSocket, STATUS.OPENING. Just push pending.
          pushPendingSubscription( subscriptionId, scope, request, messageListener, errorListener)
        }

      }

      return subscriptionId
    }

    function unsubscribe( subscriptionId) {
      if( webSocket)
        webSocket.send(JSON.stringify(
          {
            name: 'Unsubscribe',
            authToken: authentication.getAuthToken(),
            subscriptionId: subscriptionId
          }
        ))
      if( subscriptionIdMap.hasOwnProperty( subscriptionId))
        delete subscriptionIdMap[ subscriptionId]
    }


    /**
     * Public API
     */
    return {
      STATUS: STATUS, // publish STATUS enum
      getStatus: function() { return status; },
      subscribe: subscribe,
      unsubscribe: unsubscribe
    }

  }]);

angular.module("greenbus.views.template/chart/chart.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/chart/chart.html",
    "<div class=\"gb-chart\" style=\"width: 100%; height: 100%; margin: 0\">\n" +
    "    <div class=\"gb-win\" >\n" +
    "        <div class=\"gb-win-titlebar clearfix\">\n" +
    "            <p class=\"gb-win-title\"><span class=\"glyphicon glyphicon-stats\" style=\"top: 0; vertical-align: top; margin-right:4px\"></span> <span>{{ chart.name }}</span></p>\n" +
    "            <div class=\"gb-win-actions\">\n" +
    "                <a href=\"\" ng-click=\"chartRemove()\"><i class=\"glyphicon glyphicon-remove icon-white\"></i></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <ul class=\"nav nav-pills\" style=\"margin-bottom: 5px; font-size: 86%\">\n" +
    "            <li class=\"gb-legend\" ng-repeat=\"point in chart.points\">\n" +
    "                <div class=\"gb-icon-text draggable\" draggable ident=\"point.id\" source=\"chart\" on-drag-success=\"onDragSuccess\">\n" +
    "                    <span class=\"gb-legend-text\" style=\"border-bottom-color: {{ $parent.chart.traits.color(point) }}\">{{point.name}}</span>\n" +
    "                    <a class=\"gb-remove\" href=\"\" ng-click=\"removePoint( point)\"><span class=\"glyphicon glyphicon-remove\"></span></a>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "        <div id=\"chart-container\" class=\"gb-win-container\" style=\"height: 100%\">\n" +
    "            <!--<div class=\"gb-loading-overlay\" ng-show=\"loading\">-->\n" +
    "                <!--<div ng-include src=\"'/partials/loadingprogress.html'\"></div>-->\n" +
    "            <!--</div>-->\n" +
    "            <div class=\"gb-win-content\" ng-hide=\"loading\" droppable target=\"chart\" on-drop=\"onDropPoint\">\n" +
    "                <div chart=\"chart.traits\" data=\"chart.points\" selection=\"chart.selection\"  ng-style=\"styleMain()\"></div>\n" +
    "                <div chart=\"chart.brushTraits\" data=\"chart.points\" selection=\"chart.brushSelection\"  ng-style=\"styleBrush()\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/chart/charts.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/chart/charts.html",
    "<div class=\"gb-chart\" ng-repeat=\"chart in charts\">\n" +
    "    <div class=\"gb-win\" >\n" +
    "        <div class=\"gb-win-titlebar clearfix\">\n" +
    "            <p class=\"gb-win-title\"><span class=\"glyphicon glyphicon-stats\" style=\"top: 0; vertical-align: top; margin-right:4px\"></span> <span>{{ chart.name }}</span></p>\n" +
    "            <div class=\"gb-win-actions\">\n" +
    "                <a href=\"\" ng-click=\"\"><i class=\"glyphicon glyphicon-minus icon-white\" style=\"margin-top: 5px\"></i></a>\n" +
    "                <a href=\"\" ng-click=\"chartPopout($index)\"><i class=\"glyphicon glyphicon-share-alt icon-white\"></i></a>\n" +
    "                <a href=\"\" ng-click=\"chartRemove($index)\"><i class=\"glyphicon glyphicon-remove icon-white\"></i></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <ul class=\"nav nav-pills\" style=\"margin-bottom: 5px; font-size: 86%\">\n" +
    "            <li class=\"gb-legend\" ng-repeat=\"point in chart.points\">\n" +
    "                <div class=\"gb-icon-text draggable\" draggable ident=\"point.id\" source=\"chart\" on-drag-success=\"onDragSuccess\">\n" +
    "                    <span class=\"gb-legend-text\" style=\"border-bottom-color: {{ $parent.chart.traits.color(point) }}\">{{point.name}}</span>\n" +
    "                    <a class=\"gb-remove\" href=\"\" ng-click=\"removePoint( chart, point)\"><span class=\"glyphicon glyphicon-remove\"></span></a>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "        <div class=\"gb-win-container\">\n" +
    "            <div class=\"gb-win-content\" droppable target=\"chart\" on-drop=\"onDropPoint\">\n" +
    "                <div chart=\"chart.traits\" data=\"chart.points\" selection=\"chart.selection\"  style=\"height: 150px\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/command/command.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/command/command.html",
    "<div class=\"form-group\">\n" +
    "    <label class=\"col-sm-5 control-label\">{{ model.displayName }}</label>\n" +
    "    <div class=\"col-sm-7\">\n" +
    "        <div class=\"btn-toolbar\" role=\"toolbar\">\n" +
    "            <div class=\"btn-group\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" ng-click=\"selectToggle()\">Select <i ng-class=\"selectClasses\"></i></button>\n" +
    "            </div>\n" +
    "\n" +
    "            <button ng-if=\"!isSetpointType\" type=\"button\" class=\"btn btn-primary\" ng-click=\"execute()\" ng-show=\"isSelected\">\n" +
    "                Execute <span style=\"padding-right: 0.5em;\"> </span><i ng-class=\"executeClasses\"></i>\n" +
    "            </button>\n" +
    "\n" +
    "            <div ng-if=\"isSetpointType\" class=\"input-group input-group-sm-  {{form.setpoint_value.$error.pattern ? 'has-error' : ''}}\" ng-show=\"isSelected\">\n" +
    "                <input type=\"text\" class=\"form-control\" ng-model=\"setpoint.value\" name=\"setpoint_value-{{ model.id }}\" ng-pattern=\"pattern\" style=\"width:6em;\" placeholder=\"{{ placeHolder}}\">\n" +
    "                <button type=\"button\" class=\"btn btn-primary\" ng-click=\"execute()\" style=\"border-top-left-radius: 0; border-bottom-left-radius: 0;\">\n" +
    "                    Set\n" +
    "                    <span style=\"padding-right: 0.5em;\"> </span><i ng-class=\"executeClasses\"></i>\n" +
    "                </button>\n" +
    "            </div>\n" +
    "\n" +
    "            <i class=\"fa fa-exclamation-circle gb-command-error\" ng-show=\"replyError\" popover=\"{{replyError}}\" popover-trigger=\"mouseenter\" popover-placement=\"top\"></i>\n" +
    "\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/endpoint/endpoints.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/endpoint/endpoints.html",
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

angular.module("greenbus.views.template/equipment/equipment.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/equipment/equipment.html",
    "<div class=\"gb-equipment\">\n" +
    "    <h3>{{ name }}</h3>\n" +
    "    <tabset>\n" +
    "        <tab heading=\"Overview\" ng-if=\"tabs.overview\">\n" +
    "            <gb-equipment-schematic></gb-equipment-schematic>\n" +
    "        </tab>\n" +
    "        <tab heading=\"Measurements\" ng-if=\"tabs.measurements\">\n" +
    "            <gb-measurements points-promise=\"pointsPromise\"></gb-measurements>\n" +
    "        </tab>\n" +
    "        <tab heading=\"Properties\" ng-if=\"tabs.properties\">\n" +
    "            <gb-properties-table></gb-properties-table>\n" +
    "        </tab>\n" +
    "        <tab heading=\"Points\" ng-if=\"tabs.points\">\n" +
    "            <gb-points-table points-promise=\"pointsPromise\"></gb-points-table>\n" +
    "        </tab>\n" +
    "    </tabset>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/ess/esses.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/ess/esses.html",
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
    "                <th class=\"gb-cell-highlight gb-cell-highlight-left\"><a href=\"\" ng-click=\"sortColumn = 'powerCapacity'; reverse=!reverse\">Power</a></th>\n" +
    "                <th class=\"gb-cell-highlight gb-cell-highlight-right\"><a href=\"\" ng-click=\"sortColumn = 'energyCapacity'; reverse=!reverse\">Energy</a></th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr ng-repeat=\"ces in ceses | filter:searchText | orderBy:sortColumn:reverse\">\n" +
    "                <td>{{ces.name}}</td>\n" +
    "                <td>{{ces.power}}</td>\n" +
    "                <td><img class=\"ces-state-icon\" ng-src=\"{{ces.state | essStateIcon}}\" title=\"{{ces.state | essStateDescription}}\" style=\"margin-top:2px\"/></td>\n" +
    "                <td style=\"width: 60px\">\n" +
    "                    <div class=\"battery-wrapper\" title=\"{{ces.state | essStateDescription}}\" >\n" +
    "                        <div class=\"{{ces.percentSoc | essBatterySocChargedClass: ces.state}}\" style=\"width:{{ces.percentSocMax100}}%\"></div>\n" +
    "                        <div class=\"{{ces.percentSoc | essBatterySocUnchargedClass: ces.state}}\" style=\"width:{{100-ces.percentSocMax100}}%\"></div>\n" +
    "                        <div class=\"battery-overlay\"></div>\n" +
    "                    </div>\n" +
    "                </td>\n" +
    "                <td>{{ces.percentSoc}}%</td>\n" +
    "                <td class=\"gb-cell-highlight gb-cell-highlight-left\">{{ces.powerCapacity}}</td>\n" +
    "                <td class=\"gb-cell-highlight gb-cell-highlight-right\">{{ces.energyCapacity}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("greenbus.views.template/event/alarms.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/event/alarms.html",
    "<div>\n" +
    "    <!--<div class=\"row\">-->\n" +
    "        <!--<div class=\"col-md-12\">-->\n" +
    "            <!--<input type=\"text\"  class=\"form-control\" placeholder=\"search any column\" ng-model=\"searchText\" style=\"height: 100%;\">-->\n" +
    "        <!--</div>-->\n" +
    "    <!--</div>-->\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-5\">\n" +
    "            <h3>Alarms</h3>\n" +
    "        </div>\n" +
    "        <!--<div class=\"col-md-7\">-->\n" +
    "            <!--<input type=\"text\"  class=\"form-control\" placeholder=\"search any column\" ng-model=\"searchText\" style=\"height: 100%;\">-->\n" +
    "        <!--</div>-->\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-4\">\n" +
    "            <gb-select-all model=\"alarms\" notify=\"selectAllChanged(state)\"></gb-select-all>\n" +
    "            <div class=\"btn-group gb-toolbar\" ng-show=\"selectAllState!==0\" role=\"group\"  style-=\"margin-left: 1.2em;\">\n" +
    "                <button class=\"btn btn-default\" ng-click=\"silenceSelected()\" style=\"width: 60px;\" title=\"Silence selected alarms\"><i class=\"fa fa-volume-off\" style=\"font-size: 124%;\"></i></button>\n" +
    "                <button class=\"btn btn-default\" ng-click=\"acknowledgeSelected()\" style=\"width: 60px;\" title=\"Acknowledge selected alarms\"><i class=\"fa fa-bell-slash-o\"></i></button>\n" +
    "                <!--<button class=\"btn btn-default\" ng-click=\"hitIt()\" style=\"width: 60px;\" title=\"Hit it with something special!\"><i class=\"fa fa-bolt\"></i></button>-->\n" +
    "            </div>\n" +
    "            <div class=\"btn-group gb-toolbar\" ng-show=\"selectAllState!==0\" role=\"group\"  style-=\"margin-left: 1.2em;\">\n" +
    "                <button class=\"btn btn-default\" ng-click=\"removeSelected()\" style=\"width: 60px;\" title=\"Remove selected acknowledged alarms\"><i class=\"fa fa-trash-o\"></i></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-4\">\n" +
    "            <div class=\"alert alert-{{notification.type}} gb-alert-md\" ng-show=\"notification\" role=\"alert\"><span><i class=\"fa fa-info-circle\"></i> {{ notification.message }}</span></div>\n" +
    "            <div class=\"alert alert-info gb-alert-md\" ng-show=\"newItems\" role=\"alert\"><span><i class=\"fa fa-info-circle\"></i> {{ newItems }}</span></div>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-4 text-right\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"pageFirst()\" ng-show=\"pageState !== 0\" style=\"margin-right: 1em;\" popover=\"Go to current events\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span style=\"font-weight: bolder\">|</span><i class=\"fa fa-chevron-left\" style=\"vertical-align: middle\"></i></button>\n" +
    "            <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "                <button type=\"button\" ng-class=\"pageState | pagePreviousClass\" ng-click=\"pagePrevious()\" popover=\"Previous page\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"pageState | pagingIcon: 'left'\" style=\"vertical-align: middle\"></i></button>\n" +
    "                <button type=\"button\" ng-class=\"pageState | pageNextClass: lastPage\" ng-click=\"pageNext()\" popover=\"Next page\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"pageState | pagingIcon: 'right'\" style=\"vertical-align: middle\"></i></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "        <table class=\"table table-condensed\">\n" +
    "            <thead>\n" +
    "            <tr>\n" +
    "                <th></th>\n" +
    "                <th class=\"gb-alarm-btn-xs\"><i class=\"fa fa-bell\"></i></th>\n" +
    "                <th class=\"gb-alarm-btn-xs\"><i class=\"fa fa-volume-off\" style=\"font-size: 125%;\"></i></th>\n" +
    "                <th>Type</th>\n" +
    "                <th>Sev</th>\n" +
    "                <th>User</th>\n" +
    "                <th>Message</th>\n" +
    "                <th>Time</th>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr class=\"gb-alarm\" ng-repeat=\"alarm in alarms\">\n" +
    "                <td>\n" +
    "                    <div class=\"gb-checkbox-container\" ng-click=\"selectItem(alarm)\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">\n" +
    "                        <i ng-class=\"alarm._checked | selectItemClass\"></i>\n" +
    "                    </div>\n" +
    "                </td>\n" +
    "                <td ng-click=\"acknowledge(alarm)\" class=\"gb-alarm-btn-xs\"><div ng-class=\"alarm.state | alarmAckButtonClass\"><i ng-class=\"alarm.state | alarmAckClass: alarm._updateState\" style=\"min-width: 1.1em;\" title=\"{{alarm.state | alarmAckTitle}}\"></i></div></td>\n" +
    "                <td ng-click=\"silence(alarm)\" class=\"gb-alarm-btn-xs\"><div ng-class=\"alarm.state | alarmAudibleButtonClass\"><i ng-class=\"alarm.state | alarmAudibleClass: alarm._updateState\" style=\"min-width: 1.1em;\" title=\"{{alarm.state | alarmAudibleTitle}}\"></i></div></td>\n" +
    "                <td>{{alarm.eventType}}</td>\n" +
    "                <td>{{alarm.severity}}</td>\n" +
    "                <td>{{alarm.agent}}</td>\n" +
    "                <td>{{alarm.message}}</td>\n" +
    "                <td>{{alarm.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "    <div ng-show=\"pageState === 4\">\n" +
    "        No alarms\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/event/alarmsAndEvents.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/event/alarmsAndEvents.html",
    "<div>\n" +
    "    <tabset>\n" +
    "        <tab select=\"tabAlarms()\">\n" +
    "            <tab-heading>Alarms <span class=\"badge\">{{ newCounts.alarms }}</span></tab-heading>\n" +
    "            <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "                <table class=\"table table-condensed table-topless\">\n" +
    "                    <tbody>\n" +
    "                    <tr class=\"gb-alarm\" ng-repeat=\"alarm in alarms\">\n" +
    "                        <td ng-click=\"remove(alarm)\" class=\"gb-alarm-btn-xs\"><div ng-class=\"alarm.state | alarmRemoveButtonClass\"><i ng-class=\"alarm.state | alarmRemoveClass: alarm._updateState\" style=\"min-width: 1.1em;\" title=\"{{alarm.state | alarmRemoveTitle}}\"></i></div></td>\n" +
    "                        <td ng-click=\"acknowledge(alarm)\" class=\"gb-alarm-btn-xs\"><div ng-class=\"alarm.state | alarmAckButtonClass\"><i ng-class=\"alarm.state | alarmAckClass: alarm._updateState\" style=\"min-width: 1.1em;\" title=\"{{alarm.state | alarmAckTitle}}\"></i></div></td>\n" +
    "                        <td ng-click=\"silence(alarm)\" class=\"gb-alarm-btn-xs\"><div ng-class=\"alarm.state | alarmAudibleButtonClass\"><i ng-class=\"alarm.state | alarmAudibleClass: alarm._updateState\" style=\"min-width: 1.1em;\" title=\"{{alarm.state | alarmAudibleTitle}}\"></i></div></td>\n" +
    "                        <td>{{alarm.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "                        <td class=\"event-severity\">{{alarm.severity}}</td>\n" +
    "                        <td>{{alarm.eventType}}</td>\n" +
    "                        <td class=\"event-agent\">{{alarm.agent}}</td>\n" +
    "                        <td>{{alarm.message}}</td>\n" +
    "                    </tr>\n" +
    "                    </tbody>\n" +
    "                </table>\n" +
    "            </div>\n" +
    "        </tab>\n" +
    "\n" +
    "        <tab select=\"tabEvents()\">\n" +
    "            <tab-heading>Events <span class=\"badge\">{{ newCounts.events }}</span></tab-heading>\n" +
    "            <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "                <table class=\"table table-condensed table-topless\">\n" +
    "                    <tbody>\n" +
    "                    <tr class=\"gb-alarm\" ng-repeat=\"event in events\">\n" +
    "                        <td><i ng-show=\"event.alarm\" class=\"fa fa-bell text-muted\"></i></td>\n" +
    "                        <td>{{event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "                        <td class=\"event-severity\">{{event.severity}}</td>\n" +
    "                        <td>{{event.eventType}}</td>\n" +
    "                        <td class=\"event-agent\">{{event.agent}}</td>\n" +
    "                        <td>{{event.message}}</td>\n" +
    "                    </tr>\n" +
    "                    </tbody>\n" +
    "                </table>\n" +
    "            </div>\n" +
    "        </tab>\n" +
    "    </tabset>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/event/events.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/event/events.html",
    "<div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-4\">\n" +
    "            <h3>Events</h3>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-4\">\n" +
    "            <alert type=\"info\" ng-show=\"newItems\" role=\"alert\" style=\" margin-bottom: 0;padding-top: 6px; padding-bottom: 6px;\"><i class=\"fa fa-info-circle\"></i> {{ newItems }}</alert>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-4 text-right\" style=\"padding-top: 20px\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"pageFirst()\" ng-show=\"pageState !== 0\" style=\"margin-right: 1em;\" popover=\"Go to current events\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span style=\"font-weight: bolder\">|</span><i class=\"fa fa-chevron-left\" style=\"vertical-align: middle\"></i></button>\n" +
    "            <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "                <button type=\"button\" ng-class=\"pageState | pagePreviousClass\" ng-click=\"pagePrevious()\" popover=\"Previous page\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"pageState | pagingIcon: 'left'\" style=\"vertical-align: middle\"></i></button>\n" +
    "                <button type=\"button\" ng-class=\"pageState | pageNextClass: lastPage\" ng-click=\"pageNext()\" popover=\"Next page\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"pageState | pagingIcon: 'right'\" style=\"vertical-align: middle\"></i></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12\">\n" +
    "            <div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "                <table class=\"table table-condensed\">\n" +
    "                    <thead>\n" +
    "                    <tr>\n" +
    "                        <th>Type</th>\n" +
    "                        <th>Alarm</th>\n" +
    "                        <th>Sev</th>\n" +
    "                        <th>User</th>\n" +
    "                        <th>Message</th>\n" +
    "                        <th>Time</th>\n" +
    "                    </tr>\n" +
    "                    </thead>\n" +
    "                    <tbody>\n" +
    "                    <tr class=\"gb-event\" ng-repeat=\"event in events\">\n" +
    "                        <td>{{event.eventType}}</td>\n" +
    "                        <td>{{event.alarm}}</td>\n" +
    "                        <td>{{event.severity}}</td>\n" +
    "                        <td>{{event.agent}}</td>\n" +
    "                        <td>{{event.message}}</td>\n" +
    "                        <td>{{event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "                    </tr>\n" +
    "                    </tbody>\n" +
    "                </table>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-show=\"pageState === 4\">\n" +
    "            No events\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/measurement/measurements.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/measurement/measurements.html",
    "<div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-6 col-md-offset-3\" style=\"margin-top: 1.2em;\">\n" +
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
    "                            <gb-select-all model=\"points\" notify=\"selectAllChanged(state)\"></gb-select-all>\n" +
    "                            <button class=\"btn btn-default text-muted\" ng-click=\"chartAddSelectedPoints()\" ng-show=\"selectAllState!==0\" style=\"width: 60px; margin-left: 14px\"><span class=\"glyphicon glyphicon-stats\"></span></button>\n" +
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
    "                            <div class=\"gb-checkbox-container\" ng-click=\"selectItem(point)\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">\n" +
    "                                <i ng-class=\"point._checked | selectItemClass\"></i>\n" +
    "                            </div>\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">\n" +
    "                            <div class=\"gb-icon-text draggable\" draggable ident=\"point.id\">\n" +
    "                                <img class=\"gb-icon\" ng-src=\"{{ point.pointType | pointTypeImage: point.unit }}\" width=\"14px\" height=\"14px\" title=\"{{ point.pointType | pointTypeText: point.unit }}\"/>\n" +
    "                                {{point.name}}\n" +
    "                            </div>\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" style=\"text-align: right\">\n" +
    "                            <a href=\"\" ng-click=\"chartAddPointById(point.id)\"><span class=\"glyphicon glyphicon-stats text-muted\" title=\"Graph measurements\"></span></a>\n" +
    "                        </td>\n" +
    "                        <td  ng-if=\"!point.rowDetail\" class=\"gb-value\" ng-click=\"togglePointRowById(point.id)\">\n" +
    "                            <span class=\"glyphicon glyphicon-edit pull-left text-muted\" ng-show=\"point.commands\" style=\"padding-right: 10px;\" title=\"Control or Setpoint\"></span>\n" +
    "                            <gb-measurement-value model=\"point\"></gb-measurement-value>\n" +
    "                        </td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{point.unit}}</td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\" style=\"padding-bottom: 0\"><span ng-class=\"point.currentMeasurement.validity | validityIcon\" title=\"{{point.currentMeasurement.longQuality}}\"></span> <strong>{{point.currentMeasurement.shortQuality}}</strong></td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{point.currentMeasurement.time | date:'h:mm:ss a, MM-dd-yyyy'}}</td>\n" +
    "                        <td ng-if=\"!point.rowDetail\" ng-click=\"togglePointRowById(point.id)\">{{ point.pointType }}</td>\n" +
    "\n" +
    "\n" +
    "                        <td ng-if=\"point.rowDetail\" colspan=\"8\">\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"col-md-10 col-md-offset-1\">\n" +
    "                                    <form class=\"form-horizontal\" role=\"form\" name=\"form\">\n" +
    "                                        <gb-command ng-repeat=\"command in point.commands\" model=\"command\"></gb-command>\n" +
    "                                    </form>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
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

angular.module("greenbus.views.template/measurementValue/measurementValue.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/measurementValue/measurementValue.html",
    "<span>\n" +
    "    <i class=\"fa fa-exclamation-triangle\" ng-show=\"replyError\" popover=\"{{replyError}}\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"></i>\n" +
    "    <span ng-if=\"!editing\">{{ model.currentMeasurement.value }}</span>\n" +
    "\n" +
    "    <div ng-if=\"editing\" class=\"form-inline\">\n" +
    "        <input type=\"text\" class=\"form-control\" ng-model=\"editing.value\" ng-blur=\"inputOnBlur()\" ng-focus=\"inputOnFocus()\" ng-keydown=\"inputKeyDown($event)\" name=\"measurement_value\" ng-pattern=\"\" style=\"width:6em;\" placeholder=\"{{ placeHolder}}\">\n" +
    "        <div ng-if=\"model.currentMeasurement.shortQuality==='R'\" class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "            <button ng-click=\"override()\" type=\"button\" ng-class=\"requestPending | buttonDisabled: 'btn btn-info gb-btn-override'\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover=\"Replace\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span ng-class=\"(requestPending==='override')?'icon-spin':''\">R</span></button>\n" +
    "            <button ng-click=\"nis()\"     type=\"button\" ng-class=\"requestPending | buttonDisabled: 'btn btn-info gb-btn-nis'\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover=\"Not In Service\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span ng-class=\"(requestPending==='nis')?'icon-spin':''\">N</span></button>\n" +
    "            <a ng-click=\"remove()\"  type=\"button\" class=\"text-danger gb-btn-replacenis-remove\" popover=\"{{removeTooltip}}\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"(requestPending==='remove')?'fa-spin fa fa-minus-circle':'fa fa-minus-circle'\"></i></a>\n" +
    "        </div>\n" +
    "        <div ng-if=\"model.currentMeasurement.shortQuality==='N'\" class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "            <button ng-click=\"override()\" type=\"button\" ng-class=\"requestPending | buttonDisabled: 'btn btn-info gb-btn-override'\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover=\"Replace\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span ng-class=\"(requestPending==='override')?'icon-spin':''\">R</span></button>\n" +
    "            <button ng-click=\"nis()\"     type=\"button\" class=\"btn btn-info disabled gb-btn-nis\" popover=\"Not In Service\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\">N</button>\n" +
    "            <a ng-click=\"remove()\"  type=\"button\" class=\"text-danger gb-btn-replacenis-remove\" popover=\"{{removeTooltip}}\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><i ng-class=\"(requestPending==='remove')?'fa-spin fa fa-minus-circle':'fa fa-minus-circle'\"></i></a>\n" +
    "        </div>\n" +
    "        <div ng-if=\"model.currentMeasurement.shortQuality!=='N' && model.currentMeasurement.shortQuality!=='R'\" class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "            <button ng-click=\"override()\" type=\"button\" ng-class=\"requestPending | buttonDisabled: 'btn btn-info gb-btn-override'\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover=\"Replace\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span ng-class=\"(requestPending==='override')?'icon-spin':''\">R</span></button>\n" +
    "            <button ng-click=\"nis()\"     type=\"button\" ng-class=\"requestPending | buttonDisabled: 'btn btn-info gb-btn-nis'\" ng-focus=\"buttonOnFocus()\" ng-blur=\"buttonOnBlur()\" popover=\"Not In Service\" popover-trigger=\"mouseenter\" popover-placement=\"bottom\"><span ng-class=\"(requestPending==='nis')?'icon-spin':''\">N</span></button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</span>\n" +
    "");
}]);

angular.module("greenbus.views.template/navigation/navBarTop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/navigation/navBarTop.html",
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
    "        <a class=\"navbar-brand\" href=\"{{ application.url }}\">{{ application.label }}</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"collapse navbar-collapse\" collapse=\"isCollapsed\">\n" +
    "        <ul class=\"nav navbar-nav\" ng-hide=\"loading\">\n" +
    "            <li  ng-repeat=\"item in applicationMenuItems\" ng-class=\"getActiveClass( item)\">\n" +
    "                <a href=\"{{ item.url }}\">{{ item.label }}</a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "        <ul class=\"nav navbar-nav navbar-right\" ng-hide=\"loading\">\n" +
    "            <li class=\"dropdown\" dropdown>\n" +
    "                <a class=\"dropdown-toggle\" dropdown-toggle href>Logged in as {{ userName }} <b class=\"caret\"></b></a>\n" +
    "                <ul class=\"dropdown-menu\">\n" +
    "                    <li ng-repeat=\"item in sessionMenuItems\"><a href=\"{{ item.url }}\">{{ item.label }}</a></li>\n" +
    "                </ul>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("greenbus.views.template/navigation/navList.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/navigation/navList.html",
    "<ul class=\"nav nav-list\">\n" +
    "    <li ng-repeat=\"item in navItems\" ng-class=\"getClass(item)\" ng-switch=\"item.type\">\n" +
    "        <a ng-switch-when=\"item\" href=\"{{ item.url }}\">{{ item.label }}</a>\n" +
    "        <span ng-switch-when=\"header\">{{ item.label }}</span>\n" +
    "    </li>\n" +
    "</ul>");
}]);

angular.module("greenbus.views.template/notification/notification.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/notification/notification.html",
    "<div class=\"gb-notification-container\">\n" +
    "    <div class=\"gb-notification-message\" ng-repeat=\"notification in notifications\">{{ notification }}</div>\n" +
    "</div>");
}]);

angular.module("greenbus.views.template/point/pointsTable.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/point/pointsTable.html",
    "<div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "    <table class=\"table table-condensed\">\n" +
    "        <thead>\n" +
    "        <tr>\n" +
    "            <th>Name</th>\n" +
    "            <th>Class</th>\n" +
    "            <th>Unit</th>\n" +
    "            <th>Types</th>\n" +
    "        </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr class=\"gb-point\" ng-repeat=\"point in points\">\n" +
    "            <td>{{point.name}}</td>\n" +
    "            <td><img class=\"gb-icon\" ng-src=\"{{ point.pointType | pointTypeImage: point.unit }}\" width=\"14px\" height=\"14px\" title=\"{{ point.pointType | pointTypeText: point.unit }}\"/>\n" +
    "                {{point.pointType}}\n" +
    "            </td>\n" +
    "            <td>{{ point.unit }}</td>\n" +
    "            <td>{{ point.types.join(', ') }}</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/property/propertiesTable.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/property/propertiesTable.html",
    "<div class=\"table-responsive\" style=\"overflow-x: auto\">\n" +
    "    <table class=\"table table-condensed\">\n" +
    "        <thead>\n" +
    "        <tr>\n" +
    "            <th>Property</th>\n" +
    "            <th>Value</th>\n" +
    "        </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr class=\"gb-property\" ng-repeat=\"property in properties\" ng-switch on=\"property.isObject\">\n" +
    "            <td>{{property.key}}</td>\n" +
    "            <td ng-switch-when=\"true\"><pre>{{property.value | json}}</pre></td>\n" +
    "            <td ng-switch-default>{{property.value}}</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("greenbus.views.template/selection/selectAll.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("greenbus.views.template/selection/selectAll.html",
    "<button class=\"btn btn-default\" ng-click=\"selectAll()\">\n" +
    "    <div class=\"gb-checkbox-container\" role=\"checkbox\" aria-labelledby=\":2f\" dir=\"ltr\" aria-checked=\"true\" tabindex=\"-1\">\n" +
    "        <i ng-class=\"selectAllState | selectItemClass\"></i>\n" +
    "    </div>\n" +
    "</button>\n" +
    "");
}]);
