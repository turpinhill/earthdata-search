import React from 'react'
import { PropTypes } from 'prop-types'
import classNames from 'classnames'
import abbreviate from 'number-abbreviate'

import {
  projectCollectionItemHeader,
  projectCollectionItemFooter
} from './skeleton'
import { isAccessMethodValid } from '../../util/accessMethods'
import { generateHandoffs } from '../../util/handoffs/generateHandoffs'
import pluralize from '../../util/pluralize'
// import { getGranuleCount } from '../../util/collectionMetadata/granuleCount'
import { convertSize } from '../../util/project'

import MoreActionsDropdown from '../MoreActionsDropdown/MoreActionsDropdown'
import MoreActionsDropdownItem from '../MoreActionsDropdown/MoreActionsDropdownItem'
import Button from '../Button/Button'
import Skeleton from '../Skeleton/Skeleton'

import './ProjectCollectionsItem.scss'

/**
 * Renders ProjectCollectionItem.
 * @param {Object} props.collectionId - CMR Concept ID of the collection
 * @param {Object} props.collection - CMR metadata of the collection.
 * @param {Object} props.color - Color assigned to the collection based on its location in the project list.
 * @param {Object} props.isPanelActive - Whether or not the panel for the collection is active.
 * @param {Function} props.onRemoveCollectionFromProject - Function called when a collection is removed from the project.
 * @param {Function} props.onToggleCollectionVisibility - Function called when visibility of the collection is toggled.
 * @param {Function} props.onSetActivePanel - Function called when an active panel is set.
 * @param {Function} props.onSetActivePanelSection - Callback to set the active panel.
 * @param {Function} props.onUpdateFocusedCollection - Callback to set the focused collection ID.
 * @param {Object} props.projectCollection - Collection from project.byId
 * @param {Object} props.collectionsQuery - Search values from query.collection
 */
