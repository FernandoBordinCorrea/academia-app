const FIELD_NAMES = {
  name: 'nome',
  email: 'e-mail',
  phone: 'telefone',
  password: 'senha',
  confirmpassword: 'confirmação de senha',
};

function friendlyField(field) {
  return FIELD_NAMES[field] || field;
}

function resolveMessage(type, field) {
  // Pydantic v2
  if (type === 'missing') return `O campo ${friendlyField(field)} é obrigatório`;
  if (type === 'string_too_short') return `O campo ${friendlyField(field)} é muito curto`;
  if (type === 'value_error' && field === 'email') return 'Digite um e-mail válido';

  // Pydantic v1 (fallback)
  if (type === 'value_error.email') return 'Digite um e-mail válido';
  if (type === 'value_error.missing') return `O campo ${friendlyField(field)} é obrigatório`;
  if (type === 'value_error.any_str.min_length') return `O campo ${friendlyField(field)} é muito curto`;

  return null;
}

export function parseApiError(error, fallback = 'Algo deu errado. Tente novamente.') {
  const detail = error?.response?.data?.detail;

  if (!detail) return fallback;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = first?.loc?.[first.loc.length - 1];
    const type = first?.type;

    return resolveMessage(type, field) ?? fallback;
  }

  return fallback;
}
