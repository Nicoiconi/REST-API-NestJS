import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {

  constructor(config: ConfigService) {
    super({ // it will call the constructor of the class extended
      datasources: {
        db: {
          url: config.get("DATABASE_URL")
        }
      }
    })
  }

  cleanDb() { // tearDown logic
    return this.$transaction([
      this.bookmark.deleteMany(),
      this.user.deleteMany()
    ])
  }
}
