/* eslint-disable no-underscore-dangle */

import L from 'leaflet'
import { capitalize, difference, isEqual } from 'lodash'
import $ from 'jquery'

import {
  withLeaflet,
  MapLayer
} from 'react-leaflet'

import {
  addPath,
  isClockwise,
  getlprojection
} from '../../util/map/granules'

import buildLayer, {
  isCartesian,
  getPolygons,
  getLines,
  getPoints,
  getRectangles
} from '../../util/map/layers'

import { dividePolygon } from '../../util/map/geo'
import { eventEmitter } from '../../events/events'
import { getColorByIndex } from '../../util/colors'
import { getTemporal } from '../../util/edscDate'
import { panBoundsToCenter } from '../../util/map/actions/panBoundsToCenter'
import { tagName } from '../../../../../sharedUtils/tags'

import projections from '../../util/map/projections'
import projectPath from '../../util/map/interpolation'

import './GranuleGridLayer.scss'

const config = {
  // debug: true,
  // eslint-disable-next-line max-len
  gibsUrl: 'https://gibs.earthdata.nasa.gov/wmts/{lprojection}/best/{product}/default/{time}/{resolution}/{z}/{y}/{x}.{format}',
  // eslint-disable-next-line max-len
  gibsGranuleUrl: 'http://uat.gibs.earthdata.nasa.gov/wmts/{projection}/std/{product}/default/{time}/{resolution}/{z}/{y}/{x}.{format}'
}

const MAX_RETRIES = 1 // Maximum number of times to attempt to reload an image

const layerBuffer = 20

class GranuleGridLayerExtended extends L.GridLayer {
  initialize(props) {
    const {
      collectionId,
      color,
      focusedCollection,
      focusedGranule,
      granules,
      isProjectPage,
      lightColor,
      metadata,
      onChangeFocusedGranule,
      onExcludeGranule,
      onMetricsMap,
      project,
      projection
    } = props

    const { collections: projectCollections = {} } = project
    const { byId: projectCollectionsById = {} } = projectCollections
    const { [collectionId]: projectCollection = {} } = projectCollectionsById

    this.collectionId = collectionId
    this.projection = projection
    this.onChangeFocusedGranule = onChangeFocusedGranule
    this.onExcludeGranule = onExcludeGranule
    this.onMetricsMap = onMetricsMap
    this.focusedCollection = focusedCollection

    const {
      addedGranuleIds = [],
      removedGranuleIds = []
    } = projectCollection

    this.isProjectPage = isProjectPage
    this.addedGranuleIds = addedGranuleIds
    this.removedGranuleIds = removedGranuleIds

    this.setResults({
      addedGranuleIds,
      collectionId,
      color,
      lightColor,
      defaultGranules: granules,
      focusedCollection,
      focusedGranule,
      granules,
      isProjectPage,
      metadata,
      projectCollection,
      removedGranuleIds
    })

    eventEmitter.on('map.mousemove', e => this._onEdscMousemove(e))
    eventEmitter.on('map.mouseout', e => this._onEdscMouseout(e))
    eventEmitter.on('map.click', e => this._onClick(e))
    eventEmitter.on(`map.layer.${collectionId}.focusgranule`, granule => this._onEdscFocusgranule(granule))
    eventEmitter.on(`map.layer.${collectionId}.stickygranule`, granule => this._onEdscStickygranule(granule))
    eventEmitter.on('map.excludestickygranule', granuleId => this._onExcludeGranule(granuleId))

    this.originalOptions = { tileSize: 512 }
    return super.initialize(this.originalOptions)
  }

  // Overwrite the leaflet onAdd function
  onAdd(map) {
    this._map = map
    super.onAdd()

    this._container.setAttribute('id', `granule-vis-${this.collectionId}`)
    this.setFocus(this.collectionId)
  }

  // Overwrite the leaflet onRemove function
  onRemove(map) {
    super.onRemove(map)
    eventEmitter.off('map.mousemove', e => this._onEdscMousemove(e))
    eventEmitter.off('map.mouseout', e => this._onEdscMouseout(e))
    eventEmitter.off('map.click', e => this._onClick(e))
    eventEmitter.off(`map.layer.${this.collectionId}.focusgranule`, granule => this._onEdscFocusgranule(granule))
    eventEmitter.off(`map.layer.${this.collectionId}.stickygranule`, granule => this._onEdscStickygranule(granule))
    eventEmitter.off('map.excludestickygranule', granuleId => this._onExcludeGranule(granuleId))

    this.granules = null
  }

  // Overwrite the leaflet createTile function
  createTile(tilePoint) {
    const tile = this.newTile()

    // # force the map _zoom to the new value before we calculate
    // # where things need to be drawn
    // # This was to fix the granules being drawn incorrectly after a zoom, but
    // # it isn't needed if we turn zoomAnimation off for the map
    // @_map._zoom = tilePoint.z
    this.drawTile(tile, this.getBackTile(tilePoint), tilePoint)

    const element = L.DomUtil.create('div', 'leaflet-tile')

    const {
      imagery,
      outline
    } = tile

    element.appendChild(imagery)
    element.appendChild(outline)

    return element
  }

