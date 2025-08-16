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

// Existing tasks
const existingTasks = document.getElementsByClassName('task');
for (let task of existingTasks) {
    const markDoneBtn = task.querySelector('.check-btn');
    if (markDoneBtn) markDoneBtn.addEventListener('click', () => task.remove());
    makeTaskEditable(task);
}