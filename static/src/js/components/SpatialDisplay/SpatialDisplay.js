import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { isEqual } from 'lodash'

import {
  Col,
  Form,
  Row,
  Spinner
} from 'react-bootstrap'

import { availableSystems } from '../../util/grid'

import FilterStackItem from '../FilterStack/FilterStackItem'
import FilterStackContents from '../FilterStack/FilterStackContents'
import SpatialDisplayEntry from './SpatialDisplayEntry'
import { eventEmitter } from '../../events/events'
import pluralize from '../../util/pluralize'
import { getApplicationConfig } from '../../../../../sharedUtils/config'

import './SpatialDisplay.scss'

const { defaultSpatialDecimalSize } = getApplicationConfig()

class SpatialDisplay extends Component {
  constructor(props) {
    super(props)

    this.state = {
      error: '',
      boundingBoxSearch: '',
      circleSearch: '',
      lineSearch: '',
      gridName: '',
      manuallyEntering: false,
      pointSearch: '',
      polygonSearch: '',
      shapefile: {}
    }

    this.onChangeGridType = this.onChangeGridType.bind(this)
    this.onGridRemove = this.onGridRemove.bind(this)
    this.onSpatialRemove = this.onSpatialRemove.bind(this)
    this.onChangePointSearch = this.onChangePointSearch.bind(this)
    this.onSubmitPointSearch = this.onSubmitPointSearch.bind(this)
    this.onChangeBoundingBoxSearch = this.onChangeBoundingBoxSearch.bind(this)
    this.onSubmitBoundingBoxSearch = this.onSubmitBoundingBoxSearch.bind(this)
    this.onChangeCircleCenter = this.onChangeCircleCenter.bind(this)
    this.onChangeCircleRadius = this.onChangeCircleRadius.bind(this)
    this.onSubmitCircleSearch = this.onSubmitCircleSearch.bind(this)
    this.onFocusSpatialSearch = this.onFocusSpatialSearch.bind(this)
  }

  componentDidMount() {
    const {
      boundingBoxSearch,
      circleSearch,
      gridName,
      pointSearch,
      polygonSearch,
      shapefile
    } = this.props

    this.setState({
      error: '',
      boundingBoxSearch: this.transformBoundingBoxCoordinates(boundingBoxSearch),
      circleSearch: this.transformCircleCoordinates(circleSearch),
      gridName,
      pointSearch,
      polygonSearch,
      shapefile
    })
  }

  componentWillReceiveProps(nextProps) {
    const {
      boundingBoxSearch,
      circleSearch,
      lineSearch,
      gridName,
      pointSearch,
      polygonSearch,
      shapefile
    } = this.props

    let shouldUpdateState = false

    const state = {
      error: ''
    }

    if (pointSearch !== nextProps.pointSearch) {
      shouldUpdateState = true

      state.pointSearch = nextProps.pointSearch
      state.error = this.validateCoordinate(
        this.transformSingleCoordinate(nextProps.pointSearch)
      )
    }

    if (boundingBoxSearch !== nextProps.boundingBoxSearch) {
      shouldUpdateState = true

      const points = this.transformBoundingBoxCoordinates(nextProps.boundingBoxSearch)

      state.boundingBoxSearch = points

      if (points.filter(Boolean).length > 0) {
        points.forEach((point) => {
          state.error = this.validateCoordinate(point)
        })
      }
    }

    if (polygonSearch !== nextProps.polygonSearch) {
      shouldUpdateState = true

      state.polygonSearch = nextProps.polygonSearch
    }

    if (lineSearch !== nextProps.lineSearch) {
      shouldUpdateState = true

      state.lineSearch = nextProps.lineSearch
    }

    if (circleSearch !== nextProps.circleSearch) {
      shouldUpdateState = true

      const points = this.transformCircleCoordinates(nextProps.circleSearch)
      state.circleSearch = points
    }

    if (gridName !== nextProps.gridName) {
      shouldUpdateState = true

      state.gridName = nextProps.gridName
    }

    if (!isEqual(shapefile, nextProps.shapefile)) {
      shouldUpdateState = true

      state.shapefile = nextProps.shapefile
    }

    // Only update the state if a prop we care about was provided and updated
    if (shouldUpdateState) this.setState(state)
  }

  onChangeGridType(e) {
    const { onChangeQuery } = this.props
    onChangeQuery({
      collection: {
        gridName: e.target.value
      }
    })
    e.preventDefault()
  }

