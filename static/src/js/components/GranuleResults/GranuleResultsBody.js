import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { CSSTransition } from 'react-transition-group'

import { getGranuleIds } from '../../util/getGranuleIds'
import { formatGranulesList } from '../../util/formatGranulesList'

import Spinner from '../Spinner/Spinner'
import GranuleResultsList from './GranuleResultsList'
import GranuleResultsTable from './GranuleResultsTable'

import './GranuleResultsBody.scss'

/**
 * Renders GranuleResultsBody.
 * @param {Object} props - The props passed into the component.
 * @param {String} props.collectionId - The focused collection ID.
 * @param {String} props.focusedGranuleId - The focused granule ID.
 * @param {Object} props.granuleSearchResults - Granules passed from redux store.
 * @param {Object} props.isCwic - Flag set if the focused collection is a CWIC collection.
 * @param {Function} props.loadNextPage - Callback to load the next page of results.
 * @param {Object} props.location - Location passed from react router.
 * @param {Function} props.onExcludeGranule - Callback exclude a granule.
 * @param {Function} props.onFocusedGranuleChange - Callback change the focused granule.
 * @param {Function} props.onMetricsDataAccess - Metrics callback for data access events.
 * @param {Function} props.panelView - The current panel view.
 * @param {Object} props.portal - Portal object passed from the store.
 */
