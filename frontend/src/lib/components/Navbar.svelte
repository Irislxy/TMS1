<script>
  import { goto } from '$app/navigation'; // SvelteKit's navigation
  import { axios } from '$lib/config';
  import { onMount } from 'svelte';

  export let pageTitle = 'App List'; // Default page title
  export let user;
  // let isAdmin = false;

  const goToProfile = () => {
    checkStatus();
    goto("/userProfile/"); // Navigate to the profile page
  };

  const goToUserManagement = () => {
    checkStatus();
    goto("/userManagement/"); // Navigate to the user management page (admin only)
  };

  const logOut = async () => {
    try {
      await axios.post('/api/v1/logout', {}, {
        withCredentials: true // Ensure the cookie is sent along with the request
      });
      
      console.log('Logged out successfully');
      goto('/'); // Navigate to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Fetch current user data
  onMount(async () => {
    await checkStatus();
  });

  const checkStatus = async () => {
    try {
      const response = await axios.get('/api/v1/getUserDetails', {
        withCredentials: true
      });
      user.user_name = response.data.user.username;
      user.email = response.data.user.email;
      user.isAdmin = response.data.user.isAdmin
      //console.log(user);
    } catch (error) {
      //console.log(error);
      if (error.response.data.errMessage == "User is not found or disabled") {
        logOut();
        errorMessage = 'Invalid credentials. Please login again';
      }
      // errorMessage = 'Failed to fetch user profile';
    }
  }
</script>

<nav class="navbar">
  <!-- navbar left -->
  <div class="navbar-left">
    <h1 class="page-title">{pageTitle}</h1> <!-- Dynamic page title -->
  </div>

  <!-- navbar right -->
  <div class="navbar-right">
      <span class="username">{user.user_name}</span>
    <!-- Profile dropdown container -->
    <div class="profile-container">
      <img 
        src="/profile-icon.png" 
        alt="Profile" 
        class="profile-icon"
      />
      
      <!-- Dropdown menu -->
      <div class="dropdown-menu">
        <button on:click={goToProfile}>View / Edit Profile</button>
        <!-- Show the User Management button only if the user is an admin -->
        {#if user.isAdmin}
          <button on:click={goToUserManagement}>User Management</button>
        {/if}
        <button on:click={logOut}>Log Out</button>
      </div>
    </div>
  </div>
</nav>

<style>
  /* Navbar container */
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #D3D3D3;
    padding: 1rem;
    color: white;
  }

  /* Left section (Page title) */
  .navbar-left .page-title {
    font-size: 1.5rem;
    margin: 0;
    color: #000000;
  }

  /* Right section (Profile and username) */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1rem; /* Space between username and profile icon */
  }

  /* Username */
  .navbar-right .username {
    font-size: 1rem;
    color: #000000;
  }

  /* Profile icon */
  .profile-container {
    position: relative;
  }

  .profile-icon {
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 50%;
  }

  /* Dropdown menu */
  .dropdown-menu {
    display: none;
    position: absolute;
    right: 0;
    top: 45px;
    background-color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    z-index: 1;
  }

  .dropdown-menu button {
    display: block;
    width: 100%;
    padding: 10px 20px;
    background-color: white;
    color: black;
    border: none;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
  }

  .dropdown-menu button:hover {
    background-color: #f1f1f1;
  }

  /* Show dropdown on hover */
  .profile-container:hover .dropdown-menu {
    display: block;
  }
</style>
