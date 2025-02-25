<script lang="ts">
    import * as jose from 'jose';
    import * as pako from 'pako';
    import { createEventDispatcher, getContext } from 'svelte';
    import {
      Alert
    } from 'sveltestrap';
    import FetchSoFLTT from './FetchSoFLTT.svelte';
    import type { Writable } from 'svelte/store';
    import type { SHLAdminParams, SHLClient } from '$lib/managementClient';
    import type { SOFClient } from './sofClient';
    import issuerKeys from './issuer.private.jwks.json';
    import type { SHCFile,
      Bundle,
      ResourceRetrieveEvent,
      SHLRetrieveEvent,
      SHLSubmitEvent} from './types';
    import RetrieveShl from './RetrieveSHL.svelte';
    import { log } from '$lib/logger';

    let shlStore: Writable<SHLAdminParams> = getContext('shlStore');
    let shlClient: SHLClient = getContext('shlClient');
    let sofClient: SOFClient = getContext('sofClient');

    const shlReadyDispatch = createEventDispatcher<{ 'shl-ready': boolean }>();
    const shlDispatch = createEventDispatcher<{ 'shl-submitted': SHLSubmitEvent }>();
    let submitting = false;
    let fetchError = "";
    let createSHL = false;
    let updatedShl = false;

    let shlResult: SHLRetrieveEvent = {
      shl: undefined
    }

    let resourceResult: ResourceRetrieveEvent = {
      resources: undefined
    }

    let resourcesToReview: any[] = [];

    let label = `My Choices Report (${new Date().toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'})})`;
    let passcode = "";
    let today = new Date();
    let sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

    let checkedShl = false;
    let fetchedResources = false;

    let patientId: string;
    let sessionId: string;

    $: {
      if (checkedShl && fetchedResources) {
        render();
      }
    }

    async function render() {
      // True when FetchSoF and RetrieveSHL resolve. Creates a new SHL if no SHL was retrieved.
      if (resourcesToReview.length > 0 && ($shlStore !== undefined || createSHL)) {
        let patient: any = resourcesToReview.filter((r) => r.resourceType === "Patient")[0];
        // TODO: Get summary DocumentReferences from resourcesToReview
        let summaryDocRefs: any[] = resourcesToReview.filter((r) => r.resourceType === "DocumentReference" && !(r.type?.coding[0]?.code === "34108-1"));
        if (summaryDocRefs.length === 0) {
          console.error('No sessions found for user');
        }
        // Compare sessionIDs in most recent DocRef with sessionID in most recent SHL
        // let mostRecentDocRef = summaryDocRefs.sort((a, b) => b.date - a.date)[0];
        let mostRecentDocRef = summaryDocRefs[0];
        // TODO: Get shl DocumentReferences from resourcesToReview
        let shlDocRefs: any[] = resourcesToReview.filter((r) => r.resourceType === "DocumentReference" && r.type?.coding[0]?.code === "34108-1");

        patientId = sofClient.getPatientID();
        sessionId = mostRecentDocRef.id;

        if (createSHL) {
          console.log("Creating new SHL");
          createSHL = false;
          newShl(patient, mostRecentDocRef);
        } else {
          getCurrentShl(patient, mostRecentDocRef, shlDocRefs);
        }
      }
    }

    async function newShl(patient: any, mostRecentDocRef: any) {
      if (mostRecentDocRef) {
        let ips = createIpsPayload(patient, mostRecentDocRef);
        let shc = await packageShc(ips);
        let shl = await submitShl([shc]);
        let reportDate = new Date(mostRecentDocRef.date)
          .toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        let reportLabel = `My Choices Report (${reportDate})`;
        let result = await sofClient.postShl(shl, mostRecentDocRef, reportLabel);
        $shlStore = shl;
        console.log($shlStore);
        log({
          action: "create",
          entity: {
            detail: {
              action: `Created SHL '${$shlStore.id}'`,
              shl_session: $shlStore.sessionId ?? "",
              shl: $shlStore.id,
              patient: patient.id,
              docref: mostRecentDocRef.id
            }
          }
        });
        shlReadyDispatch('shl-ready', true);
      } else {
        fetchError = "No Report found";
        throw Error("Unable to create SHL: no summary found for patient");
      }
    }

    async function getCurrentShl(patient: any, mostRecentDocRef: any, shlDocRefs: any[]) {
      // Look for id of shlStore in shls from HAPI
      let found = false;
      for(let i=0; i < shlDocRefs.length; i++) {
        // Decode docref data
        let data = atob(shlDocRefs[i].content[0].attachment.data);
        let shlData = JSON.parse(data);
        // Populate shl fields if the document reference is a match
        if (shlData.id == $shlStore.id) {
          $shlStore.encryptionKey = shlData.encryptionKey;
          $shlStore.managementToken = shlData.managementToken;
          $shlStore.label = shlData.label;
          $shlStore.files = [];
          found = true;
          break;
        }
      }

      if (found) {
        console.log("Successfully retrieved SHL and Resources");
        if (mostRecentDocRef.id != $shlStore.sessionId) {
          console.log(`Most recent SHL ${$shlStore.id} doesn't match session ${$shlStore.sessionId}, updating SHL`);
          let deleted = await shlClient.deleteAllFiles($shlStore);
          let ips = createIpsPayload(patient, mostRecentDocRef);
          let shc = await packageShc(ips);
          $shlStore.sessionId = mostRecentDocRef.id;
          $shlStore.exp = sixMonths.getTime() / 1000;
          let updated = await shlClient.updateShl($shlStore);
          $shlStore = await addFiles($shlStore, [shc]);
          let reportDate = new Date(mostRecentDocRef.date)
            .toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          let reportLabel = `My Choices Report (${reportDate})`;
          let result = await sofClient.postShl($shlStore, mostRecentDocRef, reportLabel);
          $shlStore.label = result.label;
          log({
            action: "create",
            entity: {
              detail: {
                action: `Created new SHL for updated report '${$shlStore.id}'`,
                shl_session: $shlStore.sessionId ?? "",
                shl: $shlStore.id,
                patient: patient.id,
                docref: mostRecentDocRef.id
              }
            }
          });
          updatedShl = true;
        }
        // The current SHL is most recent, so use it
        shlReadyDispatch('shl-ready', true);
      } else if (mostRecentDocRef) {
        console.log(`Couldn't find FHIR record for SHL ${$shlStore.id} and session ${$shlStore.sessionId}, creating new SHL`);
        log({
          action: "read",
          entity: {
            detail: {
              action: `Recreating SHL for '${$shlStore.sessionId}'`,
              shl_session: $shlStore.sessionId ?? "",
              shl: $shlStore.id
            }
          }
        });
        shlClient.deleteShl($shlStore);
        newShl(patient, mostRecentDocRef);
      } else {
        fetchError = "No report found.";
        log({
          action: "read",
          severity: "error",
          entity: {
            detail: {
              action: `No report found for '${$shlStore.sessionId}'`,
              shl_session: $shlStore.sessionId ?? "",
              shl: $shlStore.id,
              patient: patient.id
            }
          }
        })
      }
    }

    async function handleNewResources(details: ResourceRetrieveEvent) {
      resourceResult = details;
      if (resourceResult.resources) {
        // Trigger update in ResourceSelector
        resourcesToReview = resourceResult.resources;
        fetchedResources = true;
      } else {
        fetchError = "Error fetching Choices Report.";
      }
    }

    async function updateShl(details: SHLRetrieveEvent) {
      shlResult = details;
      if (shlResult.shl) {
        log({
          action: "read",
          entity: {
            detail: {
              action: `Loaded SHL '${shlResult.shl.id}'`,
              shl_session: sessionId,
              shl: shlResult.shl.id,
              patient: patientId
            }
          }
        });
        // Trigger update in store
        $shlStore = shlResult.shl;
      } else {
        createSHL = true;
      }
      checkedShl = true;
    }

    function createIpsPayload(patient:any, docref:any) {
      let payload = {
        "resourceType": "Bundle",
        "type": "document",
        "entry": [{
          "fullUrl": "urn:uuid:32c664eb-86af-46b4-8937-acfe5fb2f2c7", "resource": {
            "resourceType": "Composition",
            "status": "final",
            "type": {
              "coding": [
                {
                  "system": "http://loinc.org",
                  "code": "60591-5",
                  "display": "Patient Summary Document"
                }
              ]
            },
            "subject": {
              "reference": "urn:uuid:e154ab0d-b714-4e16-96a7-e6f8b1b95344"
            },
            "date": new Date().toDateString(),
            "title": "Let's Talk Tech Summary",
            "confidentiality": "N",
            "section": [
              {
                "title": "Advance Directives",
                "code": {
                  "coding": [
                    {
                      "system": "http://loinc.org",
                      "code": "42348-3",
                      "display": "Advance Directive Document"
                    }
                  ]
                },
                "entry": [
                  {
                    "reference": "urn:uuid:0b85017e-217f-4d92-8d4d-18c428dab7f5"
                  }
                ]
              }
            ]
          }
        }, {
          "fullUrl": "urn:uuid:e154ab0d-b714-4e16-96a7-e6f8b1b95344",
          "resource": patient
        }, {
          "fullUrl": "urn:uuid:0b85017e-217f-4d92-8d4d-18c428dab7f5",
          "resource": docref
        }]
      };
      
      return payload;
    }
    
    function isShcFile(object: any): object is SHCFile {
      return 'verifiableCredential' in object;
    }

    async function packageShc(content:SHCFile | Bundle | undefined): Promise<SHCFile> {
        if (content != undefined && isShcFile(content) && content.verifiableCredential) {
          return content;
        }

        const shc = await signJws(content);

        return { verifiableCredential: [shc] };
    }

    function submitShl(shcs: SHCFile[]): Promise<SHLAdminParams>{
      return newShlFromShc({
        shcs: shcs,
        label,
        passcode: passcode ?? undefined,
        exp: sixMonths.getTime() / 1000
      });
    }

    async function addFiles(shl:SHLAdminParams, fileList:SHCFile[]): Promise<SHLAdminParams> {
      for (let i=0; i < fileList.length; i++) {
        shl = await shlClient.addFile(shl, fileList[i], 'application/smart-health-card');
      }
      return shl;
    }

    async function newShlFromShc(details: SHLSubmitEvent): Promise<SHLAdminParams> {
      let shlCreated = await shlClient.createShl({
        exp: details.exp,
        passcode: details.passcode,
        userId: patientId,
        sessionId: sessionId
      });
      shlCreated = await addFiles(shlCreated, details.shcs);
      shlCreated.label = details.label;
      shlCreated.passcode = details.passcode;
      return shlCreated;
    }

    const exampleSigningKey = jose.importJWK(issuerKeys.keys[0]);
    async function signJws(payload: unknown) {
        const fields = { zip: 'DEF', alg: 'ES256', kid: issuerKeys.keys[0].kid };
        const body = pako.deflateRaw(
            JSON.stringify({
                iss: 'https://spec.smarthealth.cards/examples/issuer',
                nbf: new Date().getTime() / 1000,
                vc: {
                    type: ['https://smarthealth.cards#health-card'],
                    credentialSubject: {
                        fhirVersion: '4.0.1',
                        fhirBundle: payload
                    }
                }
            })
        );

        const signed = new jose.CompactSign(body)
        .setProtectedHeader(fields)
        .sign(await exampleSigningKey);
        return signed;
    }
</script>

<!-- Retrieves the patient's SHL on mount -->
<RetrieveShl
  on:shl-retrieved={ async ({ detail }) => { updateShl(detail) } }
/>

<!-- Retrieves SOF resources on mount -->
<FetchSoFLTT
  on:updateResources={ async ({ detail }) => { handleNewResources(detail) } }
/>

{#if fetchError}
<Alert color="danger">
  <h4 class="alert-heading text-capitalize">{fetchError}</h4>
  You can try again later, click "Back" to choose another option, or reach out for help below.
</Alert>
{/if}

{#if updatedShl}
<Alert color="success" dismissible>
  <h4 class="alert-heading">Your report has been updated</h4>
  Your shareable link now shows your most recent Choices Report.
  <br>
  People who already have access can now see your updated choices.
</Alert>
{/if}
