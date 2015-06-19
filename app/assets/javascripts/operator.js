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
], function( /*angular*/) {
'use strict';


    // Declare app level module which depends on filters, and services
    var app = angular.module('ReefAdmin', [
        'ui.router',
        'ngAnimate',
        'angularBootstrapNavTree',
        'greenbus.views'
      ]).
      config([ '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        // For any unmatched url, redirect to ...
        $urlRouterProvider.otherwise("/loading")

        $stateProvider
          .state('loading',                   { url: "/loading",     template: "<div>loading...</div>"})
          .state('microgrids',                { url: "/microgrids/:microgridId", params: {navigationElement: null}, template: "<div ui-view></div>"})
          .state('microgrids.dashboard',      { url: "/dashboard",       params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.equipments',     { url: "/equipments",      params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.equipmentsId',   { url: "/equipments/:id",  params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.pvs',            { url: "/pvs",             params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.pvsId',          { url: "/pvs/:id",         params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.esses',          { url: "/esses",           params: {navigationElement: null}, template: "<gb-esses></gb-esses>"})
          .state('microgrids.essesId',        { url: "/esses/:id",       params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.generations',    { url: "/generations",     params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.generationsId',  { url: "/generations/:id", params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.loads',          { url: "/loads",           params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('microgrids.loadsId',        { url: "/loads/:id",       params: {navigationElement: null}, template: "<gb-equipment></gb-equipment>"})
          .state('endpoints',                 { url: "/endpoints",       params: {navigationElement: null}, template: "<gb-endpoints></gb-endpoints>"})
          .state('events',                    { url: "/events",          params: {navigationElement: null}, template: "<gb-events></gb-events>"})
          .state('alarms',                    { url: "/alarms",          params: {navigationElement: null}, template: "<gb-alarms></gb-alarms>"})
          .state('logout',                    { url: "/logout",          params: {navigationElement: null}, template: "<div>Logging out...</div>", controller: 'LogoutController'})

        //$routeProvider.
        //  when('/view1', {templateUrl: '/partials/view1.html', controller: 'View1Control'}).
        //  when('/logout', {templateUrl: '/partials/login.html', controller: 'LogoutController'}).
        //  when('/measurements', {templateUrl: '/partials/measurements.html'}).
        //  when('/measurements/:navId', {templateUrl: '/partials/measurements.html'}).
        //  when('/events', {templateUrl: '/partials/events.html'}).
        //  when('/alarms', {templateUrl: '/partials/alarms.html'}).
        //  when('/endpoints', {templateUrl: '/partials/endpoints.html'}).
        //  when('/esses/:id', {templateUrl: '/partials/esses.html'}).
        //  otherwise({redirectTo: '/measurements'});
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