  /**
   * Sets up a canvas to be placed in the tile.
   * @param {Object} size - Size information from the tile.
   * @param {String} name - A unique name for the tile class name.
   * @return {Element} A canvas element.
   */
  setupCanvas(size, name) {
    const canvas = L.DomUtil.create('canvas', `leaflet-${name}-tile`)

    canvas.width = size.x
    canvas.height = size.y

    canvas.onmousemove = L.Util.falseFn
    canvas.onselectstart = L.Util.falseFn

    return canvas
  }

  /**
   * Creates an object of canvases to be used for the tile.
   * @return {Object} A object containing the canvases for each tile.
   */
  newTile() {
    const size = this.getTileSize()

    return {
      imagery: this.setupCanvas(size, 'imagery'),
      outline: this.setupCanvas(size, 'outline', true)
    }
  }

  getBackTile(tilePoint) {
    const key = `${tilePoint.x}:${tilePoint.y}`
    if (this._backTiles == null) { this._backTiles = {} }
    if (this._backTiles[key] == null) { this._backTiles[key] = this.newTile() }

    return this._backTiles[key]
  }

  matches(granule, matcher) {
    const operators = ['>=', '<=']
    Object.keys(matcher || {}).forEach((prop) => {
      let value = matcher[prop]
      const granuleValue = granule[prop].split('T')[0]
      if (value && !granuleValue) { return false }
      let op = null
      operators.forEach((operator) => {
        if (value.indexOf(operator) === 0) {
          op = operator
          value = value.substring(operator.length)
          return true
        }
        return true
      })

      if ((op === '>=') && (granuleValue < value)) { return false }
      if ((op === '<=') && (granuleValue > value)) { return false }
      if (!op && (value !== granuleValue)) { return false }
      return true
    })
    return true
  }

  getTileUrl(tilePoint, granule) {
    if (!this.multiOptions) { return null }
    const date = granule.time_start != null ? granule.time_start.substring(0, 10) : undefined

    let matched = false
    this.multiOptions.forEach((optionSet) => {
      const newOptionSet = optionSet
      if (this.matches(granule, newOptionSet.match)) {
        let newResolution

        const oldResolution = newOptionSet.resolution

        // Set resolution to {projection}_resolution if it exists and if the layer exists within newOptionSet
        if ((this.projection === projections.geographic) && newOptionSet.geographic) {
          matched = true
          newResolution = newOptionSet.geographic_resolution
        } else if ((this.projection === projections.arctic) && newOptionSet.arctic) {
          matched = true
          newResolution = newOptionSet.arctic_resolution
        } else if ((this.projection === projections.antarctic) && newOptionSet.antarctic) {
          matched = true
          newResolution = newOptionSet.antarctic_resolution
        }

        // Use default resolution unless newResolution exists
        if (newResolution == null) { newResolution = oldResolution }
        newOptionSet.resolution = newResolution

        this.options = L.extend({}, this.originalOptions, newOptionSet)
      }
    })

    if (!matched) { return false }

    this.options.time = date
    if (this.options.granule) {
      this._originalUrl = this._originalUrl || this._url
      this._url = config.gibsGranuleUrl || this._originalUrl
      this.options.time = granule.time_start.replace(/\.\d{3}Z$/, 'Z')
    } else {
      this._url = this._originalUrl || this._url || config.gibsUrl
    }

    const data = {
      lprojection: getlprojection(this.options),
      x: tilePoint.x,
      y: tilePoint.y,
      z: tilePoint.z,
      time: this.options.time
    }

    if (this._map && !this._map.options.crs.infinite) {
      const invertedY = this._globalTileRange.max.y - (tilePoint.y)
      if (this.options.tms) {
        data.y = invertedY
      }
      data['-y'] = invertedY
    }

    return L.Util.template(this._url, L.Util.extend(data, this.options))
  }

