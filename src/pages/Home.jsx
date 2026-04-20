import {useState, useEffect} from 'react';
import {api} from '../api/client';
import './Home.css';
import Header from "../components/Header.jsx";
import CreateAdModal from "../components/CreateAdModal.jsx";

export default function Home() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAds = async () => {
    try {
      setLoading(true);
      const data = await api.advertisements.getAll();
      setAds(data);
    } catch (err) {
      setError('Не удалось загрузить объявления');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  if (loading && ads.length === 0) {
    return <div className="loader">Загрузка объявлений...</div>;
  }
  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  return (
      <div className="page-wrapper">
        <Header/>

        <div className="home-layout">
          <aside className="sidebar">
            <h3>Категории</h3>
            <ul className="category-list">
              <li className="active">Все категории</li>
              <li>Услуги</li>
              <li>Вещи</li>
              <li>Учеба</li>
              <li>Недвижимость</li>
            </ul>
          </aside>

          <main className="feed">
            <div className="feed-header">
              <h2>Свежие объявления</h2>
              <div className="search-bar">
                <input type="text" placeholder="Поиск по названию..."/>
              </div>
              <button
                  className="create-btn"
                  onClick={() => setIsModalOpen(true)}
              >
                + Создать
              </button>
            </div>

            <div className="ads-grid">
              {ads.length > 0 ? (
                  ads.map(ad => (
                      <div key={ad.id} className="ad-card">
                        <div className="ad-image">
                          {ad.photoUrls?.length > 0 ? (
                              <img src={ad.photoUrls[0]} alt={ad.name}/>
                          ) : (
                              <div className="no-photo">Нет фото</div>
                          )}
                          <span className={`ad-category ${ad.type?.toLowerCase()
                          || ''}`}>
                            {ad.categoryDisplayName || ad.category}
                          </span>
                        </div>
                        <div className="ad-content">
                          <h3>{ad.name}</h3>
                          <p className="ad-price">{ad.price ? `${ad.price} ₽`
                              : 'Бесплатно'}</p>
                          <p className="ad-description">{ad.description?.substring(
                              0, 60)}...</p>
                          <button className="details-btn">Подробнее</button>
                        </div>
                      </div>
                  ))
              ) : (
                  <p>Объявлений пока нет. Будьте первым!</p>
              )}
            </div>
          </main>
        </div>
        <CreateAdModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={loadAds}
        />
      </div>
  );
}