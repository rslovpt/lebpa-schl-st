from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global data store for tasks
tasks_data = [
    {
        "title": "Darwin's Tasks",
        "tasks": [
            "Work on stuff for the week",
            "Another task example"
        ]
    },
    {
        "title": "Name's Tasks",
        "tasks": []
    }
]

# --- Socket.IO Events --- #

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# Send all existing tasks to client
@socketio.on('get_all_tasks')
def handle_get_all_tasks():
    emit('all_tasks', tasks_data)

# Create a new task in a specific container
@socketio.on('create_task')
def handle_create_task(data):
    container_title = data.get('container_title')
    task_text = data.get('task_text')
    for container in tasks_data:
        if container['title'] == container_title:
            container['tasks'].append(task_text)
            break
    else:
        # If container not found, optionally create it
        tasks_data.append({"title": container_title, "tasks": [task_text]})
    emit('new_task', data, broadcast=True)  # broadcast to all clients

# Edit a task
@socketio.on('edit_task')
def handle_edit_task(data):
    container_title = data.get('container_title')
    old_task_text = data.get('old_task_text')
    new_task_text = data.get('new_task_text')
    for container in tasks_data:
        if container['title'] == container_title:
            try:
                idx = container['tasks'].index(old_task_text)
                container['tasks'][idx] = new_task_text
                break
            except ValueError:
                pass
    emit('update_task', data, broadcast=True)

# Delete a task
@socketio.on('delete_task')
def handle_delete_task(data):
    container_title = data.get('container_title')
    task_text = data.get('task_text')
    for container in tasks_data:
        if container['title'] == container_title:
            try:
                container['tasks'].remove(task_text)
                break
            except ValueError:
                pass
    emit('delete_task', data, broadcast=True)

# Create a new task container
@socketio.on('create_container')
def handle_create_container(data):
    container_title = data.get('container_title')
    tasks_data.append({"title": container_title, "tasks": []})
    emit('new_container', data, broadcast=True)

# Edit container title
@socketio.on('edit_container')
def handle_edit_container(data):
    old_title = data.get('old_title')
    new_title = data.get('new_title')
    for container in tasks_data:
        if container['title'] == old_title:
            container['title'] = new_title
            break
    emit('update_container', data, broadcast=True)

# Delete a container
@socketio.on('delete_container')
def handle_delete_container(data):
    title = data.get('container_title')
    for i, container in enumerate(tasks_data):
        if container['title'] == title:
            del tasks_data[i]
            break
    emit('delete_container', data, broadcast=True)

# --- Run server --- #
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)