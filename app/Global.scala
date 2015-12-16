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
// No package. Just the root context. It's what play wants.

import io.greenbus.web.config.dal.InitialDB
import io.greenbus.msg.Session
import io.greenbus.web.connection.ConnectionManager.WebSocketChannels
import io.greenbus.web.connection.{ClientServiceFactoryDefault, ConnectionStatus, WebSocketPushActorFactory, ConnectionManager}
import io.greenbus.web.websocket.{WebSocketPushActor, WebSocketConsumerImpl}
import play.api._
import controllers.Application
import play.api.Application
import play.api.http.HeaderNames
import play.api.libs.concurrent.Akka
import play.api.libs.iteratee.Concurrent
import play.api.libs.json.JsValue
import play.api.Play.current
import akka.actor.{Props, ActorContext}
import play.api.db.slick
import play.api.mvc.{WithFilters, Result, RequestHeader, Filter}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future


object ClientPushActorFactory extends WebSocketPushActorFactory{
  import ConnectionStatus._
  import ConnectionManager._

  def makeChildActor( parentContext: ActorContext, actorName: String, connectionStatus: ConnectionStatus, session: Session): WebSocketChannels = {
    // Create a pushChannel that the new actor will use for push
    val (enumerator, pushChannel) = Concurrent.broadcast[JsValue]
    val actorRef = parentContext.actorOf( Props( new WebSocketPushActor( connectionStatus, session, pushChannel, ClientServiceFactoryDefault)) /*, name = actorName*/) // Getting two with the same name
    val iteratee = WebSocketConsumerImpl.getConsumer( actorRef)
    WebSocketChannels( iteratee, enumerator)
  }
}

/**
 * Allow CORS - Cross Origin Resource Sharing
 * See example: https://gist.github.com/mitchwongho/78cf2ae0276847c9d332
 */
object CorsFilter extends Filter {

  def apply (nextFilter: (RequestHeader) => Future[Result])(requestHeader: RequestHeader): Future[Result] = {

    nextFilter(requestHeader).map { result =>
      result.withHeaders(
        HeaderNames.ALLOW -> "*",
        HeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN -> "*",
        HeaderNames.ACCESS_CONTROL_ALLOW_METHODS -> "POST, GET, PUT, DELETE, OPTIONS",
        HeaderNames.ACCESS_CONTROL_ALLOW_HEADERS -> "Origin, X-Requested-With, Content-Type, Accept, Referer, User-Agent, Authorization, withcredentials",
        HeaderNames.ACCESS_CONTROL_ALLOW_CREDENTIALS -> "true"
      )
    }
  }
}

/**
 *
 * @author Flint O'Brien
 */
object Global extends WithFilters(CorsFilter) with GlobalSettings {
  import ConnectionManager.DefaultConnectionManagerServicesFactory

  lazy val connectionManager = Akka.system.actorOf(Props( new ConnectionManager( DefaultConnectionManagerServicesFactory, ClientPushActorFactory)), "ConnectionManager")

  override def onStart(app: Application) {
    super.onStart(app)

    Logger.info( "Application starting...")
    Logger.info( "Starting reef connection manager " + connectionManager)
    Application.aConnectionManager = connectionManager
    Application.aServiceFactory = ClientServiceFactoryDefault
    Application.myWebSocketServiceProviders = Seq(
      io.greenbus.web.websocket.SubscriptionServicesActor.webSocketServiceProvider
    )

    Logger.info( "Application started")

    /*
    play.api.Play.mode(app) match {
      case play.api.Mode.Test => // do not schedule anything for Test
      case _ => Logger.info( "Starting reef connection manager " + reefConnectionManager)
    }
    */


    InitialDB.init()

  }
}
