import _root_.sbt.Credentials
import _root_.sbt.Keys._
import _root_.sbt.Path
import play.twirl.sbt.Import.TwirlKeys
import com.google.javascript.jscomp.{CompilerOptions, CompilationLevel}
import RjsKeys._

name := "greenbus-web-hmi"

organization in ThisBuild := "io.greenbus"

version := "3.0.1-SNAPSHOT"

lazy val root = (project in file("."))
  .enablePlugins(PlayScala,SbtTwirl)
  .settings(
    scalaVersion := "2.10.4"
  )

lazy val appPublishMavenStyle = true

lazy val appPublishArtifactInTest = false

lazy val appPomIncludeRepository = { _: MavenRepository => false }

lazy val appPublishTo = { (v: String) =>
  val artifactory = "https://repo.totalgrid.org/artifactory/"
  if (v.trim.endsWith("SNAPSHOT"))
    Some("snapshots" at artifactory + "totalgrid-snapshot")
  else
    Some("releases"  at artifactory + "totalgrid-release")
}

lazy val appPomExtra = {
  <url>https://github.com/gec/greenbus-web-hmi.git</url>
    <licenses>
      <license>
        <name>Apache License, Version 2.0</name>
        <url>http://www.apache.org/licenses/LICENSE-2.0.html</url>
        <distribution>repo</distribution>
      </license>
    </licenses>
    <scm>
      <url>git@github.com:gec/greenbus-web-hmi.git</url>
      <connection>scm:git:git@github.com:gec/greenbus-web-hmi.git</connection>
    </scm>
}


credentials += Credentials( Path.userHome / ".ivy2" / ".credentials")

// for io.greenbus
resolvers += "totalgrid-release" at "https://repo.totalgrid.org/artifactory/totalgrid-release"

resolvers += "totalgrid-snapshot" at "https://repo.totalgrid.org/artifactory/totalgrid-snapshot"

resolvers += Resolver.mavenLocal

libraryDependencies ++= Seq(
  filters,
  cache,
  // WebJars (i.e. client-side) dependencies
  "org.webjars" % "requirejs" % "2.1.14-1",
  "org.webjars" % "webjars-play_2.10" % "2.3.0",
//  "org.webjars" % "jquery" % "1.11.1",
  "org.webjars" % "bootstrap" % "3.3.6",
  "org.webjars" % "angularjs" % "1.2.27",
  "org.webjars" % "angular-ui-bootstrap" % "0.12.0" exclude("org.webjars", "angularjs"),
  "org.webjars" % "angular-ui-utils" % "0.1.1" exclude("org.webjars", "angularjs"),
  "org.webjars" % "angular-ui-router" % "0.2.13" exclude("org.webjars", "angularjs"),
  "org.webjars" % "momentjs" % "2.10.2",
  "io.greenbus" % "greenbus-client" % "3.0.0" withSources(),
  "io.greenbus.web" %% "web-core" % "3.0.1-SNAPSHOT" withSources(),
  "com.typesafe.slick" %% "slick" % "2.1.0",
  "com.typesafe.play" %% "play-slick" % "0.8.1"
)

// Scala Compiler Options
scalacOptions in ThisBuild ++= Seq(
  "-target:jvm-1.7",
  "-encoding", "UTF-8",
  "-deprecation", // warning and location for usages of deprecated APIs
  "-feature", // warning and location for usages of features that should be imported explicitly
  "-unchecked", // additional warnings where generated code depends on assumptions
  "-Xlint", // recommended additional warnings
  "-Ywarn-adapted-args", // Warn if an argument list is modified to match the receiver
  "-Ywarn-value-discard", // Warn when non-Unit expression results are unused
  "-Ywarn-inaccessible",
  "-Ywarn-dead-code"
)

// Need to specify main module if it's not main.js
RjsKeys.mainModule := "operator"

// Configure the steps of the asset pipeline (used in stage and dist tasks)
// rjs = RequireJS, uglifies, shrinks to one file, replaces WebJars with CDN
// digest = Adds hash to filename
// gzip = Zips all assets, Asset controller serves them automatically when client accepts them
pipelineStages := Seq(rjs, digest, gzip)
