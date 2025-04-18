import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // create a fake copy of the users service
    const users: User[] = [];
    let id = 1;
    fakeUsersService = {
      find: (email: string) => {
        return Promise.resolve(users.filter((user) => user.email === email));
      },
      create: (email: string, password: string) => {
        const user: User = {
          id: id++,
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('khaled.khaled@kahled', 'khaled1234');

    expect(user.password).not.toEqual('khaled1234');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('khaled.khaled@khaled', 'khaled');

    await expect(
      service.signup('khaled.khaled@khaled', 'khaled'),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(service.signin('khaled@khaled', 'khaled')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throw an error if an invalid password is provided', async () => {
    await service.signup('khaled@khaled.khaled', 'wrongPassword'),
      await expect(
        service.signin('khaled@khaled.khaled', 'password'),
      ).rejects.toThrow(BadRequestException);
  });

  it('it returns a user if correct password is provided', async () => {
    await service.signup('khaled@khaled.khaled', 'khaled');

    const user = await service.signin('khaled@khaled.khaled', 'khaled');

    expect(user).toBeDefined();
  });
});
