// import {PUBLIC_BASE_URL} from '$env/static/public';
import { dev } from '$app/environment';
import { toMilliseconds } from '$lib/util';

export const API_BASE = import.meta.env.VITE_API_BASE;

export const OIDC_BASE = import.meta.env.VITE_OIDC_SERVER_BASE;
export const CHECK_SESSION_IFRAME = import.meta.env.VITE_OIDC_CHECK_SESSION_IFRAME;
export const LOGOUT_URL = import.meta.env.VITE_OIDC_LOGOUT_ENDPOINT;

export const BACK_URL = import.meta.env.VITE_BACK_URL;

export const FHIR_R4_EXTERNAL_ID_SYSTEM = import.meta.env.VITE_FHIR_R4_EXTERNAL_ID_SYSTEM;

const timeout = (import.meta.env.VITE_INACTIVITY_TIMEOUT ?? "04:00:00").split(":").map((n) => Number(n));
export const INACTIVITY_TIMEOUT = toMilliseconds(timeout[0] ?? 0, timeout[1] ?? 0, timeout[2] ?? 0);

export const SOF_PATIENT_RESOURCES = [
  'Patient',
  'DocumentReference'
];

export const RESOURCE_SCOPE = SOF_PATIENT_RESOURCES.map(resourceType => `patient/${resourceType}.read`).join(" ");
const keycloakScope = `openid online_access`;
const fullScope = `${keycloakScope} fhirUser ${RESOURCE_SCOPE}`;
const SOF_REDIRECT_URI = `${window.location.origin}/share`;

export const SOF_HOSTS = [
  {
    id: "keycloak",
    name: "Let's Talk Tech Login",
    iss: import.meta.env.VITE_SOF_ISS,
    clientId: import.meta.env.VITE_SOF_CLIENT_ID,
    scope: keycloakScope,
    redirect_uri: SOF_REDIRECT_URI,
    note: "Credentials provided"
  }
];

export const VIEWER_BASE = new URL(
  (import.meta.env.VITE_VIEWER_BASE || `/view${dev ? '/index.html' : ''}`)+'#',
  window.location.href
).toString();
