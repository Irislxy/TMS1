<script>
    import { goto } from '$app/navigation'; // Import goto from SvelteKit
    import { axios } from '$lib/config';

    let username = '';
    let password = '';
    let errorMessage = '';
    let successMessage = '';

    const handleLogin = async (event) => {
        event.preventDefault();
        errorMessage = ''; // Reset error message

        try {
            const response = await axios.post('/api/v1/login', {
                user_name: username,
                password: password
            }, {
                withCredentials: true
            });

            // Check if login was successful
            if (response.status === 200) {
                successMessage = 'Login successful!';

                // Redirect to the appList page
                goto('/appList/');
            } 
        } catch (error) {
            // Handle error response when login fails
            if (error.response && error.response.status === 401) {
                // 401 Unauthorized error (incorrect username or password)
                errorMessage = 'Invalid Credentials. Please try again.';
            } else {
                // Other errors (network issue, server errors, etc.)
                errorMessage = 'Something went wrong. Please try again later.';
            }
        }
    };
</script>

<div class="login-container">
    <form on:submit={handleLogin} class="login-form">
        <label for="username">Username: </label>
        <input type="text" bind:value={username} required placeholder="Username" />
        <label for="password">Password: </label>
        <input type="password" bind:value={password} required placeholder="Password" />
        <button type="submit">Login</button>

        <!-- Display error message if present -->
        {#if errorMessage}
            <p class="error-message">{errorMessage}</p>
        {/if}
    </form>
</div>

<style>
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		width: 300px;
		padding: 20px;
		background: white;
		border-radius: 4px;
	}

	input {
		height: 30px;
		margin: 5px 0px;
		padding: 8px;
		font-size: 16px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	input:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}

	button {
		height: 40px;
		background-color: #007bff;
		color: white;
		font-size: 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	button:hover {
		background-color: #0056b3;
	}

    .error-message {
        color: red;
        margin-top: 10px;
    }
</style>