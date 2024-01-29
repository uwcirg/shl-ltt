// import {PUBLIC_BASE_URL} from '$env/static/public';
import { dev } from '$app/environment';

export const API_BASE = import.meta.env.VITE_API_BASE;

export const INTERMEDIATE_FHIR_SERVER_BASE = import.meta.env.VITE_INTERMEDIATE_FHIR_SERVER_BASE;

export const SOF_HOSTS = [
  // {
  //   id: "smit",
  //   name: "SMART Health IT Demo",
  //   url: "https://launch.smarthealthit.org/v/r4/sim/WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMF0/fhir",
  //   clientId: "<no client id>",
  //   note: "Credentials provided"
  // },
  {
    id: "keycloak",
    name: "Let's Talk Tech Login",
    url: "https://fhir.inform.dev.cirg.uw.edu/fhir",
    clientId: "shl_creator",
    note: "Credentials provided"
  }
];
export const SOF_REDIRECT_URI = '/authenticate';
export const SOF_RESOURCES = [
  'Patient',
  'AllergyIntolerance',
  // 'MedicationStatement', // Not in EPIC USCDI R4
  'MedicationRequest',
  'Medication', // can't search by patient; "Only an _ID search is allowed."
  'Condition',
  'Observation', // "Must have either code or category."
  'Organization', // can't search by patient; "Only an _ID search is allowed."
  'Immunization',
  'Device',
  // 'DeviceUseStatement', // Not in EPIC USCDI R4
  'DiagnosticReport', // TODO change to subject
  // 'ImagingStudy', // Not in EPIC USCDI R4
  // 'Media', // Not in EPIC USCDI R4
  'Practitioner', // can't search by patient; "Either name, family, or identifier is a required parameter."
  'PractitionerRole',  // can't search by patient; "An identifier, practitioner, organization, location, or specialty parameter is required."
  'Procedure', // TODO change to subject
  // 'Specimen', // Not in EPIC USCDI R4
];

export const SOF_PATIENT_RESOURCES = [
  'Patient',
  'AllergyIntolerance',
  // 'MedicationStatement', // Not in EPIC USCDI R4
  'MedicationRequest',
  // 'Medication', // can't search by patient; "Only an _ID search is allowed."
  'Condition',
  // 'Observation', // "Must have either code or category."
  // 'Organization', // can't search by patient; "Only an _ID search is allowed."
  'Immunization',
  // 'Device',
  // 'DeviceUseStatement', // Not in EPIC USCDI R4
  'DiagnosticReport', // TODO change to subject
  // 'ImagingStudy', // Not in EPIC USCDI R4
  // 'Media', // Not in EPIC USCDI R4
  // 'Practitioner', // can't search by patient; "Either name, family, or identifier is a required parameter."
  // 'PractitionerRole',  // can't search by patient; "An identifier, practitioner, organization, location, or specialty parameter is required."
  'Procedure', // TODO change to subject
  // 'Specimen', // Not in EPIC USCDI R4
];

export const VIEWER_BASE = new URL(
  (import.meta.env.VITE_VIEWER_BASE ?? `/ips${dev ? '/index.html' : ''}`)+'#',
  window.location.href
).toString();
export const PATIENT_IPS = {
  'Dave deBronkart': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/11013/$summary'
}
export const EXAMPLE_IPS = {
  'Maria SEATTLE Gravitate': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/14599/$summary',
  'Peter Keith Jones': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/11013/$summary',
  'Angela Roster': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/10965/$summary',
  'Horace Skelly': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/11142/$summary',
  'Anonymous': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/10999/$summary',
  'Desiree': 'https://fhir.ips-demo.dev.cirg.uw.edu/fhir/Patient/Pat1-System2/$summary'
};
export const IPS_DEFAULT = 'Maria SEATTLE Gravitate';
