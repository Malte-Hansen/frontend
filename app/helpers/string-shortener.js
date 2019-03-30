import { helper } from '@ember/component/helper';

export function stringShortener(params) {
  const [value, desiredLength] = params;
  if (desiredLength <= 0){
    return '';
  } else if (String(value).length <= desiredLength) {
    return String(value);
  } else {
    return String(value).substring(0, desiredLength) + "...";
  }
}

export default helper(stringShortener);