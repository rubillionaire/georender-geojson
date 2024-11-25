const features = require('@rubenrodriguez/georender-pack/features.json')
const decode = require('@rubenrodriguez/georender-pack/decode')
const pointInPolygon = require('point-in-polygon')

module.exports = function (buffers) {
  var decoded = decode(Array.isArray(buffers) ? buffers : [buffers])
  var features = []
  decodePoint(features, decoded.point)
  decodeLine(features, decoded.line)
  decodeArea(features, decoded.area)
  return { type: 'FeatureCollection', features }
}

function decodePoint(features, point) {
  const decodeTagsPoint = decodeTags('point')
  const getTags = decodeTagsPoint(point)
  for (var i = 0; i < point.types.length; i++) {
    var id = point.ids[i]
    const properties = Object.assign(getFeatureType(point.types[i]), getTags(i))
    features.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'Point',
        coordinates: [point.positions[i*2+0], point.positions[i*2+1]],
      },
    })
  }
}

function decodeLine(features, line) {
  var prevId = null
  var coordinates = []

  const decodeTagsLine = decodeTags('line')
  const getTags = decodeTagsLine(line)

  for (var i = 0; i < line.types.length; i++) {
    var id = line.ids[i]
    if (i > 0 && id !== prevId) {
      const properties = Object.assign(getFeatureType(line.types[i-1]), getTags(i-1))
      features.push({
        type: 'Feature',
        properties,
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        }
      })
      coordinates = []
    } else {
      coordinates.push([line.positions[i*2+0], line.positions[i*2+1]])
    }
    prevId = id
  }
  if (coordinates.length > 0) {
    const properties = Object.assign(getFeatureType(line.types[i-1]), getTags(i-1))
    features.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      }
    })
  }
}

function decodeArea(features, area) {
  var prevId = null
  var ring = []
  var coordinates = [[ring]]
  var edgeCounts = getEdgeCounts(area.cells)
  var isMulti = false

  const decodeTagsArea = decodeTags('area')
  const getTags = decodeTagsArea(area)

  for (var i = 0; i < area.types.length; i++) {
    var id = area.ids[i]
    if (i > 0 && id !== prevId) {
      // todo: add labels to properties
      ring.push([ring[0][0],ring[0][1]])
      const properties = Object.assign(getFeatureType(area.types[i-1]), getTags(i-1))
      features.push({
        type: 'Feature',
        properties,
        geometry: {
          type: isMulti ? 'MultiPolygon' : 'Polygon',
          coordinates: isMulti ? coordinates : coordinates[0],
        }
      })
      isMulti = false
      ring = []
      coordinates = [[ring]]
      ring.push([area.positions[i*2+0], area.positions[i*2+1]])
    } else if (i > 0 && area.ids[i+1] === id && edgeCounts[edgeKey(i,i+1)] !== 1) {
      var p = [area.positions[i*2+0], area.positions[i*2+1]]
      ring.push(p, [ring[0][0],ring[0][1]])
      ring = []
      coordinates[coordinates.length-1].push(ring)
    } else {
      var p = [area.positions[i*2+0], area.positions[i*2+1]]
      var cl = coordinates.length
      var c0l = coordinates[cl-1].length
      if (c0l > 1 && ring.length === 0 && !pointInPolygon(p, coordinates[cl-1][0])) {
        coordinates[cl-1].splice(-1)
        ring = []
        coordinates.push([ring])
        isMulti = true
      }
      ring.push(p)
    }
    prevId = id
  }
  if (ring.length > 0) {
    ring.push([ring[0][0],ring[0][1]])
  }
  if (coordinates[0].length > 0 && coordinates[0][0].length > 0) {
    const properties = Object.assign(getFeatureType(area.types[i-1]), getTags(i-1))
    features.push({
      type: 'Feature',
      properties,
      geometry: {
        type: isMulti ? 'MultiPolygon' : 'Polygon',
        coordinates: isMulti ? coordinates : coordinates[0],
      }
    })
  }
}

function getFeatureType(type) {
  if (type === undefined) return {}
  var parts = features[type].split('.')
  var tags = {}
  tags[parts[0]] = parts[1]
  return tags
}

function getEdgeCounts(cells) {
  var counts = {}
  for (var i = 0; i < cells.length; i+=3) {
    for (var j = 0; j < 3; j++) {
      var e0 = cells[i+j]
      var e1 = cells[i+(j+1)%3]
      var ek = edgeKey(e0,e1)
      counts[ek] = (counts[ek] || 0) + 1
    }
  }
  return counts
}

function edgeKey(e0, e1) {
  return e0 < e1 ? e0+','+e1 : e1+','+e0
}

function decodeTags (type) {
  const baseFields = decode.baseFields[type]
  return function (data) {
    const tags = []
    for (const key in data) {
      if (!baseFields.includes(key)) tags.push(key)
    }
    
    return tags.length > 0 ? tagsForData : noTagData

    function tagsForData (i) {
      const values = {}
      for (const tag of tags) {
        values[tag] = data[tag][i]
      }
      return values
    }

    function noTagData () { return {} }
  }
}