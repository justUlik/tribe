import { useEffect, useMemo, useState } from 'react';
import { PAYMENT_LINK } from '../config';
import { ADDRESSES, COLORS, PRINT_SIDES, PRODUCTS, TEAMS } from '../data';
import { nbspText } from '../nbsp';
import type { ColorId, OrderPrefill, PrintSide, ProductId } from '../types';
import { ButtonCard } from './ButtonCard';
import { PaymentConfirm, type PayMethod } from './fields/PaymentConfirm';
import { PhoneField } from './fields/PhoneField';
import { QtyStepper } from './fields/QtyStepper';
import { SelectField } from './fields/SelectField';
import { TextField } from './fields/TextField';
import { UploadZone } from './fields/UploadZone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const NAME_RE = /^[A-Za-zА-Яа-яЁё\-\s]{5,120}$/;
const FILE_OK = /\.(png|jpe?g|webp|gif|heic|pdf)$/i;
const MAX_FILE = 12 * 1024 * 1024;

function parsePrice(label: string) {
  return Number(label.replace(/\D/g, '')) || 0;
}

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU').replace(/[\u00A0\u202F]/g, ' ')} ₽`;
}

type Props = {
  open: boolean;
  mobile: boolean;
  prefill: OrderPrefill;
  onClose: () => void;
};

