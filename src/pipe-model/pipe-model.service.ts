import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePipeModelDto } from './dto/create-pipe-model.dto';
import { UpdatePipeModelDto } from './dto/update-pipe-model.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PipeModel } from './entities/pipe-model.entity';
import { Brackets, Repository } from 'typeorm';
import { BufferedFile } from 'src/common/services/minio/interfaces/file.interface';
import { MinioClientService } from 'src/common/services/minio/minio-client.service';
import { ErrorResponse } from 'src/common/error-reponse';
import { CodeError, ObjectSize, ValidType } from 'src/common/enums';
import { Validations } from 'src/common/validations';
import { PipeModelFilter } from './dto/filter-pipe-model.dto';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { AngleService } from './angles.service';
import { PipeModelServiceInterface } from './interface/service/pipe-model.service.interface';
import { UpdatePdfDto } from './dto/update-pdf.dto';
import { PipeModelAngle } from './entities/pipe-model-angle.entity';
import { PipeModelAngleService } from './pipe-model-angle.service';

@Injectable()
export class PipeModelService implements PipeModelServiceInterface {
  constructor(
    @InjectRepository(PipeModel)
    private readonly pipeModelRepository: Repository<PipeModel>,
    private readonly minioService: MinioClientService,
    private readonly angleService: AngleService,
    private readonly pipeModelAngleService: PipeModelAngleService,
  ) {}

  //* Método utilizado em create para verificar se já existe nome de tubo
  async findByPipeName(name: string): Promise<PipeModel | undefined> {
    return await this.pipeModelRepository.findOneBy({
      pipe_model_name: name,
    });
  }

  //* Metodo utilizado em create e em production goal
  async findByPipeCode(code: string): Promise<PipeModel | undefined> {
    return await this.pipeModelRepository.findOneBy({
      pipe_model_code: code,
    });
  }

  //* Método utilizado em update para verificar se existe esse nome de tubo com id diferente
  async findByPipeNameAndId(name: string): Promise<PipeModel | undefined> {
    return await this.pipeModelRepository
      .createQueryBuilder('pipe_model')
      .where('pipe_model.pipe_model_name = :name', { name })
      .getOne();
  }

