import { CardsArt, CrystalArt, DeckArt, TrophyArt } from '../components/Art.jsx';

// Правила описывают ровно то, что реализовано в серверном движке:
// колоды 24/36/52, шесть карт на руку, козырь, подкидывание до шести пар,
// добор после круга, режимы «подкидной» и «переводной».
const DECKS = [
  { size: 24, cards: '9, 10, валет, дама, король, туз', note: 'Девятка — младшая карта' },
  { size: 36, cards: '6, 7, 8, 9, 10, валет, дама, король, туз', note: 'Классическая колода' },
  { size: 52, cards: '2, 3, 4, 5, 6, 7, 8, 9, 10, валет, дама, король, туз', note: 'Двойка — младшая карта' },
];

const STEPS = [
  {
    title: 'Цель игры',
    text: 'Избавиться от всех карт раньше остальных. Кто остался с картами последним — тот и проиграл.',
  },
  {
    title: 'Раздача и козырь',
    text: 'Каждому игроку раздаётся по шесть карт. Одна карта из колоды открывается и задаёт козырную масть. Козырь бьёт любую карту другой масти.',
  },
  {
    title: 'Атака',
    text: 'Первый игрок ходит любой картой. Следующие карты можно подкидывать только тех достоинств, которые уже есть на столе.',
  },
  {
    title: 'Защита',
    text: 'Защищающийся отбивает карты старшей картой той же масти или любым козырем. Если отбить нечем — забирает все карты со стола.',
  },
  {
    title: 'Подкидывание',
    text: 'Другие игроки могут подкидывать карты, пока на столе меньше шести пар и у защищающегося хватает карт для отбоя.',
  },
  {
    title: 'Добор',
    text: 'После круга игроки добирают карты до шести — сначала атакующий, потом остальные. Козырь забирается последним.',
  },
  {
    title: 'Конец партии',
    text: 'Партия заканчивается, когда из колоды вышли все карты и у игроков не осталось карт, кроме одного — он и проиграл.',
  },
];

export function Rules({ onBack }) {
  return (
    <div className="screen v2 v3-rules">
      <div className="v3-topline">
        <button type="button" className="v2-link" onClick={onBack}>‹ Назад</button>
        <span className="v2-chip">36 карт — стандарт</span>
      </div>

      <div className="v2-title">
        <span>Правила игры</span>
      </div>

      <section className="v2-panel v3-rules__hero">
        <span className="v3-rules__art" aria-hidden="true">
          <CardsArt size={78} />
        </span>
        <div>
          <h2 className="v3-rules__title">Дурак</h2>
          <p className="v3-rules__lead">
            Играют 2–4 человека. Колода — 24, 36 или 52 карты, без джокеров.
            Козырь определяется в начале партии.
          </p>
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Колоды</span>
          <span className="v2-chip">3 варианта</span>
        </div>
        <div className="v3-rules__decks">
          {DECKS.map((deck) => (
            <div key={deck.size} className="v3-rules__deck">
              <span className="v3-rules__deck-art" aria-hidden="true">
                <DeckArt itemId="deck_graphite" size={40} />
              </span>
              <div>
                <span className="v3-rules__deck-name">{deck.size} карты</span>
                <p className="v3-rules__deck-cards">{deck.cards}</p>
                <span className="v3-rules__deck-note">{deck.note}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="v2-hint">
          Масти: пики, черви, бубны, трефы. Старшинство: от младшей карты колоды до туза.
        </p>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Ход игры</span>
          <span className="v2-chip">{STEPS.length}</span>
        </div>
        <div className="v3-rules__steps">
          {STEPS.map((step, index) => (
            <div key={step.title} className="v3-rules__step">
              <span className="v3-rules__num">{index + 1}</span>
              <div>
                <span className="v3-rules__step-title">{step.title}</span>
                <p className="v3-rules__step-text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Режимы</span>
          <span className="v2-chip">2</span>
        </div>
        <div className="v3-rules__modes">
          <div className="v3-rules__mode">
            <span className="v3-rules__mode-art" aria-hidden="true">
              <CrystalArt size={40} tone="violet" />
            </span>
            <span className="v3-rules__mode-name">Подкидной</span>
            <p className="v3-rules__mode-text">
              Классические правила: защищающийся отбивается, остальные подкидывают карты подходящих достоинств.
            </p>
          </div>
          <div className="v3-rules__mode">
            <span className="v3-rules__mode-art" aria-hidden="true">
              <TrophyArt size={40} />
            </span>
            <span className="v3-rules__mode-name">Переводной</span>
            <p className="v3-rules__mode-text">
              Пока стол пустой, защищающийся может перевести атаку картой того же достоинства на следующего игрока.
            </p>
          </div>
        </div>
      </section>

      <p className="v2-hint">
        Все ходы проверяет сервер: недопустимые карты отклонить нельзя обманом клиента.
      </p>
    </div>
  );
}

export default Rules;
