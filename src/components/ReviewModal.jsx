import { useState, useEffect } from 'react';

export default function ReviewModal({ isOpen, onClose, onSkip, onSubmit, adTitle, loading, error }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setIsAnonymous(false);
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit() {
    if (rating === 0) { setValidationError('Выберите оценку'); return; }
    if (comment.trim().length < 10) { setValidationError('Комментарий должен быть не менее 10 символов'); return; }
    setValidationError('');
    onSubmit({ rating, comment: comment.trim(), isAnonymous });
  }

  const displayError = validationError || error;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Подтвердить получение</div>
        {adTitle && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {adTitle}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Оценка продавца</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star === rating ? 0 : star)}
                style={{
                  fontSize: 32,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: star <= (hoverRating || rating) ? '#f5a623' : 'var(--border)',
                  padding: '0 2px',
                  lineHeight: 1,
                  transition: 'color 0.1s',
                }}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][rating]}
            </div>
          )}
        </div>

        {rating > 0 && (
          <>
            <div style={{ marginBottom: 4 }}>
              <textarea
                value={comment}
                onChange={e => { setComment(e.target.value); setValidationError(''); }}
                placeholder="Расскажите о покупке (не менее 10 символов)..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ fontSize: 11, color: comment.trim().length > 4900 ? 'var(--negative)' : 'var(--muted)', textAlign: 'right' }}>
                {comment.trim().length} / 5000
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              Анонимный отзыв
            </label>
          </>
        )}

        {displayError && (
          <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 10, padding: '6px 10px', background: 'oklch(0.95 0.04 25)', borderRadius: 'var(--radius-sm)' }}>
            {displayError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onSkip}
            disabled={!!loading}
            style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading === 'skip' ? '...' : 'Только подтвердить'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!!loading || rating === 0}
            style={{
              flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)',
              background: (loading || rating === 0) ? 'var(--border)' : 'var(--positive)',
              color: (loading || rating === 0) ? 'var(--muted)' : '#fff',
              cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading === 'submit' ? '...' : 'Подтвердить с отзывом'}
          </button>
        </div>
        {rating === 0 && (
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
            Выберите звёзды, чтобы оставить отзыв
          </div>
        )}
      </div>
    </div>
  );
}
