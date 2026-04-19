import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import AdCard from '../components/AdCard';

export default function Home() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.advertisements.getAll()
        .then(data => {
          setAds(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Ошибка загрузки объявлений:", err);
          setLoading(false);
        });
  }, []);

  if (loading) return <div className="loader">Загрузка объявлений...</div>;

  return (
      <div className="container">
        <header className="home-header">
          <h1>Объявления Физтеха</h1>
          <p>Товары и услуги в вашем общежитии</p>
        </header>

        <div className="ads-grid">
          {ads.length > 0 ? (
              ads.map(ad => <AdCard key={ad.id} ad={ad} />)
          ) : (
              <p>Объявлений пока нет. Будьте первым!</p>
          )}
        </div>
      </div>
  );
}