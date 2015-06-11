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
import io.greenbus.web.websocket.WebSocketActor.WebSocketServiceProvider
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
  var myWebSocketServiceProviders: Seq[WebSocketServiceProvider] = _
  override def webSocketServiceProviders: Seq[WebSocketServiceProvider] = myWebSocketServiceProviders


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

  def appsChartPopout = AuthenticatedPageAction { (request, session) =>
    Logger.debug( "Application.appsChartPopout")
    Ok(views.html.chartPopout("GreenBus HMI Chart"))
  }

}