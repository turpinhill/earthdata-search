/* eslint-disable import/no-cycle */
import { adminIsAuthorized } from './admin/isAuthorized'
import {
  adminViewRetrieval,
  fetchAdminRetrievals,
  fetchAdminRetrieval,
  updateAdminRetrievalsSortKey,
  updateAdminRetrievalsPageNum
} from './admin/retrievals'
import {
  updateAdvancedSearch
} from './advancedSearch'
import {
  getCollections,
  updateFocusedCollectionGranuleFilters
} from './collections'
import {
  changeFocusedCollection,
  getFocusedCollection,
  updateFocusedCollection,
  viewCollectionGranules,
  viewCollectionDetails
} from './focusedCollection'
import {
  applyGranuleFilters,
  excludeGranule,
  getProjectGranules,
  initializeCollectionGranulesResults,
  searchGranules,
  undoExcludeGranule,
  fetchRetrievalCollectionGranuleLinks,
  updateGranuleResults,
  updateGranuleMetadata
} from './granules'
import { logout, updateAuthToken } from './authToken'
import {
  changeTimelineQuery,
  getTimeline
} from './timeline'
import {
  changeCollectionPageNum,
  changeGranulePageNum,
  changeProjectQuery,
  changeRegionQuery,
  changeQuery,
  clearFilters,
  removeGridFilter,
  removeSpatialFilter,
  removeTemporalFilter,
  updateRegionQuery
} from './search'
import { changeMap } from './map'
import {
  changeUrl,
  changePath,
  updateStore
} from './urlQuery'
import {
  addCmrFacet,
  changeCmrFacet,
  changeFeatureFacet,
  removeCmrFacet,
  updateCmrFacet,
  updateFeatureFacet
} from './facets'
import {
  toggleAdvancedSearchModal,
  toggleAboutCwicModal,
  toggleChunkedOrderModal,
  toggleDrawingNewLayer,
  toggleFacetsModal,
  toggleOverrideTemporalModal,
  toggleRelatedUrlsModal,
  toggleSecondaryOverlayPanel,
  toggleSelectingNewGrid,
  toggleShapefileUploadModal,
  toggleSpatialPolygonWarning,
  toggleTooManyPointsModal
} from './ui'
import {
  applyViewAllFacets,
  getViewAllFacets,
  changeViewAllFacet,
  triggerViewAllFacets
} from './viewAllFacets'
import {
  changeFocusedGranule,
  getFocusedGranule
} from './focusedGranule'
import {
  togglePanels,
  setActivePanel,
  setActivePanelGroup,
  setActivePanelSection
} from './panels'
import {
  addAccessMethods,
  addGranuleToProjectCollection,
  addProjectCollection,
  getProjectCollections,
  removeCollectionFromProject,
  removeGranuleFromProjectCollection,
  restoreProject,
  selectAccessMethod,
  toggleCollectionVisibility,
  updateAccessMethod,
  updateProjectGranuleParams
} from './project'
import {
  fetchProviders
} from './providers'
import {
  getRegions
} from './regions'
import {
  fetchRetrieval,
  submitRetrieval,
  deleteRetrieval
} from './retrieval'
import { fetchRetrievalHistory } from './retrievalHistory'
import {
  fetchAccessMethods
} from './accessMethods'
import {
  clearShapefile,
  saveShapefile,
  shapefileErrored,
  shapefileLoading,
  updateShapefile
} from './shapefiles'
import { fetchRetrievalCollection } from './retrievalCollection'
import { loadPortalConfig } from './portals'
import { fetchDataQualitySummaries } from './dataQualitySummaries'
import { deleteSavedProject, updateProjectName, updateSavedProject } from './savedProject'
import { fetchSavedProjects, setSavedProjects } from './savedProjects'
import { handleError, removeError } from './errors'
import { updateBrowserVersion } from './browser'
import { collectionRelevancyMetrics } from './relevancy'
import { fetchContactInfo, updateNotificationLevel } from './contactInfo'
import {
  cancelAutocomplete,
  clearAutocompleteSelected,
  clearAutocompleteSuggestions,
  deleteAutocompleteValue,
  fetchAutocomplete,
  removeAutocompleteValue,
  selectAutocompleteSuggestion
} from './autocomplete'
import {
  setIsSubmitting,
  setPreferences,
  setPreferencesFromJwt,
  updatePreferences
} from './preferences'

