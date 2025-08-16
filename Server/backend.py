from flask import Flask
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# ---- Data model ----
# containers: [{ id, title, tasks: [{ id, text }, ...] }, ...]
tasks_data = []

JSON_FILE = 'Server/data.json'

def save_to_json():
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks_data, f, indent=4)

def load_from_json():
    global tasks_data
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            try:
                tasks_data = json.load(f)
            except json.JSONDecodeError:
                print("JSON file corrupted. Starting fresh.")
                tasks_data = []
    else:
        # If file doesn't exist, use default data
        tasks_data = [
            {
                "id": 1,
                "title": "Example's Tasks",
                "tasks": [
                    {"id": 1, "text": "Work on stuff for the week"},
                    {"id": 2, "text": "Another task example"}
                ]
            }
        ]
        save_to_json()

def find_container(container_id):
    for c in tasks_data:
        if c["id"] == container_id:
            return c
    return None

def next_container_id():
    return (max([c["id"] for c in tasks_data]) + 1) if tasks_data else 1

def next_task_id(container):
    return (max([t["id"] for t in container["tasks"]]) + 1) if container["tasks"] else 1

# ---- Socket.IO events ----
@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('get_all_tasks')
def handle_get_all_tasks():
    emit('all_tasks', tasks_data)

@socketio.on('create_container')
def handle_create_container(data):
    title = data.get('container_title', "New Name's Tasks")
    new_container = {
        "id": next_container_id(),
        "title": title,
        "tasks": []
    }
    tasks_data.append(new_container)
    save_to_json()
    emit('new_container', new_container, broadcast=True)

@socketio.on('edit_container')
def handle_edit_container(data):
    container_id = data.get('container_id')
    new_title = data.get('new_title', '').strip()
    container = find_container(container_id)
    if container and new_title:
        container['title'] = new_title
        save_to_json()
        emit('update_container', container, broadcast=True)

@socketio.on('delete_container')
def handle_delete_container(data):
    container_id = data.get('container_id')
    idx = None
    for i, c in enumerate(tasks_data):
        if c["id"] == container_id:
            idx = i
            break
    if idx is not None:
        del tasks_data[idx]
        save_to_json()
        emit('delete_container', {"container_id": container_id}, broadcast=True)

@socketio.on('create_task')
def handle_create_task(data):
    container_id = data.get('container_id')
    text = data.get('task_text', "New task goes here")
    container = find_container(container_id)
    if not container:
        return
    new_task = {"id": next_task_id(container), "text": text}
    container["tasks"].append(new_task)
    save_to_json()
    emit('new_task', {"container_id": container_id, "task": new_task}, broadcast=True)

@socketio.on('edit_task')
def handle_edit_task(data):
    container_id = data.get('container_id')
    task_id = data.get('task_id')
    new_text = data.get('new_task_text', '').strip()
    container = find_container(container_id)
    if not container or not new_text:
        return
    for task in container["tasks"]:
        if task["id"] == int(task_id):
            task["text"] = new_text
            save_to_json()
            emit('update_task', {"container_id": container_id, "task": task}, broadcast=True)
            return

@socketio.on('delete_task')
def handle_delete_task(data):
    container_id = data.get('container_id')
    task_id = data.get('task_id')
    container = find_container(container_id)
    if not container:
        return
    for i, task in enumerate(container["tasks"]):
        if task["id"] == int(task_id):
            del container["tasks"][i]
            save_to_json()
            emit('delete_task', {"container_id": container_id, "task_id": int(task_id)}, broadcast=True)
            return

# ---- Initialize data from JSON ----
load_from_json()

print("Running Script")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)