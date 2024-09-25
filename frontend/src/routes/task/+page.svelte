<script>
  import { onMount } from 'svelte';
  import { axios } from '$lib/config';
  import Modal from '$lib/components/Modal.svelte';
  
  let showModal = false;
  let taskDetails = [];
  let newPlan = { plan_app_acronym: '', plan_mvp_name: '', plan_startdate: '', plan_enddate: '', plan_colour: ''}
  let changePlan = { task_id: '', task_plan: '' };
  let errorMessage = '';
	let successMessage = '';
  let tasks = {
    open: [],
    todo: [],
    doing: [],
    done: [],
    close: []
  };

  // Fetch task details when component mounts
  onMount(async () => {
    await fetchAllTask();
  });

  // Function to fetch all task
  const fetchAllTask = async () => {
    try {
      const response = await axios.get('/api/v1/getAllTask', {
        withCredentials: true
      });
      
      const fetchedTasks = response.data.data;
      
      // Sort tasks based on their status
      tasks = {
        open: fetchedTasks.filter(task => task.task_state === 'open'),
        todo: fetchedTasks.filter(task => task.task_state === 'todo'),
        doing: fetchedTasks.filter(task => task.task_state === 'doing'),
        done: fetchedTasks.filter(task => task.task_state === 'done'),
        close: fetchedTasks.filter(task => task.task_state === 'close')
      };
      //console.log('Open Tasks:', tasks.open);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Function to fetch specific task details with taskId provided
  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.post('/api/v1/getTaskDetails', { task_id: taskId }, { withCredentials: true });
      taskDetails = response.data.data[0]; // Get the first task in the array
      showModal = true;
    } catch (error) {
      console.error(error);
    }
  };

  // Function to create plan
  const handleCreatePlan = async () => {
    // Check if all required fields are provided
		if (!newPlan.plan_app_acronym || !newPlan.plan_mvp_name || !newPlan.plan_startdate || !newPlan.plan_enddate || !newPlan.plan_colour) {
			errorMessage = 'All fields are required';
			return;
  	}

    try {
      const response = await axios.post('/api/v1/createPlan', newPlan, 
      { 
        withCredentials: true 
      });

      errorMessage = '';
      successMessage = 'Plan Created';
      showModal = true;
    } catch (error) {
      console.error(error);
    }
  };

  const saveChanges = () => {
    console.log("Save changes triggered");
  };

  const demoteTask = () => {
    console.log("Demote task triggered");
  };

  const promoteTask = () => {
    console.log("Promote task triggered");
  };
</script>

<!-- Create Task Button -->
<!-- <button class="create-task-button" on:click={() => (showModal = true)}>
  Create Task
</button> -->

<div class="kanban-board">
  <!-- Open Column -->
  <div class="kanban-column">
    <div class="column-header">Open</div>
    {#each tasks.open as task}
      <div class="task-card">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => fetchTaskDetails(task.task_id)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Todo Column -->
  <div class="kanban-column">
    <div class="column-header">Todo</div>
    {#each tasks.todo as task}
      <div class="task-card">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => (showModal = true)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Doing Column -->
  <div class="kanban-column">
    <div class="column-header">Doing</div>
    {#each tasks.doing as task}
      <div class="task-card">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => (showModal = true)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Done Column -->
  <div class="kanban-column">
    <div class="column-header">Done</div>
    {#each tasks.done as task}
      <div class="task-card">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => (showModal = true)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Close Column -->
  <div class="kanban-column">
    <div class="column-header">Close</div>
    {#each tasks.close as task}
      <div class="task-card">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => (showModal = true)}>View</button>
        </div>
      </div>
    {/each}
  </div>
</div>

<Modal bind:showModal>
  <h2 slot="header">
		Task Details
	</h2>
  <div class="modal-content">
    <!-- Left Section -->
    <div class="modal-left">
      <p>ID: {taskDetails.task_id}</p>
      <p>Name: {taskDetails.task_name}</p>
      <p>Description: {taskDetails.task_description}</p>
      <p>State: {taskDetails.task_state}</p>
      <p>Plan: {taskDetails.task_plan}</p>
      <p>Creator: {taskDetails.task_creator}</p>
      <p>Owner: {taskDetails.task_owner}</p>
      <p>Created date: {taskDetails.task_createdate}</p>
    </div>

    <!-- Right Section -->
    <div class="modal-right">
      <div class="notes-area">
        <label for="notes">Notes:</label>
        <textarea id="notes" disabled>{taskDetails.task_notes}</textarea>
      </div>
      <div class="notes-area">
        <textarea id="userNotes" bind:value={taskDetails.task_notes} placeholder="Enter notes here..."></textarea>
      </div>
    </div>
  </div>

  <div class="modal-footer">
    <button class="button" on:click={saveChanges}>Save</button>
    <button class="button" on:click={demoteTask}>Demote</button>
    <button class="button" on:click={promoteTask}>Promote</button>
  </div>
</Modal>

<style>
  .kanban-board {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    padding: 20px;
  }

  .kanban-column {
    background: #f4f4f4;
    padding: 10px;
    border-radius: 8px;
    min-height: 400px;
  }

  .column-header {
    font-weight: bold;
    margin-bottom: 10px;
  }

  .task-card {
    background: white;
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }

  .task-card p {
    margin: 5px 0;
  }

  .task-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 10px;
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

  .modal-content {
    display: flex;
    flex-direction: row;
  }

  .modal-left {
    flex: 1;
    margin-right: 20px;
  }

  .modal-right {
    flex: 2;
    display: flex;
    flex-direction: column;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  textarea {
    width: 100%;
    height: 150px;
    padding: 10px;
    margin-top: 10px;
    font-family: inherit;
    font-size: inherit;
    resize: none;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .notes-area {
    height: 200px;
    margin-top: 10px;
  }

  .button {
    margin-right: 10px;
  }
</style>