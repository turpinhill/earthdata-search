import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { isPlainObject, isEmpty } from 'lodash'

import actions from '../../actions/index'

import SearchForm from '../../components/SearchForm/SearchForm'

const mapDispatchToProps = dispatch => ({
  onChangeQuery: query => dispatch(actions.changeQuery(query)),
  onChangeFocusedCollection:
    collectionId => dispatch(actions.changeFocusedCollection(collectionId)),
  onClearFilters:
    () => dispatch(actions.clearFilters()),
  onToggleAdvancedSearchModal:
    state => dispatch(actions.toggleAdvancedSearchModal(state)),
  onCancelAutocomplete:
    () => dispatch(actions.cancelAutocomplete()),
  onClearAutocompleteSuggestions:
    () => dispatch(actions.clearAutocompleteSuggestions()),
  onFetchAutocomplete:
    data => dispatch(actions.fetchAutocomplete(data)),
  onSelectAutocompleteSuggestion:
    data => dispatch(actions.selectAutocompleteSuggestion(data))
})

const mapStateToProps = state => ({
  advancedSearch: state.advancedSearch,
  autocomplete: state.autocomplete,
  boundingBoxSearch: state.query.collection.spatial.boundingBox,
  drawingNewLayer: state.ui.map.drawingNewLayer,
  gridName: state.query.collection.gridName,
  keywordSearch: state.query.collection.keyword,
  lineSearch: state.query.collection.spatial.line,
  pointSearch: state.query.collection.spatial.point,
  polygonSearch: state.query.collection.spatial.polygon,
  selectingNewGrid: state.ui.grid.selectingNewGrid,
  shapefile: state.shapefile,
  temporalSearch: state.query.collection.temporal
})

// Export non-redux-connected component for use in tests
// Import this class as `import { SearchFormContainer } from '../SearchFormContainer'`
export const SearchFormContainer = (props) => {
  const {
    advancedSearch,
    autocomplete,
    boundingBoxSearch,
    drawingNewLayer,
    gridName,
    lineSearch,
    pointSearch,
    keywordSearch,
    polygonSearch,
    selectingNewGrid,
    shapefile,
    temporalSearch,
    onCancelAutocomplete,
    onChangeQuery,
    onClearFilters,
    onChangeFocusedCollection,
    onToggleAdvancedSearchModal,
    onClearAutocompleteSuggestions,
    onFetchAutocomplete,
    onSelectAutocompleteSuggestion
  } = props

  const {
    endDate: temporalEnd,
    startDate: temporalStart
  } = temporalSearch

  const {
    shapefileError,
    shapefileLoading,
    shapefileLoaded,
    shapefileId
  } = shapefile

  const { regionSearch } = advancedSearch

  let showFilterStackToggle = [
    regionSearch,
    boundingBoxSearch,
    drawingNewLayer,
    gridName,
    lineSearch,
    pointSearch,
    polygonSearch,
    selectingNewGrid,
    shapefileError,
    shapefileLoading,
    shapefileLoaded,
    shapefileId,
    temporalEnd,
    temporalStart
  ].some((filter) => {
    if (isPlainObject(filter)) {
      return !isEmpty(filter)
    }
    return !!filter
  })

  showFilterStackToggle = false

  return (
    <SearchForm
      onChangeQuery={onChangeQuery}
      onChangeFocusedCollection={onChangeFocusedCollection}
      onClearFilters={onClearFilters}
      onToggleAdvancedSearchModal={onToggleAdvancedSearchModal}
      onCancelAutocomplete={onCancelAutocomplete}
      onClearAutocompleteSuggestions={onClearAutocompleteSuggestions}
      onFetchAutocomplete={onFetchAutocomplete}
      onSelectAutocompleteSuggestion={onSelectAutocompleteSuggestion}
      advancedSearch={advancedSearch}
      keywordSearch={keywordSearch}
      autocomplete={autocomplete}
      showFilterStackToggle={showFilterStackToggle}
    />
  )
}

SearchFormContainer.defaultProps = {
  advancedSearch: {},
  keywordSearch: '',
  boundingBoxSearch: '',
  gridName: '',
  lineSearch: '',
  pointSearch: '',
  polygonSearch: '',
  shapefile: {},
  temporalSearch: {}
}

SearchFormContainer.propTypes = {
  advancedSearch: PropTypes.shape({}),
  autocomplete: PropTypes.shape({}).isRequired,
  boundingBoxSearch: PropTypes.string,
  drawingNewLayer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]).isRequired,
  gridName: PropTypes.string,
  lineSearch: PropTypes.string,
  keywordSearch: PropTypes.string,
  onChangeQuery: PropTypes.func.isRequired,
  onChangeFocusedCollection: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  onToggleAdvancedSearchModal: PropTypes.func.isRequired,
  onCancelAutocomplete: PropTypes.func.isRequired,
  onClearAutocompleteSuggestions: PropTypes.func.isRequired,
  onFetchAutocomplete: PropTypes.func.isRequired,
  onSelectAutocompleteSuggestion: PropTypes.func.isRequired,
  pointSearch: PropTypes.string,
  polygonSearch: PropTypes.string,
  selectingNewGrid: PropTypes.bool.isRequired,
  shapefile: PropTypes.shape({}),
  temporalSearch: PropTypes.shape({})
}

// Export redux-connected component for use in application
// Import this class as `import ConnectedSearchFormContainer from './SearchFormContainer'`
export default connect(mapStateToProps, mapDispatchToProps)(SearchFormContainer)
