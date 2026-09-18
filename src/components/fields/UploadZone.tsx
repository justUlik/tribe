import { useState } from 'react';
import { nbspText } from '../../nbsp';

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: boolean;
  failed?: boolean;
  fullWidth?: boolean;
};

const ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.heic,image/*,application/pdf';

export function UploadZone({ file, onChange, error, failed, fullWidth }: Props) {
  const [drag, setDrag] = useState(false);

  const takeFile = (list: FileList | null) => {
    const next = list?.[0];
    if (next) onChange(next);
  };

  if (file) {
    return (
      <div className={`file-status${failed || error ? ' is-error' : ''}`}>
        <div className="file-status-copy">
          <p className="file-name">{file.name}</p>
          <p className={`file-state${failed || error ? ' is-bad' : ''}`}>
            <span className="file-dot" />
            {failed ? 'Ошибка загрузки' : error ? 'Прикрепите скрин об оплате' : 'Загружен'}
          </p>
        </div>
        <button type="button" className="file-trash" aria-label="Удалить файл" onClick={() => onChange(null)}>
          <img src="/assets/ui/trash.svg" alt="" width={20} height={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`upload-block${error ? ' has-error' : ''}`}>
      <p className="upload-label">{nbspText('Загрузите скрин об оплате')}</p>
      <label
        className={`btn-card is-outline${fullWidth ? ' is-full' : ''}${error ? ' has-error' : ''}${drag ? ' is-drag' : ''}`}
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
        Загрузить
        <input
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(event) => {
            takeFile(event.target.files);
            event.target.value = '';
          }}
        />
      </label>
      {error ? <p className="upload-error">{nbspText('Прикрепите скрин об оплате')}</p> : null}
    </div>
  );
}
