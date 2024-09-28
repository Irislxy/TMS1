<script>
  import { onMount } from 'svelte';
	import { axios } from '$lib/config';
	import { goto } from '$app/navigation';
	import { app_name } from '$lib/stores.js';
	import Modal from '$lib/components/Modal.svelte';
	import AppModal from '$lib/components/AppModal.svelte';

	let user = { user_name: '', email: '', active: 1, isAdmin: false };
	let apps = [];
	let appDetails = [];
	let showModal = false; // modal for create app
	let showAppModal = false; // modal for edit app
	let newApp = { app_acronym: '', app_description: '', app_rnumber: '', app_startdate: '', app_enddate: '', app_permit_create: '', app_permit_open: '', app_permit_todolist: '', app_permit_doing: '', app_permit_done: '' };
	let editApp = { app_acronym: '', app_description: '', app_permit_create: '', app_permit_open: '', app_permit_todolist: '', app_permit_doing: '', app_permit_done: '' };
	let errorMessage = '';
	let successMessage = '';

	// Fetch current user data
	onMount(async () => {
    await checkStatus();
		await fetchAllApp();
  });

  const checkStatus = async () => {
    try {
      const response = await axios.get('/api/v1/getUserDetails', { withCredentials: true });
      user.user_name = response.data.user.username;
      user.email = response.data.user.email;
      user.active = response.data.user.active;
      user.isAdmin = response.data.user.isAdmin;
			user.isPL = response.data.user.isPL;
    } catch (error) {
      if (error.response.data.errMessage == "User is not found or disabled") {
        goto('/');
      }
      errorMessage = 'Failed to fetch user profile';
    }
  };

  // Fetch all apps to display
  const fetchAllApp = async () => {
    try {
      const response = await axios.get('/api/v1/getAllApp', { withCredentials: true });
      apps = response.data.data;
    } catch (error) {
      console.error("Error fetching apps:", error);
      errorMessage = 'Failed to fetch apps';
    }
  };

	// Fetch app details to edit
	const fetchAppDetails = async (appAcronym) => {
    try {
      const response = await axios.post('/api/v1/getAppDetails', { app_acronym: appAcronym }, { withCredentials: true });
      appDetails = response.data.data[0];
    } catch (error) {
      console.error("Error fetching app details:", error);
      errorMessage = 'Failed to fetch app details';
    }
  };

	// Function to handle create app
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
				const response = await axios.post('/api/v1/createApp', newApp, { withCredentials: true });
				
				errorMessage = '';
				successMessage = 'App Created';
				apps.push({ 
					app_acronym: newApp.app_acronym,
					app_description: newApp.app_description,
					app_rnumber: newApp.app_rnumber,
					app_startdate: newApp.app_startdate,
					app_enddate: newApp.app_enddate,
					app_permit_create: newApp.app_permit_create,
					app_permit_open: newApp.app_permit_open,
					app_permit_todolist: newApp.app_permit_todolist,
					app_permit_doing: newApp.app_permit_doing,
					app_permit_done: newApp.app_permit_done
				});
				apps = apps;
				newApp = {};
		} catch (error) {
				successMessage = '';
				if (error.response && error.response.status === 409) {
						// Catch duplicate entry error
						errorMessage = 'App already exists';
				} else {
						// Catch any other errors
						errorMessage = 'Error creating app';
				}
		}
  };

	// Function to handle edit app
	const handleEditApp = async () => {
		await checkStatus();
		errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message

		try {
			const response = await axios.patch('/api/v1/updateApp', editApp, { withCredentials: true });

			// Check if any changes were made
			if (response.status === 200 && response.data.message === "No changes were made") {
				errorMessage = 'No changes were made';
				return;
			}
			
			successMessage = 'App Updated';
			apps.push({ 
				app_acronym: editApp.app_acronym,
				app_description: editApp.app_description,
				app_rnumber: appDetails.app_rnumber, // cannot change aft creation
				app_startdate: appDetails.app_startdate, // cannot change aft creation
				app_enddate: appDetails.app_enddate, // cannot change aft creation
				app_permit_create: editApp.app_permit_create,
				app_permit_open: editApp.app_permit_open,
				app_permit_todolist: editApp.app_permit_todolist,
				app_permit_doing: editApp.app_permit_doing,
				app_permit_done: editApp.app_permit_done
			});
			apps = apps;
		} catch (error) {
			console.error("Error updating app:", error);
			errorMessage = 'Error updating app';
		}
	};

	// View button clicked
	const handleView = async (appAcronym) => {
		await checkStatus();
		app_name.set(appAcronym); //store app_name
		goto('/task');
	};

	// Edit button clicked
	const handleEdit = async (appAcronym) => {
		await checkStatus();
		await fetchAppDetails(appAcronym);
		editApp = {
			app_acronym: appDetails.app_acronym, // Prepopulate with existing values
			app_description: appDetails.app_description,
			app_permit_create: appDetails.app_permit_create,
			app_permit_open: appDetails.app_permit_open,
			app_permit_todolist: appDetails.app_permit_todolist,
			app_permit_doing: appDetails.app_permit_doing,
			app_permit_done: appDetails.app_permit_done,
    };
		showAppModal = true;
	};
</script>

