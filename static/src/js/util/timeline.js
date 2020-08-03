/**
 * Mapping of timeline zoom levels. The Timeline (sometimes) and URL use numbers, CMR uses words
 */
export const timelineIntervals = {
  minute: '2',
  hour: '3',
  day: '4',
  month: '5',
  year: '6'
}

/**
 * Prepare parameters used in getTimeline() based on current Redux State
 * @param {Object} state Current Redux State
 * @returns Parameters used in Timeline request
 */
export const prepareTimelineParams = (state) => {
  const {
    authToken,
    focusedCollection,
    project,
    query,
    router,
    timeline
  } = state

  const { location } = router
  const { pathname } = location
  const isProjectPage = pathname.startsWith('/project')

  let conceptIds = []

  // If we are on the project page, we want to query the projectIds
  if (isProjectPage) {
    const { collections: projectCollections } = project
    const { allIds: projectIds } = projectCollections

    conceptIds = projectIds
  } else if (focusedCollection !== '') {
    // if we aren't on the project page, we want to query the focusedCollection
    conceptIds.push(focusedCollection)
  }

  // If we don't have any conceptIds, bail out!
  if (conceptIds.length === 0) {
    return null
  }

  const { collection: collectionQuery } = query
  const { spatial } = collectionQuery
  const {
    boundingBox,
    point,
    polygon
  } = spatial

  const { query: timelineQuery } = timeline
  const {
    endDate,
    interval,
    startDate
  } = timelineQuery

  if (!startDate) {
    return null
  }

  return {
    authToken,
    boundingBox,
    conceptId: conceptIds,
    endDate,
    interval,
    point,
    polygon,
    startDate
  }
}
