// ================= Socket.IO Setup =================
const socket = io("https://0c1f4618a860.ngrok-free.app", { transports: ['websocket'], secure: true });

function refreshConnection() {
    if (socket.connected) {
        socket.disconnect();
        console.log("Manually disconnected");
    }
    socket.connect();  // reconnects automatically
    console.log("Reconnecting...");
}

setInterval(() => {
    if (!socket.connected) {
        console.log("Disconnected — trying to reconnect...");
        socket.connect();
    }
    updateConnectionLabel();
}, 2000); // 2000ms = 2 seconds

socket.on('connect', () => {
  console.log('Connected to server');
  // Ask for all data on connect to avoid race
  socket.emit('get_all_tasks');

  document.getElementById('WarningLabel').innerText = "Connected";
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    document.getElementById('WarningLabel').innerText = "Disconnected";
});


// ---------- Helpers ----------
function createTaskElement(containerId, taskObj) {
  const task = document.createElement('div');
  task.classList.add('task');
  task.dataset.id = taskObj.id;

  task.innerHTML = `
    <h3>${escapeHtml(taskObj.text)}</h3>
    <button class="check-btn" title="Mark Complete">Mark Done</button>
  `;

  // Editable text
  makeTaskEditable(task, containerId);

  // Mark done
  const btn = task.querySelector('.check-btn');
  btn.addEventListener('click', () => {
    socket.emit('delete_task', {
      container_id: containerId,
      task_id: taskObj.id
    });
    // Do not remove here; wait for server 'delete_task' to avoid desync
  });

  return task;
}

function createServerContainer(containerData) {
  const tasksContainer = document.querySelector('.tasks-container');
  const addListBtn = document.querySelector('.task-list-create');

  const newContainer = document.createElement('div');
  newContainer.classList.add('task-container');
  newContainer.dataset.id = containerData.id;

  // Title
  const title = document.createElement('h3');
  title.classList.add('name-tag');
  title.textContent = containerData.title;
  newContainer.appendChild(title);

  // Add Task button
  const addTaskBtn = document.createElement('button');
  addTaskBtn.classList.add('task-create');
  addTaskBtn.title = "Create Task";
  addTaskBtn.textContent = "Add New Task +";
  newContainer.appendChild(addTaskBtn);

  // Insert before the "Add Task List" button
  tasksContainer.insertBefore(newContainer, addListBtn);

  // Make title editable
  makeContainerTitleEditable(newContainer);

  // Attach "create task" action (emit only; server will broadcast back)
  addTaskBtn.addEventListener('click', () => {
    const cid = Number(newContainer.dataset.id);
    socket.emit('create_task', {
      container_id: cid,
      task_text: "New task goes here"
    });
  });

  // Populate tasks
  (containerData.tasks || []).forEach(taskObj => {
    const taskEl = createTaskElement(containerData.id, taskObj);
    newContainer.insertBefore(taskEl, addTaskBtn);
  });

  return newContainer;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ================= Task Editing =================
function makeTaskEditable(task, containerId, maxChars = 108) {
  const taskText = task.querySelector('h3');
  if (!taskText) return;

  taskText.addEventListener('click', () => {
    const oldText = taskText.textContent;
    const taskId = task.dataset.id;
    const input = document.createElement('textarea');
    input.value = oldText;
    input.className = 'task-edit-input';

    // --- styling ---
    Object.assign(input.style, {
      width: '100%',
      fontFamily: taskText.style.fontFamily || 'Nunito, sans-serif',
      fontSize: taskText.style.fontSize || '0.95rem',
      background: 'rgba(255,255,255,0.1)',
      color: '#fff',
      border: 'none',
      outline: 'none',
      padding: '2px 4px',
      borderRadius: '4px',
      resize: 'none',
      boxSizing: 'border-box',
      lineHeight: '1.4',
      overflow: 'hidden',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    });

    const counter = document.createElement('div');
    counter.style.position = 'absolute';
    counter.style.bottom = '2px';
    counter.style.right = '6px';
    counter.style.fontSize = '0.75rem';
    counter.style.color = '#ccc';
    counter.textContent = `${input.value.length}/${maxChars}`;

    task.style.position = 'relative';
    task.appendChild(counter);
    task.replaceChild(input, taskText);
    input.focus();

    function resize() {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    }
    resize();

    input.addEventListener('input', () => {
      if (input.value.length > maxChars) input.value = input.value.substring(0, maxChars);
      counter.textContent = `${input.value.length}/${maxChars}`;
      resize();
    });

    function save() {
      // Optimistic UI (so the box closes immediately)
      const newText = input.value || 'New task goes here';
      taskText.textContent = newText;
      task.replaceChild(taskText, input);
      task.removeChild(counter);

      // Tell server
      socket.emit('edit_task', {
        container_id: Number(containerId),
        task_id: Number(taskId),
        new_task_text: newText
      });
      // If server sends different text, update via 'update_task' handler
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        save();
      }
    });
  });
}