  onGridRemove() {
    const {
      onRemoveGridFilter
    } = this.props

    onRemoveGridFilter()
  }

  onSpatialRemove() {
    const {
      onRemoveSpatialFilter
    } = this.props

    this.setState({
      manuallyEntering: false
    })

    onRemoveSpatialFilter()
  }

  onChangePointSearch(e) {
    const { value = '' } = e.target

    if (this.isValidDecimalLatLng(value)) {
      this.setState({
        pointSearch: this.transformSingleCoordinate(value),
        error: this.validateCoordinate(value)
      })
    }
  }

  onSubmitPointSearch(e) {
    if (e.type === 'blur' || e.key === 'Enter') {
      eventEmitter.emit('map.drawCancel')

      const { pointSearch, error } = this.state
      const { onChangeQuery } = this.props

      if (error === '') {
        this.setState({
          manuallyEntering: false
        })

        onChangeQuery({
          collection: {
            spatial: {
              point: pointSearch.replace(/\s/g, '')
            }
          }
        })
      }
    }

    e.preventDefault()
  }

  onChangeBoundingBoxSearch(e) {
    const { boundingBoxSearch } = this.state
    const [swPoint, nePoint] = boundingBoxSearch

    const {
      name,
      value = ''
    } = e.target

    let newSearch

    if (name === 'swPoint') {
      newSearch = [value, nePoint]
    }

    if (name === 'nePoint') {
      newSearch = [swPoint, value]
    }

    if (this.isValidDecimalLatLng(value)) {
      this.setState({
        boundingBoxSearch: newSearch,
        error: this.validateCoordinate(value)
      })
    }
  }

  onFocusSpatialSearch(spatialType) {
    this.setState({
      manuallyEntering: spatialType
    })
  }

  onSubmitBoundingBoxSearch(e) {
    if (e.type === 'blur' || e.key === 'Enter') {
      const { boundingBoxSearch, error } = this.state
      const { onChangeQuery } = this.props

      if (boundingBoxSearch[0] && boundingBoxSearch[1]) {
        eventEmitter.emit('map.drawCancel')

        if (error === '') {
          this.setState({
            manuallyEntering: false
          })

          onChangeQuery({
            collection: {
              spatial: {
                boundingBox: this.transformBoundingBoxCoordinates(boundingBoxSearch.join(',')).join(',')
              }
            }
          })
        }
      }
    }

    e.preventDefault()
  }

  onChangeCircleCenter(e) {
    const { circleSearch } = this.state
    const [, radius] = circleSearch

    const { value = '' } = e.target

    if (this.isValidDecimalLatLng(value)) {
      const newSearch = [value, radius]

      this.setState({
        circleSearch: newSearch,
        error: this.validateCircleCoordinates(newSearch)
      })
    }
  }

  onChangeCircleRadius(e) {
    const { circleSearch } = this.state
    const [center] = circleSearch

    const { value = '' } = e.target

    if (this.isValidRadius(value)) {
      const newSearch = [center, value]

      this.setState({
        circleSearch: newSearch,
        error: this.validateCircleCoordinates(newSearch)
      })
    }
  }

  onSubmitCircleSearch(e) {
    if (e.type === 'blur' || e.key === 'Enter') {
      const { circleSearch, error } = this.state
      const [center, radius] = circleSearch
      const { onChangeQuery } = this.props

      if (center && radius) {
        eventEmitter.emit('map.drawCancel')

        if (error === '') {
          this.setState({
            manuallyEntering: false
          })

          onChangeQuery({
            collection: {
              spatial: {
                circle: [this.transformCircleCoordinates(circleSearch.join(','))].join(',')
              }
            }
          })
        }
      }
    }

    e.preventDefault()
  }

  /**
   * Validates a Lat/Lng is limited to a configured number of decimal places
   * @param {String} latLng
   */
  isValidDecimalLatLng(latLng) {
    const regex = new RegExp(`^-?\\d*\\.?\\d{0,${defaultSpatialDecimalSize}},?-?\\d*\\.?\\d{0,${defaultSpatialDecimalSize}}$`)

    return !!(latLng.match(regex))
  }

  /**
   * Validates a radius is limited to an integer
   * @param {String} value
   */
  isValidRadius(value) {
    const regex = /^\d*$/

    return !!(value.match(regex))
  }

