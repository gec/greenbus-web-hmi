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
define([
], function() {
'use strict';

return angular.module( 'controllers', ['greenbus.views'] )

.controller( 'View1Control', [ '$scope', function( $scope) {
    $scope.hey = 'hey'
}])

.controller( 'MenuControl', ['$rootScope', '$scope', function( $rootScope, $scope) {

    $scope.isActive = function(menuItem) {
        return {
            active: menuItem && menuItem === $scope.currentMenuItem
        };
    };
}])

//.controller( 'ReefStatusControl', ['$scope', 'reef', function( $scope, reef) {
//
//    $scope.status = reef.getStatus()
//    $scope.visible = $scope.status.status !== "UP"
//
//    // This is not executed until after Reef AngularJS service is initialized
//    $scope.$on( 'reef.status', function( event, status) {
//        $scope.status = status;
//        $scope.visible = $scope.status.status !== "UP"
//    });
//}])
//
//.controller( 'LoadingControl', ['$rootScope', '$scope', 'reef', '$location', function( $rootScope, $scope, reef, $location) {
//
//    $scope.status = reef.getStatus();
//
//    // if someone goes to the default path and reef is up, we go to the entity page by default.
//    //
//    if( $scope.status.status === "UP") {
//        $location.path( "/entities");
//        return;
//    }
//
//    $rootScope.currentMenuItem = "loading";
//    $rootScope.breadcrumbs = [
//        { name: "Reef", url: "#/"},
//        { name: "Loading" }
//    ];
//
//    $scope.$on( 'reef.status', function( event, status) {
//        $scope.status = status;
//        $scope.visible = $scope.status.status !== "UP"
//    });
//}])
//
//.controller( 'LogoutControl', ['$scope', 'authentication', function( $scope, authentication) {
//
//    authentication.logout();
//}])
//
//.controller( 'EntityControl', ['$rootScope', '$scope', 'reef', function( $rootScope, $scope, reef) {
//    $rootScope.currentMenuItem = "entities";
//    $rootScope.breadcrumbs = [
//        { name: "Reef", url: "#/"},
//        { name: "Entities" }
//    ];
//    console.log( "EntityControl")
//    reef.get( "/entities", "entities", $scope);
//}])


});// end RequireJS define