const actions = {
  addAccessMethods,
  addCmrFacet,
  addGranuleToProjectCollection,
  addProjectCollection,
  adminIsAuthorized,
  adminViewRetrieval,
  applyGranuleFilters,
  applyViewAllFacets,
  cancelAutocomplete,
  changeCmrFacet,
  changeCollectionPageNum,
  changeFeatureFacet,
  changeFocusedCollection,
  changeFocusedGranule,
  changeGranulePageNum,
  changeMap,
  changePath,
  changeProjectQuery,
  changeQuery,
  changeRegionQuery,
  changeTimelineQuery,
  changeUrl,
  changeViewAllFacet,
  clearAutocompleteSelected,
  clearAutocompleteSuggestions,
  clearFilters,
  clearShapefile,
  collectionRelevancyMetrics,
  deleteAutocompleteValue,
  deleteRetrieval,
  deleteSavedProject,
  excludeGranule,
  fetchAccessMethods,
  fetchAdminRetrieval,
  fetchAdminRetrievals,
  fetchAutocomplete,
  fetchContactInfo,
  fetchDataQualitySummaries,
  fetchProviders,
  fetchRetrieval,
  fetchRetrievalCollection,
  fetchRetrievalCollectionGranuleLinks,
  fetchRetrievalHistory,
  fetchSavedProjects,
  getCollections,
  getFocusedCollection,
  getFocusedGranule,
  getProjectCollections,
  getProjectGranules,
  getRegions,
  getTimeline,
  getViewAllFacets,
  handleError,
  initializeCollectionGranulesResults,
  loadPortalConfig,
  logout,
  removeAutocompleteValue,
  removeCmrFacet,
  removeCollectionFromProject,
  removeError,
  removeGranuleFromProjectCollection,
  removeGridFilter,
  removeSpatialFilter,
  removeTemporalFilter,
  restoreProject,
  saveShapefile,
  searchGranules,
  selectAccessMethod,
  selectAutocompleteSuggestion,
  setActivePanel,
  setActivePanelGroup,
  setActivePanelSection,
  setIsSubmitting,
  setPreferences,
  setPreferencesFromJwt,
  setSavedProjects,
  shapefileErrored,
  shapefileLoading,
  submitRetrieval,
  toggleAboutCwicModal,
  toggleAdvancedSearchModal,
  toggleChunkedOrderModal,
  toggleCollectionVisibility,
  toggleDrawingNewLayer,
  toggleFacetsModal,
  toggleOverrideTemporalModal,
  togglePanels,
  toggleRelatedUrlsModal,
  toggleSecondaryOverlayPanel,
  toggleSelectingNewGrid,
  toggleShapefileUploadModal,
  toggleSpatialPolygonWarning,
  toggleTooManyPointsModal,
  triggerViewAllFacets,
  undoExcludeGranule,
  updateAccessMethod,
  updateAdminRetrievalsPageNum,
  updateAdminRetrievalsSortKey,
  updateAdvancedSearch,
  updateAuthToken,
  updateBrowserVersion,
  updateCmrFacet,
  updateFeatureFacet,
  updateFocusedCollection,
  updateFocusedCollectionGranuleFilters,
  updateGranuleMetadata,
  updateGranuleResults,
  updateNotificationLevel,
  updatePreferences,
  updateProjectGranuleParams,
  updateProjectName,
  updateRegionQuery,
  updateSavedProject,
  updateShapefile,
  updateStore,
  viewCollectionDetails,
  viewCollectionGranules
}

export default actions
