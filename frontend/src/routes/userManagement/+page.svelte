<script>
    import { onMount } from 'svelte';
    import { axios } from '$lib/config';
    import Modal from '$lib/components/Modal.svelte';

    let users = [];
    let errorMessage = '';
    let successMessage = '';
    let newUser = { user_name: '', password: '', email: '', active: 1, group_id: '' };
    let groups = []; // to store the fetched groups
    let showModal = false;
    let groupName = '';
    let editableUser = null;
    let originalData = {};

    // Fetch all groups for dropdown
    // Fetch all users for display
    onMount(async () => {
        try {
            // const response = await axios.get('/api/v1/allgroup', {
            //     withCredentials: true // Include cookies for authentication
            // });
            const response2 = await axios.get('/api/v1/alluserwithgrp', {
                withCredentials: true // Include cookies for authentication
            });
            if (response.status === 200) {
                groups = response.data.data;
            } else {
                errorMessage = 'Failed to load groups.';
            }
            if (response2.status === 200) {
                users = response2.data.data;
            } else {
                errorMessage = 'Failed to load users.';
            }
        } catch (error) {
            errorMessage = 'Error fetching groups';
        }
        
    });

    // Function to handle edit button click
    const handleEdit = (user) => {
        originalData = { ...user }; // Save original data in case of cancel
        editableUser = { ...user }; // Set the user to be edited // Set the user to be edited
        // console.log('Editing User:', editableUser); 
    };

    // Function to handle cancel button
    const handleCancel = () => {
        editableUser = null; // Cancel editing
        errorMessage = ''; // Clear any error messages
    };

    // Function to handle save button
    const handleSave = async (event) => {
        event.preventDefault(); // Prevent default form submission
        console.log("editableUser:", editableUser); // Debug log to check editableUser
        console.log("originalData:", originalData); 

        // Disable the user if the active status is set to inactive (0)
        if (editableUser.active == 0 && originalData.active == 1) {
            try {
                const response = await axios.patch('/api/v1/disableuser', {
                    user_name: editableUser.user_name,
                    active: editableUser.active
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'User disabled successfully!';
                }
            } catch (error) {
                errorMessage = 'Failed to disable user.';
                console.error('Error disabling user:', error);
            }
        }

        // If email is changed
        if (editableUser.email !== originalData.email) {
            try {
                const response = await axios.put(`/api/v1/updateEmail/${editableUser.user_name}`, {
                    email: editableUser.email
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'Email updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Failed to update email.';
                console.error('Error updating email:', error);
            }
        }

        // If password is changed
        if (editableUser.password && editableUser.password !== originalData.password) {
            try {
                const response = await axios.put('/api/v1/updatePassword', {
                    user_name: editableUser.user_name,
                    password: editableUser.password
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'Password updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Failed to update password.';
                console.error('Error updating password:', error);
            }
        }

        // If group is changed
        if (editableUser.group_id !== originalData.group_id) {
            try {
                const response = await axios.put('/api/v1/updategroup', {
                    user_name: editableUser.user_name,
                    group_id: editableUser.group_id
                }, { withCredentials: true });

                if (response.status === 200) {
                    successMessage = 'Group updated successfully!';
                }
            } catch (error) {
                errorMessage = 'Failed to update group.';
                console.error('Error updating group:', error);
            }
        }

        // Update the users array with the new data after all operations
        const index = users.findIndex(u => u.user_name === editableUser.user_name);
        if (index !== -1) {
            users[index] = { ...editableUser };
        }

        editableUser = null; // Exit edit mode
    };

    // Function to create a new user
    const handleCreateUser = async (event) => {
        event.preventDefault(); // Prevent form submission
        errorMessage = ''; // Reset error message
        successMessage = ''; // Reset success message

        try {
            const response = await axios.post('/api/v1/newuser', newUser, 
            {
                withCredentials: true
            });

            console.log("Response from server:", response);

            if (response.status === 201) {
                successMessage = 'User created successfully!';

                // Find the corresponding group_name based on group_id
                const selectedGroup = groups.find(group => group.group_id === newUser.group_id);
                const groupName = selectedGroup ? selectedGroup.group_name : 'No Group';

                console.log("Selected group name:", groupName);

                // Push the new user into the users array with the group name
                users.push({
                    user_name: newUser.user_name,
                    email: newUser.email,
                    active: newUser.active,
                    group_name: groupName
                });
                users = users;
                newUser = { user_name: '', password: '', email: '', active: 1, group_id: ''  }; // Reset the form
            }
        } catch (error) {
            errorMessage = 'Failed to create user. Please check the details.';
            console.error('Error creating user:', error);
        }
    };

    // Function to handle create group button click
    const handleCreateGroup = async (event) => {
        event.preventDefault(); // Prevent default form submission
        errorMessage = '';
        successMessage = '';

        const group_name = { group_name: groupName };

        try {
            const response = await axios.post('/api/v1/creategroup',
                group_name, 
            {
                withCredentials: true
            });
            
            successMessage = 'Group Created';
            groups.push({ group_id: response.data.group_id, group_name: groupName });
            groups = groups;
            errorMessage = ''; // Clear any previous error messages
        } catch (error) {
            errorMessage = 'Failed to create group';
            successMessage = ''; // Clear any previous success messages
        }
    };
</script>

<div class="user-management">

    <!-- Create Group Button -->
    <button class="create-group-button" on:click={() => (showModal = true)}>
        Create Group
    </button>

    <Modal bind:showModal>
        <h2>
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
        <label>
            Group:
            <select bind:value={newUser.group_id}>
                <option value="" disabled>Select Group</option>
                {#each groups as group}
                    <!-- Use group_id and group_name from API data -->
                    <option value={group.group_id}>{group.group_name}</option>
                {/each}
            </select>
        </label>
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
                                {user.active ? 'Yes' : 'No'}
                            {/if}
                        </td>
        
                        <!-- Editable Group -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <select bind:value={editableUser.group_id}>
                                    <option value="" disabled selected>Select Group</option>
                                    {#each groups as group}
                                        <option value={group.group_id}>{group.group_name}</option>
                                    {/each}
                                </select>
                            {:else}
                                {user.group_name || 'No Group'}
                            {/if}
                        </td>
        
                        <!-- Action Buttons -->
                        <td>
                            {#if editableUser && editableUser.user_name === user.user_name}
                                <button on:click={handleSave}>Save</button>
                                <button on:click={handleCancel}>Cancel</button>
                            {:else}
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
