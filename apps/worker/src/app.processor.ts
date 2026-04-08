import { Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DEFAULT_QUEUE_NAME } from './queue.constants';

@Processor(DEFAULT_QUEUE_NAME)
export class AppProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(AppProcessor.name);

  onModuleInit() {
    this.logger.log(
      `BullMQ worker ready; queue="${DEFAULT_QUEUE_NAME}" (match this name + BULL_PREFIX in apps/api when enqueueing)`,
    );
  }

  process(job: Job): Promise<void> {
    this.logger.log(`job id=${job.id} name=${job.name}`);
    return Promise.resolve();
  }
}