  //* Criar Tubo
  async create(createPipeModelDto: CreatePipeModelDto): Promise<PipeModel> {
    const { pipe_model_code, pipe_model_name, pipe_angles } = createPipeModelDto;

    const pipe = this.pipeModelRepository.create(createPipeModelDto);

    if (!pipe_model_name || pipe_model_name.trim() == '')
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo descrição de tubo não pode estar vazio`),
      );

    if (pipe_model_code.trim() == '' || !pipe_model_code)
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo código de tubo não pode estar vazio`),
      );

    pipe.pipe_model_name = pipe_model_name.toUpperCase().trim();

    Validations.getInstance().validateWithRegex(
      pipe.pipe_model_name,
      'descrição',
      ValidType.IS_PIPE_NAME,
    );
    Validations.getInstance().verifyLength(pipe.pipe_model_name, 'descrição', 5, 40);

    const pipeNameAlreadyExists = await this.findByPipeName(pipe.pipe_model_name);

    if (pipeNameAlreadyExists)
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_REGISTERED, 'Descrição de tubo já cadastrada'),
      );

    pipe.pipe_model_code = pipe.pipe_model_code.replace(/\s/g, '');

    Validations.getInstance().validateWithRegex(
      pipe.pipe_model_code,
      'código',
      ValidType.IS_PIPE_CODE,
      ValidType.NO_SPACE,
      ValidType.NO_SPECIAL_CHARACTER,
      ValidType.IS_NUMBER,
    );

    pipe.pipe_model_code = `ARC${pipe.pipe_model_code}`;

    const pipeCodeAlreadyExists = await this.findByPipeCode(pipe.pipe_model_code);

    if (pipeCodeAlreadyExists)
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_REGISTERED, 'Código de tubo ja cadastrado.'),
      );

    pipe.pipe_model_status = true;
    pipe.pipe_model_created_at = new Date();
    pipe.pipe_model_updated_at = pipe.pipe_model_created_at;

    // if (pipe_angles) {
    //   let listAngles = [];
    //   for (const element of pipe_angles) {
    //     const angleId = Number(element);
    //     if (!isNaN(angleId) && angleId > 0) {
    //       listAngles.push(await this.angleService.findById(angleId));
    //     }
    //   }
    //   pipe.angle = listAngles;
    // }

    if (pipe_angles) {
      let listPipeAngles: PipeModelAngle[] = [];

      for (const element of pipe_angles) {
        const pipeModelAngle = new PipeModelAngle();

        pipeModelAngle.angle_id = element.angle_id;

        pipeModelAngle.angle_order = element.angle_order;

        const angleRegistered = await this.angleService.findById(pipeModelAngle.angle_id);

        if (!angleRegistered)
          throw new BadRequestException(`O angulo ${pipeModelAngle.angle_id} não existe!`);

        if (!pipeModelAngle.angle_order || !pipeModelAngle.angle_id)
          throw new BadRequestException(
            'Os campos angle_id e angle_order devem ter ao menos um angle_id e um angle_order',
          );

        listPipeAngles.push(pipeModelAngle);
      }

      if (pipe.pipe_model_folds !== listPipeAngles.length)
        throw new BadRequestException(
          `O pipe_model_folds deve ser igual a quantidade de angulos no array!`,
        );

      if (listPipeAngles.length === 0)
        throw new BadRequestException(
          'Os campos angle_id e angle_order devem ter ao menos um modulo e um numero de posto',
        );

      const savedPipeAngles = await Promise.all(
        listPipeAngles.map((pipeAngles) => this.pipeModelAngleService.create(pipeAngles)),
      );

      pipe.pipeModelAngle = savedPipeAngles;
    }

    pipe.pipe_model_path = 'elgin-cnc/0000_0_000_00_00_00_0000';
    return await this.pipeModelRepository.save(pipe);
  }

  //* Método para adicionar pdf a um tubo por id
  async updatePdf(
    pipe_model_id: number,
    file: BufferedFile,
    updatePdf: UpdatePdfDto,
  ): Promise<PipeModel> {
    const pipeModel = await this.findOne(pipe_model_id);

    if (file) {
      const maxFileSize = 18874368;
      file.fieldname = `${pipeModel.pipe_model_code.slice(9, 13)}_${pipeModel.pipe_model_code.slice(3,4)}_${pipeModel.pipe_model_code.slice(4, 7)}_${pipeModel.pipe_model_code.slice(7, 9)}`; // prettier-ignore

      if (file.size > maxFileSize)
        throw new BadRequestException(
          new ErrorResponse(CodeError.MAX_SIZE, 'Tamanho máximo do arquivo permitido é de 18MB'),
        );

      if (file.mimetype != 'application/pdf')
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.INVALID_TYPE,
            'Somente arquivos em formato PDF são permitidos',
          ),
        );

      await this.minioService.delete(pipeModel.pipe_model_path.replace('elgin-cnc/', ''));
      const currentPath = await this.minioService.upload(file);

      pipeModel.pipe_model_path = currentPath;
    }

    return await this.pipeModelRepository.save(pipeModel);
  }

  //* Atualizar um tubo por id
  async update(pipe_model_id: number, updatePipeModelDto: UpdatePipeModelDto): Promise<PipeModel> {
    const {
      pipe_model_name,
      pipe_angles,
      pipe_model_diameter,
      pipe_model_expansion,
      pipe_model_folds,
      pipe_model_length,
      pipe_model_reduction,
    } = updatePipeModelDto;
    const pipeModel = await this.findOne(pipe_model_id);

    if (pipe_model_name) {
      pipeModel.pipe_model_name = pipe_model_name.toUpperCase().trim();

      Validations.getInstance().validateWithRegex(
        pipeModel.pipe_model_name,
        'descrição',
        ValidType.IS_PIPE_NAME,
      );
      Validations.getInstance().verifyLength(pipeModel.pipe_model_name, 'descrição', 5, 40);

      const pipeNameAlreadyExists = await this.findByPipeNameAndId(pipeModel.pipe_model_name);

      if (pipeNameAlreadyExists && pipe_model_id != pipeNameAlreadyExists.pipe_model_id)
        throw new BadRequestException(
          new ErrorResponse(CodeError.IS_REGISTERED, 'Descrição de tubo já cadastrada'),
        );
    }

    // if (pipe_angles) {
    //   let listAngles = [];
    //   for (const element of pipe_angles) {
    //     const angleId = Number(element);
    //     if (!isNaN(angleId) && angleId > 0) {
    //       listAngles.push(await this.angleService.findById(angleId));
    //     }
    //   }
    //   pipeModel.angle = listAngles;
    // }

    if (pipe_angles) {
      let listPipeAngles: PipeModelAngle[] = [];

      for (const element of pipe_angles) {
        const pipeModelAngle = new PipeModelAngle();

        pipeModelAngle.angle_id = element.angle_id;

        pipeModelAngle.angle_order = element.angle_order;

        const angleRegistered = await this.angleService.findById(pipeModelAngle.angle_id);

        if (!angleRegistered)
          throw new BadRequestException(`O angulo ${pipeModelAngle.angle_id} não existe!`);

        if (!pipeModelAngle.angle_order || !pipeModelAngle.angle_id)
          throw new BadRequestException(
            'Os campos angle_id e angle_order devem ter ao menos um angle_id e um angle_order',
          );

        listPipeAngles.push(pipeModelAngle);
      }
      if (pipe_model_folds !== listPipeAngles.length)
        throw new BadRequestException(
          `O pipe_model_folds deve ser igual a quantidade de angulos no array!`,
        );

      if (listPipeAngles.length === 0)
        throw new BadRequestException(
          'Os campos angle_id e angle_order devem ter ao menos um modulo e um numero de posto',
        );

      const savedPipeAngles = await Promise.all(
        listPipeAngles.map((pipeAngles) => this.pipeModelAngleService.create(pipeAngles)),
      );

      pipeModel.pipeModelAngle = savedPipeAngles;
    }

    if (pipe_model_diameter) pipeModel.pipe_model_diameter = pipe_model_diameter;
    if (pipe_model_folds) pipeModel.pipe_model_folds = pipe_model_folds;
    if (pipe_model_length) pipeModel.pipe_model_length = pipe_model_length;
    if (pipe_model_reduction) pipeModel.pipe_model_reduction = pipe_model_reduction;
    if (pipe_model_expansion) pipeModel.pipe_model_expansion = pipe_model_expansion;

    pipeModel.pipe_model_updated_at = new Date();

    return await this.pipeModelRepository.save(pipeModel);
  }

  //* Listagem paginada de tubos
  async findAll(filter: PipeModelFilter): Promise<Pagination<PipeModel>> {
    const { search, pipe_model_status, page, limit } = filter;

    const pipeModelBuilder = this.pipeModelRepository
      .createQueryBuilder('pipe_model')
      .orderBy('pipe_model.pipe_model_updated_at', 'DESC')
      .addOrderBy('pipe_model.pipe_model_name', 'ASC');

    if (search) {
      const sanSearch = search.replace(/\s/g, '');
      pipeModelBuilder.andWhere(
        new Brackets((queryBuilderOne) => {
          queryBuilderOne
            .where('pipe_model.pipe_model_name LIKE :pipe_model_name', {
              pipe_model_name: `%${search}%`,
            })
            .orWhere('pipe_model.pipe_model_code LIKE :pipe_model_code', {
              pipe_model_code: `%${sanSearch}%`,
            });
        }),
      );
    }

    if (pipe_model_status) {
      pipeModelBuilder.andWhere('pipe_model.pipe_model_status = :pipe_model_status', {
        pipe_model_status,
      });
    }

    const returnPagination = await paginate<PipeModel>(pipeModelBuilder, filter);

    return returnPagination;
  }

  //* Listagem somente dos tubos que estão ativos no sistema
  async findPipeModels(): Promise<PipeModel[]> {
    const queryBuilder = this.pipeModelRepository
      .createQueryBuilder('pipe')
      .where('pipe.pipe_model_status = :pipe_model_status', { pipe_model_status: 1 })
      .orderBy('pipe.pipe_model_name', 'ASC');
    return await queryBuilder.getMany();
  }

  //* Endpoint usado para o controller :id com todos os relacionamentos
  async findByPipeId(pipe_model_id: number) {
    Validations.getInstance().validateWithRegex(`${pipe_model_id}`, ValidType.IS_NUMBER);

    if (pipe_model_id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_NUMBER, `Número de id invalido`),
      );
    }

    const pipeModel = await this.pipeModelRepository
      .createQueryBuilder('pipe_model')
      .leftJoinAndSelect('pipe_model.pipeModelAngle', 'pipeModelAngle')
      .leftJoinAndSelect('pipeModelAngle.angles', 'angles')
      .where('pipe_model.pipe_model_id = :pipe_model_id', { pipe_model_id })
      .andWhere('pipe_model.pipe_model_id = :pipe_model_id', { pipe_model_id })
      .getOne();

    if (!pipeModel) {
      throw new BadRequestException(new ErrorResponse(CodeError.NOT_FOUND, `Tubo não existe`));
    }

    pipeModel.pipeModelAngle.sort((a, b) => a.angle_order - b.angle_order);

    return pipeModel;
  }

  //* Método usado em outros métodos sem relacionamentos
  async findOne(pipe_model_id: number): Promise<PipeModel> {
    Validations.getInstance().validateWithRegex(`${pipe_model_id}`, ValidType.IS_NUMBER);

    if (pipe_model_id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_NUMBER, `Número de id invalido`),
      );
    }

    const pipeModel = await this.pipeModelRepository
      .createQueryBuilder('pipe_model')
      .where('pipe_model.pipe_model_id = :pipe_model_id', { pipe_model_id })
      .getOne();

    if (!pipeModel) {
      throw new BadRequestException(new ErrorResponse(CodeError.NOT_FOUND, `Tubo não existe`));
    }

    return pipeModel;
  }

  //* Ativar e desativar um tubo
  async changeStatus(pipe_model_id: number): Promise<PipeModel> {
    const pipeModel = await this.findOne(pipe_model_id);

    pipeModel.pipe_model_status = pipeModel.pipe_model_status === true ? false : true;

    return this.pipeModelRepository.save(pipeModel);
  }
}