const GranuleResultsBody = ({
  collectionId,
  focusedGranuleId,
  granuleQuery,
  granuleSearchResults,
  granulesMetadata,
  isCwic,
  loadNextPage,
  location,
  onAddGranuleToProjectCollection,
  onExcludeGranule,
  onFocusedGranuleChange,
  onMetricsDataAccess,
  onRemoveGranuleFromProjectCollection,
  panelView,
  portal,
  project
}) => {
  const {
    hits: granuleHits,
    loadTime,
    isLoaded,
    isLoading,
    allIds
  } = granuleSearchResults

  const {
    excludedGranuleIds = []
  } = granuleQuery

  const granuleIds = getGranuleIds({
    allIds,
    excludedGranuleIds,
    isCwic,
    limit: false
  })

  const { collections: projectCollections } = project

  const {
    byId: projectCollectionsById = {},
    allIds: projectCollectionIds = []
  } = projectCollections

  const { [collectionId]: projectCollection = {} } = projectCollectionsById
  const { granules: projectCollectionGranules = {} } = projectCollection
  const {
    addedGranuleIds = [],
    removedGranuleIds = []
  } = projectCollectionGranules

  let isCollectionInProject = false
  let allGranulesInProject = false

  // If the collection is in the project
  if (projectCollectionIds.indexOf(collectionId) > -1 && projectCollection) {
    isCollectionInProject = true

    if (!addedGranuleIds.length && !removedGranuleIds.length) {
      // If there are no added granules and no removed granule, then the
      // user has chosen to add the entire collection to the project
      allGranulesInProject = true
    }
  }

  /**
  * Takes the granule id and returns whether or not a granule is in the project.
  * @param {String} granuleId - The granule id.
  * @returns {Boolean}
  */
  const isGranuleInProject = (granuleId) => {
    // If the collection is in the project and the user has removed granules
    if (isCollectionInProject && removedGranuleIds.length) {
      // Check to see if the granuleId provided has been specifically removed
      return removedGranuleIds.indexOf(granuleId) === -1
    }

    // Otherwise, check to see if all granules are in project or that the granuleId
    // provided has been specifically added
    return allGranulesInProject || addedGranuleIds.indexOf(granuleId) > -1
  }

  const loadTimeInSeconds = (loadTime / 1000).toFixed(1)

  const result = useMemo(() => formatGranulesList(
    granuleIds,
    granulesMetadata,
    focusedGranuleId,
    isGranuleInProject,
    isCollectionInProject
  ), [granuleIds, granulesMetadata, focusedGranuleId, excludedGranuleIds])

  const [visibleMiddleIndex, setVisibleMiddleIndex] = useState(null)

  const { granulesList, hasBrowseImagery } = result

  // Determine if another page is available by checking if there are more collections to load,
  // or if we have no collections and collections are loading. This controls whether or not the
  // "collections loading" item or the skeleton is displayed.
  const moreGranulesToLoad = !!(
    allIds
    && allIds.length
    && allIds.length < granuleHits
  )

  // When the focused collection info is loading, a request has not been made
  // so we need to force the skeleton
  // const noGranuleRequestStarted = !isLoading && !isLoaded

  // Show a skeleton while a request is happening
  const loadingFirstGranules = isLoading && granulesList.length === 0

  // const loadingFirstGranules = isGranulesLoading

  // Show a skeleton when items are loading
  const hasNextPage = moreGranulesToLoad

  // If a next page is available, add an empty item to the lists for the loading indicator.
  const itemCount = hasNextPage ? granulesList.length + 1 : granulesList.length

  // If collections are currently loading, pass an empty function, otherwise load more collections.
  const loadMoreItems = isLoading || loadingFirstGranules ? () => {} : loadNextPage

  // Callback to check if a particular collection has loaded.
  const isItemLoaded = index => !hasNextPage || index < granulesList.length

  return (
    <div className="granule-results-body">
      <CSSTransition
        in={panelView === 'list'}
        timeout={200}
        classNames="granule-results-body__view"
        unmountOnExit
      >
        <GranuleResultsList
          collectionId={collectionId}
          excludedGranuleIds={excludedGranuleIds}
          granules={granulesList}
          isCollectionInProject={isCollectionInProject}
          isCwic={isCwic}
          isGranuleInProject={isGranuleInProject}
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          location={location}
          onAddGranuleToProjectCollection={onAddGranuleToProjectCollection}
          onExcludeGranule={onExcludeGranule}
          onFocusedGranuleChange={onFocusedGranuleChange}
          onMetricsDataAccess={onMetricsDataAccess}
          onRemoveGranuleFromProjectCollection={onRemoveGranuleFromProjectCollection}
          portal={portal}
          setVisibleMiddleIndex={setVisibleMiddleIndex}
          visibleMiddleIndex={visibleMiddleIndex}
        />
      </CSSTransition>
      <CSSTransition
        in={panelView === 'table'}
        timeout={200}
        classNames="granule-results-body__view"
        unmountOnExit
      >
        <GranuleResultsTable
          collectionId={collectionId}
          excludedGranuleIds={excludedGranuleIds}
          focusedGranuleId={focusedGranuleId}
          granules={granulesList}
          hasBrowseImagery={hasBrowseImagery}
          isCwic={isCwic}
          itemCount={itemCount}
          isItemLoaded={isItemLoaded}
          location={location}
          loadMoreItems={loadMoreItems}
          onExcludeGranule={onExcludeGranule}
          onFocusedGranuleChange={onFocusedGranuleChange}
          onMetricsDataAccess={onMetricsDataAccess}
          portal={portal}
          visibleMiddleIndex={visibleMiddleIndex}
          setVisibleMiddleIndex={setVisibleMiddleIndex}
          onAddGranuleToProjectCollection={onAddGranuleToProjectCollection}
          onRemoveGranuleFromProjectCollection={onRemoveGranuleFromProjectCollection}
          isGranuleInProject={isGranuleInProject}
          isCollectionInProject={isCollectionInProject}
        />
      </CSSTransition>
      <div className="granule-results-body__floating-footer">
        <span className="granule-results-body__floating-footer-item">
          Search Time:
          {' '}
          {
            isLoading && !isLoaded
              ? (
                <span className="granule-results-body__search-time-value">
                  <Spinner
                    type="dots"
                    size="x-tiny"
                  />
                </span>
              )
              : (
                <span className="granule-results-body__search-time-value">
                  {`${loadTimeInSeconds}s`}
                </span>
              )
          }
        </span>
      </div>
    </div>
  )
}

GranuleResultsBody.propTypes = {
  collectionId: PropTypes.string.isRequired,
  focusedGranuleId: PropTypes.string.isRequired,
  granuleQuery: PropTypes.shape({}).isRequired,
  granuleSearchResults: PropTypes.shape({}).isRequired,
  granulesMetadata: PropTypes.shape({}).isRequired,
  isCwic: PropTypes.bool.isRequired,
  location: PropTypes.shape({}).isRequired,
  loadNextPage: PropTypes.func.isRequired,
  onAddGranuleToProjectCollection: PropTypes.func.isRequired,
  onExcludeGranule: PropTypes.func.isRequired,
  onFocusedGranuleChange: PropTypes.func.isRequired,
  onMetricsDataAccess: PropTypes.func.isRequired,
  onRemoveGranuleFromProjectCollection: PropTypes.func.isRequired,
  panelView: PropTypes.string.isRequired,
  portal: PropTypes.shape({}).isRequired,
  project: PropTypes.shape({}).isRequired
}

export default GranuleResultsBody
