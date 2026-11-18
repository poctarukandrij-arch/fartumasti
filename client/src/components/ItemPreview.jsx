export function ItemPreview({ item, size = 'md' }) {
  const visual = item.visual || {};
  const boxStyle = size === 'sm' ? { height: 56 } : { height: 92 };

  if (item.type === 'deck') {
    return (
      <div className="preview" style={boxStyle}>
        <div className="preview__deck">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="preview__card"
              style={{
                background: `linear-gradient(150deg, ${visual.back || '#1a1e26'}, #0b0d11)`,
                borderColor: visual.edge || '#2c323d',
                boxShadow: index === 2 ? `0 0 14px ${visual.accent || '#5b8cff'}55` : 'none',
                transform: `translateX(${(index - 1) * 12}px) rotate(${(index - 1) * 5}deg)`,
              }}
            >
              <span className="preview__chip" style={{ background: visual.accent || '#5b8cff' }} />
              <span className="preview__stripe" style={{ background: visual.edge || '#2c323d' }} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'table') {
    const felt = visual.felt || ['#15171c', '#0e1013'];
    return (
      <div className="preview" style={boxStyle}>
        <div
          className="preview__table"
          style={{
            background: `radial-gradient(75% 75% at 50% 25%, ${felt[0]}, ${felt[1]})`,
            borderColor: visual.line || '#2a2f38',
            boxShadow: `inset 0 0 22px ${visual.line || '#2a2f38'}44`,
          }}
        >
          <span className="preview__card" style={{ width: 20, height: 28 }} />
          <span className="preview__card" style={{ width: 20, height: 28, marginLeft: -6 }} />
        </div>
      </div>
    );
  }

  if (item.type === 'emoji') {
    return (
      <div className="preview" style={boxStyle}>
        <span className="preview__emoji">{visual.symbol || '—'}</span>
      </div>
    );
  }

  return (
    <div className="preview" style={boxStyle}>
      <span className={`preview__effect preview__effect--${visual.kind || 'none'}`} />
    </div>
  );
}
