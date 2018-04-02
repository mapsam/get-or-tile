# get ... or tile

This is an example tile server that gets a vector tile from a local filesystem if it exists, otherwise generates a new tile from a geojson source and serves it on demand. Once a tile is generated on demand, it is stored in the tile cache for the next request.

Here's an example of the server generating tiles as the user scrolls as well as serving already generated and cached tiles.

![](https://user-images.githubusercontent.com/1943001/38180703-6be5fc72-35e3-11e8-908b-eebb427bd1be.gif)

### How to use it

Firstly, don't use this for huge datasources. It'll clog up the javascript event loop and crash your server. Running it locally takes a few steps.

First, clone the repo

```
git clone git@github.com:mapsam/get-or-tile.git
```

Then edit the viz/index.html file to add your Mapbox access token. And finally run the following commands:

```shell
cd get-or-tile
npm install

# create (and clear) the local cache
npm run clear-cache

# start the server
npm start

# start a separate server for the web map (open another terminal)
cd get-or-tile/viz
python -m SimpleHTTPServer
```

Now you can go to http://127.0.0.1:8000 to see the map load tiles from cache or source.
