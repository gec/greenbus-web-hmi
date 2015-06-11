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
    },
    baseUrl: '/javascripts'
});

define([
], function() {
'use strict';


    // Declare app level module which depends on filters, and services
    var app = angular.module('greenbus-chart-popout', [
        'ui.router',
        'ngAnimate',
        'greenbus.views'
      ]).
      config([ '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        // For any unmatched url, redirect to ...
        $urlRouterProvider.otherwise("/")

        $stateProvider
          .state('chartpopout', { url: "/", template: '<gb-chart></gb-chart>'})
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