  // Draw the granule tile
  drawTile(canvases, back, tilePoint) {
    const dpr = window.devicePixelRatio || 1
    const {
      imagery: imageryCanvas,
      outline: outlineCanvas
    } = canvases

    // If the devicePixelRatio is not 1, adjust the outline tile so pixelation of the borders is avoided.
    if (dpr !== 1) {
      const outlineCanvasCtx = outlineCanvas.getContext('2d')
      const currentWidth = outlineCanvas.width
      const currentHeight = outlineCanvas.height
      outlineCanvas.style.transform = `scale(${dpr / 4})`
      outlineCanvas.style.transformOrigin = 'top left'
      outlineCanvas.width = currentWidth * dpr
      outlineCanvas.height = currentHeight * dpr
      outlineCanvasCtx.scale(dpr, dpr)
    }

    let reverse

    if ((this.granules == null) || (this.granules.length <= 0)) return

    const tileSize = this.getTileSize()

    const layerPointToLatLng = this._map.layerPointToLatLng.bind(this._map)
    const nwPoint = this._getTilePos(tilePoint)

    const nePoint = nwPoint.add([tileSize.x, 0])
    const sePoint = nwPoint.add([tileSize.x, tileSize.y])
    const swPoint = nwPoint.add([0, tileSize.y])

    const boundary = { poly: [nwPoint, nePoint, sePoint, swPoint] }
    if (!isClockwise(boundary.poly)) { boundary.poly.reverse() }

    let bounds = new L.LatLngBounds(boundary.poly.map(layerPointToLatLng))
    bounds = bounds.pad(0.1)

    let paths = []
    const pathsWithHoles = []

    this.granules.forEach((granule, index) => {
      const visibleOverlappingGranulePaths = []
      const overlaps = this.granulePathsOverlappingTile(granule, bounds)

      if (overlaps.length > 0) {
        const url = this.getTileUrl(tilePoint, granule)

        for (let j = 0; j < overlaps.length; j += 1) {
          const path = overlaps[j]
          const existsInAddedGranules = this.addedGranuleIds.indexOf(granule.id) === -1
          const existsInRemovedGranules = this.removedGranuleIds.indexOf(granule.id) === -1

          // If on the project page, only want to show granules that are in the users current project.
          if (this.isProjectPage) {
            if (
              this.addedGranuleIds.length
              && existsInAddedGranules
            ) {
              break
            }

            if (
              this.removedGranuleIds.length
              && !existsInRemovedGranules
            ) {
              break
            }
          }

          path.index = index
          path.url = url
          path.granule = granule

          if (path.poly != null) {
            reverse = (j === 0) === isClockwise(path.poly)
            if (reverse) path.poly.reverse()
          }

          // If there are added granules, set deemphisized on the non-added granules.
          if (this.addedGranuleIds.length) {
            path.deemphisized = existsInAddedGranules
          }

          // If there are removed granules, set deemphisized on the removed granules.
          if (this.removedGranuleIds.length) {
            path.deemphisized = !existsInRemovedGranules
          }

          visibleOverlappingGranulePaths.push(path)
        }

        if (visibleOverlappingGranulePaths.length) {
          pathsWithHoles.push(visibleOverlappingGranulePaths)
          paths = paths.concat(visibleOverlappingGranulePaths)
        }
      }
    })

    // Draw the granule outlines.
    setTimeout((
      () => this.drawClippedPaths(outlineCanvas, boundary, pathsWithHoles, nwPoint)
    ), 0)
    setTimeout((
      () => this.drawOutlines(outlineCanvas, paths, nwPoint)
    ), 0)

    // Draw the granule imagery.
    setTimeout((
      () => this.drawClippedImagery(imageryCanvas, boundary, paths, nwPoint, tilePoint)
    ), 0)
    setTimeout((
      () => this.drawFullBackTile(back, boundary, pathsWithHoles.concat().reverse(), nwPoint)
    ), 0)

    if ((paths.length > 0) && config.debug) {
      console.log(`${paths.length} Overlapping Granules [(${bounds.getNorth()}, ${bounds.getWest()}), (${bounds.getSouth()}, ${bounds.getEast()})]`)
    }
  }

  // Draws an outline of the granule paths
  drawOutlines(canvas, paths, nwPoint) {
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(-nwPoint.x, -nwPoint.y)
    ctx.globalCompositeOperation = 'destination-over'

    paths.forEach((path) => {
      // Faint stroke of whole path
      ctx.strokeStyle = 'rgba(128, 128, 128, .2)'
      ctx.beginPath()
      addPath(ctx, path)
      ctx.stroke()
    })
    ctx.restore()
    return null
  }

  // Draws the granule paths
  drawClippedPaths(canvas, boundary, pathsWithHoles, nwPoint) {
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(-nwPoint.x, -nwPoint.y)

    pathsWithHoles.forEach((pathWithHoles) => {
      const [path, ...holes] = Array.from(pathWithHoles)

      ctx.beginPath()

      ctx.strokeStyle = this.color

      ctx.globalCompositeOperation = 'destination-over'

      if (path.deemphisized !== undefined && !this.isProjectPage) {
        ctx.strokeStyle = path.deemphisized ? this.lightColor : this.color
        ctx.lineWidth = path.deemphisized ? 1 : 1.5
      }

      addPath(ctx, path)

      holes.forEach((hole) => {
        if (hole.deemphisized !== undefined && !this.isProjectPage) {
          ctx.strokeStyle = hole.deemphisized ? this.lightColor : this.color
          ctx.lineWidth = hole.deemphisized ? 1 : 1.5
        }

        addPath(ctx, { poly: hole.poly.concat().reverse() })
      })

      ctx.stroke()
      addPath(ctx, boundary)

      if (!(path.line != null ? path.line.length : undefined) > 0) ctx.clip()
    })
    ctx.restore()
    return null
  }

