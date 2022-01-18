# Ruter Interactive
A interactive transport flow map.

![map](https://user-images.githubusercontent.com/3536134/50222032-412e2900-0397-11e9-95ea-de7d3a5e2ad5.png)

Live demo:
https://ruter-interactive.firebaseapp.com

Note: the demo uses a journey processer running on azure, so when the first request of the day triggers a new data import job, the demo will be non-working for about 5 minutes.

### Quick start
#### Journey fetcher
In `/journeyfetcher/` you find the project for importing data from a GTFS transport source. It generates and serves a journey JSON file, 
which is a list of all public transport trips in Oslo for the current day. It also generates a stops-file with data on all active stop-places in oslo, with altidude fetched from google maps api. 
When a day is processed the result is cached locally so the next request is handled faster.

Run `yarn install` (or `npm install`) and `yarn start` to initialize the project and start the web-server.  All endpoints except the `/cacheall` endpoint also have the `agency` parameter which is optional. Values for this parameter are: `ruter`, `nsb`, or `all`. `ruter` is the default parameter. `nsb` returns the journeys from NSB and `all` returns journeys from all services on the given date.
The available endpoints are: 

- `/journeys` for today's journeys
- `/journeys?date=dd-mm-yyyy` for given date
- `/stops` for all stops
- `/cacheall` processes all stops and journeys for all three agencies. This endpoint is meant to be called every night to cache up todays journeys in order to increase performance. 


It is also set up on a server at https://journeyfetcher.azurewebsites.net/. It is deployed as a container service with the Dockerfile in the project directory.

#### Map prototype
The main project is built on React and Three.js, with firebase hosting available. It has a dat.gui debug menu where most variables can be played with live.
Run `yarn install` then `yarn start`. By default it is set up to fetch journeys from the azure service.
To point it to the local JourneyFetcher change `global.options.source.baseUrl` to `http://localhost:3000/`.

`yarn deploy` builds a production build and deploys the solution to firebase.

#### File structure
- `./src/modules/map/` contains the main map logic and processing files, where `MapModule.jsx` is the initializer.
- `./public/` has the base `index.html` file and sprites
- The remaining somewhat complex file structure was designed to support changing between multiple submodules, 
both for mobile and a "presenter"-screen, synced live with firebase. 
See `modules.js` and `Mobile.jsx` for that setup.

#### Build chain
- Webpack builds sass and jsx for chrome (no capability with older browsers), cleans the /dist folder, and copies the public folder into it.

#### To-do
- Fix service worker and cache journey files offline, so everything works offline
- Optimize and correct `newPosition` so that it dosn't calculate a new vector each time, and get the correct position with distances included in calculation.
- Fade lines/points in/out
- Journeyplanner: get data from past night and next night
- Conntect with camera interaction


Firebase console:
https://console.firebase.google.com/u/XXXXXX/project/ruter-interactive/overview 

User: makingwavesnorge@gmail.com