  /**
   * Validate the provided point setting any errors to the component state
   * @param {String} coordinates Value provided by an input field containing a single point of 'lat,lon'
   */
  validateCoordinate(coordinates) {
    if (coordinates === '') return ''

    let errorMessage = ''

    const validCoordinates = coordinates.trim().match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)
    if (validCoordinates == null) {
      errorMessage = `Coordinates (${coordinates}) must use 'lat,lon' format with up to ${defaultSpatialDecimalSize} decimal place(s)`
    }

    if (validCoordinates) {
      // Ignores the first match which will be the entire result, the second two values are
      // the groups we're looking for
      const [, lat, lon] = validCoordinates

      if (lat < -90 || lat > 90) {
        errorMessage = `Lattitude (${lat}) must be between -90 and 90.`
      }

      if (lon < -180 || lon > 180) {
        errorMessage = `Longitude (${lon}) must be between -180 and 180.`
      }
    }

    return errorMessage
  }

  /**
   * Validate the provided center point of a circle
   * @param {Array} circle Array with [point, radius] values
   */
  validateCircleCoordinates(circle) {
    const [center] = circle
    return this.validateCoordinate(center)
  }

  /**
   * Turns '1,2' into '2,1' for leaflet
   * @param {String} coordinateString A single coordinate representing a point on a map
   */
  transformSingleCoordinate(coordinateString) {
    return coordinateString.split(',').reverse().join(',').replace(/\s/g, '')
  }

  /**
   * Turns '1,2,3,4' into ['2,1', '4,3'] for leaflet
   * @param {String} boundingBoxCoordinates A set of two points representing a bounding box
   */
  transformBoundingBoxCoordinates(boundingBoxCoordinates) {
    // Returns empty strings by default as input fields cannot be set to undefined
    return boundingBoxCoordinates
      ? boundingBoxCoordinates
        .match(/[^,]+,[^,]+/g)
        .map(pointStr => this.transformSingleCoordinate(pointStr))
      : ['', '']
  }

  /**
   * Turns '1,2,3' into '2,1,3' for leaflet
   * @param {String} circleCoordinates A center point and radius
   */
  transformCircleCoordinates(circleCoordinates) {
    const points = circleCoordinates.split(',')

    const [
      lat = '',
      lng = '',
      radius = ''
    ] = points

    if (lat && lng) {
      const coordinate = [lat, lng]
      return [this.transformSingleCoordinate(coordinate.join(',')), radius]
    }

    return ['', '', '']
  }

  render() {
    const {
      displaySpatialPolygonWarning,
      drawingNewLayer,
      selectingNewGrid
    } = this.props

    const {
      error,
      boundingBoxSearch,
      circleSearch,
      lineSearch,
      gridName,
      manuallyEntering,
      pointSearch,
      polygonSearch,
      shapefile
    } = this.state

    const contents = []
    const items = []

    let entry
    let secondaryTitle = ''
    let spatialError = error

    const {
      isErrored: shapefileError,
      isLoading: shapefileLoading,
      isLoaded: shapefileLoaded,
      shapefileName,
      shapefileId,
      shapefileSize
    } = shapefile

    if (selectingNewGrid || gridName) {
      const entry = (
        <SpatialDisplayEntry>
          <Form.Row className="spatial-display__form-row">
            <Form.Group className="spatial-display__form-group spatial-display__form-group--system">
              <Form.Label srOnly>
                Coordinate System
              </Form.Label>
              <Form.Control
                as="select"
                onChange={this.onChangeGridType}
                size="sm"
                value={gridName}
              >
                <option value="">Coordinate System...</option>
                {
                  availableSystems.map(system => (
                    <option
                      key={system.name}
                      value={system.name}
                    >
                      {system.label}
                    </option>
                  ))
                }
              </Form.Control>
            </Form.Group>
          </Form.Row>
        </SpatialDisplayEntry>
      )
      const gridContents = (
        <FilterStackContents
          key="filter__grid"
          body={entry}
          title="Grid"
        />
      )

      items.push((
        <FilterStackItem
          key="item__grid"
          icon="edsc-globe"
          title="Grid"
          hint="Apply grid coordinates in Granule Filters"
          onRemove={this.onGridRemove}
        >
          {gridContents}
        </FilterStackItem>
      ))
    }

    let hint = ''

    if ((pointSearch && !drawingNewLayer) || drawingNewLayer === 'marker' || manuallyEntering === 'marker') {
      entry = (
        <SpatialDisplayEntry>
          <Form.Row className="spatial-display__form-row">
            <Form.Group as={Row} className="spatial-display__form-group spatial-display__form-group--coords">
              <Form.Label srOnly>
                Coordinates:
              </Form.Label>
              <Col
                className="spatial-display__form-column"
              >
                <Form.Control
                  className="spatial-display__text-input"
                  type="text"
                  placeholder="lat, lon (e.g. 44.2, 130)"
                  sm="auto"
                  size="sm"
                  value={this.transformSingleCoordinate(pointSearch)}
                  onChange={this.onChangePointSearch}
                  onBlur={this.onSubmitPointSearch}
                  onKeyUp={this.onSubmitPointSearch}
                  onFocus={() => this.onFocusSpatialSearch('marker')}
                />
              </Col>
            </Form.Group>
          </Form.Row>
        </SpatialDisplayEntry>
      )

      secondaryTitle = 'Point'

      contents.push((
        <FilterStackContents
          key="filter__point"
          body={entry}
          title="Point"
        />
      ))
    } else if ((boundingBoxSearch && (boundingBoxSearch[0] || boundingBoxSearch[1]) && !drawingNewLayer) || drawingNewLayer === 'rectangle' || manuallyEntering === 'rectangle') {
      entry = (
        <SpatialDisplayEntry>
          <Form.Row className="spatial-display__form-row">
            <Form.Group as={Row} className="spatial-display__form-group spatial-display__form-group--coords">
              <Form.Label
                className="spatial-display__form-label"
                column
                sm="auto"
              >
                SW:
              </Form.Label>
              <Col className="spatial-display__form-column">
                <Form.Control
                  className="spatial-display__text-input"
                  sm="auto"
                  type="text"
                  placeholder="lat, lon (e.g. 44.2, 130)"
                  size="sm"
                  name="swPoint"
                  value={boundingBoxSearch[0]}
                  onChange={this.onChangeBoundingBoxSearch}
                  onBlur={this.onSubmitBoundingBoxSearch}
                  onKeyUp={this.onSubmitBoundingBoxSearch}
                  onFocus={() => this.onFocusSpatialSearch('rectangle')}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="spatial-display__form-group spatial-display__form-group--coords">
              <Form.Label
                className="spatial-display__form-label"
                column
                sm="auto"
              >
                NE:
              </Form.Label>
              <Col className="spatial-display__form-column">
                <Form.Control
                  className="spatial-display__text-input"
                  sm="auto"
                  type="text"
                  placeholder="lat, lon (e.g. 50, 133.24)"
                  size="sm"
                  name="nePoint"
                  value={boundingBoxSearch[1]}
                  onChange={this.onChangeBoundingBoxSearch}
                  onBlur={this.onSubmitBoundingBoxSearch}
                  onKeyUp={this.onSubmitBoundingBoxSearch}
                  onFocus={() => this.onFocusSpatialSearch('rectangle')}
                />
              </Col>
            </Form.Group>
          </Form.Row>
        </SpatialDisplayEntry>
      )

      secondaryTitle = 'Rectangle'

      contents.push((
        <FilterStackContents
          key="filter__rectangle"
          body={entry}
          title="Rectangle"
          variant="block"
        />
      ))
    } else if ((circleSearch && (circleSearch[0] || circleSearch[1]) && !drawingNewLayer) || drawingNewLayer === 'circle' || manuallyEntering === 'circle') {
      entry = (
        <SpatialDisplayEntry>
          <Form.Row className="spatial-display__form-row">
            <Form.Group as={Row} className="spatial-display__form-group spatial-display__form-group--coords">
              <Form.Label
                className="spatial-display__form-label"
                column
                sm="auto"
              >
                Center:
              </Form.Label>
              <Col className="spatial-display__form-column">
                <Form.Control
                  className="spatial-display__text-input"
                  sm="auto"
                  type="text"
                  placeholder="lat, lon (e.g. 44.2, 130)"
                  size="sm"
                  name="center"
                  value={circleSearch[0]}
                  onChange={this.onChangeCircleCenter}
                  onBlur={this.onSubmitCircleSearch}
                  onKeyUp={this.onSubmitCircleSearch}
                  onFocus={() => this.onFocusSpatialSearch('circle')}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="spatial-display__form-group spatial-display__form-group--coords">
              <Form.Label
                className="spatial-display__form-label"
                column
                sm="auto"
              >
                Radius (m):
              </Form.Label>
              <Col className="spatial-display__form-column">
                <Form.Control
                  className="spatial-display__text-input"
                  sm="auto"
                  type="text"
                  placeholder="meters (e.g. 200)"
                  size="sm"
                  name="radius"
                  value={circleSearch[1]}
                  onChange={this.onChangeCircleRadius}
                  onBlur={this.onSubmitCircleSearch}
                  onKeyUp={this.onSubmitCircleSearch}
                  onFocus={() => this.onFocusSpatialSearch('circle')}
                />
              </Col>
            </Form.Group>
          </Form.Row>
        </SpatialDisplayEntry>
      )

      secondaryTitle = 'Circle'

      contents.push((
        <FilterStackContents
          key="filter__circle"
          body={entry}
          title="Circle"
          variant="block"
        />
      ))
    } else if (((shapefileError || shapefileLoading || shapefileLoaded || shapefileId)
      && !drawingNewLayer)
      || drawingNewLayer === 'shapefile') {
      // if (shapefile data or error exists and not currently drawing a new layer) or (the drawingNewLayer === 'shapefile')
      // render the shapefile display
      entry = (
        <SpatialDisplayEntry>
          <Row className="spatial-display__form-row">
            {
              shapefileName && (
                <>
                  <span className="spatial-display__text-primary">{shapefileName}</span>
                  {
                    shapefileSize && (
                      <span className="spatial-display__text-secondary">{`(${shapefileSize})`}</span>
                    )
                  }
                  {
                    shapefileLoading && (
                      <span className="spatial-display__loading">
                        <Spinner
                          className="spatial-display__loading-icon"
                          animation="border"
                          variant="light"
                          size="sm"
                        />
                        Loading...
                      </span>
                    )
                  }
                </>
              )
            }
          </Row>
        </SpatialDisplayEntry>
      )

      if (shapefileError) {
        const { type } = shapefileError

        if (type === 'upload_shape') {
          spatialError = 'To use a shapefile, please upload a zip file that includes its .shp, .shx, and .dbf files.'
        }
      }

      secondaryTitle = 'Shape File'

      contents.push((
        <FilterStackContents
          key="filter__shapefile"
          body={entry}
          title="Shape File"
        />
      ))
    } else if ((polygonSearch && !drawingNewLayer) || drawingNewLayer === 'polygon') {
      const pointArray = polygonSearch.split(',')
      const pointCount = (pointArray.length / 2) - 1

      entry = (
        <SpatialDisplayEntry>
          {
            pointCount > 2 && (
              <Row className="spatial-display__form-row">
                <span className="spatial-display__text-primary">{`${pointCount} ${pluralize('Point', pointCount)}`}</span>
              </Row>
            )
          }
        </SpatialDisplayEntry>
      )

      if (pointArray.length < 2) {
        hint = 'Draw a polygon on the map to filter results'
      }

      secondaryTitle = 'Polygon'

      if (displaySpatialPolygonWarning) {
        spatialError = 'This collection does not support polygon search. Your polygon has been converted to a bounding box.'
      }

      contents.push((
        <FilterStackContents
          key="filter__polygon"
          body={entry}
          title="Polygon"
        />
      ))
    } else if ((lineSearch && !drawingNewLayer) || drawingNewLayer === 'polyline') {
      entry = <SpatialDisplayEntry />

      contents.push((
        <FilterStackContents
          key="filter__polygon"
          body={entry}
          title="Line"
        />
      ))
    }

    if (contents.length) {
      items.push((
        <FilterStackItem
          key="item__spatial"
          icon="crop"
          title="Spatial"
          secondaryTitle={secondaryTitle}
          error={drawingNewLayer ? '' : spatialError}
          onRemove={this.onSpatialRemove}
          hint={hint}
        >
          {contents}
        </FilterStackItem>
      ))
    }

    if (!items.length) {
      return null
    }

    return (
      <>
        {items}
      </>
    )
  }
}

SpatialDisplay.propTypes = {
  boundingBoxSearch: PropTypes.string.isRequired,
  circleSearch: PropTypes.string.isRequired,
  displaySpatialPolygonWarning: PropTypes.bool.isRequired,
  drawingNewLayer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]).isRequired,
  gridName: PropTypes.string.isRequired,
  lineSearch: PropTypes.string.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  onRemoveGridFilter: PropTypes.func.isRequired,
  onRemoveSpatialFilter: PropTypes.func.isRequired,
  pointSearch: PropTypes.string.isRequired,
  polygonSearch: PropTypes.string.isRequired,
  selectingNewGrid: PropTypes.bool.isRequired,
  shapefile: PropTypes.shape({}).isRequired
}

export default SpatialDisplay