  loadImage(url, callback, retries = 0) {
    if (url != null) {
      const image = new Image()
      image.onload = function onload() {
        callback(this)
        return document.body.removeChild(image)
      }

      image.onerror = () => {
        if (retries < MAX_RETRIES) {
          return this.loadImage(url, callback, retries + 1)
        }
        console.error(`Failed to load tile after ${MAX_RETRIES} tries: ${url}`)
        return callback(null)
      }

      // IE seems to like to get smart and occasionally not load images when they're
      // not in the DOM
      image.setAttribute('style', 'display: none;')
      document.body.appendChild(image)
      image.src = url
      return url
    }
    return callback(null)
  }

  drawClippedImage(ctx, boundary, paths, nwPoint, image, size) {
    if (image != null) {
      ctx.save()
      ctx.beginPath()

      paths.forEach((path) => {
        if (
          (path.deemphisized !== undefined && !path.deemphisized)
          || path.deemphisized === undefined
        ) {
          addPath(ctx, path)
        }
      })

      ctx.globalAlpha = 1

      // Clear out existing pixels so any transparent deemphisized tranparent granules
      // opacities do not stack up.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fill()

      // Draw the granule imagery.
      ctx.globalCompositeOperation = 'source-over'
      ctx.clip()
      ctx.drawImage(image, nwPoint.x, nwPoint.y, size, size)

      ctx.restore()
    }

    return null
  }

  drawClippedImageDeemphisized(ctx, boundary, paths, nwPoint, image, size) {
    if (image != null) {
      ctx.save()
      ctx.beginPath()

      paths.forEach((path) => {
        if (path.deemphisized !== undefined && path.deemphisized) addPath(ctx, path)
      })

      ctx.clip()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fill()
      ctx.globalAlpha = 0.5
      ctx.globalCompositeOperation = 'source-over'

      ctx.drawImage(image, nwPoint.x, nwPoint.y, size, size)

      ctx.globalAlpha = 1
      ctx.restore()
    }

    return null
  }

  // Draws the gibs imagery for the granule
  drawClippedImagery(canvas, boundary, paths, nwPoint) {
    const ctx = canvas.getContext('2d')

    ctx.save()
    ctx.translate(-nwPoint.x, -nwPoint.y)

    let url = null
    let currentPaths = []
    const pathsByUrl = []

    paths.forEach((path) => {
      if (path.url !== url) {
        // Draw everything in current
        if (currentPaths.length > 0) {
          pathsByUrl.push({ url, urlPaths: currentPaths })
        }
        ({ url } = path)
        currentPaths = [path]
      } else {
        currentPaths.push(path)
      }
    })

    if (currentPaths.length > 0) {
      pathsByUrl.push({ url, urlPaths: currentPaths })
    }

    const queue = []
    let index = 0

    const size = canvas.width
    const self = this
    for (let i = 0; i < pathsByUrl.length; i += 1) {
      const {
        url,
        urlPaths
      } = pathsByUrl[i]

      // eslint-disable-next-line no-loop-func
      self.loadImage(url, (image) => {
        queue[i] = () => {
          const paths = []
          const deemphisizedPaths = []

          urlPaths.forEach((path) => {
            if (path.deemphisized !== undefined && path.deemphisized) {
              deemphisizedPaths.push(path)
            } else {
              paths.push(path)
            }
          })

          // TODO: Figure out a way that we can prevent this from redrawing twice, every time a granule is loaded in.
          this.drawClippedImageDeemphisized(ctx, boundary, deemphisizedPaths, nwPoint, image, size)
          this.drawClippedImage(ctx, boundary, paths, nwPoint, image, size)
        }

        while (queue[index] != null) {
          queue[index]()
          queue[index] = null // Allow GC of image data
          index += 1
        }
        if (index === pathsByUrl.length) {
          return ctx.restore()
        }
        return null
      })
    }
    return null
  }

  drawFullBackTile(canvases, boundary, pathsWithHoles, nwPoint) {
    const { outline: outlineCanvas } = canvases

    const ctx = outlineCanvas.getContext('2d')

    ctx.save()
    ctx.translate(-nwPoint.x, -nwPoint.y)
    pathsWithHoles.forEach((pathWithHoles) => {
      const [path, ...holes] = Array.from(pathWithHoles)

      ctx.fillStyle = `#${(path.index + 0x1000000).toString(16).substr(-6)}`
      ctx.strokeStyle = ctx.fillStyle
      ctx.beginPath()
      addPath(ctx, path)

      holes.forEach(hole => addPath(ctx, hole))

      if (path.line != null) {
        ctx.lineWidth = 4
        ctx.stroke()
      } else {
        ctx.fill()
      }
    })
    ctx.restore()
    return null
  }

