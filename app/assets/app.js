(function () {
	const STORAGE_KEY = "notes.v1";

	/** @type {{id:string,title:string,body:string,updatedAt:number}[]} */
	let notes = [];
	let selectedId = null;

	// Elements
	const searchInput = document.getElementById("searchInput");
	const form = document.getElementById("noteForm");
	const titleInput = document.getElementById("noteTitle");
	const bodyInput = document.getElementById("noteBody");
	const clearBtn = document.getElementById("clearBtn");
	const notesList = document.getElementById("notesList");

	function load() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			notes = raw ? JSON.parse(raw) : [];
		} catch (e) {
			notes = [];
		}
	}

	function save() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
	}

	function createId() {
		return Math.random().toString(36).slice(2) + Date.now().toString(36);
	}

	function resetEditor() {
		selectedId = null;
		form.reset();
		titleInput.focus();
	}

	function upsertNote({ id, title, body }) {
		const now = Date.now();
		if (!id) {
			const newNote = { id: createId(), title: title || "Sin título", body: body || "", updatedAt: now };
			notes.unshift(newNote);
			selectedId = newNote.id;
			return newNote;
		}
		const idx = notes.findIndex(n => n.id === id);
		if (idx !== -1) {
			notes[idx] = { ...notes[idx], title: title || "Sin título", body: body || "", updatedAt: now };
			return notes[idx];
		}
		const created = { id, title: title || "Sin título", body: body || "", updatedAt: now };
		notes.unshift(created);
		return created;
	}

	function deleteNote(id) {
		notes = notes.filter(n => n.id !== id);
		if (selectedId === id) selectedId = null;
	}

	function formatDate(ts) {
		return new Date(ts).toLocaleString();
	}

	function render(filter = "") {
		const query = filter.trim().toLowerCase();
		const filtered = query
			? notes.filter(n => (n.title + " " + n.body).toLowerCase().includes(query))
			: notes;

		notesList.innerHTML = "";
		if (filtered.length === 0) {
			notesList.innerHTML = `<li class="note-item"><em>No hay notas.</em></li>`;
			return;
		}

		for (const note of filtered) {
			const li = document.createElement("li");
			li.className = "note-item";
			li.innerHTML = `
				<h3>${escapeHtml(note.title)}</h3>
				<div class="meta">Actualizado: ${formatDate(note.updatedAt)}</div>
				<div class="actions">
					<button data-id="${note.id}" data-action="edit" class="secondary">Editar</button>
					<button data-id="${note.id}" data-action="delete" class="danger">Eliminar</button>
				</div>
			`;
			notesList.appendChild(li);
		}
	}

	function escapeHtml(str) {
		return String(str)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	// Events
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const title = titleInput.value.trim();
		const body = bodyInput.value.trim();
		if (!title && !body) return; // ignore empty submits

		upsertNote({ id: selectedId, title, body });
		save();
		render(searchInput.value);
		resetEditor();
	});

	clearBtn.addEventListener("click", () => {
		resetEditor();
	});

	notesList.addEventListener("click", (e) => {
		const target = e.target;
		if (!(target instanceof Element)) return;
		const action = target.getAttribute("data-action");
		const id = target.getAttribute("data-id");
		if (!action || !id) return;

		if (action === "edit") {
			const note = notes.find(n => n.id === id);
			if (!note) return;
			selectedId = id;
			titleInput.value = note.title;
			bodyInput.value = note.body;
			titleInput.focus();
		} else if (action === "delete") {
			if (confirm("¿Eliminar esta nota?")) {
				deleteNote(id);
				save();
				render(searchInput.value);
				if (selectedId === id) resetEditor();
			}
		}
	});

	searchInput.addEventListener("input", () => {
		render(searchInput.value);
	});

	// Init
	load();
	render("");
})();