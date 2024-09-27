<script>
  import { onMount } from 'svelte';
  import { axios } from '$lib/config';
  import Modal from '$lib/components/Modal.svelte';
  import TaskModal from '$lib/components/TaskModal.svelte';
  
  let showModal = false; // modal for task details
  let showTaskModal = false; // modal for create task
  let taskDetails = [];
  let planNames = [];
  let originalPlan = '';
  let newNotes = '';
  //let newPlan = { plan_app_acronym: '', plan_mvp_name: '', plan_startdate: '', plan_enddate: '', plan_colour: ''}
  let newTask = { task_id: '', task_name: '', task_description: '', task_notes: '', task_plan: '', task_app_acronym: '', task_state: '', task_creator: '', task_owner: '', task_createdate: ''}
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
    await fetchPlanNames();
  });

  // fetch all task
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
      console.error(error);
      errorMessage = 'Failed to fetch all tasks';
    }
  };

  // fetch specific task details with taskId provided
  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.post('/api/v1/getTaskDetails', { task_id: taskId }, { withCredentials: true });
      taskDetails = response.data.data[0]; // Get the first task in the array
      originalPlan = taskDetails.task_plan;
      showModal = true;
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to fetch task details';
    }
  };

  // fetch all plan for dropdown
  const fetchPlanNames = async () => {
    try {
      const response = await axios.get('/api/v1/getAllPlan', {
          withCredentials: true
      });
      if (response.status === 200) {
        planNames = response.data.data;
        //console.log(planNames);
      } else {
          errorMessage = 'Failed to load plans.';
      }
    } catch (error) {
      errorMessage = 'Error fetching data';
    }
  }

  // Function to update plan dropdown within task with taskId provided
  const updatePlan = async (taskId, updatedPlan) => {
    const updateData = { task_id: taskId, task_plan: updatedPlan };
    try {
      await axios.put('/api/v1/updateTaskPlan', updateData, { withCredentials: true });

      successMessage = 'Task Plan Updated';
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to update task plan';
    }
  };

  // Function to update task notes within task with taskId provided
  const updateNotes = async (taskId) => {
    const updateData = { task_id: taskId, task_notes: newNotes };
    try {
      await axios.put('/api/v1/updateNotes', updateData, { withCredentials: true });

      successMessage = 'Task Notes Updated';
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to update task notes';
    }
  };

  const handleSave = async () => {
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updatePlan(taskDetails.task_id, taskDetails.task_plan);
    } else {
      errorMessage = 'No changes were made';
    }

    await updateNotes(taskDetails.task_id);
  };

  // todo: task state
  const handleDemote = async () => {
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updatePlan(taskDetails.task_id, taskDetails.task_plan);
    } else {
      errorMessage = 'No changes were made';
    }

    await updateNotes(taskDetails.task_id);
  };

  // todo: task state
  const handlePromote = async () => {
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updatePlan(taskDetails.task_id, taskDetails.task_plan);
    } else {
      errorMessage = 'No changes were made';
    }

    await updateNotes(taskDetails.task_id);
  };


  const handleCreateTask = async () => {
    showTaskModal = True;
    // insertion logic
  };

  const createPlan = () => {
    console.log("create plan triggered");
  };

    // // Function to create plan
  // const handleCreatePlan = async () => {
  //   // Check if all required fields are provided
	// 	if (!newPlan.plan_app_acronym || !newPlan.plan_mvp_name || !newPlan.plan_startdate || !newPlan.plan_enddate || !newPlan.plan_colour) {
	// 		errorMessage = 'All fields are required';
	// 		return;
  // 	}

  //   try {
  //     const response = await axios.post('/api/v1/createPlan', newPlan, 
  //     { 
  //       withCredentials: true 
  //     });

  //     errorMessage = '';
  //     successMessage = 'Plan Created';
  //     showModal = true;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
</script>

<div class="header-buttons">
  <button class="create-task-button" on:click={() => (showTaskModal = true)}>Create Task</button>

  <div class="dropdown">
    <button class="plan-button">Plan</button>
    <div class="dropdown-content">
      {#each planNames as plan}
        <button value={plan.plan_mvp_name}>{plan.plan_mvp_name}</button>
      {/each}
      <button on:click={createPlan}>Create New Plan</button>
    </div>
  </div>
</div>

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

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <div class="modal-content">
    <!-- Left Section -->
    <div class="modal-left">
      <p><strong>ID:</strong> {taskDetails.task_id}</p>
      <p><strong>Name:</strong> {taskDetails.task_name}</p>
      <p><strong>Description:</strong> {taskDetails.task_description}</p>
      <p><strong>State:</strong> {taskDetails.task_state}</p>
      <label for="new-plan"><strong>Plan:</strong> </label>
      <select bind:value={taskDetails.task_plan} style="width: 60%;">
        {#each planNames as plan}
          <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
        {/each}
      </select>
      <p><strong>Creator:</strong> {taskDetails.task_creator}</p>
      <p><strong>Owner:</strong> {taskDetails.task_owner}</p>
      <p><strong>Created date:</strong> {taskDetails.task_createdate}</p>
    </div>

    <!-- Right Section -->
    <div class="modal-right">
      <div class="notes-area">
        <label for="notes"><strong>Notes:</strong></label>
        <textarea id="notes" disabled>{taskDetails.task_notes}</textarea>
      </div>
      <div class="notes-area">
        <textarea id="userNotes" bind:value={newNotes} placeholder="Enter notes here..."></textarea>
      </div>
    </div>
  </div>

  <div class="modal-footer">
    <button class="button" on:click={handleSave}>Save</button>
    <button class="button" on:click={handleDemote}>Demote</button>
    <button class="button" on:click={handlePromote}>Promote</button>
  </div>
</Modal>

<TaskModal bind:showTaskModal>
  <h2 slot="header">
		Create Task
	</h2>

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <!-- Task Name Field -->
  <div class="form-group">
    <label for="task_name">Name: </label>
    <input type="text" id="task_name" bind:value={newTask.task_name} required />
  </div>

  <!-- Task Description Field -->
  <div class="form-group">
    <label for="task_description">Description: </label>
    <textarea id="task_description" bind:value={newTask.task_description}></textarea>
  </div>

  <!-- Task Plan Field -->
  <div class="form-group">
    <label for="task_plan">Plan: </label>
    <select bind:value={newTask.task_plan} style="width: 60%;">
      {#each planNames as plan}
        <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
      {/each}
    </select>
  </div>

  <!-- Task Notes Field -->
  <div class="form-group">
    <label for="task_notes">Notes: </label>
    <textarea id="task_notes" bind:value={newTask.task_notes}></textarea>
  </div>

  <div class="modal-footer">
    <button class="button" on:click={handleCreateTask}>Create Task</button>
  </div>
</TaskModal>

<style>
  .header-buttons {
    padding-top: 20px;
    padding-right: 40px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .create-task-button, .plan-button {
    background-color: #007BFF;
    padding: 10px 20px;
    border: none;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }

  /* Dropdown container */
  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 160px;
    width: 100%;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    right: 0;
  }

  .dropdown-content button {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .dropdown-content button:hover {
    background-color: #f1f1f1;
  }

  .dropdown:hover .dropdown-content {
    display: block;
  }

  .form-group {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
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