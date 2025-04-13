import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(email: string, password: string) {
    const existUser = await this.usersService.find(email);
    if (existUser.length) {
      throw new BadRequestException('Email is in use');
    }
    // generate the salt
    const salt = randomBytes(8).toString('hex'); // 16 characters long string

    // hash the salt and the passowrd together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Joint the hashed resutl and teh salt together
    const result = salt + '.' + hash.toString('hex');

    // create a new user and save it
    const user = await this.usersService.create(email, result);

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const [salt, hash] = user.password.split('.');
    const hashToCompare = (await scrypt(password, salt, 32)) as Buffer;

    if (hash !== hashToCompare.toString('hex')) {
      throw new BadRequestException('wrong password');
    }

    return user;
  }
}
