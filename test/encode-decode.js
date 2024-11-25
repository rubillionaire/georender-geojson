const test = require('tape')
const toGeorender = require('../to-georender.js')
const toGeoJSON = require('../to-geojson.js')
const { decode } = require('varint')

test('decode encode simple', function (t) {
  var decoded = toGeoJSON(toGeorender({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[1,2],[3,4],[5,0],[1,2]]],
        },
      }
    ],
  }))
  t.deepEqual(decoded, {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { place: 'other' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[1,2],[3,4],[5,0],[1,2]]],
        },
      }
    ],
  })
  t.end()
})

test('decode encode hole', function (t) {
  var decoded = toGeoJSON(toGeorender({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[10,20],[30,40],[50,0],[10,20]],
            [[15,21],[25,22],[34,19],[15,21]],
          ],
        },
      }
    ],
  }))
  t.deepEqual(decoded, {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { place: 'other' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[10,20],[30,40],[50,0],[10,20]],
            [[15,21],[25,22],[34,19],[15,21]],
          ],
        },
      }
    ],
  })
  t.end()
})

test('decode encode multipolygon', function (t) {
  var decoded = toGeoJSON(toGeorender({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [[10,20],[30,40],[50,0],[10,20]]
            ],
            [
              [[0,50],[40,55],[20,35],[0,50]]
            ],
          ],
        },
      }
    ],
  }))
  t.deepEqual(decoded, {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { place: 'other' },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [[10,20],[30,40],[50,0],[10,20]]
            ],
            [
              [[0,50],[40,55],[20,35],[0,50]]
            ],
          ],
        },
      }
    ],
  })
  t.end()
})

test('decode encode point', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        place: 'city',
        bufferIndex: 0,
      },
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      }
    }]
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  t.deepEqual(decoded, fc)
  t.end()
})

test('decode encode line', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        waterway: 'river',
        meanWaterLevel: 12,
      },
      geometry: {
        type: 'LineString',
        coordinates: [[0, 1], [1, 2], [3, 4]],
      }
    }]
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  // console.log(decoded.features[0])
  t.deepEqual(decoded, fc, 'feature collection : line matches')
  t.end()
})

test('decode encode multi-line', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        waterway: 'river',
        meanWaterLevel: 12,
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [[0, 1], [1, 2]],
          [[3, 4], [5, 6]]
        ],
      }
    }]
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  t.notDeepEqual(decoded, fc, 'fails: MultiLineString does not match, encoding does not preserve this information, and flattens into a single LineString.')
  t.end()
})

test('decode multi polygon area with tags', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'multipolygon',
          place: 'city',
          population: 342_259,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [[10,20],[30,40],[50,0],[10,20]]
            ],
            [
              [[0,50],[40,55],[20,35],[0,50]]
            ],
          ],
        },
      }
    ],
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  t.deepEqual(decoded, fc)
  t.end()
})

test('decode polygon area with tags', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'multipolygon',
          place: 'city',
          population: 342_259,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[10,20],[30,40],[50,0],[10,20]]
          ],
        },
      }
    ],
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  t.deepEqual(decoded, fc)
  t.end()
})

test('decode polygon area with tags and names', function (t) {
  const fc = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'multipolygon',
          place: 'country',
          population: 342_259,
          name: 'Puerto Rico',
          'name:taíno': 'Borikén',
          'alt_name:en': 'Rich Port',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[10,20],[30,40],[50,0],[10,20]]
          ],
        },
      }
    ],
  }
  const decoded = toGeoJSON(toGeorender(fc, { includeAllTags: true }))
  t.deepEqual(decoded, fc)
  t.end()
})