export function OrderModal({ open, mobile, prefill, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productId, setProductId] = useState<ProductId>(prefill.productId);
  const [color, setColor] = useState<ColorId | ''>(prefill.color);
  const [team, setTeam] = useState('');
  const [printSide, setPrintSide] = useState<PrintSide | ''>(prefill.printSide ?? '');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileFailed, setFileFailed] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('upload');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitFailed, setSubmitFailed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProductId(prefill.productId);
    setColor(prefill.color);
    setTeam('');
    setPrintSide(prefill.printSide ?? '');
    setQuantity(1);
    setFile(null);
    setFileFailed(false);
    setPayMethod('upload');
    setSubmitFailed(false);
    setSuccess(false);
    setErrors({});
  }, [open, prefill]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const product = PRODUCTS.find((item) => item.id === productId)!;
  const colorOptions = useMemo(
    () =>
      COLORS.filter((item) => product.colors.includes(item.id)).map((item) => ({
        id: item.id,
        label: item.label,
        swatch: item.hex,
      })),
    [product],
  );
  const teamOptions = useMemo(
    () => TEAMS.map((name) => ({ id: name, label: nbspText(name) })),
    [],
  );

  if (!open) return null;

  const takeFile = (next: File | null) => {
    setFile(next);
    setErrors((prev) => ({ ...prev, file: '' }));
    if (!next) {
      setFileFailed(false);
      return;
    }
    const okType =
      FILE_OK.test(next.name) ||
      next.type.startsWith('image/') ||
      next.type === 'application/pdf';
    setFileFailed(!okType || next.size > MAX_FILE);
  };

  const fileRequired = mobile || payMethod === 'upload';

  const validate = () => {
    const name = fullName.trim();
    const mail = email.trim();
    const next: Record<string, string> = {};
    if (!name) next.fullName = 'Укажите ФИО';
    else if (!NAME_RE.test(name) || name.split(/\s+/).length < 2) next.fullName = 'Укажите ФИО полностью';
    if (!mail) next.email = 'Укажите электронную почту';
    else if (!EMAIL_RE.test(mail)) next.email = 'Некорректный email';
    if (!phone) next.phone = 'Укажите номер телефона';
    else if (!PHONE_RE.test(phone)) next.phone = 'Некорректный номер телефона';
    if (!productId) next.product = 'Выберите мерч';
    if (!color || !product.colors.includes(color)) next.color = 'Выберите цвет';
    if (product.hasCrest && !team) next.team = 'Выберите команду';
    if (product.hasCrest && !printSide) next.printSide = 'Выберите сторону печати';
    if (!address) next.address = 'Выберите адрес доставки';
    if (fileRequired && !file) next.file = 'Прикрепите скрин об оплате';
    else if (fileRequired && fileFailed) next.file = 'Ошибка загрузки';
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const clearErr = (key: string) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = async () => {
    setSubmitFailed(false);
    const valid = validate();
    if (!valid || (fileRequired && (!file || fileFailed)) || !color) return;
    setSending(true);
    try {
      const body = new FormData();
      body.set('fullName', fullName.trim());
      body.set('email', email.trim());
      body.set('phone', phone);
      body.set('product', productId);
      body.set('color', color);
      body.set('quantity', String(quantity));
      body.set('address', address);
      if (product.hasCrest) body.set('team', team);
      if (product.hasCrest && printSide) body.set('printSide', printSide);
      body.set('paymentMethod', fileRequired ? 'file' : 'email');
      if (fileRequired && file) body.set('payment', file);
      const response = await fetch('/api/orders', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) {
        const text = String(data.error || 'Не удалось отправить заказ');
        if (/файл|загруз/i.test(text)) setFileFailed(true);
        throw new Error(text);
      }
      setSuccess(true);
    } catch {
      setSubmitFailed(true);
    } finally {
      setSending(false);
    }
  };

  const merchField = (
    <SelectField
      value={productId}
      placeholder="Мерч"
      emptyLabel="Выберите мерч"
      error={errors.product}
      options={PRODUCTS.map((item) => ({ id: item.id, label: nbspText(item.formTitle) }))}
      onChange={(id) => {
        setProductId(id);
        clearErr('product');
        const next = PRODUCTS.find((item) => item.id === id)!;
        if (color && !next.colors.includes(color)) setColor('');
        if (!next.hasCrest) {
          setTeam('');
          setPrintSide('');
        } else {
          setPrintSide(prefill.printSide ?? '');
        }
      }}
    />
  );

  const teamField = product.hasCrest ? (
    <SelectField
      value={team}
      placeholder={mobile ? 'Герб команды' : 'Команда'}
      emptyLabel="Выберите команду"
      error={errors.team}
      options={teamOptions}
      onChange={(value) => {
        setTeam(value);
        clearErr('team');
      }}
    />
  ) : null;

  const printSideField = product.hasCrest ? (
    <SelectField
      value={printSide}
      placeholder={nbspText('Сторона печати')}
      emptyLabel={nbspText('Выберите сторону печати')}
      error={errors.printSide}
      options={PRINT_SIDES}
      onChange={(value) => {
        setPrintSide(value);
        clearErr('printSide');
      }}
    />
  ) : null;

  const onEmail = (value: string) => {
    setEmail(value);
    clearErr('email');
  };
  const onPhone = (value: string) => {
    setPhone(value);
    clearErr('phone');
  };
  const onColor = (value: ColorId) => {
    setColor(value);
    clearErr('color');
  };
  const onAddress = (value: string) => {
    setAddress(value);
    clearErr('address');
  };

  const fields = (
    <div className="form-grid">
      <TextField
        value={fullName}
        placeholder="ФИО"
        autoComplete="name"
        error={errors.fullName}
        onChange={(value) => {
          setFullName(value);
          clearErr('fullName');
        }}
      />
      {mobile ? (
        <>
          <TextField
            value={email}
            placeholder="Электронная почта"
            type="email"
            autoComplete="email"
            error={errors.email}
            onChange={onEmail}
          />
          <PhoneField value={phone} error={errors.phone} onChange={onPhone} />
          {merchField}
          {teamField}
          {printSideField}
          <SelectField
            value={color}
            placeholder="Цвет мерча"
            emptyLabel="Выберите цвет"
            error={errors.color}
            options={colorOptions}
            onChange={onColor}
          />
          <QtyStepper value={quantity} onChange={setQuantity} />
          <SelectField
            value={address}
            placeholder={nbspText('Адрес доставки')}
            emptyLabel={nbspText('Введите адрес доставки')}
            error={errors.address}
            options={ADDRESSES.map((item) => ({ id: item, label: nbspText(item) }))}
            onChange={onAddress}
          />
        </>
      ) : (
        <>
          <div className="form-row">
            <TextField
              value={email}
              placeholder="Электронная почта"
              type="email"
              autoComplete="email"
              error={errors.email}
              onChange={onEmail}
            />
            <PhoneField value={phone} error={errors.phone} onChange={onPhone} />
          </div>
          {product.hasCrest ? (
            <>
              <div className="form-row is-half">{merchField}</div>
              <div className="form-row">
                {teamField}
                {printSideField}
              </div>
            </>
          ) : (
            <div className="form-row is-half">{merchField}</div>
          )}
          <div className="form-row">
            <SelectField
              value={color}
              placeholder="Цвет мерча"
              emptyLabel="Выберите цвет"
              error={errors.color}
              options={colorOptions}
              onChange={onColor}
            />
            <QtyStepper value={quantity} onChange={setQuantity} />
          </div>
          <SelectField
            value={address}
            placeholder={nbspText('Адрес доставки')}
            emptyLabel={nbspText('Введите адрес доставки')}
            error={errors.address}
            options={ADDRESSES.map((item) => ({ id: item, label: nbspText(item) }))}
            onChange={onAddress}
          />
        </>
      )}
    </div>
  );

  const upload = mobile ? (
    <UploadZone
      file={file}
      error={errors.file}
      failed={fileFailed}
      fullWidth
      onChange={takeFile}
    />
  ) : (
    <PaymentConfirm
      method={payMethod}
      onMethodChange={(method) => {
        setPayMethod(method);
        if (method === 'email') clearErr('file');
      }}
      file={file}
      onFileChange={takeFile}
      error={errors.file}
      failed={fileFailed}
    />
  );
  const submitBtn = (
    <ButtonCard type="button" onClick={submit} disabled={sending}>
      {sending ? 'Отправка…' : 'Оформить'}
    </ButtonCard>
  );

  const totalPrice = formatPrice(parsePrice(product.price) * quantity);

  const qr = (
    <aside className="modal-qr">
      <div className="qr-group">
        <img src="/assets/ui/qr-code.png" alt={nbspText('QR-код на сбор')} width={232} height={232} />
        <p className="qr-price">{totalPrice}</p>
        <p className="qr-title">{nbspText('Оплатить по QR-коду')}</p>
        <p className="qr-text">
          {nbspText('Наведите камеру телефона')}
          <br />
          {nbspText('или откройте приложение банка.')}
          <br />
          <br />
          {nbspText('Также можно оплатить ')}
          <a href={PAYMENT_LINK} target="_blank" rel="noreferrer">
            {nbspText('по ссылке')}
          </a>
        </p>
      </div>
    </aside>
  );

  const mobilePay = (
    <div className="sheet-pay">
      <p className="qr-price">{totalPrice}</p>
      <a href={PAYMENT_LINK} target="_blank" rel="noreferrer">
        {nbspText('Ссылка на оплату')}
      </a>
    </div>
  );

  const errorToast = submitFailed ? (
    <div className="error-toast" role="alert">
      <p className="error-toast-title">Какая оказия!</p>
      <p className="error-toast-copy">
        {mobile ? (
          <>
            {nbspText('Попробуйте оформить')}
            <br />
            заказ позднее
          </>
        ) : (
          nbspText('Попробуйте оформить заказ позднее')
        )}
      </p>
    </div>
  ) : null;

  const closeBtn = (
    <button type="button" className="modal-close" aria-label="Закрыть" onClick={onClose}>
      <img src="/assets/ui/close-x.svg" alt="" width={32} height={32} />
    </button>
  );

  const successView = (
    <div className="success-view">
      <img
        className="success-shield"
        src="/assets/hero/shield-center.png"
        alt=""
        width={214}
        height={233}
      />
      <h2 className="success-title">Спасибо!</h2>
      <p className="success-copy">
        {mobile ? (
          <>
            {nbspText('Не забывайте выходить из сбора после перевода денег, иначе другие коллеги')}
            <br />
            {nbspText('не смогут присоединиться.')}
            <br />
            <br />
            {nbspText('Мерч вы получите до конца 2026 года.')}
          </>
        ) : (
          <>
            {nbspText('Не забывайте выходить из сбора после перевода денег, ')}
            <br />
            {nbspText('иначе другие коллеги не смогут присоединиться.')}
            <br />
            <br />
            {nbspText('Мерч вы получите до конца 2026 года.')}
          </>
        )}
      </p>
    </div>
  );

  if (mobile) {
    return (
      <div className="sheet" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="sheet-stack" onClick={(event) => event.stopPropagation()}>
          <div className={`sheet-panel${success ? ' is-success' : ''}`}>
            {closeBtn}
            {success ? (
              successView
            ) : (
              <div className="modal-form">
                <h2 className="modal-title">{nbspText('Оформление предзаказа')}</h2>
                {fields}
                {mobilePay}
                {upload}
                {submitBtn}
              </div>
            )}
          </div>
          {errorToast}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-stack" onClick={(event) => event.stopPropagation()}>
        <div className={`modal${success ? ' is-success' : ''}`}>
          {closeBtn}
          {success ? (
            successView
          ) : (
            <div className="modal-body">
              {qr}
              <div className="modal-form">
                <h2 className="modal-title">{nbspText('Оформление предзаказа')}</h2>
                {fields}
                {upload}
                {submitBtn}
              </div>
            </div>
          )}
        </div>
        {errorToast}
      </div>
    </div>
  );
}
