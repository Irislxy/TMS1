<script>
  import { onMount } from 'svelte';
  import { axios } from '../../lib/config';
  import { goto } from '$app/navigation';

  let user = { user_name: '', email: '', active: 1, isAdmin: false };
  let newEmail = '';
  let newPassword = '';
  let errorMessage = '';
  let successMessage = '';


  // Fetch current user data
  onMount(async () => {
    checkStatus();
  });

  const checkStatus = async () => {
    try {
      const response = await axios.get('/api/v1/getUserDetails', {
        withCredentials: true
      });
      user.user_name = response.data.user.username;
      user.email = response.data.user.email;
      user.active = response.data.user.active;
      user.isAdmin = response.data.user.isAdmin;
    } catch (error) {
      if (error.response.data.errMessage == "User is not found or disabled") {
        goto('/');
      }
      errorMessage = 'Failed to fetch user profile';
    }
  };

  // Update email
  const updateEmail = async (event) => {
    event.preventDefault(); // Prevent default form submission
    errorMessage = '';
    successMessage = '';

    // Check user's status before any action
    await checkStatus();

    const updateData = { user_name: user.user_name, email: newEmail };

    if (!newEmail) {
      errorMessage = 'Empty email field'
      return;
    }

    try {
      const response = await axios.put('/api/v1/updateEmail',
        updateData, 
      {
        withCredentials: true
      });

      user.email = newEmail; //reassigning email with the new email
      
      successMessage = 'Email updated successfully!';
      errorMessage = ''; // Clear any previous error messages
    } catch (error) {
        if (error.response && error.response.status === 400) {
            errorMessage = 'Email does not meet requirements';
        } else if (error.response && error.response.status === 500) {
            errorMessage = 'Failed to update email';
        }
        successMessage = ''; // Clear any previous success messages
    }
  };

  // Update Password
  const updatePassword = async (event) => {
    event.preventDefault(); // Prevent default form submission
    errorMessage = '';
    successMessage = '';

    // Check user's status before any action
    await checkStatus();

    const updateData = { user_name: user.user_name, password: newPassword };

    if (!newPassword) {
        errorMessage = 'Empty password field'
        return;
    }

    const regex = new RegExp(/((?=.*\d)(?=.*[a-zA-Z])(?=.*[\W\_]).{8,10})/g)
    if (!regex.test(newPassword)) {
      errorMessage = 'Password does not meet requirements'
      return;
    }

    try {
      const response = await axios.put('/api/v1/updatePassword',
        updateData,
      {
        withCredentials: true
      });
      
      successMessage = 'Password updated successfully!';
      errorMessage = ''; // Clear any previous error messages
    } catch (error) {
        if (error.response && error.response.status === 500) {
          errorMessage = 'Failed to update password';
        }
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
