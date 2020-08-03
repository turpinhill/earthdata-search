import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withFormik } from 'formik'
import * as Yup from 'yup'

import actions from '../../actions'

import {
  dateOutsideRange,
  maxLessThanMin,
  minLessThanMax,
  nullableTemporal,
  nullableValue,
  startBeforeEnd
} from '../../util/validation'

import { getFocusedCollectionGranuleQuery, getCollectionsQuery } from '../../selectors/query'
import { getFocusedCollectionMetadata } from '../../selectors/collectionMetadata'

import GranuleFiltersActions
  from '../../components/GranuleFilters/GranuleFiltersActions'
import GranuleFiltersBody
  from '../../components/GranuleFilters/GranuleFiltersBody'
import GranuleFiltersForm
  from '../../components/GranuleFilters/GranuleFiltersForm'
import GranuleFiltersHeaderContainer
  from '../GranuleFiltersHeaderContainer/GranuleFiltersHeaderContainer'
import SecondaryOverlayPanelContainer
  from '../SecondaryOverlayPanelContainer/SecondaryOverlayPanelContainer'

const mapStateToProps = state => ({
  collectionMetadata: getFocusedCollectionMetadata(state),
  collectionQuery: getCollectionsQuery(state),
  granuleQuery: getFocusedCollectionGranuleQuery(state),
  temporal: state.query.collection.temporal
})

const mapDispatchToProps = dispatch => ({
  onApplyGranuleFilters:
    (values, closePanel) => dispatch(
      actions.applyGranuleFilters(values, closePanel)
    )
})

/**
 * Renders GranuleFiltersPanelContainer.
 * @param {Object} props - The props passed into the component.
 * @param {Object} props.collections - The collections.
 * @param {String} props.focusedCollection - The focused collection id.
 * @param {Object} props.temporal - The query temporal.
 * @param {Function} props.onApplyGranuleFilters - Callback function to apply the granule filters.
 * @param {Object} props.errors - Form errors provided by Formik.
 * @param {Function} props.handleBlur - Callback function provided by Formik.
 * @param {Function} props.handleChange - Callback function provided by Formik.
 * @param {Object} props.metadata - The focused collection metadata.
 * @param {Object} props.values - Form values provided by Formik.
 * @param {Function} props.setFieldValue - Callback function provided by Formik.
 * @param {Function} props.setFieldTouched - Callback function provided by Formik.
 * @param {Object} props.touched - Form state provided by Formik.
 */
export class GranuleFiltersPanelContainer extends Component {
  constructor(props) {
    super(props)
    this.form = null
    this.onClearGranuleFilters = this.onClearGranuleFilters.bind(this)
  }

  onClearGranuleFilters() {
    const {
      onApplyGranuleFilters,
      handleReset,
      values
    } = this.props

    handleReset()
    // Set each of the values to an empty string to avoid wiping
    // out ALL granule filters (e.g. sort key)
    const emptyObject = {}
    Object.keys(values).forEach((key) => {
      emptyObject[key] = ''
    })

    onApplyGranuleFilters(emptyObject)
  }

  render() {
    const {
      collectionMetadata,
      collectionQuery,
      errors,
      handleBlur,
      handleChange,
      handleSubmit,
      isValid,
      setFieldValue,
      setFieldTouched,
      touched,
      values
    } = this.props

    return (
      <SecondaryOverlayPanelContainer
        header={<GranuleFiltersHeaderContainer />}
        body={(
          <GranuleFiltersBody
            granuleFiltersForm={(
              <GranuleFiltersForm
                collectionMetadata={collectionMetadata}
                collectionQuery={collectionQuery}
                values={values}
                touched={touched}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
                setFieldValue={setFieldValue}
                setFieldTouched={setFieldTouched}
              />
            )}
          />
        )}
        footer={(
          <GranuleFiltersActions
            isValid={isValid}
            onApplyClick={handleSubmit}
            onClearClick={this.onClearGranuleFilters}
          />
        )}
      />
    )
  }
}

