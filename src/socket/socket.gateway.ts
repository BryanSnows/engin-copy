import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DailyProductionService } from 'src/daily-production/daily-production.service';

@WebSocketGateway({ cors: true, path: '/socket.io' })
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private dataInterval: NodeJS.Timeout | null = null;

  @WebSocketServer() server: Server;

  constructor(private readonly dailyProductionService: DailyProductionService) {}

  handleConnection(client: any, ...args: any[]) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  async sendRealtimeData() {
    if (this.dataInterval === null) {
      this.dataInterval = setInterval(async () => {
        try {
          const processes = await this.dailyProductionService.getDailyProductionWithMachines();
          this.server?.emit('realtimeData', processes);
        } catch (error) {
          console.error('Erro ao buscar processos:', error);
        }
      }, 5000);
    }
  }
}
