<script>
  import { onMount } from 'svelte';
  import { axios } from '$lib/config';
  import { goto } from '$app/navigation';
  import { app_name } from '$lib/stores.js';
  import Modal from '$lib/components/Modal.svelte';
  import TaskModal from '$lib/components/TaskModal.svelte';
  import PlanModal from '$lib/components/PlanModal.svelte';
  import EditPlanModal from '$lib/components/EditPlanModal.svelte';
  
  let showModal = false; // modal for task details
  let showTaskModal = false; // modal for create task
  let showPlanModal = false; // modal for create plan
  let editPlanModal = false; // modal for edit plan
  let user = { user_name: '', email: '', active: 1, isAdmin: false, isPL: false, isPM: false, isDev: false };
  let currentAppAcronym = '';
  let fetchedTasks = [];
  let taskDetails = [];
  let planNames = [];
  let originalPlan = '';
  let planChanged = false; // Track if the plan has changed
  let disableSave = false; // Track if the Save button should be disabled
  let disablePromote = false; // Track if the Promote button should be disabled
  let canCreateTask = false;
  let canOpenTask = false;
  let canTodoTask = false;
  let canDoingTask = false;
  let canDoneTask = false;
  let planDetails = [];
  let newNotes = '';
  let newPlan = { plan_app_acronym: '', plan_mvp_name: '', plan_startdate: '', plan_enddate: '', plan_colour: ''}
  let editPlan = { plan_app_acronym: '', plan_mvp_name: '', plan_startdate: '', plan_enddate: '', plan_colour: ''}
  let newTask = { task_name: '', task_description: '', task_notes: '', task_plan: '', task_app_acronym: ''}
  let errorMessage = '';
	let successMessage = '';
  let tasks = {
    open: [],
    todo: [],
    doing: [],
    done: [],
    close: []
  };
  // Button labels for promoting tasks
  let buttonLabels = {
    open: 'Release',
    todo: 'Take On',
    doing: 'To Review',
    done: 'Approve'
  };
  // Button labels for demoting tasks
  let demoteButtonLabels = {
    doing: 'Give Up',
    done: 'Reject'
  };

  onMount(async () => {
    await checkStatus();
    await fetchAllTaskByApp();
    await fetchPlanNames();
    await checkTaskPermission();
  });

  const checkStatus = async () => {
    try {
      const response = await axios.get('/api/v1/getUserDetails', { withCredentials: true });
      user.user_name = response.data.user.username;
      user.email = response.data.user.email;
      user.active = response.data.user.active;
      user.isAdmin = response.data.user.isAdmin;
			user.isPL = response.data.user.isPL;
      user.isPM = response.data.user.isPM;
      user.isDev = response.data.user.isDev;
    } catch (error) {
      if (error.response.data.errMessage == "User is not found or disabled") {
        goto('/');
      }
      errorMessage = 'Failed to fetch user profile';
    }
  };

  // fetch all task with task_app_acronym provided
  const fetchAllTaskByApp = async () => {
    // Get the current app acronym from the store
    app_name.subscribe(value => {
      currentAppAcronym = value;
    });

    if (!currentAppAcronym) {
      errorMessage = 'No application selected.';
      return;
    }

    try {
      const response = await axios.post('/api/v1/getAllTaskByApp', { task_app_acronym: currentAppAcronym }, { withCredentials: true });
      
      fetchedTasks = response.data.data;
      
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

  // Fetch task creation permission
  const checkTaskPermission = async () => {
    try {
      const response = await axios.post('/api/v1/checkTaskPermission', { app_acronym: currentAppAcronym }, { withCredentials: true });
      const { canCreate, canOpen, canTodo, canDoing, canDone } = response.data;

      // Update your state or variables accordingly
      canCreateTask = canCreate;
      canOpenTask = canOpen;
      canTodoTask = canTodo;
      canDoingTask = canDoing;
      canDoneTask = canDone;

    } catch (error) {
      console.error("Failed to check task permission", error);
      canCreateTask = false;
      canOpenTask = false;
      canTodoTask = false;
      canDoingTask = false;
      canDoneTask = false;
    }
  };

  // fetch specific task details with taskId provided
  const fetchTaskDetails = async (taskId) => {
    await checkStatus();
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
      const response = await axios.post('/api/v1/getAllPlan', { plan_app_acronym: currentAppAcronym }, { withCredentials: true });
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

  // Fetch plan details to edit
	const fetchPlanDetails = async (planName) => {
    try {
      const response = await axios.post('/api/v1/getPlanDetails', { plan_mvp_name: planName }, { withCredentials: true });
      planDetails = response.data.data[0];
    } catch (error) {
      console.error("Error fetching plan details:", error);
      errorMessage = 'Failed to fetch plan details';
    }
  };

  // Function to update plan dropdown within task with taskId provided
  const updateTaskPlan = async (taskId, updatedPlan) => {
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message

    const updateData = { task_id: taskId, task_plan: updatedPlan };
    try {
      await axios.put('/api/v1/updateTaskPlan', updateData, { withCredentials: true });

      successMessage = 'Task Plan Updated';
    } catch (error) {
      if (error.response && error.response.status === 403) {
        errorMessage = error.response.data.message || 'Permission denied';
      } else {
        errorMessage = 'Failed to update task plan';
      }
    }
  };

  // Function to update task notes within task with taskId provided
  const updateNotes = async (taskId) => {
    await checkStatus();
    
    const updateData = { task_id: taskId, task_notes: newNotes };
    try {
      await axios.put('/api/v1/updateNotes', updateData, { withCredentials: true });

      await fetchTaskDetails(taskId);
      newNotes = '';
      successMessage = 'Task Notes Updated';
    } catch (error) {
      if (error.response && error.response.status === 403) {
        errorMessage = error.response.data.message || 'Permission denied';
      } else {
        errorMessage = 'Failed to update task notes';
      }
    }
  };

  const handleSave = async () => {
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updateTaskPlan(taskDetails.task_id, taskDetails.task_plan);
    }
    // handle update notes
    await updateNotes(taskDetails.task_id);
  };

  const handleDemote = async () => {
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updateTaskPlan(taskDetails.task_id, taskDetails.task_plan);
    }
    // handle update notes
    await updateNotes(taskDetails.task_id);

    // handle demote task
    try {
      await axios.patch('/api/v1/demoteTask', { task_id: taskDetails.task_id }, { withCredentials: true });
      successMessage = 'Task Demoted';
      await fetchAllTaskByApp();
      await fetchTaskDetails(taskDetails.task_id);
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to demote task';
    }
  };

  const handlePromote = async () => {
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    // handle changed plan
    if (taskDetails.task_id && taskDetails.task_plan !== originalPlan) {
      await updateTaskPlan(taskDetails.task_id, taskDetails.task_plan);
    }
    // handle update notes
    await updateNotes(taskDetails.task_id);

    // handle promote task
    try {
      const response = await axios.patch('/api/v1/promoteTask', { task_id: taskDetails.task_id }, { withCredentials: true });
      successMessage = 'Task Promoted';
      await fetchAllTaskByApp();
      await fetchTaskDetails(taskDetails.task_id);
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to promote task';
    } 
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    newTask.task_app_acronym = currentAppAcronym;
    
    try {
      await axios.post('/api/v1/createTask', newTask, { withCredentials: true });

      successMessage = 'Task Created';
      showTaskModal = true;
      newTask = {};
      await fetchAllTaskByApp();
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        errorMessage = error.response.data.message || 'Permission denied';
      } else {
        errorMessage = 'Failed to create task';
      }
    }
  };

  // Function to create plan
  const handleCreatePlan = async () => {
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    newPlan.plan_app_acronym = currentAppAcronym;

    // Check if all required fields are provided
		if (!newPlan.plan_mvp_name || !newPlan.plan_startdate || !newPlan.plan_enddate) {
			errorMessage = 'All fields are required';
			return;
  	}

    if (!newPlan.plan_colour) {
      newPlan.plan_colour = '#000000';
    }

    // Remove the '#' from the color code before sending it to the database
    newPlan.plan_colour = newPlan.plan_colour.replace('#', '');

    try {
      await axios.post('/api/v1/createPlan', newPlan, { withCredentials: true });

      errorMessage = '';
      successMessage = 'Plan Created';
      newPlan = {};
      await fetchPlanNames();
      showPlanModal = true;
    } catch (error) {
      if (error.response && error.response.status === 409) {
          // Catch duplicate entry error
          errorMessage = error.response.data.message || 'Plan already exists';
      } else {
          // Catch any other errors
          errorMessage = 'Failed to create plan';
      }
    }
  };
  
  // Call this when a plan is selected in the done state
  const handlePlanChange = () => {
    if (taskDetails.task_state === 'done' && originalPlan !== taskDetails.task_plan) {
      planChanged = true;
    } else {
      planChanged = false;
    }
  };

  $: if (!showTaskModal) {
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
  }

  $: if (!showPlanModal) {
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
  }

  $: if (!editPlanModal) {
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
  }

  // Reset button states when modal is closed and opened
  $: if (!showModal) {
    // Reset when modal is closed
    planChanged = false;
    disableSave = false;
    disablePromote = false;
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
  }

  $: {
    disableSave = planChanged && taskDetails.task_state === 'done';
    disablePromote = planChanged && taskDetails.task_state === 'done';
  }

  // Call this when a plan is selected
  const onPlanSelected = async (planName) => {
    await checkStatus();
    await fetchPlanDetails(planName);

    editPlan = {
			plan_mvp_name: planDetails.plan_mvp_name, // Prepopulate with existing values
			plan_startdate: planDetails.plan_startdate,
			plan_enddate: planDetails.plan_enddate,
			plan_colour: planDetails.plan_colour
    };
    editPlanModal = true;
  };

  const handleEditPlan = async () => { //No changes hvt implement
    await checkStatus();
    errorMessage = ''; // Reset error message
		successMessage = ''; // Reset success message
    editPlan.plan_app_acronym = currentAppAcronym;

    try {
      await axios.patch('/api/v1/updatePlan', editPlan, { withCredentials: true });

      successMessage = 'Plan Updated';
      editPlanModal = true;
    } catch (error) {
      console.error(error);
      errorMessage = 'Failed to update plan';
    }
  };
