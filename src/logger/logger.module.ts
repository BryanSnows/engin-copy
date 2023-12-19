import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as chalk from 'chalk';

@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { level, message, timestamp } = info;

          let coloredMessage = message;

          if (message.includes('[NestFactory]')) {
            coloredMessage = chalk.yellow(message);
          } else if (message.includes('DeprecationWarning:')) {
            coloredMessage = chalk.red(message);
          } else if (message.includes('Nest application successfully started')) {
            coloredMessage = chalk.green(message);
          }

          const log = `[${timestamp}] ${level}: ${coloredMessage}`;
          return log;
        }),
      ),
      transports: [new winston.transports.Console()],
    }),
  ],
})
export class LoggerModule {}
