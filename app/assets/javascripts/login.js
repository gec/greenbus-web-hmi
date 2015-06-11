/**
 * Copyright 2013-2015 Green Energy Corp.
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
 * @author Flint O'Brien
 */
require.config({
    paths: {
    },
    baseUrl: '/javascripts',
    shim: {
    },
    priority: [
    ]
});

define([
], function() {
    'use strict';

    var app = angular.module('ReefAdmin', [
        'ui.router',
        'greenbus.views.authentication'
    ]).
    config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        // For any unmatched url, redirect to ...
        $urlRouterProvider.otherwise("/microgrids")

        $stateProvider
          .state('login', {url: '/login', templateUrl: 'partials/login.html', controller: 'LoginController'})
    }]);

    // No ng-app in index page. Bootstrap manually after RequireJS has dependencies loaded.
    angular.bootstrap(document, ['ReefAdmin'])
    return app
}); // end RequireJS define
