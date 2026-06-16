//  Конфигурация
// Базовый адрес, по которому сервер отдаёт данные о клиентах
const API_BASE = 'http://localhost:3000/api/clients';
// Список всех клиентов, полученных с сервера
let clients = [];
// Настройки текущей сортировки: поле (id/fio/createdAt/updatedAt) и направление (asc/desc)
let currentSort = { field: 'id', order: 'asc' };
// Текст, который пользователь ввёл в поле поиска
let currentSearch = '';
// Определение элементов
// Таблица, куда рисуются клиенты
const table = document.querySelector('.main__table');
// Элемент-крутилка, который показывается во время загрузки
const loader = document.querySelector('.main__load');
// Поле ввода для поиска клиентов
const searchInput = document.querySelector('.header__search');
// Кнопка "Добавить клиента"
const addBtn = document.querySelector('.main__btn');

// Загрузчик
// Показать надпись "Загрузка..." и сделать её видимой
function showLoader() {
    if (loader) {
        loader.style.display = 'flex';
        loader.textContent = '⏳ Loading...';
    }
}
// Спрятать загрузчик
function hideLoader() {
    if (loader) {
        loader.style.display = 'none';
        loader.textContent = '';
    }
}

// Доп. функции
// Склеить фамилию, имя и отчество в одну строку с пробелами
function getFullName(client) {
    return `${client.surname || ''} ${client.name || ''} ${client.lastName || ''}`.trim();
}
// Превратить страшную ISO-дату в красивый формат "ДД.ММ.ГГГГ ЧЧ:ММ"
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `
        <div class="table-date">
            <span class="date-black">${day}.${month}.${year}</span>
            <span class="date-gray">${hours}:${minutes}</span>
        </div>
    `;
}
// Какая иконка какому типу контакта соответствует
const icons = {
    'телефон': './backend/img/phone.png',
    'email': './backend/img/email.png',
    'vk': './backend/img/vk.png',
    'facebook': './backend/img/facebook.png',
    'twitter': './backend/img/twitter.png'   
};
// Нарисовать иконки контактов (максимум 4 штуки, остальные свернуть в +N)
function renderContacts(contacts) {
    if (!contacts || contacts.length === 0) return '—';
    let html = '';
    const visible = contacts.slice(0, 4);
    const hiddenCount = contacts.length - 4;
    
    visible.forEach(contact => {
        const iconSrc = icons[contact.type.toLowerCase()] || './backend/img/default-link.png';
        html += `
            <div class="contact-item">
                <img class="contact-icon-img" src="${iconSrc}" alt="${contact.type}" width="20" height="20">
                <div class="tooltip">
                    <span class="tooltip__type">${contact.type}:</span>
                    <a href="#" class="tooltip__value">${contact.value}</a>
                </div>
            </div>
        `;
    });
    if (hiddenCount > 0) html += `<span class="contact-more">+${hiddenCount}</span>`;
    return html;
}

// Сортировка
// Сортирует массив клиентов по указанному полю. Возвращает НОВЫЙ массив (не меняет исходный)
function sortClients(arr, field, order) {
    return [...arr].sort((a, b) => {
        let valA, valB;
        if (field === 'id') {
            // Берём последние 6 цифр ID, чтобы сортировать по короткому номеру
            valA = Number(String(a.id).slice(-6));
            valB = Number(String(b.id).slice(-6));
        } else if (field === 'fio') {
            // Сортируем по полному имени (Фамилия + Имя + Отчество)
            valA = getFullName(a);
            valB = getFullName(b);
        } else if (field === 'createdAt' || field === 'updatedAt') {
            // Сортируем по дате
            valA = new Date(a[field]);
            valB = new Date(b[field]);
        } else {
            return 0;
        }
        // Сравниваем значения и возвращаем -1/1 в зависимости от направления сортировки
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

// Таблица
// Главная функция, которая рисует таблицу с клиентами
function renderTable() {
    // Находим tbody (тело таблицы), если нет — создаём
    let tbody = table.querySelector('tbody');
    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }
    // Сортируем клиентов
    const sorted = sortClients(clients, currentSort.field, currentSort.order);
    tbody.innerHTML = '';
    // Если клиентов нет — показываем сообщение
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No clients</td></tr>';
        return;
    }
    // Для каждого клиента создаём строку таблицы
    sorted.forEach(client => {
        const row = document.createElement('tr');
        row.className = 'main__row';
        row.innerHTML = `
            <td class="main__id__col">${String(client.id).slice(-6)}</td>
            <td class="main__col">${getFullName(client)}</td>
            <td class="main__col">${formatDate(client.createdAt)}</td>
            <td class="main__col">${formatDate(client.updatedAt)}</td>
            <td class="main__col">${renderContacts(client.contacts)}</td>
            <td class="main__col">
                <button class="edit-btn" data-id="${client.id}">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M0 9.50167V12.0017H2.5L9.87333 4.62833L7.37333 2.12833L0 9.50167ZM11.8067 2.695C12.0667 2.435 12.0667 2.015 11.8067 1.755L10.2467 0.195C9.98667 -0.065 9.56667 -0.065 9.30667 0.195L8.08667 1.415L10.5867 3.915L11.8067 2.695Z" fill="#9873FF"/>
                    </svg> Edit
                </button>
                <button class="delete-btn" data-id="${client.id}">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z" fill="#F06A4D"/>
                    </svg> Delete
                </button>
            <tr>
        `;
        tbody.appendChild(row);
    });
    // После того как кнопки появились на странице — вешаем на них обработчики
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => openEditModal(btn.dataset.id);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteClient(btn.dataset.id);
    });
}

