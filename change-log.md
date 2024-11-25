# next

- [fork] from [georender-geojson@1.2.0](https://www.npmjs.com/package/georender-geojson)
- [package] major: georender-pack@4 -> @rubenrodriguez/georender-pack@5
- [to-georender] minor: pass `opts` into `georender-pack/encode`
- [to-geojson] minor: account for additional tags that can be encoded
- [to-geojson] patch: remove widow ring from polygons. the home for a new ring can be added to the end of a set of coordinates to make room for processing more, so if there is an empty array at the end of the coordinates we remove it