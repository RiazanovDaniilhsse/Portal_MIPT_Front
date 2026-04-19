import React from 'react';

export default function AdCard({ ad }) {
  return (
      <div className="ad-card">
        {/* Если есть фото, берем первое, иначе заглушка */}
        <div className="ad-image">
          <img
              src={ad.photoUrls && ad.photoUrls.length > 0 ? ad.photoUrls[0] : 'https://via.placeholder.com/150'}
              alt={ad.name}
          />
          <span className={`badge ${ad.type.toLowerCase()}`}>
          {ad.typeDisplayName}
        </span>
        </div>

        <div className="ad-info">
          <h3>{ad.name}</h3>
          <p className="category">{ad.categoryDisplayName}</p>
          <p className="price">{ad.price ? `${ad.price} ₽` : 'Бесплатно/Бартер'}</p>
          <p className="description-short">{ad.description}</p>
          <div className="ad-footer">
            <span className="date">{new Date(ad.createdAt).toLocaleDateString()}</span>
            {ad.isFavorite && <span className="favorite-icon">❤️</span>}
          </div>
        </div>
      </div>
  );
}