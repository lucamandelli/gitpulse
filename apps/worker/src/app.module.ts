import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppProcessor } from './app.processor';
import { DEFAULT_QUEUE_NAME } from './queue.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '..', '..', '.env'), '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = parseInt(
          configService.get<string>('REDIS_PORT', '6379'),
          10,
        );
        const password = configService.get<string>('REDIS_PASSWORD');
        const prefix = configService.get<string>('BULL_PREFIX', 'bull');
        const connection: { host: string; port: number; password?: string } = {
          host,
          port,
        };
        if (password) {
          connection.password = password;
        }
        return {
          connection,
          prefix,
        };
      },
    }),
    BullModule.registerQueue({ name: DEFAULT_QUEUE_NAME }),
  ],
  providers: [AppProcessor],
})
export class AppModule {}