{#if errorMessage}
<p style="color: red;">{errorMessage}</p>
{/if}

{#if successMessage}
<p style="color: green;">{successMessage}</p>
{/if}

<div class="container">
	{#if user.isPL}
		<button class="create-app-button" on:click={() => (showModal = true)}>
			Create App
		</button>
	{/if}

	<div class="app-list">
		{#each apps as app}
			<div class="app-card">
				<h2>{app.app_acronym}</h2>
				<p>{app.app_description}</p>
				<p>{app.app_rnumber}</p>
				<div class="app-footer">
					<button class="view-button" on:click={() => handleView(app.app_acronym)}>View</button>
					{#if user.isPL}
						<button class="edit-button" on:click={() => handleEdit(app.app_acronym)}>Edit</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<Modal bind:showModal>
	<h3 slot="header">Create App</h3>

	<form on:submit={handleCreateApp} class="create-app-form">
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

		<div class="date-group">
		<!-- App Running Number Field -->
			<div class="form-group">
				<label for="app_rnumber">R Number: </label>
				<input type="number" id="app_rnumber" bind:value={newApp.app_rnumber} required min="1" />
			</div>

			<!-- App Start Date Field -->
			<div class="form-group" style="padding-left: 20px;">
				<label for="app_startdate">Start Date: </label>
				<input type="date" id="app_startdate" bind:value={newApp.app_startdate} required />
			</div>

			<!-- App End Date Field -->
			<div class="form-group" style="margin-left: 20px;">
				<label for="app_enddate">End Date: </label>
				<input type="date" id="app_enddate" bind:value={newApp.app_enddate} required />
			</div>
		</div>

		<h4>Permit Group</h4>

		<div class="modal-content">
			<div class="modal-left">
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
			</div>

			<div class="modal-right">
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
			</div>
		</div>

		<div class="modal-footer">
			<button type="submit" class="button">Create App</button>
		</div>
	</form>
</Modal>

<AppModal bind:showAppModal>
	<h3 slot="header">Edit App</h3>

	<form on:submit={handleEditApp} class="edit-app-form">
		<div class="form-group">
			<label for="app_acronym">Acronym: </label>
			<input type="text" id="app_acronym" disabled bind:value={editApp.app_acronym} />
		</div>

		<div class="form-group">
			<label for="app_description">Description: </label>
			<textarea id="app_description" bind:value={editApp.app_description}></textarea>
		</div>

		<div class="date-group">
			<div class="form-group">
				<label for="app_rnumber">R Number: </label>
				<input type="number" id="app_rnumber" disabled bind:value={appDetails.app_rnumber} />
			</div>

			<div class="form-group" style="padding-left: 20px;">
				<label for="app_startdate">Start Date: </label>
				<input type="date" id="app_startdate" disabled bind:value={appDetails.app_startdate} />
			</div>

			<div class="form-group">
				<label for="app_enddate">End Date: </label>
				<input type="date" id="app_enddate" disabled bind:value={appDetails.app_enddate} />
			</div>
		</div>

		<h4>Permit Group</h4>

		<div class="modal-content">
			<div class="modal-left">
				<!-- App Permit Create Field -->
				<div class="form-group">
					<label for="app_permit_create">Create: </label>
					<select id="app_permit_create" bind:value={editApp.app_permit_create}>
						<option value="Project Lead">Project Lead</option>
						<option value="Project Manager">Project Manager</option>
						<option value="Developer">Developer</option>
					</select>
				</div>

				<!-- App Permit Open Field -->
				<div class="form-group">
					<label for="app_permit_open">Open: </label>
					<select id="app_permit_open" bind:value={editApp.app_permit_open}>
						<option value="Project Lead">Project Lead</option>
						<option value="Project Manager">Project Manager</option>
						<option value="Developer">Developer</option>
					</select>
				</div>

				<!-- App Permit To-Do List Field -->
				<div class="form-group">
					<label for="app_permit_todolist">To-Do List: </label>
					<select id="app_permit_todolist" bind:value={editApp.app_permit_todolist}>
						<option value="Project Lead">Project Lead</option>
						<option value="Project Manager">Project Manager</option>
						<option value="Developer">Developer</option>
					</select>
				</div>
			</div>

			<div class="modal-right">
				<!-- App Permit Doing Field -->
				<div class="form-group">
					<label for="app_permit_doing">Doing: </label>
					<select id="app_permit_doing" bind:value={editApp.app_permit_doing}>
						<option value="Project Lead">Project Lead</option>
						<option value="Project Manager">Project Manager</option>
						<option value="Developer">Developer</option>
					</select>
				</div>

				<!-- App Permit Done Field -->
				<div class="form-group">
					<label for="app_permit_done">Done: </label>
					<select id="app_permit_done" bind:value={editApp.app_permit_done}>
						<option value="Project Lead">Project Lead</option>
						<option value="Project Manager">Project Manager</option>
						<option value="Developer">Developer</option>
					</select>
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button type="submit" class="button">Edit App</button>
		</div>
	</form>
</AppModal>

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

	.edit-button {
    background: none;
    border: none;
    color: rgb(227, 28, 28);
    text-decoration: underline;
    cursor: pointer;
    padding-left: 15px;
    font: inherit;
  }

	.edit-button:hover {
    color: darkred;
  }

  .view-button:focus {
    outline: 2px solid #000;
    outline-offset: 2px;
  }

	.modal-content {
    display: flex;
    flex-direction: row;
  }

	.modal-left {
    flex: 1;
    margin-right: 20px;
  }

  .modal-right {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
		padding-right: 10px;
  }
</style>