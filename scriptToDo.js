const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const statsTotal = document.getElementById('stats-total');
const statsActive = document.getElementById('stats-active');
const statsCompleted = document.getElementById('stats-completed');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressBarText = document.getElementById('progress-bar-text');

let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let filter = 'all'; // all | active | completed
let editingIdx = null; // index of the task being edited
let searchText = '';

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function updateStats() {
  statsTotal.textContent = todos.length;
  statsActive.textContent = todos.filter(t => !t.completed).length;
  statsCompleted.textContent = todos.filter(t => t.completed).length;
}

function updateProgressBar() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBarFill.style.width = percent + '%';
  progressBarText.textContent = percent + '%';
}

function renderTodos() {
  todoList.innerHTML = '';
  let filtered = todos;
  if (filter === 'active') filtered = todos.filter(t => !t.completed);
  if (filter === 'completed') filtered = todos.filter(t => t.completed);
  if (searchText.trim() !== '') {
    filtered = filtered.filter(t => t.text.toLowerCase().includes(searchText.toLowerCase()));
  }

  if (filtered.length === 0) {
    todoList.innerHTML = '<div style="text-align:center;color:#aaa;">No tasks here!</div>';
    updateStats();
    updateProgressBar();
    return;
  }
  filtered.forEach((todo, idx) => {
    const realIdx = todos.indexOf(todo);
    const item = document.createElement('div');
    item.className = 'todo-item' + (todo.completed ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'custom-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
      todos[realIdx].completed = !todos[realIdx].completed;
      saveTodos();
      renderTodos();
    });

    // Edit mode
    if (editingIdx === realIdx) {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = todo.text;
      editInput.className = 'todo-edit-input';
      editInput.style.flex = '1';
      editInput.style.fontSize = '1.08rem';
      editInput.style.marginRight = '0.7rem';
      editInput.autofocus = true;
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          finishEdit(realIdx, editInput.value);
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });
      editInput.addEventListener('blur', () => {
        cancelEdit();
      });
      item.appendChild(checkbox);
      item.appendChild(editInput);
      // Save button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'edit-save-btn';
      saveBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10.5L9 14.5L15 7.5" stroke="#6C63FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      saveBtn.style.background = 'none';
      saveBtn.style.border = 'none';
      saveBtn.style.cursor = 'pointer';
      saveBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        finishEdit(realIdx, editInput.value);
      });
      item.appendChild(saveBtn);
    } else {
      const text = document.createElement('div');
      text.className = 'todo-text';
      text.textContent = todo.text;
      // Double click to edit
      text.addEventListener('dblclick', () => {
        editingIdx = realIdx;
        renderTodos();
        setTimeout(() => {
          const input = document.querySelector('.todo-edit-input');
          if (input) input.focus();
        }, 0);
      });
      item.appendChild(checkbox);
      item.appendChild(text);
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.title = 'Edit';
      editBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5-3.5.5.5-3.5 8.5-8.5z" stroke="#6C63FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      editBtn.style.background = 'none';
      editBtn.style.border = 'none';
      editBtn.style.cursor = 'pointer';
      editBtn.style.marginLeft = '0.5rem';
      editBtn.addEventListener('click', () => {
        editingIdx = realIdx;
        renderTodos();
        setTimeout(() => {
          const input = document.querySelector('.todo-edit-input');
          if (input) input.focus();
        }, 0);
      });
      item.appendChild(editBtn);
    }

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 8.75V14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12.5 8.75V14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3.75 5.75H16.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.833 5.75L6.25 15.083C6.25 15.663 6.663 16.25 7.25 16.25H12.75C13.337 16.25 13.75 15.663 13.75 15.083L14.167 5.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8.75 3.75H11.25C11.6642 3.75 12 4.08579 12 4.5V5.75H8V4.5C8 4.08579 8.33579 3.75 8.75 3.75Z" stroke="currentColor" stroke-width="1.5"/></svg>';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      todos.splice(realIdx, 1);
      saveTodos();
      renderTodos();
    });
    item.appendChild(delBtn);
    todoList.appendChild(item);
  });
  updateStats();
  updateProgressBar();
}

function finishEdit(idx, value) {
  const val = value.trim();
  if (val) {
    todos[idx].text = val;
    saveTodos();
  }
  editingIdx = null;
  renderTodos();
}

function cancelEdit() {
  editingIdx = null;
  renderTodos();
}

todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;
  todos.unshift({ text: value, completed: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.getAttribute('data-filter');
    renderTodos();
  });
});

searchInput.addEventListener('input', (e) => {
  searchText = e.target.value;
  renderTodos();
});

// Initial render
renderTodos(); 