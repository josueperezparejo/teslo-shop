import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('ProductService');

  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();
    const result = await this.insertNewProducts(adminUser);
    return result;
  }

  private async insertNewProducts(user: User) {
    try {
      await this.productService.deleteAllProducts();
      const products = initialData.products;

      const insertPromises = [];

      products.forEach((product) => {
        insertPromises.push(this.productService.create(product, user));
      });

      const result = await Promise.all(insertPromises);

      return result;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private async insertUsers() {
    const seedUsers = initialData.users;

    const users: User[] = [];

    seedUsers.forEach((user) => {
      const { password, ...userData } = user;

      users.push(
        this.userRepository.create({
          ...userData,
          password: bcrypt.hashSync(password, 10),
        }),
      );
    });

    const dbUsers = await this.userRepository.save(users);

    dbUsers.forEach((user) => {
      delete user.password;
    });

    return dbUsers[0];
  }

  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }
}
