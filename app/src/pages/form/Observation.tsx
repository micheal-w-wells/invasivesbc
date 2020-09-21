import { Container } from '@material-ui/core';
import React from 'react';
import FormContainer from 'components/form/FormContainer';
import { observationSchema } from 'contexts/observationSchema'

// react json schema form related:

const uiSchema = {
  observation_id: {},
  workflow_id: {},
  observation_date: {},
  observation_time: {},
  observer_first_name: {},
  observer_last_name: {},
  species_id: {},
  observation_type: {},
  species_agency_code: {},
  jurisdiction_code: {},
  negative_obs_ind: {},
  subType: {
    Number_of_Individuals_observed: {},
    Life_Stage: {},
    Behaviour: {},
    sample_taken: {},
    sample_number: {},
    general_comment: {
      'ui:widget': 'textarea'
    },
    access_description: {},
    species_density_code: {},
    species_distribution_code: {},
    soil_texture_code: {},
    specific_use_code: {},
    slope_code: {},
    aspect_code: {},
    proposed_action_code: {},
    flowering: {},
    plant_life_stage: {},
    plant_health: {},
    plant_seed_stage: {},
    sample_identifier: {},
    range_unit_number: {},
    primary_file_id: {},
    secondary_file_id: {},
    aquatic_obs_ind: {},
    legacy_site_ind: {},
    early_detection_rapid_resp_ind: {},
    research_detection_ind: {},
    well_ind: {},
    special_care_ind: {},
    biological_ind: {},
    Photo_Indicator: {},
    Bec_Zone: {},
    RISO: {},
    IPMA: {},
    Ownership: {},
    Regional_District: {},
    FLNRO_District: {},
    MOTI_District: {},
    MOE_Region: {}
  }
};


interface IObservationProps {
  id: number;
  classes?: any;
}

const Observation: React.FC<IObservationProps> = (props) => {
  return (
    <Container className={props.classes.container}>
      <FormContainer schema={observationSchema} uiSchema={uiSchema} />
    </Container>
  );
};

export default Observation;
