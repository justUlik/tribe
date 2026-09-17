import { useEffect, useMemo, useState } from 'react';
import { PAYMENT_LINK } from '../config';
import { ADDRESSES, COLORS, PRINT_SIDES, PRODUCTS, TEAMS } from '../data';
import type { ColorId, OrderPrefill, PrintSide, ProductId } from '../types';
import { ButtonCard } from './ButtonCard';
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
  const [errors, setErrors] = useState<Record<string, boolean>>({});
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
    () => TEAMS.map((name) => ({ id: name, label: name })),
    [],
  );

  if (!open) return null;

  const takeFile = (next: File | null) => {
    setFile(next);
    setErrors((prev) => ({ ...prev, file: false }));
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

  const validate = () => {
    const next: Record<string, boolean> = {
      fullName: !NAME_RE.test(fullName.trim()) || fullName.trim().split(/\s+/).length < 2,
      email: !EMAIL_RE.test(email.trim()),
      phone: !PHONE_RE.test(phone),
      product: !productId,
      color: !color || !product.colors.includes(color),
      team: product.hasCrest && !team,
      printSide: product.hasCrest && !printSide,
      address: !address,
      file: !file || fileFailed,
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const submit = async () => {
    setSubmitFailed(false);
    if (!validate() || !file || !color) return;
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
      body.set('payment', file);
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
      options={PRODUCTS.map((item) => ({ id: item.id, label: item.formTitle }))}
      onChange={(id) => {
        setProductId(id);
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
      onChange={setTeam}
    />
  ) : null;

  const printSideField = product.hasCrest ? (
    <SelectField
      value={printSide}
      placeholder="Сторона печати"
      emptyLabel="Выберите сторону печати"
      error={errors.printSide}
      options={PRINT_SIDES}
      onChange={setPrintSide}
    />
  ) : null;

  const fields = (
    <div className="form-grid">
      <TextField value={fullName} placeholder="ФИО" autoComplete="name" error={errors.fullName} onChange={setFullName} />
      {mobile ? (
        <>
          <TextField
            value={email}
            placeholder="Электронная почта"
            type="email"
            autoComplete="email"
            error={errors.email}
            onChange={setEmail}
          />
          <PhoneField value={phone} error={errors.phone} onChange={setPhone} />
          {merchField}
          {teamField}
          {printSideField}
          <SelectField
            value={color}
            placeholder="Цвет мерча"
            emptyLabel="Выберите цвет"
            error={errors.color}
            options={colorOptions}
            onChange={setColor}
          />
          <QtyStepper value={quantity} onChange={setQuantity} />
          <SelectField
            value={address}
            placeholder="Адрес доставки"
            emptyLabel="Введите адрес доставки"
            error={errors.address}
            options={ADDRESSES.map((item) => ({ id: item, label: item }))}
            onChange={setAddress}
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
              onChange={setEmail}
            />
            <PhoneField value={phone} error={errors.phone} onChange={setPhone} />
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
              onChange={setColor}
            />
            <QtyStepper value={quantity} onChange={setQuantity} />
          </div>
          <SelectField
            value={address}
            placeholder="Адрес доставки"
            emptyLabel="Введите адрес доставки"
            error={errors.address}
            options={ADDRESSES.map((item) => ({ id: item, label: item }))}
            onChange={setAddress}
          />
        </>
      )}
    </div>
  );

  const upload = (
    <UploadZone
      file={file}
      error={errors.file}
      failed={fileFailed}
      fullWidth={mobile}
      onChange={takeFile}
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
        <img src="/assets/ui/qr-code.png" alt="QR-код на сбор" width={232} height={232} />
        <p className="qr-price">{totalPrice}</p>
        <p className="qr-title">Оплатить по QR-коду</p>
        <p className="qr-text">
          Наведите камеру телефона
          <br />
          или откройте приложение банка.
          <br />
          <br />
          Так же можно оплатить{' '}
          <a href={PAYMENT_LINK} target="_blank" rel="noreferrer">
            по ссылке
          </a>
        </p>
      </div>
    </aside>
  );

  const mobilePay = (
    <div className="sheet-pay">
      <p className="qr-price">{totalPrice}</p>
      <a href={PAYMENT_LINK} target="_blank" rel="noreferrer">
        Ссылка на оплату
      </a>
    </div>
  );

  const errorToast = submitFailed ? (
    <div className="error-toast" role="alert">
      <p className="error-toast-title">Какая оказия!</p>
      <p className="error-toast-copy">
        {mobile ? (
          <>
            Попробуйте оформить
            <br />
            заказ позднее
          </>
        ) : (
          'Попробуйте оформить заказ позднее'
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
            Не забывайте выходить из сбора после перевода денег, иначе другие коллеги
            <br />
            не смогут присоединиться.
            <br />
            <br />
            Мерч вы получите до конца 2026 года.
          </>
        ) : (
          <>
            Не забывайте выходить из сбора после перевода денег,{' '}
            <br />
            иначе другие коллеги не смогут присоединиться.
            <br />
            <br />
            Мерч вы получите до конца 2026 года.
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
                <h2 className="modal-title">Оформление предзаказа</h2>
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
                <h2 className="modal-title">Оформление предзаказа</h2>
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
