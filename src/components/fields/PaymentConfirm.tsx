import { useRef, useState } from 'react';
import { RECEIPT_EMAIL } from '../../config';
import { nbspText } from '../../nbsp';

const ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.heic,image/*,application/pdf';

export type PayMethod = 'upload' | 'email';

type Props = {
  method: PayMethod;
  onMethodChange: (method: PayMethod) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  failed?: boolean;
};

export function PaymentConfirm({ method, onMethodChange, file, onFileChange, error, failed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const takeFile = (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    onMethodChange('upload');
    onFileChange(next);
  };

  const chooseUpload = () => {
    onMethodChange('upload');
  };

  const openFile = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onMethodChange('upload');
  };

  return (
    <div className={`pay-confirm${error ? ' has-error' : ''}`}>
      <p id="pay-confirm-title" className="pay-confirm-title">{nbspText('Подтвердите оплату')}</p>
      <div className="pay-options" role="radiogroup" aria-labelledby="pay-confirm-title">
        <div
          className={`pay-option${method === 'upload' ? ' is-on' : ''}${drag ? ' is-drag' : ''}${error ? ' has-error' : ''}`}
          role="radio"
          aria-checked={method === 'upload'}
          tabIndex={0}
          onClick={chooseUpload}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              chooseUpload();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            takeFile(event.dataTransfer.files);
          }}
        >
          <span className="pay-radio" aria-hidden="true" />
          <div className="pay-option-body">
            <p className="pay-option-label">{nbspText('Загружу чек об оплате')}</p>
            {method === 'upload' && file ? (
              <div className={`file-status${failed || error ? ' is-error' : ''}`}>
                <div className="file-status-copy">
                  <p className="file-name">{file.name}</p>
                  <p className={`file-state${failed || error ? ' is-bad' : ''}`}>
                    <span className="file-dot" />
                    {failed ? 'Ошибка загрузки' : error ? 'Прикрепите скрин об оплате' : 'Загружен'}
                  </p>
                </div>
                <button
                  type="button"
                  className="file-trash"
                  aria-label="Удалить файл"
                  onClick={(event) => {
                    event.stopPropagation();
                    onFileChange(null);
                  }}
                >
                  <img src="/assets/ui/trash.svg" alt="" width={20} height={20} />
                </button>
              </div>
            ) : null}
            {method === 'upload' && !file ? (
              <>
                <label
                  className={`btn-card is-outline${error ? ' has-error' : ''}${drag ? ' is-drag' : ''}`}
                  onClick={openFile}
                >
                  Загрузить
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    hidden
                    onChange={(event) => {
                      takeFile(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </label>
                {error ? <p className="upload-error">{error}</p> : null}
              </>
            ) : null}
          </div>
        </div>
        <div
          className={`pay-option${method === 'email' ? ' is-on' : ''}`}
          role="radio"
          aria-checked={method === 'email'}
          tabIndex={0}
          onClick={() => onMethodChange('email')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onMethodChange('email');
            }
          }}
        >
          <span className="pay-radio" aria-hidden="true" />
          <div className="pay-option-body">
            <p className="pay-option-label">
              {nbspText('Я заказываю из контура банка (с рабочего ноутбука) и отправлю чек на почту')}
              <br />
              <a className="pay-option-mail" href={`mailto:${RECEIPT_EMAIL}`}>
                {RECEIPT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