  addIntersections(result, paths, bounds, type, interpolation) {
    if (paths == null) { return null }

    paths.forEach((path) => {
      const shapeBounds = L.latLngBounds(path)
      if (shapeBounds.intersects(bounds)) {
        const intersection = {}
        intersection[type] = projectPath(this._map, path, interpolation, 2, 5)
        result.push(intersection)
      }
    })
    return null
  }

  // Determine what granule paths fit into a given tileBounds
  granulePathsOverlappingTile(granule, tileBounds) {
    const result = []

    const interpolation = isCartesian(granule) ? 'cartesian' : 'geodetic'

    Array.from(getPolygons(granule)).some((polygon) => {
      if (interpolation === 'cartesian') {
        this.addIntersections(result, polygon, tileBounds, 'poly', interpolation)
      } else {
        // Handle holes
        Array.from(polygon).forEach((shape) => {
          const { interiors } = dividePolygon(shape)
          this.addIntersections(result, interiors, tileBounds, 'poly', interpolation)
        })
      }
      // Workaround for EDSC-657
      // Avoid spamming the map with a large number of barely intersecting orbits by only
      // drawing the first orbit. Hovering will continue to draw the full orbit.
      return granule.orbit
    })

    this.addIntersections(result, getRectangles(granule), tileBounds, 'poly', 'cartesian')
    this.addIntersections(result, getLines(granule), tileBounds, 'line', interpolation)

    Array.from(getPoints(granule)).forEach((point) => {
      if (tileBounds.contains(point)) {
        result.push({ point: this._map.latLngToLayerPoint(point) })
      }
    })

    return result
  }

  // Is there are granule at a give point?
  granuleAt(point) {
    const origin = this._map.getPixelOrigin()
    const tileSize = this.getTileSize()
    const tilePoint = point.add(origin).divideBy(tileSize.x).floor()
    const {
      outline: outlineCanvas
    } = this.getBackTile(tilePoint)
    const bounds = this._tileCoordsToBounds(tilePoint)

    const tilePixel = point.subtract(this._map.latLngToLayerPoint(bounds.getNorthWest()))

    let result = null
    const ctx = outlineCanvas.getContext('2d')
    const { data } = ctx.getImageData(tilePixel.x, tilePixel.y, 1, 1)
    if (data[3] === 255) {
      // eslint-disable-next-line no-bitwise
      const index = (data[0] << 16) + (data[1] << 8) + data[2]
      result = this.granules != null ? this.granules[index] : undefined
    }

    return result
  }

  // Set the granule results that need to be drawn
  setResults(props) {
    const {
      metadata,
      granules,
      color,
      lightColor,
      defaultGranules,
      focusedGranule,
      collectionId,
      focusedCollection,
      addedGranuleIds = [],
      removedGranuleIds = [],
      isProjectPage
    } = props

    this.granules = granules
    this.addedGranuleIds = addedGranuleIds
    this.removedGranuleIds = removedGranuleIds
    this.isProjectPage = isProjectPage
    this.collectionId = collectionId
    this.focusedCollection = focusedCollection

    if (defaultGranules) {
      this.defaultGranules = defaultGranules

      if (focusedGranule === '') {
        this._onEdscStickygranule({ granule: null })
      } else {
        const [granule] = defaultGranules.filter(g => g.id === focusedGranule)
        this._onEdscStickygranule({ granule })
      }
    }

    if (color) this.color = color
    if (lightColor) this.lightColor = lightColor

    if (metadata) {
      // Set multiOptions (gibs data)
      const { tags } = metadata

      if (tags) {
        // TODO: Use getTagValue below.
        const gibsTag = tags[tagName('gibs')] || {}
        const { data } = gibsTag

        this.multiOptions = data
      }
    }

    if (collectionId && this._container) {
      this._container.setAttribute('id', `granule-vis-${collectionId}`)
      this.setFocus(collectionId)
    }

    return this.redraw()
  }

  _reorderedResults(results, defaultResults) {
    if (this._stickied && this._stickied !== null) {
      const newResults = results.concat()
      const index = newResults.indexOf(this._stickied)
      if (index === -1) {
        this._stickied = null
        this.stickyId = null
        if (this._granuleStickyLayer != null) {
          this._granuleStickyLayer.onRemove(this._map)
        }
        this._granuleStickyLayer = null
      } else {
        newResults.splice(index, 1)
        newResults.unshift(this._stickied)
      }
      return newResults
    }
    return defaultResults
  }

  loadResults(results) {
    const granules = this._reorderedResults(
      results,
      Object.values(this.defaultGranules)
    )

    const {
      color,
      lightColor,
      focusedCollection,
      focusedGranule,
      collectionId,
      addedGranuleIds,
      removedGranuleIds,
      isProjectPage
    } = this

    return this.setResults({
      color,
      lightColor,
      focusedCollection,
      focusedGranule,
      collectionId,
      granules,
      addedGranuleIds,
      removedGranuleIds,
      isProjectPage
    })
  }

