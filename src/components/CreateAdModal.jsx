import {useState, useEffect} from 'react';
import {api} from '../api/client';
import './CreateAdModal.css';

export default function CreateAdModal({isOpen, onClose, onSuccess}) {
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'OBJECTS',
    group: '',
    category: '',
    name: '',
    description: '',
    price: ''
  });

  // Загружаем категории при открытии окна
  useEffect(() => {
    if (isOpen) {
      api.advertisements.getCategories()
          .then(data => setAllCategories(data))
          .catch(err => console.error("Ошибка загрузки категорий:", err));
    }
  }, [isOpen]);

  // --- ЛОГИКА КАСКАДНЫХ СПИСКОВ ---

  const filteredGroups = allCategories.filter(group =>
      group.categories.some(cat => cat.type === form.type)
  );

// 2. Список имен доступных групп для выпадающего списка
  const availableGroups = filteredGroups.map(g => g.groupName);

// 3. Достаем список конкретных категорий для выбранной группы и типа
  const currentGroupData = filteredGroups.find(g => g.groupName === form.group);
  const availableSpecificCategories = currentGroupData
      ? currentGroupData.categories.filter(cat => cat.type === form.type)
      : [];

  // Сброс зависимых полей при смене Типа
  useEffect(() => {
    setForm(prev => ({...prev, group: '', category: ''}));
  }, [form.type]);

  // Сброс категории при смене Группы
  useEffect(() => {
    setForm(prev => ({...prev, category: ''}));
  }, [form.group]);

  // ---------------------------------

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) {
      return setError(
          'Пожалуйста, выберите финальную категорию');
    }

    setLoading(true);
    try {
      // Формируем payload для бэкенда
      const requestData = {
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        type: form.type,
        category: form.category // Отправляем name из Category.java
      };

      await api.advertisements.create(requestData);

      setForm({
        type: 'OBJECTS',
        group: '',
        category: '',
        name: '',
        description: '',
        price: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError('Ошибка при создании. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Новое объявление</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {error && <div className="error-msg">{error}</div>}

            {/* 1. ВЫБОР ТИПА */}
            <div className="form-group type-selector">
              <label>Тип объявления</label>
              <div className="radio-group">
                <label>
                  <input
                      type="radio" name="type" value="OBJECTS"
                      checked={form.type === 'OBJECTS'} onChange={handleChange}
                  />
                  Барахолка (Товары)
                </label>
                <label>
                  <input
                      type="radio" name="type" value="SERVICES"
                      checked={form.type === 'SERVICES'} onChange={handleChange}
                  />
                  Услуги
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Группа категорий</label>
              <select
                  name="group"
                  value={form.group}
                  onChange={handleChange}
                  required
              >
                <option value="">-- Выберите группу --</option>
                {availableGroups.map(groupPath => {
                  const parts = groupPath.split('/');
                  const cleanGroupName = parts.length > 1 ? parts[1]
                      : groupPath;
                  return (
                      <option key={groupPath} value={groupPath}>
                        {cleanGroupName}
                      </option>
                  );
                })}
              </select>
            </div>

            {/* Выбор категории */}
            <div className="form-group">
              <label>Категория</label>
              <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={!form.group}
              >
                <option value="">-- Выберите категорию --</option>
                {availableSpecificCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.displayName.split('/').pop()}
                    </option>
                ))}
              </select>
            </div>

            {/* ОСНОВНЫЕ ДАННЫЕ */}
            <div className="form-group">
              <label>Название *</label>
              <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange}
                  placeholder="Например: Макбук или Репетитор по физике"
                  required
              />
            </div>

            <div className="form-group">
              <label>Цена (₽)</label>
              <input
                  type="number" name="price" value={form.price}
                  onChange={handleChange}
                  placeholder="0, если бесплатно или по договоренности" min="0"
              />
            </div>

            <div className="form-group">
              <label>Описание *</label>
              <textarea
                  name="description" value={form.description}
                  onChange={handleChange}
                  placeholder="Подробно опишите детали..." rows="3" required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn"
                      onClick={onClose}>Отмена
              </button>
              <button type="submit" className="submit-btn"
                      disabled={loading || !form.category}>
                {loading ? 'Создание...' : 'Опубликовать'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}