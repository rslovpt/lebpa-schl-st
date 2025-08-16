// ================= Socket.IO Setup =================
const socket = io("http://localhost:5000");

socket.on('connect', () => {
    console.log('Connected to server');
});

// ================= Task Editing =================
function makeTaskEditable(task, containerTitle, maxChars = 108) {
    const taskText = task.querySelector('h3');
    if (!taskText) return;

    taskText.addEventListener('click', () => {
        const oldText = taskText.textContent;
        const input = document.createElement('textarea');
        input.value = oldText;
        input.className = 'task-edit-input';

        // --- keep all styling here ---
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
            const newText = input.value || 'New task goes here';

            // Emit first
            socket.emit('edit_task', {
                container_title: containerTitle,
                old_task_text: oldText,
                new_task_text: newText
            });

            // Then replace DOM
            taskText.textContent = newText;
            task.replaceChild(taskText, input);
            task.removeChild(counter);
        }

        // Save on blur
        input.addEventListener('blur', save);

        // Save on Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();  // emit + replace DOM
            }
        });
    });
}

// ================= Container Title Editing =================
function makeContainerTitleEditable(container) {
    const title = container.querySelector('.name-tag');
    if (!title) return;

    const oldTitle = title.textContent;

    title.addEventListener('click', () => {
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

            // Emit correct edit container event
            socket.emit('edit_container', { old_title: oldTitle, new_title: newTitle });
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

// ================= Task Creation =================
function attachTaskCreation(btn, containerTitle) {
    btn.addEventListener('click', () => {
        const newTask = document.createElement('div');
        newTask.classList.add('task');
        newTask.innerHTML = `
            <h3>Click Text to Edit</h3>
            <button class="check-btn" title="Mark Complete">Mark Done</button>
        `;

        const container = btn.parentElement;
        container.insertBefore(newTask, btn);

        // Immediately emit creation to server
        socket.emit('create_task', {
            container_title: containerTitle,
            task_text: "New task goes here"
        });

        const markDoneBtn = newTask.querySelector('.check-btn');
        markDoneBtn.addEventListener('click', () => {
            const taskText = newTask.querySelector('h3').textContent;
            newTask.remove();
            socket.emit('delete_task', {
                container_title: containerTitle,
                task_text: taskText
            });
        });

        // Make it editable after creation
        makeTaskEditable(newTask, containerTitle);
    });
}

// ================= Container Creation =================
function createServerContainer(containerData) {
    const tasksContainer = document.querySelector('.tasks-container');
    const addListBtn = document.querySelector('.task-list-create');

    const newContainer = document.createElement('div');
    newContainer.classList.add('task-container');

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

    tasksContainer.insertBefore(newContainer, addListBtn);

    makeContainerTitleEditable(newContainer);
    attachTaskCreation(addTaskBtn, containerData.title);

    // Populate tasks
    containerData.tasks.forEach(taskText => {
        const task = document.createElement('div');
        task.classList.add('task');
        task.innerHTML = `<h3>${taskText}</h3><button class="check-btn" title="Mark Complete">Mark Done</button>`;
        newContainer.insertBefore(task, addTaskBtn);
        makeTaskEditable(task, containerData.title);

        task.querySelector('.check-btn').addEventListener('click', () => {
            task.remove();
            socket.emit('delete_task', {
                container_title: containerData.title,
                task_text: taskText
            });
        });
    });

    return newContainer;
}

// Attach "Add Task List" button
const addListBtn = document.querySelector('.task-list-create');
if (addListBtn) {
    addListBtn.addEventListener('click', () => {
        const newContainerData = { title: "New Name's Tasks", tasks: [] };
        createServerContainer(newContainerData);
        socket.emit('create_container', { container_title: newContainerData.title });
    });
}

// ================= Initial Load =================
socket.emit('get_all_tasks');

socket.on('all_tasks', (data) => {
    const tasksContainer = document.querySelector('.tasks-container');
    const addListBtn = document.querySelector('.task-list-create');

    // Clear existing containers
    tasksContainer.querySelectorAll('.task-container').forEach(c => c.remove());

    data.forEach(containerData => {
        createServerContainer(containerData);
    });
});