  setFocus(focus, map = this._map) {
    if (this._isFocused === focus) { return }
    this._isFocused = focus
    const events = ['map.mousemove', 'map.mouseout', 'click', `map.layer.${this.collectionId}.focusgranule`, `map.layer.${this.collectionId}.stickygranule`]
    if (focus) {
      this._handle(map, 'on', ...Array.from(events))
    }
    this._handle(map, 'off', ...Array.from(events))
    if (this._granuleFocusLayer != null) {
      this._granuleFocusLayer.onRemove(map)
    }
    this._granuleFocusLayer = null
    if (this._granuleStickyLayer != null) {
      this._granuleStickyLayer.onRemove(map)
    }
    this._granuleStickyLayer = null
  }

  _handle(obj, onOrOff, ...events) {
    return (() => {
      const result = []
      events.forEach((event) => {
        const method = `_on${event.split('.').map(str => capitalize(str)).join('')}`
        result.push(obj[onOrOff](event, this[method]))
      })
      return result
    })()
  }

  _onEdscFocuscollection(e) {
    if (this._map) {
      this.setFocus(
        (e.collection != null ? e.collection.id : undefined) === this.collectionId
      )
    }
  }

  _onEdscMouseout() {
    if (this._map) {
      if (this._granule != null) {
        eventEmitter.emit(`map.layer.${this.collectionId}.focusgranule`, { granule: null })
      }
    }
  }

  _onEdscMousemove(e) {
    if (this._map) {
      const granule = this.granuleAt(e.layerPoint)
      if (this._granule !== granule) {
        eventEmitter.emit(`map.layer.${this.collectionId}.focusgranule`, { granule })
      }
    }
  }

  _onClick(e) {
    if (this._map) {
      const tag = $(e.originalEvent.target).closest('a, button')

      if (tag.hasClass('panel-list-remove')) {
        const granuleId = tag.data('granuleId')
        eventEmitter.emit('map.excludestickygranule', granuleId)
        return
      }

      // If the element that triggered the event is an `a` or `button` and is also inside
      // the leaflet map, prevent the clearing of the focused granule.
      if (tag.length !== 0 && tag.parents('.map.leaflet-container').length > 0) return

      let granule = this.granuleAt(e.layerPoint)

      if (this._stickied === granule) granule = null

      if (this.collectionId === this.focusedCollection) {
        eventEmitter.emit(`map.layer.${this.collectionId}.focusgranule`, { granule })
        eventEmitter.emit(`map.layer.${this.collectionId}.stickygranule`, { granule })
      }
    }
  }

  _onEdscFocusgranule(e) {
    if (this._map) {
      const { granule } = e
      this._granule = granule

      if (this._granuleFocusLayer != null) {
        this._granuleFocusLayer.onRemove(this._map)
      }
      this._granuleFocusLayer = this._focusLayer(granule, false)
      if (this._granuleFocusLayer != null && this.collectionId === this.focusedCollection) {
        this._granuleFocusLayer.onAdd(this._map)
      }
    }
  }

  _onEdscStickygranule(e) {
    if (this._map) {
      const { _layers: mapLayers } = this._map

      // Clear out all existing sticky granules from collections.
      Object.values(mapLayers).forEach((layer) => {
        if (layer.collectionId && layer._granuleStickyLayer) {
          layer._granuleStickyLayer.onRemove(this._map)
        }
      })

      const { granule } = e

      if (this._stickied === granule) { return }

      this._stickied = granule
      this.stickyId = granule != null ? granule.id : undefined // Ugly hack for testing

      let focusedGranuleId = ''
      if (granule != null) focusedGranuleId = granule.id

      this.onChangeFocusedGranule(focusedGranuleId)

      this._granuleStickyLayer = this._stickyLayer(granule, true)

      if (this._granuleStickyLayer != null) {
        this.onMetricsMap('Selected Granule')

        this._granuleStickyLayer.onAdd(this._map)

        if ((this.projection === projections.geographic) && (this._granuleFocusLayer != null)) {
          const bounds = this._granuleFocusLayer.getBounds()
          // Avoid zooming and panning tiny amounts
          if (
            (bounds != null ? bounds.isValid() : undefined)
            && !this._map.getBounds().contains(bounds)
          ) {
            panBoundsToCenter(this._map, bounds)
          }
        }
      }

      this.loadResults(this.granules)
    }
  }

  _onExcludeGranule(granuleId) {
    this.onExcludeGranule({
      collectionId: this.collectionId,
      granuleId
    })
  }

  _granuleLayer(granule, options) {
    return buildLayer(options, granule)
  }

  _focusLayer(granule) {
    if (granule == null) { return null }
    return buildLayer({
      clickable: false, color: this.color, fillColor: this.color, opacity: 1
    }, granule)
  }

