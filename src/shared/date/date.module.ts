import { Module } from '@nestjs/common';
import { DayjsService } from './infrastructure/dayjs.service';
import { DateServicePort } from './domain/date.service.port';

@Module({
  providers: [
    {
      provide: DateServicePort,
      useClass: DayjsService,
    },
  ],
  exports: [DateServicePort],
})
export class DateModule {}
