export type DateUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

export abstract class DateServicePort {
  abstract now(): Date;

  // Calcula una fecha futura (ej: ahora + 15 minutos)
  abstract add(date: Date, amount: number, unit: DateUnit): Date;

  // Calcula una fecha pasada
  abstract subtract(date: Date, amount: number, unit: DateUnit): Date;

  // Compara si la fecha A es posterior a la fecha B
  abstract isAfter(date: Date, toCompare: Date): boolean;

  // Compara si la fecha A es anterior a la fecha B
  abstract isBefore(date: Date, toCompare: Date): boolean;
}
