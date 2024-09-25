<script>
  import { onMount } from 'svelte';
	import { axios } from '$lib/config';
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';

	let user = { user_name: '', email: '', active: 1, isAdmin: false };
	let apps = [];
	let showModal = false;
	let newApp = { app_acronym: '', app_description: '', app_rnumber: '', app_startdate: '', app_enddate: '', app_permit_create: '', app_permit_open: '', app_permit_todolist: '', app_permit_doing: '', app_permit_done: '' };
	let errorMessage = '';
	let successMessage = '';

	// Fetch current user data
	onMount(async () => {
    await checkStatus();
		await fetchAllApp();
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

  // Fetch all apps using the getAllApp
  const fetchAllApp = async () => {
    try {
      const response = await axios.get('/api/v1/getAllApp', {
        withCredentials: true
      });
      apps = response.data.data;
			//console.log(apps);
    } catch (error) {
      console.error("Error fetching apps:", error);
      errorMessage = 'Failed to fetch apps';
    }
  };

	// Function to handle creating a new app
	const handleCreateApp = async () => {
		await checkStatus();
		errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message

		// Check if all required fields are provided
		if (!newApp.app_acronym || !newApp.app_rnumber || !newApp.app_startdate || !newApp.app_enddate) {
			errorMessage = 'Acronym, R Number, Start Date, End Date is required';
			return;
  	}

		// Check if app_acronym meets requirements
		const regex = /^[a-zA-Z0-9_]{1,64}$/;
		if (!regex.test(newApp.app_acronym)) {
			errorMessage = 'Invalid App name. Only alphanumeric characters and underscores are allowed.';
			return;
    }

		// Check if R Number is a positive integer
		if (isNaN(newApp.app_rnumber) || newApp.app_rnumber <= 0) {
			errorMessage = 'R Number must be a positive integer.';
			return;
		}

		try {
				const response = await axios.post('/api/v1/createApp', newApp, 
				{
						withCredentials: true
				});
				
				errorMessage = '';
				successMessage = 'App Created';
				//console.log(response.data);
				// groupNames.push({ label: response.data.data.group_name }); 
				newApp = newApp;
				newApp = {};
				errorMessage = ''; // Clear any previous error messages
		} catch (error) {
				if (error.response && error.response.status === 409) { // havent done duplication error in backend
						// Catch duplicate entry error
						errorMessage = 'App already exists.';
				} else {
						// Catch any other errors
						errorMessage = 'Error creating app.';
				}
				successMessage = ''; // Clear any previous success messages
		}
  };

	// Function to handle view button click
	const handleView = async (user) => {
		await checkStatus();
		goto('/task');
	};
</script>

{#if errorMessage}
<p style="color: red;">{errorMessage}</p>
{/if}

{#if successMessage}
<p style="color: green;">{successMessage}</p>
{/if}

<div class="container">
	<!-- Create App Button -->
	<button class="create-app-button" on:click={() => (showModal = true)}>
		Create App
	</button>

	<Modal bind:showModal>
		<h3 slot="header">
			Create App
		</h3>

		<!-- App Acronym Field -->
		<div class="form-group">
			<label for="app_acronym">Acronym: </label>
			<input type="text" id="app_acronym" bind:value={newApp.app_acronym} required />
		</div>

		<!-- App Description Field -->
		<div class="form-group">
			<label for="app_description">Description: </label>
			<textarea id="app_description" bind:value={newApp.app_description}></textarea>
		</div>

		<!-- App Running Number Field -->
		<div class="form-group">
			<label for="app_rnumber">R Number: </label>
			<input type="number" id="app_rnumber" bind:value={newApp.app_rnumber} required min="1" />
		</div>

		<div class="date-group">
			<!-- App Start Date Field -->
			<div class="form-group">
				<label for="app_startdate">Start Date: </label>
				<input type="date" id="app_startdate" bind:value={newApp.app_startdate} required />
			</div>

			<!-- App End Date Field -->
			<div class="form-group" style="margin-left: 20px;">
				<label for="app_enddate">End Date: </label>
				<input type="date" id="app_enddate" bind:value={newApp.app_enddate} required />
			</div>
		</div>

		<h3>
			Permit Group
		</h3>

		<!-- App Permit Create Field -->
		<div class="form-group">
			<label for="app_permit_create">Create: </label>
			<select id="app_permit_create" bind:value={newApp.app_permit_create}>
				<option value="Project Lead">Project Lead</option>
				<option value="Project Manager">Project Manager</option>
				<option value="Developer">Developer</option>
			</select>
		</div>

		<!-- App Permit Open Field -->
		<div class="form-group">
			<label for="app_permit_open">Open: </label>
			<select id="app_permit_open" bind:value={newApp.app_permit_open}>
				<option value="Project Lead">Project Lead</option>
				<option value="Project Manager">Project Manager</option>
				<option value="Developer">Developer</option>
			</select>
		</div>

		<!-- App Permit To-Do List Field -->
		<div class="form-group">
			<label for="app_permit_todolist">To-Do List: </label>
			<select id="app_permit_todolist" bind:value={newApp.app_permit_todolist}>
				<option value="Project Lead">Project Lead</option>
				<option value="Project Manager">Project Manager</option>
				<option value="Developer">Developer</option>
			</select>
		</div>

		<!-- App Permit Doing Field -->
		<div class="form-group">
			<label for="app_permit_doing">Doing: </label>
			<select id="app_permit_doing" bind:value={newApp.app_permit_doing}>
				<option value="Project Lead">Project Lead</option>
				<option value="Project Manager">Project Manager</option>
				<option value="Developer">Developer</option>
			</select>
		</div>

		<!-- App Permit Done Field -->
		<div class="form-group">
			<label for="app_permit_done">Done: </label>
			<select id="app_permit_done" bind:value={newApp.app_permit_done}>
				<option value="Project Lead">Project Lead</option>
				<option value="Project Manager">Project Manager</option>
				<option value="Developer">Developer</option>
			</select>
		</div>

		<button on:click={handleCreateApp}>Create App</button>
	</Modal>

	<div class="app-list">
		{#each apps as app}
			<div class="app-card">
				<h2>{app.app_acronym}</h2>
				<p>{app.app_description}</p>
				<p>{app.app_rnumber}</p>
				<div class="app-footer">
					<button class="view-button" on:click={() => handleView(user)}>View</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		width: 70%;
		margin: auto;
		padding: 20px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
	}

	.create-app-button {
    position: absolute;
    top: 100px;
    right: 10px;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

	.app-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.app-card {
		padding: 20px;
		border: 1px solid #ccc;
		border-radius: 5px;
		text-align: left;
		position: relative; /* Create a positioning context for absolute children */
	}

	.app-card p {
		margin: 10px 0;
	}

	.app-footer {
    display: flex;
    justify-content: flex-end; /* Align contents to the right */
    position: absolute; /* Position absolute within the card */
    bottom: 10px; /* 10px from the bottom */
    right: 10px; /* 10px from the right */
  }

	.form-group {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
	}

	.date-group {
		display: flex;
		gap: 20px;
	}

	.form-group label {
		margin-bottom: 5px;
		font-size: small;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 5px;
		width: 80%;
	}

	.view-button {
    background: none;
    border: none;
    color: blue;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }

  .view-button:hover {
    color: darkblue;
  }

  .view-button:focus {
    outline: 2px solid #000;
    outline-offset: 2px;
  }
</style>