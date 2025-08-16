const createButtons = document.getElementsByClassName('task-create');

function makeTaskEditable(task, maxChars = 108) {
    const taskText = task.querySelector('h3');

    taskText.addEventListener('click', () => {
        const input = document.createElement('textarea');
        input.value = taskText.textContent;
        input.className = 'task-edit-input';

        // Style to match task
        input.style.width = '100%';
        input.style.fontFamily = taskText.style.fontFamily || 'Nunito, sans-serif';
        input.style.fontSize = taskText.style.fontSize || '0.95rem';
        input.style.background = 'rgba(255,255,255,0.1)';
        input.style.color = '#fff';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.padding = '2px 4px';
        input.style.borderRadius = '4px';
        input.style.resize = 'none';
        input.style.boxSizing = 'border-box';
        input.style.lineHeight = '1.4';
        input.style.overflow = 'hidden';
        input.style.wordBreak = 'break-word';
        input.style.overflowWrap = 'break-word';
        input.style.whiteSpace = 'pre-wrap';

        // Counter
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
            taskText.textContent = input.value || 'New task goes here';
            task.replaceChild(taskText, input);
            task.removeChild(counter);
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
function makeContainerTitleEditable(container) {
    const title = container.querySelector('.name-tag');
    if (!title) return;

    title.addEventListener('click', () => {
        const inputWrapper = document.createElement('div');
        inputWrapper.style.position = 'relative';
        inputWrapper.style.width = '100%';

        const input = document.createElement('textarea'); // use textarea to allow wrapping
        input.value = title.textContent;
        input.maxLength = 50; // character limit
        input.rows = 1;        // start as single line
        input.className = 'title-edit-input';

        // Style to match title
        input.style.width = '100%';
        input.style.fontFamily = title.style.fontFamily || 'Nunito, sans-serif';
        input.style.fontSize = title.style.fontSize || '1.5rem';
        input.style.background = 'rgba(255,255,255,0.1)';
        input.style.color = '#fff';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.padding = '0 4px'; // smaller padding so it looks like one line
        input.style.borderRadius = '4px';
        input.style.boxSizing = 'border-box';
        input.style.textAlign = 'center';
        input.style.resize = 'none';
        input.style.overflow = 'hidden';
        input.style.wordBreak = 'break-word';
        input.style.marginBottom = title.style.marginBottom || '20px';
        input.style.lineHeight = '1.2'; // match title height closely

        // Counter
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
            title.textContent = input.value || "New Name's Tasks";
            container.replaceChild(title, inputWrapper);
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


// Add new tasks
for (let btn of createButtons) {
    btn.addEventListener('click', () => {
        const newTask = document.createElement('div');
        newTask.classList.add('task');
        newTask.innerHTML = `
            <h3>Click Text to Edit</h3>
            <button class="check-btn" title="Mark Complete">Mark Done</button>
        `;

        const container = btn.parentElement;
        container.insertBefore(newTask, btn);

        const markDoneBtn = newTask.querySelector('.check-btn');
        markDoneBtn.addEventListener('click', () => newTask.remove());

        makeTaskEditable(newTask);
    });
}

// Function to make a new task-container editable and functional
function createTaskContainer(containerName = "New Name's Tasks") {
    // Get the tasks container
    const tasksContainer = document.querySelector('.tasks-container');

    // Create the new container
    const newContainer = document.createElement('div');
    newContainer.classList.add('task-container');

    // Add title
    const title = document.createElement('h3');
    title.classList.add('name-tag');
    title.textContent = containerName;
    newContainer.appendChild(title);

    // Add "Add New Task" button
    const addTaskBtn = document.createElement('button');
    addTaskBtn.classList.add('task-create');
    addTaskBtn.title = "Create Task";
    addTaskBtn.textContent = "Add New Task +";
    newContainer.appendChild(addTaskBtn);

    // Append to tasks-container
    tasksContainer.insertBefore(newContainer, document.querySelector('.task-list-create'));

    // Make the title editable
    makeContainerTitleEditable(newContainer);

    // Make the addTask button functional
    attachTaskCreation(addTaskBtn);
}

// Function to attach the task creation functionality to a button
function attachTaskCreation(btn) {
    btn.addEventListener('click', () => {
        const newTask = document.createElement('div');
        newTask.classList.add('task');
        newTask.innerHTML = `
            <h3>New task goes here</h3>
            <button class="check-btn" title="Mark Complete">Mark Done</button>
        `;

        // Insert the new task before the add button
        const container = btn.parentElement;
        container.insertBefore(newTask, btn);

        // Attach delete behavior
        const markDoneBtn = newTask.querySelector('.check-btn');
        markDoneBtn.addEventListener('click', () => newTask.remove());

        // Make the task text editable
        makeTaskEditable(newTask);
    });
}

// Attach existing "Add Task List" button
const addListBtn = document.querySelector('.task-list-create');
addListBtn.addEventListener('click', () => {
    createTaskContainer();
});

// Initialize existing task-create buttons on page load
document.querySelectorAll('.task-create').forEach(btn => attachTaskCreation(btn));

// Initialize existing tasks
document.querySelectorAll('.task').forEach(task => makeTaskEditable(task));

// Initialize existing container titles
document.querySelectorAll('.task-container').forEach(container => makeContainerTitleEditable(container));

// Existing tasks
const existingTasks = document.getElementsByClassName('task');
for (let task of existingTasks) {
    const markDoneBtn = task.querySelector('.check-btn');
    if (markDoneBtn) markDoneBtn.addEventListener('click', () => task.remove());
    makeTaskEditable(task);
}

const containers = document.getElementsByClassName('task-container');
for (let container of containers) {
    makeContainerTitleEditable(container);
}