# PitStop

This repository contains backend and frontend sources used in the Flux Foundations training.

## Introduction

During this training you will develop a road-side assistance app called PitStop. In this webapp users can
report incidents with their car and service operators will be able to offer assistance.

Some less important parts of the app have already been developed for you, e.g. user management and authentication
and reference data queries. Feel free to reuse these parts in your own Flux applications.

## Setting up

Before continuing make sure you have created your own fork of
the [public PitStop repository](https://github.com/manoups/pitstop). Next, clone this fork on your machine,
then open the project in Intellij IDEA.

The repository consists of two parts:

- A backend written in Java, contained in the `/src` folder.
- A frontend in Angular, found in the `/ui` folder.

To get started:

- In `File -> Project Structure` select to use Java 25.
- Via Intellij's run config menu, run:
    - `mvn clean install`
    - `ng serve`
- Please check in with colleagues or us before the training if either doesn't run.
- Add `application-local.properties` to `/src/main/resources`. You'll receive this file before the training.
- There are two options to bootstrap the BE
  - Via Intellij's run config menu, run: `Flux test + proxy + app`. 
  - Via Intellij's run config menu, run: `docker-compose`. This option also provisions a dashboard on `localhost:5601`. 

## Day 1

On the first day of the training you'll develop a minimum viable version of the PitStop App.

To get started please have a look at the `PitStopApi` class. It contains a bunch of unimplemented REST endpoints for
PitStop. The provided frontend makes use of these endpoints, so it is your challenge to provide an implementation.
For that, you'll need to develop the following features:

- Report incident
- Get incidents
- Offer assistance as operator
- Accept an offer
- Close incident
- Schedule to close an incident automatically after 24h

All features should be accompanied by automated behavioral tests. You'll also be able to check your implementation
using the provided UI.

**Note:** please make sure you don't structurally modify any of the objects used in the REST endpoints, as that may
break the UI.

### Questions
- In the UI, many components use objects from the backend (see components importing `@pitstop/typescript/pitstop`). How is this module created?
- In the UI, after login the front-end queries the backend for the user's profile (GetUserProfile). Why?
- How are the user profile data being populated in the BE in this workflow?
- Once we issue a command (_e.g._ `DeclareIncident`) the BE will validate the command synchronously (accept/reject decision) but it will further process it asynchronously. How does the processing outcome reach the UI? Provide detailed data flow.
- Since each request/command has a payload and access control is defined on message level, why do we need multiple endpoints? _I.e._ instead of sending an `IncidentDetails` to `/api/incidents` and an `Offer` to `/api/incidents/{incidentId}/offers`, why don't we send any payload to a `/api/handle`  


## Day 2

Now that we have our minimum viable version of the App, let's add some more advanced features.

First of, we want to make sure someone can always get roadside assistance, even when there are no suitable offers. For
this, we will build an integration with a default roadside operator, called AAA. This operator provides endpoints to
request assistance ánd receive status updates on the work.

Other features for day 2:
- Filter out offers by competing operators
- Support categorization of incidents
- Support voting on operators
- Create reports on the performance of operators