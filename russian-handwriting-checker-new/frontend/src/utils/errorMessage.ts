const STATUS_MESSAGES: Record<number, string> = {
  400: 'Неверный запрос. Проверьте введённые данные.',
  401: 'Неверный email или пароль.',
  403: 'Нет доступа.',
  404: 'Ресурс не найден.',
  409: 'Пользователь с таким email уже существует.',
  422: 'Ошибка валидации данных.',
  429: 'Слишком много попыток. Подождите немного.',
  500: 'Ошибка сервера. Попробуйте позже.',
  502: 'Сервис временно недоступен. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
  504: 'Сервер не отвечает. Попробуйте позже.',
};

export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Произошла ошибка.';

  const e = error as any;

  // Нет ответа от сервера (сеть недоступна)
  if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED' || !e.response) {
    return 'Нет соединения с сервером. Проверьте интернет-подключение.';
  }

  const status: number | undefined = e.response?.status;
  const detail = e.response?.data?.detail;

  // Если сервер вернул читаемое сообщение на русском — показываем его
  if (typeof detail === 'string' && /[а-яёА-ЯЁ]/.test(detail)) {
    return detail;
  }

  // Иначе переводим по статус-коду
  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (status && status >= 500) return 'Ошибка сервера. Попробуйте позже.';
  if (status && status >= 400) return 'Неверный запрос. Проверьте введённые данные.';

  return 'Произошла ошибка. Попробуйте позже.';
}
