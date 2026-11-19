import { useState } from 'react';
import { openLink } from '../telegram.js';

// Поддержка: живые каналы связи через Telegram + короткий FAQ.
// Все кнопки рабочие: открывают чат бота или копируют адрес поддержки.
const SUPPORT_URL = 'https://t.me/Fartumastiibot';
const SUPPORT_HANDLE = '@Fartumastiibot';

const TOPICS = [
  {
    id: 'balance',
    title: 'Баланс и операции',
    sub: 'Пополнение, вывод, история',
    text:
      'Пополнение и вывод работают через СБП и подключаются после запуска платёжного провайдера. Пока операции закрыты, баланс и история доступны в разделе «Статистика» → «Финансовая история».',
  },
  {
    id: 'game',
    title: 'Игра и правила',
    sub: 'Ходы, взносы, спорные партии',
    text:
      'Все ходы проверяет сервер: подкинуть, перевести или отбить можно только разрешённой картой. Если партия завершилась спорно — пришлите код комнаты и время, мы проверим журнал партии.',
  },
  {
    id: 'items',
    title: 'Предметы и кейсы',
    sub: 'Награды, инвентарь, экипировка',
    text:
      'Награду из кейса определяет сервер, шансы открыты в разделе «Все награды и шансы». Полученные предметы сразу попадают в «Инвентарь», где их можно надеть.',
  },
  {
    id: 'access',
    title: 'Вход в приложение',
    sub: 'Telegram, имя, сессия',
    text:
      'Вход выполняется автоматически через Telegram. Если приложение не открывается — запустите его кнопкой в боте заново. Имя задаётся один раз, сменить его можно в профиле за 49 ₽.',
  },
];

export function Support({ onBack, toast }) {
  const [open, setOpen] = useState(null);

  async function copyHandle() {
    try {
      await navigator.clipboard?.writeText(SUPPORT_HANDLE);
      toast?.(`Скопировано: ${SUPPORT_HANDLE}`, 'success');
    } catch {
      toast?.(`Поддержка: ${SUPPORT_HANDLE}`);
    }
  }

  return (
    <div className="screen v2 fm-support">
      <div className="v2-title">
        <span>Поддержка</span>
        <span className="v2-chip">на связи</span>
      </div>

      <section className="fm-support__hero">
        <span className="fm-support__badge" aria-hidden="true">24/7</span>
        <span className="fm-support__title">Поможем разобраться</span>
        <p className="fm-support__text">
          Пишите прямо в бот — ответим по игре, балансу и предметам. Укажите ник и код комнаты, если вопрос
          про конкретную партию.
        </p>
        <div className="fm-support__actions">
          <button type="button" className="v2-btn v2-btn--primary" onClick={() => openLink(SUPPORT_URL)}>
            Написать в Telegram
          </button>
          <button type="button" className="v2-btn" onClick={copyHandle}>
            {SUPPORT_HANDLE}
          </button>
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Частые вопросы</span>
          <span className="v2-chip">{TOPICS.length}</span>
        </div>
        <div className="v2-stack">
          {TOPICS.map((topic) => {
            const isOpen = open === topic.id;
            return (
              <div key={topic.id} className={`fm-faq ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="fm-faq__head"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : topic.id)}
                >
                  <span className="fm-faq__body">
                    <span className="fm-faq__title">{topic.title}</span>
                    <span className="fm-faq__sub">{topic.sub}</span>
                  </span>
                  <span className="fm-faq__sign" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p className="fm-faq__text">{topic.text}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <p className="fm-fineprint">
        Поддержка не запрашивает пароли, коды из Telegram и данные банковских карт. Никогда не сообщайте их.
      </p>

      <button type="button" className="v2-btn v2-btn--ghost" onClick={onBack}>
        Назад
      </button>
    </div>
  );
}

export default Support;
