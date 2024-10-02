<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import { page } from '$app/stores';
  import { app_name } from '$lib/stores.js';
  let pageTitle = '';
  let user = { user_name: '', email: '' };
  let currentAppAcronym;

  $: {
    app_name.subscribe(value => {
        currentAppAcronym = value;
      });
  };

  // Update the title based on the current route
  $: {
    if ($page.url.pathname === '/appList') {
        pageTitle = 'App List';
    } else if ($page.url.pathname === '/userManagement') {
        pageTitle = 'User Management';
    } else if ($page.url.pathname === '/userProfile') {
      pageTitle = 'User Profile';
    } else if ($page.url.pathname === '/task') {
      pageTitle = `Kanban (${currentAppAcronym})`;
    } else {
        pageTitle = 'App List';
    }
  }
</script>

{#if $page.url.pathname !== '/'}
   <Navbar pageTitle={pageTitle} {user} />
{/if}

<slot />