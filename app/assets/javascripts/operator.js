/**
 * Copyright 2013 Green Energy Corp.
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
require.config({
    paths: {
//        angular: '../lib/angular/angular',
//        'angular-route': '../lib/angular/angular-route',
//        'angular-animate': '../lib/angular/angular-animate',
//        'angular-cookies': '../lib/angular/angular-cookies',
//        'ui-bootstrap': '../lib/angular-ui/ui-bootstrap.min',
//        'ui-utils': '../lib/angular-ui/ui-utils.min',
//        'd3': '../lib/d3/d3.v3.min',
//        'd3-traits': '../lib/d3-traits/d3-traits',
//        'abn-tree': '../lib/angular-bootstrap-nav-tree/abn_tree_directive',
//        text: '../lib/require/text'
    },
    baseUrl: '/javascripts',
    shim: {
//        'angular' : {'exports' : 'angular'},
//        "angular-route" : { deps: ["angular"] },
//        "angular-animate" : { deps: ["angular"] },
//        "angular-cookies" : { deps: ["angular"] },
//        "ui-bootstrap" : { deps: ["angular"] },
//        "ui-utils" : { deps: ["angular"] },
//        "abn-tree" : { deps: ["angular"] },
//        "d3-tratis" : { deps: ["d3"] }
    },
    priority: [
//        "angular"
    ]
});

define([
  'controllers'
//    'angular',
//    'angular-route',
//    'angular-animate',
//    'd3',
//    'abn-tree',
//    'filters',
//    'authentication/service',
//    'authentication/interceptor',
//    'controllers',
//    'measurementController',
//    'chartController',
//    'directives',
//    'services',
//    'coral/eventService',
//    'coral/navigation',
//    'coral/measService',
//    'coral/requestService',
//    'coral/chartService',
//    'coral/chartsController'

], function( /*angular*/) {
'use strict';


    // Declare app level module which depends on filters, and services
    var app = angular.module('ReefAdmin', [
            'ngRoute',
            'ngAnimate',
            'angularBootstrapNavTree',
            'gec.views',
            'controllers'
//            'ReefAdmin.services',
//            'ReefAdmin.filters',
//            'ReefAdmin.directives',
//            'authentication.service',
//            'controllers',
//            'chartController',
//            'coral.event',
//            'coral.navigation',
//            'coral.meas',
//            'coral.request',
//            'coral.chart'
        ]).
      config(['$routeProvider', function($routeProvider) {
        $routeProvider.
          when('/view1', {templateUrl: '/partials/view1.html', controller: 'View1Control'}).
          when('/logout', {templateUrl: '/partials/login.html', controller: 'LogoutController'}).
//          when('/measurements', {templateUrl: '/partials/measurements.html', controller: 'MeasurementControl'}).
//          when('/measurements/:navId', {templateUrl: '/partials/measurements.html', controller: 'MeasurementControl'}).
//          when('/chart', {templateUrl: '/partials/chart.html', controller: 'ChartControl'}).
//          when('/ceses/:id', {templateUrl: '/partials/ceses.html', controller: 'CesesControl'}).
//          when('/entities', {templateUrl: '/partials/entities.html', controller: 'EntityControl'}).
//          when('/entities/:id/:name', {templateUrl: '/partials/entitydetail.html', controller: 'EntityDetailControl'}).
//          when('/points', {templateUrl: '/partials/points.html', controller: 'PointControl'}).
//          when('/points/:id/:name', {templateUrl: '/partials/pointdetail.html', controller: 'PointDetailControl'}).
//          when('/pointsfornav/:navId', {templateUrl: '/partials/points.html', controller: 'PointsForNavControl'}).
//          when('/commands', {templateUrl: '/partials/commands.html', controller: 'CommandControl'}).
//          when('/commands/:name', {templateUrl: '/partials/commanddetail.html', controller: 'CommandDetailControl'}).
//          when('/endpoints', {templateUrl: '/partials/endpoints.html', controller: 'EndpointControl'}).
//          when('/applications', {templateUrl: '/partials/applications.html', controller: 'ApplicationControl'}).
//          when('/applications/:name', {templateUrl: '/partials/applicationdetail.html', controller: 'ApplicationDetailControl'}).
//          when('/events', {templateUrl: '/partials/events.html', controller: 'EventControl'}).
//          when('/alarms', {templateUrl: '/partials/alarms.html', controller: 'AlarmControl'}).
//          when('/agents', {templateUrl: '/partials/agents.html', controller: 'AgentControl'}).
//          when('/agents/:name', {templateUrl: '/partials/agentdetail.html', controller: 'AgentDetailControl'}).
//          when('/permissionsets', {templateUrl: '/partials/permissionsets.html', controller: 'PermissionSetControl'}).
//          when('/permissionsets/:name', {templateUrl: '/partials/permissionsetdetail.html', controller: 'PermissionSetDetailControl'}).
          otherwise({redirectTo: '/view1'});
      }]);

    $(document).ready(function () {
        // No ng-app in index page. Bootstrap manually after RequireJS has dependencies loaded.
        angular.bootstrap(document, [ app.name /*'ReefAdmin'*/])
        // Because of RequireJS we need to bootstrap the app app manually
        // and Angular Scenario runner won't be able to communicate with our app
        // unless we explicitely mark the container as app holder
        // More info: https://groups.google.com/forum/#!msg/angular/yslVnZh9Yjk/MLi3VGXZLeMJ
        //document.addClass('ng-app');
    });

    return app
});  // end RequireJS define
