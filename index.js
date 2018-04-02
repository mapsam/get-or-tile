const express = require('express');
const AWS = require('aws-sdk');
const mapnik = require('mapnik');
const fs = require('fs');
const mkdirp = require('mkdirp');

mapnik.register_default_input_plugins();

process.env.LOCAL_CACHE = 'local_cache';
process.env.SOURCE_FILE = 'source/seattle-highways.geojson';

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  return res.send('it is working');
});

app.get('/tiles/:z(\\d+)/:x(\\d+)/:y(\\d+).mvt', (req, res) => {
  const z = parseInt(req.params.z, 10);
  const x = parseInt(req.params.x, 10);
  const y = parseInt(req.params.y, 10);

  console.log(`GET ${z}/${x}/${y}`);

  // first retrieve file from cache
  getTile(z, x, y, (err, buffer) => {
    if (err) return res.send({ message: err.message });

    res.set({
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Content-Encoding': 'gzip',
      'ETag': `roads-${z}-${x}-${y}`
    });

    return res.send(buffer);
  });
});

const getTile = (z, x, y, callback) => {
  if (process.env.LOCAL_CACHE) {
    const cache_path = [__dirname, process.env.LOCAL_CACHE, z, x, `${y}.mvt`].join('/');
    fs.readFile(cache_path, (err, buffer) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log(`${z}/${x}/${y} not in cache, generating...`);
          generateTile(z, x, y, (err, buffer) => {
            if (err) return callback(err);
            return callback(null, buffer);
          });
        } else {
          return callback(err);
        }
      } else {
        return callback(null, buffer);
      }
    });
  }
};

const generateTile = (z, x, y, callback) => {
  const path = [__dirname, process.env.SOURCE_FILE].join('/');
  fs.readFile(path, 'utf8', (err, gj) => {
    if (err) return callback(err);
    let vt;
    try {
      vt = new mapnik.VectorTile(z, x, y);
      vt.addGeoJSON(gj, 'roads');
    } catch (err) {
      return callback(err);
    }

    const opts = {
      compression: 'gzip',
      level: 9,
      strategy: 'FILTERED'
    };

    vt.getData(opts, (err, buffer) => {
      if (err) return callback(err);
      saveTile(z, x, y, buffer, (err) => {
        if (err) return (err);
        return callback(null, buffer);
      });
    });
  });
};

const saveTile = (z, x, y, buffer, callback) => {
  if (process.env.LOCAL_CACHE) {
    const cache_path = [__dirname, process.env.LOCAL_CACHE, z, x].join('/');
    mkdirp(cache_path, (err) => {
      fs.writeFile(`${cache_path}/${y}.mvt`, buffer, (err) => {
        if (err) return callback(err);
        return callback(null, buffer);
      });
    });
  }
};

app.listen(3000, () => console.log('tiles being served from port 3000'));