</script>

<div class="header-buttons">
  {#if canCreateTask}
    <button class="create-task-button" on:click={() => (showTaskModal = true)}>Create Task</button>
  {/if}

  {#if user.isPM}
    <div class="dropdown">
      <button class="plan-button">Plan</button>
      <div class="dropdown-content">
        {#each planNames as plan}
          <button on:click={() => onPlanSelected(plan.plan_mvp_name)}>{plan.plan_mvp_name}</button>
        {/each}
        {#if user.isPM}
          <button on:click={() => (showPlanModal = true)}>Create New Plan</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<div class="kanban-board">
  <!-- Open Column -->
  <div class="kanban-column">
    <div class="column-header">Open</div>
    {#each tasks.open as task}
      <div class="task-card" style="border-left: 4px solid {`#${task.plan_colour ? task.plan_colour : '000000'}`};">
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
      <div class="task-card" style="border-left: 4px solid {`#${task.plan_colour ? task.plan_colour : '000000'}`};">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => fetchTaskDetails(task.task_id)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Doing Column -->
  <div class="kanban-column">
    <div class="column-header">Doing</div>
    {#each tasks.doing as task}
      <div class="task-card" style="border-left: 4px solid {`#${task.plan_colour ? task.plan_colour : '000000'}`};">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => fetchTaskDetails(task.task_id)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Done Column -->
  <div class="kanban-column">
    <div class="column-header">Done</div>
    {#each tasks.done as task}
      <div class="task-card" style="border-left: 4px solid {`#${task.plan_colour ? task.plan_colour : '000000'}`};">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => fetchTaskDetails(task.task_id)}>View</button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Close Column -->
  <div class="kanban-column">
    <div class="column-header">Close</div>
    {#each tasks.close as task}
      <div class="task-card" style="border-left: 4px solid {`#${task.plan_colour ? task.plan_colour : '000000'}`};">
        <h3>{task.task_name}</h3>
        <p>{task.task_description}</p>
        <div class="task-footer">
          <span>{task.task_owner}</span>
          <button class="view-button" on:click={() => fetchTaskDetails(task.task_id)}>View</button>
        </div>
      </div>
    {/each}
  </div>
</div>

<Modal bind:showModal>
  <h2 slot="header">Task Details</h2>

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <form class="task-details-form">
    <div class="modal-content">
      <!-- Left Section -->
      <div class="modal-left">
        <p><strong>ID:</strong> {taskDetails.task_id}</p>
        <p><strong>Name:</strong> {taskDetails.task_name}</p>
        <p><strong>Description:</strong> {taskDetails.task_description}</p>
        <p><strong>State:</strong> {taskDetails.task_state}</p>
        {#if taskDetails.task_state == 'open'}
          <label for="new-plan"><strong>Plan:</strong> </label>
          <select bind:value={taskDetails.task_plan} style="width: 60%;" disabled={taskDetails.task_state === 'todo' || taskDetails.task_state === 'doing' || taskDetails.task_state === 'close' || canOpenTask == false} on:change={handlePlanChange}>
            <option value={null}></option>
            {#each planNames as plan}
              <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
            {/each}
          </select>
        {:else if taskDetails.task_state == 'todo'}
          <label for="new-plan"><strong>Plan:</strong> </label>
          <select bind:value={taskDetails.task_plan} style="width: 60%;" disabled on:change={handlePlanChange}>
            <option value={null}></option>
            {#each planNames as plan}
              <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
            {/each}
          </select>
        {:else if taskDetails.task_state == 'doing'}
          <label for="new-plan"><strong>Plan:</strong> </label>
          <select bind:value={taskDetails.task_plan} style="width: 60%;" disabled on:change={handlePlanChange}>
            <option value={null}></option>
            {#each planNames as plan}
              <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
            {/each}
          </select>
        {:else if taskDetails.task_state == 'done'}
          <label for="new-plan"><strong>Plan:</strong> </label>
          <select bind:value={taskDetails.task_plan} style="width: 60%;" disabled={taskDetails.task_state === 'todo' || taskDetails.task_state === 'doing' || taskDetails.task_state === 'close' || canDoneTask == false} on:change={handlePlanChange}>
            <option value={null}></option>
            {#each planNames as plan}
              <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
            {/each}
          </select>
        {/if}
        <p><strong>Creator:</strong> {taskDetails.task_creator}</p>
        <p><strong>Owner:</strong> {taskDetails.task_owner}</p>
        <p><strong>Created date:</strong> {taskDetails.task_createdate}</p>
      </div>

      <!-- Right Section -->
      <div class="modal-right">
        <div class="notes-area">
          <label for="notes"><strong>Notes:</strong></label>
          <textarea id="notes" style="height: 100px;" disabled>{taskDetails.task_notes}</textarea>
        </div>
        <div class="notes-area">
          {#if taskDetails.task_state == 'open'}
            <textarea id="userNotes" bind:value={newNotes} style="height: 100px;" disabled={taskDetails.task_state === 'close' || canOpenTask == false} placeholder="Enter notes here..."></textarea>
          {:else if taskDetails.task_state == 'todo'}
            <textarea id="userNotes" bind:value={newNotes} style="height: 100px;" disabled={taskDetails.task_state === 'close' || canTodoTask == false} placeholder="Enter notes here..."></textarea>
          {:else if taskDetails.task_state == 'doing'}
            <textarea id="userNotes" bind:value={newNotes} style="height: 100px;" disabled={taskDetails.task_state === 'close' || canDoingTask == false} placeholder="Enter notes here..."></textarea>
          {:else if taskDetails.task_state == 'done'}
            <textarea id="userNotes" bind:value={newNotes} style="height: 100px;" disabled={taskDetails.task_state === 'close' || canDoneTask == false} placeholder="Enter notes here..."></textarea>
          {/if}
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <!-- Save Button -->
      {#if taskDetails.task_state == 'open'}
        <button class="button" on:click={handleSave} disabled={canOpenTask == false}>Save</button>
      {:else if taskDetails.task_state == 'todo'}
        <button class="button" on:click={handleSave} disabled={canTodoTask == false}>Save</button>
      {:else if taskDetails.task_state == 'doing'}
        <button class="button" on:click={handleSave} disabled={canDoingTask == false}>Save</button>
      {:else if taskDetails.task_state == 'done'}
        <button class="button" on:click={handleSave} disabled={disableSave || canDoneTask == false}>Save</button>
      {/if}
      <!-- Demote Button -->
      {#if taskDetails.task_state == 'doing'}
      <button class="button" on:click={handleDemote} disabled={canDoingTask == false}>{demoteButtonLabels.doing}</button>
      {:else if taskDetails.task_state == 'done'}
      <button class="button" on:click={handleDemote} disabled={canDoneTask == false}>{demoteButtonLabels.done}</button>
      {/if}
      <!-- Promote Button -->
      {#if taskDetails.task_state == 'open'}
        <button class="button" on:click={handlePromote} disabled={canOpenTask == false}>{buttonLabels.open}</button>
      {:else if taskDetails.task_state == 'todo'}
        <button class="button" on:click={handlePromote} disabled={canTodoTask == false}>{buttonLabels.todo}</button>
      {:else if taskDetails.task_state == 'doing'}
        <button class="button" on:click={handlePromote} disabled={canDoingTask == false}>{buttonLabels.doing}</button>
      {:else if taskDetails.task_state == 'done'}
        <button class="button" on:click={handlePromote} disabled={disablePromote || canDoneTask == false}>{buttonLabels.done}</button>
      {/if}
    </div>
  </form>
</Modal>

<TaskModal bind:showTaskModal>
  <h2 slot="header">Create Task</h2>

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <form on:submit={handleCreateTask} class="create-task-form">
    <div class="form-group">
      <label for="task_name">Name: </label>
      <input type="text" id="task_name" bind:value={newTask.task_name} required />
    </div>

    <div class="form-group">
      <label for="task_description">Description: </label>
      <textarea id="task_description" bind:value={newTask.task_description} style="height: 60px;"></textarea>
    </div>

    <div class="form-group">
      <label for="task_plan">Plan: </label>
      <select bind:value={newTask.task_plan} style="width: 60%;">
        {#each planNames as plan}
          <option value={plan.plan_mvp_name}>{plan.plan_mvp_name}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label for="task_notes">Notes: </label>
      <textarea id="task_notes" bind:value={newTask.task_notes} style="height: 60px;"></textarea>
    </div>

    <div class="modal-footer">
      <button type="submit" class="button">Create Task</button>
    </div>
  </form>
</TaskModal>

<PlanModal bind:showPlanModal>
  <h2 slot="header">Create Plan</h2>

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <form on:submit={handleCreatePlan} class="create-plan-form">
    <div class="form-group">
      <label for="plan_name">Name: </label>
      <input type="text" id="plan_name" bind:value={newPlan.plan_mvp_name} required />
    </div>

    <div class="date-group">
      <!-- App Start Date Field -->
      <div class="form-group">
        <label for="plan_startdate">Start Date: </label>
        <input type="date" id="plan_startdate" bind:value={newPlan.plan_startdate} required />
      </div>

      <!-- App End Date Field -->
      <div class="form-group" style="margin-left: 20px;">
        <label for="plan_enddate">End Date: </label>
        <input type="date" id="plan_enddate" bind:value={newPlan.plan_enddate} required />
      </div>
    </div>

    <div class="form-group" style="width: 100px;">
      <label for="plan_colour">Colour: </label>
      <input type="color" id="plan_colour" bind:value={newPlan.plan_colour} required />
    </div>

    <div class="modal-footer">
      <button type="submit" class="button">Create Plan</button>
    </div>
  </form>
</PlanModal>

<EditPlanModal bind:editPlanModal>
  <h2 slot="header">Edit Plan</h2>

  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}

  {#if successMessage}
  <p style="color: green;">{successMessage}</p>
  {/if}

  <form on:submit={handleEditPlan} class="edit-plan-form">
    <div class="form-group">
      <label for="plan_name">Name: </label>
      <input type="text" id="plan_name" disabled bind:value={editPlan.plan_mvp_name} required />
    </div>

    <div class="date-group">
      <!-- App Start Date Field -->
      <div class="form-group">
        <label for="plan_startdate">Start Date: </label>
        <input type="date" id="plan_startdate" bind:value={editPlan.plan_startdate} required />
      </div>

      <!-- App End Date Field -->
      <div class="form-group" style="margin-left: 20px;">
        <label for="plan_enddate">End Date: </label>
        <input type="date" id="plan_enddate" bind:value={editPlan.plan_enddate} required />
      </div>
    </div>

    <div class="form-group">
      <label for="plan_colour">Colour: </label>
      <select bind:value={editPlan.plan_colour} style="width: 82.7%;">
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="orange">Orange</option>
      </select>
    </div>

    <div class="modal-footer">
      <button type="submit" class="button">Save Changes</button>
    </div>
  </form>
</EditPlanModal>

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
    font-family: inherit;
    font-size: inherit;
    resize: none;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .notes-area {
    margin-top: 10px;
  }

  .button {
    margin-right: 10px;
  }

  .date-group {
		display: flex;
		gap: 20px;
	}
</style>