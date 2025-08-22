'use strict';

(function () {
  const STORAGE_KEY = 'miapp.todos.v1';

  const formEl = document.getElementById('todo-form');
  const inputEl = document.getElementById('todo-input');
  const listEl = document.getElementById('todo-list');
  const filterButtons = Array.from(document.querySelectorAll('.filter'));
  const itemsLeftEl = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed');

  let todos = [];
  let currentFilter = 'all'; // 'all' | 'active' | 'completed'

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        todos = parsed.map(normalizeTodo).filter(Boolean);
      }
    } catch (_) {
      todos = [];
    }
  }

  function normalizeTodo(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      id: String(t.id || generateId()),
      text: String(t.text || '').slice(0, 200),
      completed: Boolean(t.completed),
      createdAt: Number(t.createdAt || Date.now())
    };
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addTodo(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    const todo = { id: generateId(), text: trimmed, completed: false, createdAt: Date.now() };
    todos.unshift(todo);
    saveTodos();
    renderTodos();
  }

  function toggleTodo(id, completed) {
    const item = todos.find(t => t.id === id);
    if (!item) return;
    item.completed = Boolean(completed);
    saveTodos();
    renderTodos();
  }

  function deleteTodo(id) {
    const next = todos.filter(t => t.id !== id);
    if (next.length === todos.length) return;
    todos = next;
    saveTodos();
    renderTodos();
  }

  function editTodo(id, newText) {
    const item = todos.find(t => t.id === id);
    if (!item) return;
    const trimmed = String(newText || '').trim();
    if (!trimmed) {
      // Empty edit deletes the item
      deleteTodo(id);
      return;
    }
    item.text = trimmed;
    saveTodos();
    renderTodos();
  }

  function clearCompleted() {
    const next = todos.filter(t => !t.completed);
    if (next.length === todos.length) return;
    todos = next;
    saveTodos();
    renderTodos();
  }

  function getFilteredTodos() {
    if (currentFilter === 'active') return todos.filter(t => !t.completed);
    if (currentFilter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }

  function renderTodos() {
    listEl.innerHTML = '';

    const filtered = getFilteredTodos();
    for (const todo of filtered) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' completed' : '');
      li.dataset.id = String(todo.id);

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.className = 'toggle';
      toggle.checked = Boolean(todo.completed);

      const text = document.createElement('span');
      text.className = 'text';
      text.textContent = String(todo.text);
      text.title = 'Doble clic para editar';

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete';
      del.setAttribute('aria-label', 'Eliminar');
      del.textContent = '×';

      li.append(toggle, text, del);
      listEl.appendChild(li);
    }

    const left = todos.filter(t => !t.completed).length;
    itemsLeftEl.textContent = String(left);

    filterButtons.forEach(btn => {
      const active = btn.dataset.filter === currentFilter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    clearCompletedBtn.disabled = todos.every(t => !t.completed);
  }

  // Event bindings
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(inputEl.value);
    inputEl.value = '';
    inputEl.focus();
  });

  listEl.addEventListener('change', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains('toggle')) return;
    const li = target.closest('.todo-item');
    if (!li) return;
    const id = li.dataset.id || '';
    toggleTodo(id, target.checked);
  });

  listEl.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('delete')) return;
    const li = target.closest('.todo-item');
    if (!li) return;
    const id = li.dataset.id || '';
    deleteTodo(id);
  });

  listEl.addEventListener('dblclick', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('text')) return;
    const li = target.closest('.todo-item');
    if (!li) return;
    const id = li.dataset.id || '';
    const current = target.textContent || '';
    const next = window.prompt('Editar tarea:', current);
    if (next === null) return;
    editTodo(id, next);
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextFilter = btn.dataset.filter || 'all';
      currentFilter = nextFilter;
      renderTodos();
    });
  });

  clearCompletedBtn.addEventListener('click', () => {
    clearCompleted();
  });

  // Persist sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadTodos();
      renderTodos();
    }
  });

  // Init
  loadTodos();
  renderTodos();
})();