import type { ColorId, Product } from './types';

export const COLORS: { id: ColorId; label: string; hex: string }[] = [
  { id: 'white', label: 'Белый', hex: '#f7f7f7' },
  { id: 'red', label: 'Красный', hex: '#e9002b' },
  { id: 'black', label: 'Чёрный', hex: '#000000' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'sweatshirt',
    title: 'Свитшот оверсайз',
    formTitle: 'Свитшот оверсайз',
    price: '5 500 ₽',
    specs: 'ONE SIZE · 100% COTTON',
    image: '/assets/products/sweatshirt.png',
    colors: ['black', 'white', 'red'],
    hasCrest: false,
  },
  {
    id: 'tshirt',
    title: 'Футболка оверсайз',
    formTitle: 'Футболка оверсайз',
    price: '3 500 ₽',
    specs: 'ONE SIZE · 100% COTTON',
    image: '/assets/products/tshirt-b.png',
    colors: ['black', 'white', 'red'],
    hasCrest: false,
  },
  {
    id: 'longsleeve',
    title: 'Лонгслив оверсайз',
    formTitle: 'Лонгслив оверсайз',
    price: '5 500 ₽',
    specs: 'ONE SIZE · 100% COTTON',
    image: '/assets/products/longsleeve.png',
    colors: ['black', 'white', 'red'],
    hasCrest: false,
  },
  {
    id: 'team',
    title: 'Футболка команды',
    formTitle: 'Футболка с гербом команды',
    price: '3 500 ₽',
    specs: 'ONE SIZE · 100% COTTON',
    image: '/assets/products/crest-front.png',
    colors: ['black', 'white'],
    hasCrest: true,
  },
];

export const TEAMS = [
  'ДТБ дизайн',
  'Cash Management',
  'Самоинкассация',
  'Цифровой рубль для бизнеса',
  'Сберказначейство',
  'Бизнес-карта',
  'SmartBridge',
  'Электронная подпись для бизнеса',
  'Банковское сопровождение',
  'Альтернативные платежи',
  'Digital ID',
  'SberConnect+',
  'Инкассация',
  'Машиночитаемая доверенность',
  'Межбанковские расчёты',
  'Аренда индивидуальных сейфов ЮЛ',
  'Избирательные кампании',
  'Кассовые операции',
  'Ликвидность и Обязательства клиентов ЮЛ',
  'Мультибанк',
  'Привлечение средств',
  'Расчёты и платежи',
  'Цифровые права',
  'Model-View-Controller',
  'Поддержка продаж',
  'Расчётное обслуживание',
  'Сервис обмена документами B2B',
  'Платформа цифровых активов',
  'Redesign Metodogy and cost',
  'Продвижение продуктов',
  'Клиентские решения ДТБ',
  'Платформа Про.Бизнес',
  'Product analytics',
  'ОPS',
  'ОPS сервисное сопровождение',
  'ОPS DATASTORE',
  'DTB AI',
  'Разработка для ОPS',
  'OPS Solutions',
  'Practices and processes',
  'Operational Quality Management',
  'Общие прикладные сервисы платформы DB',
  'Платформы Группы компаний и корпоративные связи',
];

export const CREST_GALLERY = [
  { src: '/assets/crests/crest-1.png', alt: 'Гербы команд — лист 1' },
  { src: '/assets/crests/crest-2.png', alt: 'Гербы команд — лист 2' },
  { src: '/assets/crests/crest-3.png', alt: 'Гербы команд — лист 3' },
  { src: '/assets/crests/crest-4.png', alt: 'Гербы команд — лист 4' },
];

export const TEAM_SIDES = {
  front: { src: '/assets/products/crest-front.png', alt: 'Футболка команды спереди' },
  back: { src: '/assets/products/crest-back.png', alt: 'Футболка команды сзади' },
};

export const ADDRESSES = [
  'Москва, Кутузовский 32 корпус 1',
  'Казань, IT-парк им. Б. Рамеева',
  'Екатеринбург, ул. Розы Люксембург, 56а',
  'Санкт-Петербург, ул. Уральская, д.1 (литеры М, Ч)',
  'Сочи, Краснодарский край, улица Войкова, 2',
  'Барнаул, пр-кт Комсомольский, 106А',
  'Ростов-на-Дону, пр-кт Космонавтов, зд27В',
  'Новосибирск, Новосибирская обл, пр-кт Димитрова, 2',
  'Омск, Омская обл, ул. Маршала Жукова, 4/1',
  'Хабаровск, Хабаровский край, ул Краснореченская, 111в',
  'Самара, Московское шоссе 15',
  'Рязань, ул. Семашко 14',
  'Нет моего офиса',
];

export const PRINT_SIDES = [
  { id: 'front' as const, label: 'Спереди' },
  { id: 'back' as const, label: 'Сзади' },
];
