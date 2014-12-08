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
package controllers

import akka.actor.ActorRef
import io.greenbus.web.websocket.WebSocketServices
import play.api._
import play.api.mvc._
import play.api.libs.json.Json
import io.greenbus.web.connection.ReefServiceFactory
import io.greenbus.web.rest.RestServices
import io.greenbus.web.config.Navigation._

object Application extends Controller with ReefAuthenticationImpl with RestServices with WebSocketServices {

  // reefConnectionManager is assigned by Global. Ugly, but can't ask Global _object_ because we need mocked Global during testing.
  var reefConnectionManager: ActorRef = _
  def connectionManager: ActorRef = reefConnectionManager
  var reefServiceFactory: ReefServiceFactory = _
  def serviceFactory: ReefServiceFactory = reefServiceFactory


  def index = Action {
    Logger.debug( "Application.index")
    Redirect( routes.Application.appsOperator)
//
//    Ok(views.html.index("Your new application is ready."))
  }

  def appsOperator = AuthenticatedPageAction { (request, session) =>
    Logger.debug( "Application.appsOperator")
    Ok(views.html.operator("GreenBus HMI Operator"))
  }

  val appMenuTop = List[NavigationElement](
    NavigationItem( "GreenBus", "applications", "#/", 
      children = List[NavigationElement](
        NavigationItem( "Operator", "operator", "/apps/operator/#/"),
        NavigationItem( "Admin", "admin", "/apps/admin/#/")
      )
    ),
    NavigationItem( "", "session", "",
      children = List[NavigationElement](
        NavigationItem( "Logout", "logout", "#/logout")
      )
    )
  )

  def appAdminMenuLeft = {
    List[NavigationElement](
      NavigationHeader( "Model"),
      NavigationItem( "Entities", "entities", "#/entities", selected=true),
      NavigationItem( "Points", "points", "#/points"),
      NavigationItem( "Commands", "commands", "#/commands"),
      NavigationHeader( "Data"),
      NavigationItem( "CES", "esses", "#/esses"),
      NavigationItem( "Measurements", "measurements", "#/measurements"),
      NavigationItem( "Events", "events", "#/events"),
      NavigationItem( "Alarms", "alarms", "#/alarms"),
      NavigationHeader( "Components"),
      NavigationItem( "Endpoints", "endpointconnections", "#/endpointconnections"),
      NavigationItem( "Applications", "applications", "#/applications"),
      NavigationHeader( "Auth"),
      NavigationItem( "Agents", "agents", "#/agents"),
      NavigationItem( "Permission Sets", "permissionsets", "#/permissionsets")
    )
  }
  def appOperatorMenuLeft = {
    val subMenus = List[NavigationElement](
      NavigationItemSource( "Equipment", "equipment", "/measurements/equipment", "/models/1/equipment/$parent/descendants?depth=1", InsertLocation.CHILDREN),
      NavigationItemSource( "Solar", "solar", "/measurements/solar", "/models/1/equipment/$parent/descendants?depth=0&childTypes=PV", InsertLocation.CHILDREN),
      NavigationItemSource( "Energy Storage", "esses", "/esses/", "/models/1/equipment/$parent/descendants?depth=0&childTypes=CES", InsertLocation.CHILDREN),
      NavigationItemSource( "Generator", "generator", "/measurements/generator", "/models/1/equipment/$parent/descendants?depth=0&childTypes=Generator", InsertLocation.CHILDREN),
      NavigationItemSource( "Load", "load", "/measurements/load", "/models/1/equipment/$parent/descendants?depth=0&childTypes=Load", InsertLocation.CHILDREN)
    )
    List[NavigationElement](
      //      NavigationItem( "Dashboard", "dashboard", "#/dashboard"),
      NavigationItemSource( "Loading...", "equipment", "#/someRoute", "/models/1/equipment?depth=1&rootTypes=Root", InsertLocation.REPLACE, selected=true, children=subMenus),
      NavigationItem( "Endpoints", "endpoints", "/endpoints"),
      NavigationItem( "Events", "events", "/events"),
      NavigationItem( "Alarms", "alarms", "/alarms")
    )
  }


  def getAppsMenus( app: String, menu: String) = ReefClientAction { (request, client) =>
    Logger.debug( s"/apps/$app/menus/$menu")

    val navMenu = menu match {
      case "top" => appMenuTop
      case "left" =>
        app match {
          case "operator" => appOperatorMenuLeft
          case "admin" => appAdminMenuLeft
          case _ => List[NavigationElement](NavigationHeader( "Unknown app '" + app + "'"))
        }
      case _ => List[NavigationElement](NavigationHeader( "Unknown menu '" + menu + "'"))
    }

    Ok( Json.toJson( navMenu))
  }

//  def getCoralMenus( name: String) = ReefClientAction { (request, client) =>
//    Logger.debug( s"/coral/menus/$name")
//
//    val navMenu = name match {
//      case "admin" => appAdminMenuLeft
//      case "operator" => appOperatorMenuLeft
//      case _ =>
//        List[NavigationElement](
//          NavigationHeader( "Unknown menu '" + name + "'")
//        )
//    }
//
//
//    Ok( Json.toJson( navMenu))
//  }

}