// ================= Container Title Editing =================
function makeContainerTitleEditable(container) {
  const title = container.querySelector('.name-tag');
  if (!title) return;

  title.addEventListener('click', () => {
    const containerId = Number(container.dataset.id);

    const inputWrapper = document.createElement('div');
    inputWrapper.style.position = 'relative';
    inputWrapper.style.width = '100%';

    const input = document.createElement('textarea');
    input.value = title.textContent;
    input.maxLength = 50;
    input.rows = 1;
    input.className = 'title-edit-input';

    Object.assign(input.style, {
      width: '100%',
      fontFamily: title.style.fontFamily || 'Nunito, sans-serif',
      fontSize: title.style.fontSize || '1.5rem',
      background: 'rgba(255,255,255,0.1)',
      color: '#fff',
      border: 'none',
      outline: 'none',
      padding: '0 4px',
      borderRadius: '4px',
      boxSizing: 'border-box',
      textAlign: 'center',
      resize: 'none',
      overflow: 'hidden',
      wordBreak: 'break-word',
      marginBottom: title.style.marginBottom || '20px',
      lineHeight: '1.2',
    });

    const counter = document.createElement('span');
    counter.textContent = `${input.value.length}/50`;
    counter.style.position = 'absolute';
    counter.style.bottom = '2px';
    counter.style.right = '6px';
    counter.style.fontSize = '0.8rem';
    counter.style.color = '#ccc';

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(counter);
    container.replaceChild(inputWrapper, title);
    input.focus();

    function updateCounter() {
      counter.textContent = `${input.value.length}/50`;
    }

    function resize() {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    }
    resize();

    input.addEventListener('input', () => {
      resize();
      updateCounter();
    });

    function save() {
      const newTitle = input.value || "New Name's Tasks";
      container.replaceChild(title, inputWrapper);
      title.textContent = newTitle;

      socket.emit('edit_container', {
        container_id: containerId,
        new_title: newTitle
      });
      // If server disagrees, it will broadcast update_container
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        save();
      }
    });
  });
}

// ================= "Add Task List" button =================
const addListBtn = document.querySelector('.task-list-create');
if (addListBtn) {
  addListBtn.addEventListener('click', () => {
    socket.emit('create_container', { container_title: "New Name's Tasks" });
  });
}

// ================= Initial render =================
socket.on('all_tasks', (containers) => {
  const tasksContainer = document.querySelector('.tasks-container');
  const addListBtn = document.querySelector('.task-list-create');

  // Clear existing rendered containers
  tasksContainer.querySelectorAll('.task-container').forEach(c => c.remove());

  // Render all
  containers.forEach(containerData => {
    createServerContainer(containerData);
  });
});

// ================= Live updates from server =================
socket.on('new_container', (containerData) => {
  createServerContainer(containerData);
});

socket.on('update_container', (containerData) => {
  const container = document.querySelector(`.task-container[data-id="${containerData.id}"]`);
  if (container) {
    const title = container.querySelector('.name-tag');
    if (title) title.textContent = containerData.title;
  }
});

socket.on('delete_container', ({ container_id }) => {
  const container = document.querySelector(`.task-container[data-id="${container_id}"]`);
  if (container) container.remove();
});

socket.on('new_task', (data) => {
  const { container_id, task } = data;
  const container = document.querySelector(`.task-container[data-id="${container_id}"]`);
  if (!container) return;
  const addTaskBtn = container.querySelector('.task-create');
  const el = createTaskElement(container_id, task);
  container.insertBefore(el, addTaskBtn);
});

socket.on('update_task', (data) => {
  const { container_id, task } = data;
  const el = document.querySelector(`.task-container[data-id="${container_id}"] .task[data-id="${task.id}"] h3`);
  if (el) el.textContent = task.text;
});

socket.on('delete_task', (data) => {
  const { container_id, task_id } = data;
  const el = document.querySelector(`.task-container[data-id="${container_id}"] .task[data-id="${task_id}"]`);
  if (el) el.remove();
});
