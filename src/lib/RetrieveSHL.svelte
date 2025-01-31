<script lang="ts">
    import { createEventDispatcher, onMount, getContext } from 'svelte';
    import { Alert } from 'sveltestrap';
    import type { SHLClient } from '$lib/managementClient';
    import type { SHLRetrieveEvent } from './types';
    import type { SOFClient } from '$lib/sofClient'
    import { log } from '$lib/logger';

    let shlClient: SHLClient = getContext('shlClient');
    let sofClient: SOFClient = getContext('sofClient');

    const shlRetrievalDispatch = createEventDispatcher<{ 'shl-retrieved': SHLRetrieveEvent }>();

    let fetchError = "";

    onMount(async () => {
        let patientId = undefined;
        try {
          // get current patient from sofClient
          let patientId = sofClient.getPatientID();
          // retrieve SHLs for current patient via shlClient
          let shl = await shlClient.getUserShl(patientId).catch((reason) => {
            console.log(reason);
            return undefined;
          });
          return shlRetrievalDispatch('shl-retrieved', {
            shl: shl
          });
        } catch (error) {
          fetchError = "Unable to retrieve most recent sharing link.";
          console.error(`Error retrieving SHL for patient ${patientId}: ${error}`);
          log({
            severity: "error",
            action: "read",
            entity: {
              detail: {
                action: `Retrieve SHL for patient ${patientId}`,
                message: fetchError
              }
            },
            outcome: `${JSON.stringify(error)}`
          })
        }
        // Meanwhile, in FetchSOF:
          // retrieve DocRefs for current patient (reports and shl metadata)
        
        // Then, in AddFile:
          // Compare sessionIDs in most recent DocRef with sessionID in most recent SHL
          // Create a new SHL if out of date
          // Return the current shl
    });

</script>

{#if fetchError}
<Alert color="danger">
  <h4 class="alert-heading text-capitalize">{fetchError}</h4>
  You can reach out for help below, or click "Back" for more options.
</Alert>
{/if}
