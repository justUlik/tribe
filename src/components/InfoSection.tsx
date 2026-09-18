export function InfoSection() {
  return (
    <section className="info">
      <h2 className="section-title">Важная информация</h2>
      <ol className="info-steps">
        <li className="info-step">
          <p className="info-num">1</p>
          <p className="info-copy">
            Для заказа необходимо внести предоплату в сбор в приложении СБОЛа.
            <br />
            Не забывайте выходить из сбора после перевода денег, иначе другие коллеги не смогут присоединиться.
          </p>
        </li>
        <li className="info-step">
          <p className="info-num">2</p>
          <p className="info-copy">
            Доставка будет осуществляться СДЕКом и будет оплачиваться при получении отдельно.
            <br />
            Сотрудники из Москвы могут забрать мерч лично из офиса на Кутузовском проспекте.
          </p>
        </li>
        <li className="info-step">
          <p className="info-num">3</p>
          <p className="info-copy">
            Мерч вы получите до конца 2026 года (по точным срокам с вами свяжутся дополнительно).
            <br />
            По всем вопросам обращайтесь к{' '}
            <a href="mailto:evborzikhina@sberbank.ru">Борзихиной Екатерине.</a>
          </p>
        </li>
      </ol>
    </section>
  );
}
