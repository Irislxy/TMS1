<script>
    import { onMount } from 'svelte';
    import { axios } from '$lib/config';
    import { goto } from '$app/navigation';
    import Modal from '$lib/components/Modal.svelte';
    import MultiSelect from 'svelte-multiselect';
    let selected = [];

    let user = { user_name: '', email: '', active: 1, isAdmin: false };
    let users = []; // to store the fetched users with groups
    let groupNames = []; // to store the fetched groups
    let groupName = '';
    let groupLabels = [];
    let errorMessage = '';
    let successMessage = '';
    let newUser = { user_name: '', password: '', email: '', active: 1, group_name: [] };
    let showModal = false;
    let editableUser = null;
    let originalData = {};

    $:{
        console.log(groupLabels);
    }
    onMount(async () => {
        await fetchGroupNames();
        await checkStatus();
        try {
            // Fetch all users for display
            const response2 = await axios.get('/api/v1/getAllUserWithGroup', {
                withCredentials: true // Include cookies for authentication
            });

            if (response2.status === 200) {
                users = response2.data.data;
                console.log(users);
            } else {
                errorMessage = 'Failed to load users.';
            }
        } catch (error) {
            errorMessage = 'Error fetching data';
        }
    });

    const fetchGroupNames = async () => {
        try {
            // Fetch all groups for dropdown
            const response = await axios.get('/api/v1/getAllGroup', {
                withCredentials: true // Include cookies for authentication
            });
            if (response.status === 200) {
                // Map groupNames to label-value pairs
                groupNames = response.data.data.map(group => {
                    return group.group_name;
                });
                //console.log(groupNames);
            } else {
                errorMessage = 'Failed to load groups.';
            }
        } catch (error) {
            errorMessage = 'Error fetching data';
        }
    }

    const checkStatus = async () => {
        try {
            const response = await axios.get('/api/v1/getUserDetails', {
                withCredentials: true
            });
            user.user_name = response.data.user.username;
            user.email = response.data.user.email;
            user.active = response.data.user.active;
            user.isAdmin = response.data.user.isAdmin;
            if (user.isAdmin == false) {
                goto('/appList');
            }
        } catch (error) {
            if (error.response.data.errMessage == "User is not found or disabled") {
                goto('/');
                errorMessage = 'Invalid credentials. Please login again';
            }
            errorMessage = 'Failed to fetch user profile';
        }
    };

    // Function to handle edit button click
    const handleEdit = async (user) => {
        await checkStatus();
        originalData = { ...user }; // Save original data in case of cancel
        editableUser = { ...user }; // Save edited data
        editableUser.groups = editableUser.groups ? editableUser.groups.split(', ') : [];
        //console.log('Editing User:', editableUser); 
    };

    // Function to handle cancel button
    const handleCancel = async () => {
        await checkStatus();
        editableUser = null; // Cancel editing
    };

    // Function to handle save button
    const handleSave = async (event) => {
        await checkStatus();
        console.log("editableUser:", editableUser);
        console.log("originalData:", originalData); 

        // Disable the user if the active status is set to inactive (0)
        if (editableUser.active == 0 && originalData.active == 1) {
            try {
                const response = await axios.patch('/api/v1/disableUser', {
                    user_name: editableUser.user_name,
                    active: editableUser.active
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'User disabled';
                }
            } catch (error) {
                errorMessage = 'Error disabling user';
            }
        }

        // If email is changed
        if (editableUser.email !== originalData.email) {
            
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(editableUser.email)) {
                errorMessage = 'Email must be in the correct format';
                return;
            }

            try {
                const response = await axios.put('/api/v1/updateEmail', {
                    user_name: editableUser.user_name,
                    email: editableUser.email
                }, { withCredentials: true });

                if (response.status === 200) {
                    errorMessage = '';
                    successMessage = 'Email updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Error updating email';
            }
        }

        // If password is changed
        if (editableUser.password !== originalData.password) {
            try {
                const response = await axios.put('/api/v1/updatePassword', {
                    user_name: editableUser.user_name,
                    password: editableUser.password
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'Password updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Error updating password';
            }
        }

        // If group is changed
        if (editableUser.groups !== originalData.groups) {
            try {
                const response = await axios.patch('/api/v1/updateGroup', {
                    user_name: editableUser.user_name,
                    group_name: editableUser.groups
                }, { withCredentials: true });

                if (response.status === 201) {
                    successMessage = 'Updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Error updating group';
            }
        }

        // Update the users array with the new data after all operations
        const index = users.findIndex(u => u.user_name === editableUser.user_name);
        if (index !== -1) {
            users[index] = { ...editableUser };
            users = users; 
        }

        editableUser = null; // Exit edit mode
    };

    // Function to create a new user
    const handleCreateUser = async (event) => {
        await checkStatus();
        errorMessage = ''; // Reset error message
        successMessage = ''; // Reset success message

        // Check if username and password are provided
        if (!newUser.user_name || !newUser.password) {
            errorMessage = 'Please provide username and password';
            return;
        }

        // Check if username is alphanumeric
        const usernameRegex = /^[a-zA-Z0-9]+$/; // Regex for alphanumeric characters
        if (!usernameRegex.test(newUser.user_name)) {
            errorMessage = 'Username must be alphanumeric';
            return; // Exit the function if the username is invalid
        }

        // Check if password meet requirements
        const passwordRegex = /((?=.*\d)(?=.*[a-zA-Z])(?=.*[\W\_]).{8,10})/g;
        if (!passwordRegex.test(newUser.password)) {
            errorMessage = 'Password does not meet requirements';
            return;
        }

        // Check if email meet requirements
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newUser.email)) {
            errorMessage = 'Email must be in the correct format';
            return;
        }

        // Check if user is active
        if (newUser.active === '0') {
            newUser.active = 0;
        }

        try {
            const response = await axios.post('/api/v1/newUser', newUser, 
            {
                withCredentials: true
            });

            if (response.status === 201) {
                successMessage = 'User created successfully!';

                // Push the new user into the users array with the group name
                users.push({
                    user_name: newUser.user_name,
                    email: newUser.email,
                    active: newUser.active,
                    groups: newUser.group_name
                });
                users = users;
                newUser = { user_name: '', password: '', email: '', active: 1, group_name: []  }; // Reset the form
                groupLabels = [];
            }
        } catch (error) {
            errorMessage = 'Failed to create user. Please check the details.';
            console.error('Error creating user:', error);
        }
    };

    // Function to handle create group button click
    const handleCreateGroup = async (event) => {
        await checkStatus();
        errorMessage = '';
        successMessage = '';

        const regex = /^[a-zA-Z0-9_]+$/;
        if (!regex.test(groupName)) {
            errorMessage = 'Invalid group name. Only alphanumeric characters and underscores are allowed.';
            return;
        }

        const group_name = { group_name: groupName };

        try {
            const response = await axios.post('/api/v1/createGroup',
                group_name, 
            {
                withCredentials: true
            });
            
            errorMessage = '';
            successMessage = 'Group Created';
            //console.log(response.data);
            groupNames.push({ label: response.data.data.group_name }); 
            groupNames = groupNames;
            groupName = '';
            errorMessage = ''; // Clear any previous error messages
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Catch duplicate entry error
                errorMessage = 'Group already exists.';
            } else {
                // Catch any other errors
                errorMessage = 'Error creating group.';
            }
            successMessage = ''; // Clear any previous success messages
        }
    };

    $: newUser.group_name = groupLabels;
</script>

<div class="user-management">

    <!-- Create Group Button -->
    <button class="create-group-button" on:click={() => (showModal = true)}>
        Create Group
    </button>

    <Modal bind:showModal>
        <h2 slot="header">
            Create Group
        </h2>

        <label for="username">Group Name: </label>
        <input type="text" bind:value={groupName} required placeholder="Group name" />
        <button on:click={handleCreateGroup}>Create Group</button>
    </Modal>

    <!-- New User Creation Form -->
    <form on:submit={handleCreateUser} class="create-user-form">

    {#if errorMessage}
        <p style="color: red;">{errorMessage}</p>
    {/if}
    
    {#if successMessage}
    <p style="color: green;">{successMessage}</p>
    {/if}

        <h2>Create New User</h2>
        <label>
            Username:
            <input type="text" bind:value={newUser.user_name} required placeholder="Username" />
        </label>
        <label>
            Password:
            <input type="password" bind:value={newUser.password} required placeholder="Password" />
        </label>
        <label>
            Email:
            <input type="email" bind:value={newUser.email} placeholder="Email" />
        </label>
        <label>
            Active:
            <select bind:value={newUser.active}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
            </select>
        </label>
        <div class="inline-group">
            <label for="group-select">Group:</label>
                <MultiSelect
                    options={groupNames}
                    bind:selected={groupLabels}
                    placeholder="Select Groups"
                    style="flex: 1; max-width: 300px; margin: 5px;"
                />
        </div>

        <button type="submit">Create User</button>
    </form>

    {#if users.length > 0}
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Email</th>
                    <th>Active</th>
                    <th>Group</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {#each users as user}
                    <tr>
                        <!-- Editable Username -->
                        <td>
                            {user.user_name}
                        </td>
        
                        <!-- Editable Password -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <input type="password" bind:value={editableUser.password} placeholder="New Password" />
                            {:else}
                                ********
                            {/if}
                        </td>
        
                        <!-- Editable Email -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <input type="email" bind:value={editableUser.email} />
                            {:else}
                                {user.email}
                            {/if}
                        </td>
        
                        <!-- Editable Active Status -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <select bind:value={editableUser.active}>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            {:else}
                                {user.active == 1 ? 'Active' : 'Inactive'}
                            {/if}
                        </td>
        
                        <!-- Editable Group -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <MultiSelect
                                    options={groupNames}
                                    bind:selected={editableUser.groups} 
                                    placeholder="Select Groups"
                                    style="flex: 1; max-width: 300px; margin: 5px;"
                                />
                            {:else}
                                {user.groups || '-'}
                            {/if}
                        </td>
        
                        <!-- Action Buttons -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <button on:click={handleSave}>Save</button>
                                <button on:click={handleCancel}>Cancel</button>
                            {:else if user.user_name !== "admin"}
                                <button on:click={() => handleEdit(user)}>Edit</button>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <p>No users found.</p>
    {/if}
</div>

<style>
    .inline-group {
        display: flex; /* Use flexbox to align items inline */
        align-items: center; /* Vertically center the items */
    }
    .user-management {
        padding: 20px;
    }

    .create-group-button {
        position: absolute; /* Position the button in the top right */
        top: 120px; /* Adjust as needed */
        right: 20px; /* Adjust as needed */
        padding: 10px 20px;
        background-color: #007BFF; /* Bootstrap primary color */
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .create-group-button:hover {
        background-color: #0056b3; /* Darken on hover */
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th, td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: left;
    }

    th {
        background-color: #f4f4f4;
    }
</style>
