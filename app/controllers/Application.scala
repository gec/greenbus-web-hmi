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
import io.greenbus.web.connection.ClientServiceFactory
import io.greenbus.web.rest.RestServices
import io.greenbus.web.config.Navigation._

object Application extends Controller with ReefAuthenticationImpl with RestServices with WebSocketServices {

  // reefConnectionManager is assigned by Global. Ugly, but can't ask Global _object_ because we need mocked Global during testing.
  var aConnectionManager: ActorRef = _
  def connectionManager: ActorRef = aConnectionManager
  var aServiceFactory: ClientServiceFactory = _
  def serviceFactory: ClientServiceFactory = aServiceFactory
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

  /**
   * We're adding the CORS header via Global WithFilters(CorsFilter)
   * Allow CORS - Cross Origin Resource Sharing
   * See example:
   *   https://gist.github.com/mitchwongho/78cf2ae0276847c9d332
   *   https://windrush.org/blog/cors-and-play
   */
  def preflight(path: String) = Action {
    Ok("")
  }

}