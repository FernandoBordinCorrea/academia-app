const VALID_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24',
  '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61',
  '62', '64',
  '63',
  '65', '66',
  '67',
  '68',
  '69',
  '71', '73', '74', '75', '77',
  '79',
  '81', '87',
  '82',
  '83',
  '84',
  '85', '88',
  '86', '89',
  '91', '92', '93', '94', '95', '96', '97',
  '98', '99',
]);

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function passwordError(password) {
  if (!PASSWORD_REGEX.test(password)) {
    return 'A senha deve ter no mínimo 8 caracteres, incluindo letras e números';
  }
  return null;
}

export function phoneError(phone) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10 && digits.length !== 11) {
    return 'Telefone inválido: informe DDD + número (10 ou 11 dígitos)';
  }
  if (!VALID_DDDS.has(digits.slice(0, 2))) {
    return 'Telefone inválido: DDD inexistente';
  }
  if (digits.length === 11 && digits[2] !== '9') {
    return 'Telefone inválido: celular com 11 dígitos deve começar com 9 após o DDD';
  }
  return null;
}
