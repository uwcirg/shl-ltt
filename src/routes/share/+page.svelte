<script lang="ts">
  import HealthLinkLTT from '$lib/HealthLinkLTT.svelte';
  import AddFileLTT from '$lib/AddFileLTT.svelte';
  import { onMount } from 'svelte';
  import { log } from '$lib/logger';

  let shlReady = false;

  function updateReady(ready: boolean) {
    shlReady = ready;
  }

  onMount(() => {
    log("Share page loaded" );
  })
</script>

<svelte:head>
  <title>Let's Talk Tech - Share</title> 
</svelte:head>

<AddFileLTT
  on:shl-ready={ ({ detail }) => { updateReady(detail) } }
/>

{#if shlReady}
  <HealthLinkLTT/>
{/if}