const ProjectCollectionItem = ({
  activePanelSection,
  collectionMetadata,
  collectionCount,
  collectionId,
  collectionsQuery,
  color,
  index,
  isPanelActive,
  mapProjection,
  onRemoveCollectionFromProject,
  onSetActivePanel,
  onSetActivePanelSection,
  onToggleCollectionVisibility,
  onTogglePanels,
  onUpdateFocusedCollection,
  onViewCollectionDetails,
  onViewCollectionGranules,
  projectCollection
}) => {
  const handleToggleCollectionVisibility = (event) => {
    onToggleCollectionVisibility(collectionId)
    event.preventDefault()
  }

  const {
    granules,
    isVisible
  } = projectCollection

  const {
    isCwic,
    title,
    id: conceptId
  } = collectionMetadata

  const { hits: granuleCount, isLoaded, singleGranuleSize } = granules

  // const granuleCount = getGranuleCount(collectionMetadata, projectCollection)

  const totalSize = convertSize(granuleCount * singleGranuleSize)

  const { size = '', unit = '' } = totalSize

  const { valid: isValid } = isAccessMethodValid(projectCollection, collectionMetadata)

  const className = classNames([
    'project-collections-item',
    {
      'project-collections-item--is-active': isPanelActive,
      'project-collections-item--is-valid': isValid
    }
  ])

  const handoffLinks = generateHandoffs(collectionMetadata, collectionsQuery, mapProjection)

  return (
    <li style={{ borderLeftColor: color }} className={className}>
      <div className="project-collections-item__header">
        {
          !title ? (
            <Skeleton
              containerStyle={{
                height: '40px',
                width: '100%'
              }}
              shapes={projectCollectionItemHeader}
            />
          ) : (
            <>
              <Button
                className="project-collections-item__title-button"
                variant="naked"
                bootstrapVariant="link"
                label={`${title} Collection Details`}
                onClick={() => {
                  onTogglePanels(true)
                  onUpdateFocusedCollection(conceptId)
                  onSetActivePanelSection('1')
                }}
              >
                <h3 className="project-collections-item__title">
                  {title}
                </h3>
              </Button>
              <MoreActionsDropdown handoffLinks={handoffLinks} alignRight>
                <MoreActionsDropdownItem
                  className="project-collections-item__more-actions-item project-collections-item__more-actions-remove"
                  icon="times-circle"
                  title="Remove"
                  onClick={() => {
                    onRemoveCollectionFromProject(collectionId)

                    // If removing the first collection in the list
                    if (index === 0) {
                      let panelSectionToSelect = activePanelSection

                      // If this is the last collection in the project reset the active panel
                      if (collectionCount === 1) panelSectionToSelect = 0

                      onSetActivePanel(`${panelSectionToSelect}.0.0`)
                    } else {
                      // Select the previous collection in the list
                      onSetActivePanel(`${activePanelSection}.${index - 1}.0`)
                    }
                  }}
                />
                <MoreActionsDropdownItem
                  className="project-collections-item__more-actions-item project-collections-item__more-actions-collection-details"
                  icon="info-circle"
                  title="Collection Details"
                  onClick={() => onViewCollectionDetails(collectionId)}
                />
                <MoreActionsDropdownItem
                  className="project-collections-item__more-actions-item project-collections-item__more-actions-granules"
                  icon="map"
                  title="View Granules"
                  onClick={() => onViewCollectionGranules(collectionId)}
                />
                <MoreActionsDropdownItem
                  className="project-collections-item__more-actions-item project-collections-item__more-actions-vis"
                  icon={isVisible ? 'eye-slash' : 'eye'}
                  title="Toggle Visibility"
                  onClick={handleToggleCollectionVisibility}
                />
              </MoreActionsDropdown>
            </>
          )
        }
      </div>
      {
        isLoaded ? (
          <>
            <ul className="project-collections-item__stats-list">
              {
                <>
                  <li
                    className="project-collections-item__stats-item project-collections-item__stats-item--granule-count"
                  >
                    {`${abbreviate(granuleCount, 1)} ${pluralize('Granule', granuleCount)}`}
                  </li>
                  {
                    !isCwic && (granuleCount > 0 && size && unit) && (
                      <li
                        className="project-collections-item__stats-item project-collections-item__stats-item--total-size"
                      >
                        {`Est. Size ${size} ${unit}`}
                      </li>
                    )
                  }
                </>
              }
            </ul>
            <div className="project-collections-item__footer">
              {
                !isValid && (
                  <span className="project-collections-item__status project-collections-item__status--invalid">
                    <i className="fa fa-exclamation-circle" />
                  </span>
                )
              }
              <Button
                className="project-collections-item__more-options-button"
                variant="link"
                bootstrapVariant="link"
                icon="cog"
                label="Edit options"
                onClick={() => {
                  onUpdateFocusedCollection(conceptId)
                  onSetActivePanelSection('0')
                  onTogglePanels(true)
                }}
              >
                Edit Options
              </Button>
            </div>
          </>
        ) : (
          <Skeleton
            containerStyle={{
              height: '40px',
              width: '100%'
            }}
            shapes={projectCollectionItemFooter}
          />
        )
      }
    </li>
  )
}

ProjectCollectionItem.propTypes = {
  activePanelSection: PropTypes.string.isRequired,
  collectionMetadata: PropTypes.shape({}).isRequired,
  collectionCount: PropTypes.number.isRequired,
  collectionId: PropTypes.string.isRequired,
  collectionsQuery: PropTypes.shape({}).isRequired,
  color: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  isPanelActive: PropTypes.bool.isRequired,
  mapProjection: PropTypes.string.isRequired,
  onRemoveCollectionFromProject: PropTypes.func.isRequired,
  onSetActivePanel: PropTypes.func.isRequired,
  onSetActivePanelSection: PropTypes.func.isRequired,
  onToggleCollectionVisibility: PropTypes.func.isRequired,
  onViewCollectionDetails: PropTypes.func.isRequired,
  onViewCollectionGranules: PropTypes.func.isRequired,
  onTogglePanels: PropTypes.func.isRequired,
  onUpdateFocusedCollection: PropTypes.func.isRequired,
  projectCollection: PropTypes.shape({}).isRequired
}

export default ProjectCollectionItem
