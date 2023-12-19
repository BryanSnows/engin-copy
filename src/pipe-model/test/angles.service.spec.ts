import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AngleService } from '../angles.service';
import { Angle } from '../entities/angle.entity';

describe('AngleService', () => {
  let angleService: AngleService;
  let angleRepository: Repository<Angle>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngleService,
        {
          provide: getRepositoryToken(Angle),
          useClass: Repository,
        },
      ],
    }).compile();

    angleService = module.get<AngleService>(AngleService);
    angleRepository = module.get<Repository<Angle>>(getRepositoryToken(Angle));
  });

  describe('listAllAngles', () => {
    it('should return an array of angles', async () => {
      const mockAngles: Angle[] = [];
      jest.spyOn(angleRepository, 'find').mockResolvedValue(mockAngles);

      const result = await angleService.listAllAngles();

      expect(result).toEqual(mockAngles);
    });
  });

  describe('findById', () => {
    it('should return an angle by ID', async () => {
      const mockAngle: Angle = {
        angle_id: 0,
        angle_dimension: '',
        pipeModelAngle: [],
      };
      jest.spyOn(angleRepository, 'findOne').mockResolvedValue(mockAngle);

      const result = await angleService.findById(1);

      expect(result).toEqual(mockAngle);
    });

    it('should throw NotFoundException when angle is not found', async () => {
      jest.spyOn(angleRepository, 'findOne').mockResolvedValue(undefined);

      await expect(angleService.findById(1)).rejects.toThrowError(NotFoundException);
    });
  });
});
