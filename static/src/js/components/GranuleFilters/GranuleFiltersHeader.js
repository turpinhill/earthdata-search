import React from 'react'
import PropTypes from 'prop-types'

import './GranuleFiltersHeader.scss'

/**
 * Renders GranuleFiltersHeader.
 * @param {Object} props - The props passed into the component.
 * @param {Object} props.datasetId - The title of the focused collection.
 */
export const GranuleFiltersHeader = ({
  title
}) => (
  <div className="granule-filters-header">
    <i className="fa fa-filter" />
    <h2 className="granule-filters-header__primary">Granule Filters</h2>
    <span className="granule-filters-header__secondary">{title}</span>
  </div>
)

GranuleFiltersHeader.defaultProps = {
  title: ''
}

GranuleFiltersHeader.propTypes = {
  title: PropTypes.string
}

export default GranuleFiltersHeader
