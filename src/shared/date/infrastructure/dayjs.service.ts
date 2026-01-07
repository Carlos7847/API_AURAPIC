import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { DateServicePort, DateUnit } from '../domain/date.service.port';

@Injectable()
export class DayjsService implements DateServicePort {
  now(): Date {
    return dayjs().toDate();
  }

  add(date: Date, amount: number, unit: DateUnit): Date {
    return dayjs(date).add(amount, unit).toDate();
  }

  subtract(date: Date, amount: number, unit: DateUnit): Date {
    return dayjs(date).subtract(amount, unit).toDate();
  }

  isAfter(date: Date, toCompare: Date): boolean {
    return dayjs(date).isAfter(dayjs(toCompare));
  }

  isBefore(date: Date, toCompare: Date): boolean {
    return dayjs(date).isBefore(dayjs(toCompare));
  }
}