const ValidationSchema = (props) => {
  const { temporal = {} } = props
  const { startDate = '', endDate = '' } = temporal

  const errors = {
    cloudCover: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must be between 0.0 and 100.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    orbitNumber: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must greater than 0.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    equatorCrossingLongitude: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must be between -180.0 and 180.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    equatorCrossingDate: {
      invalidStartDate: 'Enter a valid start date',
      invalidEndDate: 'Enter a valid end date',
      // eslint-disable-next-line no-template-curly-in-string
      outsideRange: '${path} is outside current temporal range',
      // eslint-disable-next-line no-template-curly-in-string
      startBeforeEnd: '${path} should be before End'
    },
    temporal: {
      invalidStartDate: 'Enter a valid start date',
      invalidEndDate: 'Enter a valid end date',
      // eslint-disable-next-line no-template-curly-in-string
      outsideRange: '${path} is outside current temporal range',
      // eslint-disable-next-line no-template-curly-in-string
      startBeforeEnd: '${path} should be before End'
    }
  }

  return Yup.object().shape({
    gridCoords: Yup.string,
    cloudCover: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.cloudCover.invalidNumber)
        .test('min-less-than-max', errors.cloudCover.minLessThanMax, minLessThanMax)
        .min(0, errors.cloudCover.minMax)
        .max(100, errors.cloudCover.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.cloudCover.invalidNumber)
        // eslint-disable-next-line no-template-curly-in-string
        .test('max-less-than-min', errors.cloudCover.maxGreaterThanMin, maxLessThanMin)
        .min(0, errors.cloudCover.minMax)
        .max(100, errors.cloudCover.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    orbitNumber: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.orbitNumber.invalidNumber)
        .test('min-less-than-max', errors.orbitNumber.minLessThanMax, minLessThanMax)
        .min(0, errors.orbitNumber.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.orbitNumber.invalidNumber)
        // eslint-disable-next-line no-template-curly-in-string
        .test('max-less-than-min', errors.orbitNumber.maxGreaterThanMin, maxLessThanMin)
        .min(0, errors.orbitNumber.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    equatorCrossingLongitude: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.equatorCrossingLongitude.invalidNumber)
        .test('min-less-than-max', errors.equatorCrossingLongitude.minLessThanMax, minLessThanMax)
        .min(-180, errors.equatorCrossingLongitude.minMax)
        .max(180, errors.equatorCrossingLongitude.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.equatorCrossingLongitude.invalidNumber)
        // eslint-disable-next-line no-template-curly-in-string
        .test('max-less-than-min', errors.equatorCrossingLongitude.maxGreaterThanMin, maxLessThanMin)
        .min(-180, errors.equatorCrossingLongitude.minMax)
        .max(180, errors.equatorCrossingLongitude.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    equatorCrossingDate: Yup.object().shape({
      startDate: Yup.date()
        .label('Start')
        .typeError(errors.equatorCrossingDate.invalidStartDate)
        .transform(nullableValue)
        .nullable()
        // eslint-disable-next-line no-template-curly-in-string
        .test('start-before-end', errors.equatorCrossingDate.startBeforeEnd, startBeforeEnd)

        .test('inside-global-equatorial-crossing-date', errors.equatorCrossingDate.outsideRange, value => dateOutsideRange(value, startDate, endDate)),
      endDate: Yup.date()
        .label('End')
        .typeError(errors.equatorCrossingDate.invalidEndDate)
        .transform(nullableValue)
        .nullable()
        // eslint-disable-next-line no-template-curly-in-string
        .test('inside-global-equatorial-crossing-date', errors.equatorCrossingDate.outsideRange, value => dateOutsideRange(value, startDate, endDate))
    }),
    temporal: Yup.object().shape({
      startDate: Yup.date()
        .label('Start')
        .typeError(errors.temporal.invalidStartDate)
        .transform(nullableTemporal)
        .nullable()
        // eslint-disable-next-line no-template-curly-in-string
        .test('start-before-end', errors.temporal.startBeforeEnd, startBeforeEnd)

        .test('inside-global-temporal', errors.temporal.outsideRange, value => dateOutsideRange(value, startDate, endDate)),
      endDate: Yup.date()
        .label('End')
        .typeError(errors.temporal.invalidEndDate)
        .transform(nullableTemporal)
        .nullable()
        // eslint-disable-next-line no-template-curly-in-string
        .test('inside-global-temporal', errors.temporal.outsideRange, value => dateOutsideRange(value, startDate, endDate))
    })
  })
}

const EnhancedGranuleFiltersPanelContainer = withFormik({
  enableReinitialize: true,
  validationSchema: ValidationSchema,
  mapPropsToValues: (props) => {
    const {
      granuleQuery
    } = props

    const {
      browseOnly = false,
      cloudCover = {},
      dayNightFlag = '',
      equatorCrossingDate = {},
      equatorCrossingLongitude = {},
      gridCoords,
      onlineOnly = false,
      orbitNumber = {},
      temporal = {}
    } = granuleQuery

    const {
      min: cloudCoverMin,
      max: cloudCoverMax
    } = cloudCover

    const {
      min: orbitNumberMin = '',
      max: orbitNumberMax = ''
    } = orbitNumber

    const {
      min: equatorCrossingLongitudeMin = '',
      max: equatorCrossingLongitudeMax = ''
    } = equatorCrossingLongitude

    const {
      startDate: equatorCrossingDateStart = '',
      endDate: equatorCrossingDateEnd = ''
    } = equatorCrossingDate

    const {
      startDate: temporalStartDate,
      endDate: temporalEndDate,
      recurringDayStart: temporalRecurringDayStart = '',
      recurringDayEnd: temporalRecurringDayEnd = '',
      isRecurring: temporalIsRecurring = false
    } = temporal

    return {
      gridCoords,
      dayNightFlag: dayNightFlag || '',
      browseOnly: browseOnly || false,
      onlineOnly: onlineOnly || false,
      cloudCover: {
        min: cloudCoverMin || '',
        max: cloudCoverMax || ''
      },
      orbitNumber: {
        min: orbitNumberMin || '',
        max: orbitNumberMax || ''
      },
      equatorCrossingLongitude: {
        min: equatorCrossingLongitudeMin || '',
        max: equatorCrossingLongitudeMax || ''
      },
      equatorCrossingDate: {
        startDate: equatorCrossingDateStart || '',
        endDate: equatorCrossingDateEnd || ''
      },
      temporal: {
        startDate: temporalStartDate || '',
        endDate: temporalEndDate || '',
        recurringDayStart: temporalRecurringDayStart || '',
        recurringDayEnd: temporalRecurringDayEnd || '',
        isRecurring: temporalIsRecurring || false
      }
    }
  },
  handleSubmit: (values, { props, setSubmitting }) => {
    const {
      onApplyGranuleFilters
    } = props

    onApplyGranuleFilters(values, true)
    setSubmitting(false)
  }
})(GranuleFiltersPanelContainer)

GranuleFiltersPanelContainer.propTypes = {
  collectionMetadata: PropTypes.shape({}).isRequired,
  collectionQuery: PropTypes.shape({}).isRequired,
  granuleQuery: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({}).isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isValid: PropTypes.bool.isRequired,
  onApplyGranuleFilters: PropTypes.func.isRequired,
  setFieldTouched: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  touched: PropTypes.shape({}).isRequired,
  values: PropTypes.shape({}).isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(EnhancedGranuleFiltersPanelContainer)