  _stickyLayer(granule) {
    let temporalLabel
    if (granule == null) { return null }

    const layer = buildLayer({
      fillOpacity: 0,
      clickable: false,
      color: this.color,
      fillColor: this.color,
      opacity: 1
    }, granule)

    const temporal = getTemporal(granule.time_start, granule.time_end)

    if (temporal[0] && temporal[1]) {
      temporalLabel = `<p>${temporal[0]}</p><p>${temporal[1]}</p>`
    } else if (temporal[0]) {
      temporalLabel = `<p>${temporal[0]}</p>`
    } else if (temporal[1]) {
      temporalLabel = `<p>${temporal[1]}</p>`
    }

    const { id: granuleId } = granule

    let excludeHtml = ''
    excludeHtml = `<a class="panel-list-remove" data-granule-id="${granuleId}" href="#" title="Remove granule"><span class="fa-stack"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-times fa-stack-1x fa-inverse"></i></span></a>`
    const icon = new L.DivIcon({
      className: 'granule-spatial-label',
      html: `<span class="granule-spatial-label-temporal">${temporalLabel}</span>${excludeHtml}`
    })


    const marker = L.marker([0, 0], { clickable: false, icon })
    layer.addLayer(marker)

    let firstShape = layer.getLayers()[0]
    if ((firstShape != null ? firstShape._interiors : undefined) != null) {
      firstShape = firstShape._interiors
    }

    if (firstShape != null) {
      firstShape.on('add', function add() {
        const center = (this.getLatLng != null) ? this.getLatLng() : this.getCenter()
        return marker.setLatLng(center)
      })
    }

    return layer
  }
}

export class GranuleGridLayer extends MapLayer {
  /**
   * Get the data needed to create a new GranuleGridLayerExtended layer
   * @param {object} props
   * @returns {array} Array of layer data objects
   */
  getLayerData(props) {
    const {
      collectionsMetadata,
      focusedCollection,
      isProjectPage,
      project
    } = props

    const layers = {}

    if (isProjectPage) {
      // If we are on the project page, return data for each project collection
      const { collections: projectCollections } = project
      const { allIds: projectIds } = projectCollections

      projectIds.forEach((collectionId, index) => {
        const { [collectionId]: iterationCollection = {} } = collectionsMetadata
        const {
          granules: collectionGranules,
          isVisible,
          metadata
        } = iterationCollection

        if (!collectionGranules) return

        layers[collectionId] = {
          collectionId,
          color: getColorByIndex(index),
          lightColor: getColorByIndex(index, true),
          metadata,
          isVisible,
          granules: collectionGranules
        }
      })
    } else if (focusedCollection && focusedCollection !== '') {
      // If we aren't on the project page, return data for focusedCollection if it exists
      const { [focusedCollection]: focusedCollectionMetadata = {} } = collectionsMetadata

      layers[focusedCollection] = {
        collectionId: focusedCollection,
        color: getColorByIndex(0),
        lightColor: getColorByIndex(0, true),
        isVisible: true,
        focusedCollectionMetadata,
        granules: {}
      }
    }

    return layers
  }

  /**
   * Create a feature group of GranuleGridLayerExtended layers.
   * @param {object} props
   */
  createLeafletElement(props) {
    const { layers = [] } = this

    const {
      focusedCollection,
      focusedGranule,
      projection,
      project,
      onChangeFocusedGranule,
      onExcludeGranule,
      onMetricsMap,
      isProjectPage
    } = props

    // Create a GranuleGridLayerExtended layer from each data object in getLayerData
    const layerData = this.getLayerData(props)

    Object.keys(layerData).forEach((id) => {
      const {
        collectionId,
        color,
        metadata,
        granules = {}
      } = layerData[id]

      const { byId = {} } = granules
      const granuleData = Object.values(byId)

      const layer = new GranuleGridLayerExtended({
        collectionId,
        metadata,
        granules: granuleData,
        color,
        focusedCollection,
        focusedGranule,
        project,
        projection,
        onChangeFocusedGranule,
        onExcludeGranule,
        onMetricsMap,
        isProjectPage
      })

      // Set the ZIndex for the layer
      if (focusedCollection === collectionId) {
        layer.setZIndex(2)
      } else {
        layer.setZIndex(1)
      }

      layers.push(layer)
    })

    // Save the list of layers and create a feature group for the layers
    const featureGroup = new L.FeatureGroup(layers)
    return featureGroup
  }

