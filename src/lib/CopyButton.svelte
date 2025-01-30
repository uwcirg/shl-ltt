<script lang="ts">
    import {
      Button,
      Icon
    } from 'sveltestrap';
    import { log } from '$lib/logger';

    let copyNotice = '';
  
    export let id: string;
    export let href: string;
  
    async function copyShl() {
        let copyNoticePrev = copyNotice;
        copyNotice = '...';
        let text = href;
        navigator.clipboard.writeText(text);
        copyNotice = 'Copied!';
        setTimeout(() => {
            copyNotice = copyNoticePrev;
        }, 8000);
        log({
            action: 'read',
            entity: {
                detail: {
                    action: `Copied SHL to clipboard`,
                    url: href,
                    Button: id
                }
            }
        })
    }
</script>
{#if copyNotice}
    <Button size="lg" color="secondary" class="p-3" disabled>
        <Icon name="clipboard" />
        {copyNotice}
    </Button>
{:else}
    <Button size="lg" color="primary" class="p-3" on:click={copyShl}>
        <Icon name="clipboard" />
        Click here to copy a link to your Report
    </Button>
{/if}
