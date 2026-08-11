import re

# DDDs válidos segundo a ANATEL
VALID_DDDS = {
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
}

PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).{8,}$')


def validate_password(value: str) -> str:
    if not PASSWORD_REGEX.match(value):
        raise ValueError('A senha deve ter no mínimo 8 caracteres, incluindo letras e números')
    return value


def validate_phone(value: str) -> str:
    digits = re.sub(r'\D', '', value)

    if len(digits) not in (10, 11):
        raise ValueError('Telefone inválido: informe DDD + número (10 ou 11 dígitos)')

    if digits[:2] not in VALID_DDDS:
        raise ValueError('Telefone inválido: DDD inexistente')

    if len(digits) == 11 and digits[2] != '9':
        raise ValueError('Telefone inválido: celular com 11 dígitos deve começar com 9 após o DDD')

    return digits