// Визуал сортировки
// Обновляет стрелочки в заголовках таблицы (↑ ↓)
function updateSortIcons() {
    const headers = document.querySelectorAll('th.main__hcol[data-sort]');
    headers.forEach(th => {
        const field = th.dataset.sort;
        let icon = th.querySelector('.sort-icon');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'sort-icon';
            th.appendChild(icon);
        }
        // Если текущее поле сортировки совпадает с этим заголовком — показываем активную стрелку
        if (field === currentSort.field) {
            icon.textContent = currentSort.order === 'asc' ? ' ↑' : ' ↓';
            icon.style.opacity = '1';
        } else {
            icon.textContent = ' ↑';
            icon.style.opacity = '0.5';
        }
    });
}

// Запросы
// Загружает клиентов с сервера. Если передан search — добавляет параметр поиска
async function fetchClients(search = '') {
    showLoader();
    try {
        let url = API_BASE;
        if (search) url += `?search=${encodeURIComponent(search)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        clients = await response.json();
        renderTable();
        updateSortIcons();
    } catch (error) {
        console.error(error);
        const tbody = table.querySelector('tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error loading data</td></tr>';
    } finally {
        hideLoader();
    }
}

// Поиск и его задержка
let searchTimeout = null;
// Когда пользователь печатает в поиске — не дёргаем сервер на каждую букву, ждём 300мс
function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = searchInput.value;
        fetchClients(currentSearch);
    }, 300);
}

// Настройка сортирования
// Привязывает обработчики кликов к заголовкам таблицы
function initSorting() {
    const headers = document.querySelectorAll('th.main__hcol');
    // Что написано в заголовке -> на какое поле сортировать
    const fieldMap = {
        'id': 'id',
        'фамилия': 'fio',
        'создания': 'createdAt',
        'изменения': 'updatedAt'
    };
    headers.forEach(th => {
        const text = th.innerText.toLowerCase();
        let field = null;
        for (let key in fieldMap) {
            if (text.includes(key)) {
                field = fieldMap[key];
                break;
            }
        }
        if (field) {
            th.dataset.sort = field;
            th.style.cursor = 'pointer';
            th.onclick = () => {
                // Кликнули по тому же полю — меняем направление. Иначе — новое поле и сортировка по возрастанию
                if (currentSort.field === field) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.order = 'asc';
                }
                renderTable();
                updateSortIcons();
            };
        }
    });
    updateSortIcons();
}

// Модальное окно
// ID клиента, которого сейчас редактируем. Если null — значит добавляем нового
let currentEditId = null;
// Ссылка на модальное окно (чтобы не создавать каждый раз заново)
let modal = null;
// Создаёт модальное окно с формой и добавляет его на страницу
function createModal() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'client-modal';
    modalDiv.className = 'modal';
    modalDiv.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="modal-header">
                <h2 id="modal-title">Add Client</h2>
                <span class="client-id"></span>
            </div>
            <form id="client-form">
                <div class="input-group">
                    <input type="text" id="surname" required>
                    <label>Last Name <span style="color:#9873FF">*</span></label>
                </div>
                <div class="input-group">
                    <input type="text" id="name" required>
                    <label>First Name <span style="color:#9873FF">*</span></label>
                </div>
                <div class="input-group">
                    <input type="text" id="lastName">
                    <label>Middle Name</label>
                </div>
                <div class="contacts-block">
                    <div id="contacts-container"></div>
                    <button type="button" id="add-contact-btn">
                        <img src="./backend/img/add.png" width="14"> Add Contact
                    </button>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="save-btn">Save</button>
                    <button type="button" class="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modalDiv);
    return modalDiv;
}
// Возвращает модальное окно (создаёт, если ещё не создано)
function getModal() {
    if (!modal) modal = createModal();
    return modal;
}
// Добавляет одну строку для ввода контакта (выпадающий список + поле ввода + кнопка удаления)
function addContactRow(type = 'телефон', value = '') {
    const container = document.getElementById('contacts-container');
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML = `
        <select class="contact-type">
            <option value="телефон">Phone</option>
            <option value="email">Email</option>
            <option value="vk">VK</option>
            <option value="facebook">Facebook</option>
        </select>
        <input type="text" class="contact-value" value="${escapeHtml(value)}">
        <button type="button" class="remove-contact">✕</button>
    `;
    // При клике на крестик удаляем эту строку
    row.querySelector('.remove-contact').onclick = () => row.remove();
    container.appendChild(row);
}
// Защита от XSS-атак: заменяет & < > на безопасные HTML-сущности
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
// Собирает данные из формы: фамилия, имя, отчество и список контактов
function getFormData() {
    const surname = document.getElementById('surname').value.trim();
    const name = document.getElementById('name').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    // Фамилия и имя обязательны — проверяем
    if (!surname || !name) {
        alert('Last name and First name are required');
        return null;
    }
    // Проходим по всем строкам с контактами, собираем только заполненные
    const contacts = [];
    document.querySelectorAll('#contacts-container .contact-row').forEach(row => {
        const type = row.querySelector('.contact-type').value;
        const value = row.querySelector('.contact-value').value.trim();
        if (value) contacts.push({ type, value });
    });
    return { surname, name, lastName, contacts };
}

// Открывает модальное окно. isEdit = true для редактирования, false для добавления
function openModal(isEdit = false) {
    const modalElem = getModal();
    modalElem.style.display = 'flex';
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Client' : 'New Client';
    // Очищаем все поля
    document.getElementById('surname').value = '';
    document.getElementById('name').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('contacts-container').innerHTML = '';
    addContactRow(); // Одна пустая строка для контакта, чтобы не было совсем пусто
    const idSpan = modalElem.querySelector('.client-id');
    if (idSpan) idSpan.textContent = '';
}
// Закрывает модальное окно
function closeModal() {
    const modalElem = getModal();
    modalElem.style.display = 'none';
    currentEditId = null; // Сбрасываем ID редактируемого
}
// Сохраняет клиента (POST — новый, PATCH — обновление существующего)
async function saveClient() {
    const data = getFormData();
    if (!data) return;
    const isEdit = currentEditId !== null;
    const url = isEdit ? `${API_BASE}/${currentEditId}` : API_BASE;
    const method = isEdit ? 'PATCH' : 'POST';
    try {
        showLoader();
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Save failed');
        await response.json();
        closeModal();
        await fetchClients(currentSearch); // Обновляем таблицу
    } catch (err) {
        alert('Failed to save client');
    } finally {
        hideLoader();
    }
}
// Открывает модальное окно с заполненными данными клиента для редактирования
async function openEditModal(clientId) {
    currentEditId = clientId;
    try {
        showLoader();
        const response = await fetch(`${API_BASE}/${clientId}`);
        const client = await response.json();
        openModal(true);
        document.getElementById('surname').value = client.surname || '';
        document.getElementById('name').value = client.name || '';
        document.getElementById('lastName').value = client.lastName || '';
        const container = document.getElementById('contacts-container');
        container.innerHTML = '';
        if (client.contacts?.length) {
            client.contacts.forEach(c => addContactRow(c.type, c.value));
        } else {
            addContactRow();
        }
        const idSpan = getModal().querySelector('.client-id');
        idSpan.textContent = `ID: ${client.id}`;
        hideLoader();
    } catch (err) {
        alert('Failed to load client');
        hideLoader();
        closeModal();
    }
}

// Удаляет клиента. Сначала спрашивает подтверждение
async function deleteClient(clientId) {
    if (!confirm('Delete this client?')) return;
    
    try {
        showLoader();
        await fetch(`${API_BASE}/${clientId}`, { method: 'DELETE' });
        if (currentEditId === clientId) closeModal(); // Если удалили того, кого редактировали — закрываем окно
        await fetchClients(currentSearch);
    } catch (err) {
        alert('Delete failed');
    } finally {
        hideLoader();
    }
}

//  События
// Вешает все обработчики событий на кнопки, формы, окна
function initEventListeners() {
    // Кнопка "Добавить клиента"
    if (addBtn) addBtn.onclick = () => {
        currentEditId = null;
        openModal(false);
    };
    // Поиск — при каждом вводе символа (с задержкой)
    if (searchInput) searchInput.oninput = onSearchInput;
    const modalElem = getModal();
    modalElem.querySelector('.modal-close').onclick = closeModal; 
    modalElem.querySelector('.cancel-btn').onclick = closeModal;
    // Отправка формы (Save)
    modalElem.querySelector('#client-form').onsubmit = (e) => {
        e.preventDefault(); // Чтобы страница не перезагружалась
        saveClient();
    };
    // Кнопка "Добавить контакт" внутри модального окна
    modalElem.querySelector('#add-contact-btn').onclick = () => addContactRow();
    // Закрыть окно, если кликнули на серую область вокруг
    window.onclick = (e) => {
        if (e.target === modalElem) closeModal();
    };
}

// Запуск
// Ждём, пока вся страница загрузится, только потом запускаем наш код
document.addEventListener('DOMContentLoaded', () => {
    // Убеждаемся, что у таблицы есть tbody (куда вставлять строки)
    if (!table.querySelector('tbody')) {
        table.appendChild(document.createElement('tbody'));
    }
    initSorting();          // Настраиваем сортировку при клике на заголовки
    initEventListeners();   // Настраиваем все кнопки и формы
    fetchClients();         // Первая загрузка клиентов с сервера
});