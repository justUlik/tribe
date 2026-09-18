const PREP =
  'в|во|на|за|по|к|ко|с|со|о|об|от|до|из|у|для|при|без|над|под|про|через|между|перед|около';

const PREP_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${PREP}) `, 'giu');

export function nbspText(text: string) {
  return text.replace(PREP_RE, '$1$2\u00A0');
}
