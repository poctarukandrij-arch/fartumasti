// Визуальный предпросмотр предмета магазина: колода, стол, эмодзи, эффект.
export function ItemPreview({ item, className = '' }) {
  const visual = item?.visual || {};

  if (item?.type === 'deck') {
    return (
      <div className={`preview ${className}`}>
        <div className="preview__deck">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="preview__card"
              style={{
                background: visual.back || '#1b2030',
                borderColor: visual.edge || '#3a4150',
                marginLeft: index === 0 ? 0 : -13,
                transform: `rotate(${(index - 1) * 9}deg)`,
              }}
            >
              <span className="preview__chip" style={{ background: visual.accent }} />
              {visual.cardStyle ? (
                <span className="preview__stripe" style={{ background: visual.accent }} />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (item?.type === 'table') {
    const [top, bottom] = visual.felt || ['#15171c', '#0e1013'];
    return (
      <div className={`preview ${className}`}>
        <span
          className="preview__table"
          style={{
            background: `radial-gradient(circle at 50% 26%, ${top}, ${bottom})`,
            borderColor: visual.line || '#2a2f38',
          }}
        />
      </div>
    );
  }

  if (item?.type === 'emoji') {
    return (
      <div className={`preview ${className}`}>
        <span className="preview__emoji">{visual.symbol || '—'}</span>
      </div>
    );
  }

  if (item?.type === 'effect') {
    const kind = visual.kind && visual.kind !== 'none' ? visual.kind : 'glow';
    return (
      <div className={`preview ${className}`}>
        <span className={`preview__effect preview__effect--${kind}`} />
      </div>
    );
  }

  return <div className={`preview ${className}`} />;
}

export default ItemPreview;