  /**
   * Handles updating the granules in each GranuleGridLayerExtended layer on the map
   * @param {object} fromProps
   * @param {obect} toProps
   */
  updateLeafletElement(fromProps, toProps) {
    const layers = this.leafletElement._layers // List of layers

    const {
      focusedCollection,
      focusedGranule,
      projection,
      project,
      isProjectPage,
      onChangeFocusedGranule,
      onExcludeGranule,
      onMetricsMap
    } = toProps

    this.isProjectPage = isProjectPage

    const {
      focusedGranule: oldFocusedGranule,
      focusedCollection: oldFocusedCollection,
      isProjectPage: oldIsProjectPage
    } = fromProps

    const oldLayerData = this.getLayerData(fromProps)
    const layerData = this.getLayerData(toProps)

    const layerDataCollectionIds = Object.keys(layerData)

    // Nothing should be drawn, remove any existing layers
    if (layerDataCollectionIds.length === 0) {
      Object.values(layers).forEach(layer => this.leafletElement.removeLayer(layer))
    } else if (layerDataCollectionIds.length < Object.keys(oldLayerData).length) {
      // If there is less data than before, figure out which collection was removed and remove the layer

      const oldIds = Object.keys(oldLayerData)
      const diffIds = difference(oldIds, layerDataCollectionIds)

      diffIds.forEach((collectionId) => {
        Object.values(layers).forEach((layer) => {
          if (layer.collectionId === collectionId) {
            this.leafletElement.removeLayer(layer)
          }
        })
      })
    }

    // Loop through each layer data object to update the layer
    layerDataCollectionIds.forEach((id) => {
      const {
        collectionId,
        color,
        lightColor,
        metadata,
        isVisible,
        granules = {}
      } = layerData[id]

      const { project: fromPropsProject } = fromProps
      const { collections: fromPropsProjectCollections = {} } = fromPropsProject
      const { byId: fromPropsProjectCollectionsById = {} } = fromPropsProjectCollections
      const { [collectionId]: oldProjectCollection = {} } = fromPropsProjectCollectionsById

      const { collections: projectCollections = {} } = project
      const { byId: projectCollectionsById = {} } = projectCollections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById

      let oldAddedGranuleIds
      let oldRemovedGranuleIds
      let addedGranuleIds
      let removedGranuleIds

      if (oldProjectCollection) {
        ({
          addedGranuleIds: oldAddedGranuleIds,
          removedGranuleIds: oldRemovedGranuleIds
        } = oldProjectCollection)
      }

      if (projectCollection) {
        ({
          addedGranuleIds,
          removedGranuleIds
        } = projectCollection)
      }

      // If there are no granules, bail out
      const { byId: granulesById = {} } = granules
      if (Object.keys(granulesById).length === 0) return

      // If no granules were changed, bail out
      const oldCollection = oldLayerData[collectionId]
      const { granules: oldGranules = {} } = oldCollection || {}
      const { byId: oldGranulesById = {} } = oldGranules

      if (
        oldCollection
        && oldIsProjectPage !== isProjectPage
        && oldFocusedCollection !== focusedCollection
        && oldFocusedGranule !== focusedGranule
        && isEqual(Object.keys(granulesById), Object.keys(oldGranulesById))
        && isEqual(addedGranuleIds, oldAddedGranuleIds)
        && isEqual(removedGranuleIds, oldRemovedGranuleIds)
      ) return

      // If the collecton is not visible, set the granuleData to an empty array
      const granuleData = isVisible ? Object.values(granulesById) : []

      // Find the layer for this collection
      const [layer] = Object.values(layers).filter(l => l.collectionId === collectionId)

      this.addedGranuleIds = addedGranuleIds
      this.removedGranuleIds = removedGranuleIds

      if (layer) {
        const {
          isVisible: oldIsVisible
        } = oldCollection

        // If the granules and the visibility haven't changed, bail out
        if (
          oldGranules === granules
          && oldIsVisible === isVisible
          && oldFocusedCollection === focusedCollection
          && isEqual(addedGranuleIds, oldAddedGranuleIds)
          && isEqual(removedGranuleIds, oldRemovedGranuleIds)
        ) return

        // Update the layer with the new granuleData
        layer.setResults({
          addedGranuleIds,
          collectionId,
          color,
          defaultGranules: granuleData,
          focusedCollection,
          focusedGranule,
          granules: granuleData,
          isProjectPage,
          lightColor,
          metadata,
          projectCollection,
          removedGranuleIds
        })

        if (focusedCollection === collectionId) {
          layer.setZIndex(layerBuffer + 2)
        } else {
          layer.setZIndex(layerBuffer + 1)
        }
      } else {
        // A layer doesn't exist for this collection yet, maybe we just added a focusedCollection, so create a new layer
        const layer = new GranuleGridLayerExtended({
          addedGranuleIds,
          collectionId,
          color,
          focusedCollection,
          focusedGranule,
          granules: granuleData,
          isProjectPage,
          lightColor,
          metadata,
          onChangeFocusedGranule,
          onExcludeGranule,
          onMetricsMap,
          project,
          projection,
          removedGranuleIds
        })

        if (focusedCollection === collectionId) {
          layer.setZIndex(layerBuffer + 2)
        } else {
          layer.setZIndex(layerBuffer + 1)
        }

        layer.getLayerData = this.getLayerData

        // Add the layer to the feature group
        layer.addTo(this.leafletElement)
      }
    })
  }
}

export default withLeaflet(GranuleGridLayer)
