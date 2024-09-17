<script>
  import { onMount } from 'svelte';
  import { axios } from '../../lib/config';

  let user = { user_name: '', email: '' };
  let newEmail = '';
  let newPassword = '';
  let errorMessage = '';
  let successMessage = '';


  // Fetch current user data
  onMount(async () => {
    try {
      const response = await axios.get('/api/v1/user', {
        withCredentials: true
      });
      user.user_name = response.data.user.username;
      user.email = response.data.user.email;

    } catch (error) {
      errorMessage = 'Failed to fetch user profile';
    }
  });

  // Update email
  const updateEmail = async (event) => {
    event.preventDefault(); // Prevent default form submission
    errorMessage = '';
    successMessage = '';

    const updateData = { user_name: user.user_name, email: newEmail };

    try {
      const response = await axios.put('/api/v1/updateEmail',
        updateData, 
      {
        withCredentials: true
      });
      
      successMessage = 'Profile updated successfully!';
      errorMessage = ''; // Clear any previous error messages
    } catch (error) {
      errorMessage = 'Failed to update profile';
      successMessage = ''; // Clear any previous success messages
    }
  };

  // Update Password
  const updatePassword = async (event) => {
    event.preventDefault(); // Prevent default form submission
    errorMessage = '';
    successMessage = '';

    const updateData = { user_name: user.user_name, password: newPassword };

    try {
      const response = await axios.put('/api/v1/updatePassword',
        updateData,
      {
        withCredentials: true
      });
      
      successMessage = 'Profile updated successfully!';
      errorMessage = ''; // Clear any previous error messages
    } catch (error) {
      errorMessage = 'Failed to update profile';
      successMessage = ''; // Clear any previous success messages
    }
  };
</script>

<div class="container">
	<h2>User details</h2>
	<p>Username: {user.user_name}</p>
	<p>Email: {user.email}</p>

  <h2>Update Email</h2>
	<form action="">
		<div class="form-group">
			<label for="new-email">Update Email</label>
			<input id="new-email" type="email" bind:value={newEmail} placeholder="New Email" />
      <button on:click={updateEmail}>Update email</button>
		</div>
	</form>

  <h2>Change Password</h2>
	<form action="">
		<div class="form-group">
			<label for="new-password">Change Password</label>
			<input id="new-password" type="password" bind:value={newPassword} placeholder="New Password" />
      <button on:click={updatePassword}>Change password</button>
		</div>
	</form>

  {#if successMessage}
    <p class="success-message">{successMessage}</p>
  {/if}
  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {/if}
</div>

<style>
	.container {
		width: 50%;
		margin: auto;
		padding: 20px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
	input,
	button {
		width: 100%;
		padding: 8px;
		margin-top: 10px;
	}
	.form-group {
		display: flex;
		align-items: center;
		margin-top: 10px;
	}
	.form-group label {
		flex: 1 0 120px; /* label width */
	}
	.form-group input,
	.form-group button {
		flex: 1 0 200px; /* input and button width */
		padding: 8px;
	}
  .error-message {
        color: red;
        margin-top: 10px;
  }
  .success-message {
        color: green;
        margin-top: 10px;
  }
</style>
